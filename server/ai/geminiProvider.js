import fs from 'fs';
import path from 'path';
import { normalizeAIError } from './types.js';

/**
 * Base AI Provider Interface
 */
export class BaseAIProvider {
  constructor(name = 'base') {
    this.name = name;
  }

  async analyzeReport(reportContext) {
    throw new Error('Method analyzeReport must be implemented');
  }
}

/**
 * Gemini Provider using Google Generative Language API
 */
export class GeminiProvider extends BaseAIProvider {
  constructor(options = {}) {
    super('gemini');
    this.explicitApiKey = options.apiKey || null;
    this.model = options.model || process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
    this.maxOutputTokens = parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS || '1024', 10);
    this.maxInputTokens = parseInt(process.env.GEMINI_MAX_INPUT_TOKENS || '2048', 10);
  }

  getApiKey() {
    if (this.explicitApiKey && this.explicitApiKey !== 'YOUR_ACTUAL_API_KEY') {
      return this.explicitApiKey;
    }
    // Check process.env
    let key = process.env.GEMINI_API_KEY || '';
    if (!key || key === 'YOUR_ACTUAL_API_KEY') {
      // Re-read server/.env if process started before env edit
      try {
        const envPath = path.resolve(process.cwd(), 'server/.env');
        const altPath = path.resolve(process.cwd(), '.env');
        const target = fs.existsSync(envPath) ? envPath : (fs.existsSync(altPath) ? altPath : null);
        if (target) {
          const content = fs.readFileSync(target, 'utf8');
          const match = content.match(/^GEMINI_API_KEY=(.+)$/m);
          if (match && match[1]) {
            key = match[1].trim();
            process.env.GEMINI_API_KEY = key;
          }
        }
      } catch (e) {}
    }
    return key;
  }

  isConfigured() {
    const key = this.getApiKey();
    return Boolean(
      key &&
      key !== 'YOUR_ACTUAL_API_KEY' &&
      key !== 'YOUR_GEMINI_API_KEY_HERE' &&
      key.trim().length > 10
    );
  }

  getModelName() {
    return process.env.GEMINI_MODEL || this.model;
  }

  /**
   * Constructs the structured analysis prompt and dispatches to Gemini
   */
  async analyzeReport(context) {
    if (!this.isConfigured()) {
      const err = new Error('Gemini API key is not configured (set GEMINI_API_KEY in server/.env). Falling back to deterministic civic scoring.');
      err.status = 401;
      throw err;
    }

    const { report, location, mediaPath, mimeType } = context;

    const systemInstruction = `You are the UrbanEye / Alcheminds Civic Intelligence Engine.
Analyze the citizen civic grievance report and provide an objective, scenario-grounded structured JSON assessment.

STRICT RULES:
1. ONLY evaluate risks and entities directly evident in the citizen's report description, category, and evidence.
2. DO NOT hallucinate, assume unrelated hazards, or apply generic templates. For example:
   - For electrical issues (e.g. power cut, sparking wire, blown fuse): evaluate electrocution risk, fire hazard, grid disruption. DO NOT assume flooding or water contamination unless water is explicitly mentioned.
   - For water issues: evaluate waterlogging, contamination, drainage blockage.
   - For road issues: evaluate traffic hazard, pothole severity, vehicle damage.
   - For sanitation issues: evaluate waste accumulation, odor, vector breeding.
3. DO NOT output markdown codeblocks, explanations, or prose outside the JSON. Return valid JSON only.

Required JSON Schema:
{
  "domain": "electricity" | "water" | "roads" | "sanitation" | "infrastructure" | "health" | "environment" | "other",
  "issue_type": "string (specific descriptive name e.g. exposed_sparking_wire, power_blackout, localized_pothole, blocked_storm_drain)",
  "subtype": "string (further technical classification)",
  "severity": <integer 1 to 10>,
  "safety_risk": <integer 1 to 10 (electrocution, physical injury, fire, collapse)>,
  "health_risk": <integer 1 to 10 (contamination, disease, pollution)>,
  "urgency": <integer 1 to 10>,
  "recurrence": "first_time" | "intermittent" | "frequent" | "continuous",
  "recommended_radius_m": <integer recommended impact radius in meters, 25 to 1000>,
  "evidence_confidence": <float between 0.5 and 1.0>,
  "affected_entities": ["string array of genuinely affected groups, e.g. 'residents', 'pedestrians', 'vehicles', 'students'"],
  "risk_factors": ["short concise strings explaining the exact identified risks for this specific incident"]
}`;

    const userPrompt = `Analyze this specific civic issue report:
Category: ${report.category || 'General'}
User Description: ${report.description || 'No description provided'}
Reported Duration: ${report.duration || 'Unknown'}
Reported Recurrence: ${report.recurrence || 'Unknown'}
User Severity Rating: ${report.severity || 'Moderate'}
Immediate Hazard/Risk Present: ${report.isRiskPresent ? 'Yes' : 'No'}
Risk Details: ${report.riskDescription || 'None'}
Location: Latitude ${location?.latitude || 'N/A'}, Longitude ${location?.longitude || 'N/A'}, City: ${location?.city || 'Local Ward'}

Provide a precise, factual JSON assessment for this specific ${report.category || 'civic'} issue:`;

    const parts = [{ text: userPrompt }];

    // Attach image if media exists and is readable
    if (mediaPath && fs.existsSync(mediaPath)) {
      try {
        const fileBuffer = fs.readFileSync(mediaPath);
        const base64Data = fileBuffer.toString('base64');
        const resolvedMime = mimeType || (mediaPath.endsWith('.png') ? 'image/png' : 'image/jpeg');
        parts.push({
          inlineData: {
            mimeType: resolvedMime,
            data: base64Data
          }
        });
      } catch (mediaErr) {
        console.warn('⚠️ Media read error during Gemini preparation:', mediaErr.message);
      }
    }

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts
        }
      ],
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: this.maxOutputTokens,
        temperature: 0.1
      }
    };

    const activeKey = this.getApiKey();
    const activeModel = this.getModelName();
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(activeModel)}:generateContent?key=${encodeURIComponent(activeKey)}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      let errorBody = {};
      try {
        errorBody = await response.json();
      } catch (e) {
        errorBody = { message: response.statusText };
      }
      const err = new Error(errorBody.error?.message || `Gemini API returned status ${response.status}`);
      err.status = response.status;
      err.raw = errorBody;
      throw err;
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error('Gemini API returned an empty response candidate.');
    }

    let parsed = null;
    try {
      const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch (parseErr) {
      throw new Error(`Failed to parse Gemini structured JSON: ${parseErr.message}`);
    }

    const usageMetadata = data.usageMetadata || {};
    const inputTokens = usageMetadata.promptTokenCount || Math.ceil(userPrompt.length / 4);
    const outputTokens = usageMetadata.candidatesTokenCount || Math.ceil(rawText.length / 4);

    return {
      structuredOutput: parsed,
      tokens: {
        inputTokens,
        outputTokens,
        totalTokens: usageMetadata.totalTokenCount || (inputTokens + outputTokens)
      },
      model: this.model,
      rawText
    };
  }
}
