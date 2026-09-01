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
    const { report, location, mediaPath, mimeType } = context;

    if (!this.isConfigured()) {
      // Deterministic scenario-grounded fallback adhering to the full schema
      return {
        structuredOutput: generateDeterministicAIAssessment(context),
        tokens: { inputTokens: 250, outputTokens: 300, totalTokens: 550 },
        model: 'deterministic-civic-engine',
        rawText: JSON.stringify(generateDeterministicAIAssessment(context))
      };
    }

    const systemInstruction = `You are an expert AI Decision-Support Analyst for the Alcheminds / UrbanEYE Civic and Societal Problem Management Platform.
Your task is to analyze submitted societal challenges and generate an evidence-grounded, structured JSON decision support assessment for municipal government officers.

INDEPENDENT DUAL-BRANCH DETERMINATIONS:
You MUST determine two distinct, independent pathways:
1. Immediate Government Action: Does this incident require immediate municipal field crew dispatch or mitigation? (e.g. power isolation, emergency pothole patching, water tanker supply, clearing dangerous debris).
2. Innovation / Research Pathway: Does this challenge require university R&D, engineering capability matching, new technology, or long-term design innovation?

STRICT RULES FOR INNOVATION / RESEARCH PATHWAY:
- Say "NO" for all conventional municipal issues where standard public works repair techniques, commercial off-the-shelf parts, or standard maintenance crews already exist (e.g., standard isolated potholes, routine light bulb/fixture failure, ordinary pipe joint leaks, standard overflowing garbage bins, standard transformer fuse replacement). For these, innovation_decision MUST be "NO".
- Say "YES" ONLY IF:
  a) The problem is recurring/systemic and repeatedly failing despite standard municipal repairs, OR
  b) The challenge requires scientific research, university R&D (e.g., crop blight/soil pathology, complex industrial groundwater chemical contamination requiring novel filtration, unmapped urban catchment flood modeling, geotechnical soil stabilization, IoT smart grid telemetry).

STRICT RULES FOR SEVERITY & EXPLANATION:
- You MUST explain WHY the specific severity level (CRITICAL, HIGH, MEDIUM, LOW) was assigned.
- You MUST directly cite the specific facts, hazards, and environmental factors from the citizen's report description (e.g. exposed live wire in rain, deep hole on high-speed school route, discolored water with chemical odor).
- DO NOT return generic textbook templates.

Required JSON Schema:
{
  "immediate_action_required": boolean,
  "immediate_action_decision": "YES" | "NO" | "UNCERTAIN",
  "immediate_action_summary": "Concise 1-2 sentence evidence-based summary for immediate government action",
  "immediate_action_reason": "Specific reasons why immediate municipal intervention is or is not required",
  "recommended_immediate_actions": [
    "Specific action item 1",
    "Specific action item 2"
  ],

  "innovation_required": boolean,
  "innovation_decision": "YES" | "NO" | "UNCERTAIN",
  "innovation_summary": "Concise 1-2 sentence assessment of technology, engineering or research needs",
  "innovation_reason": "Specific reasons explaining why innovation is or is NOT needed (e.g. standard contractor fix vs university R&D)",
  "required_capabilities": [
    "Specific Engineering/Scientific capability (e.g. Water Treatment, IoT Sensing, Soil Stabilization)"
  ],

  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "severity_score": integer (1 to 10),
  "severity_reason": "Evidence-grounded explanation of why this severity rating was assigned to this specific incident",
  "severity_explanation": [
    "Specific factual condition 1 from report description explaining severity",
    "Specific factual condition 2 from report description explaining severity"
  ],
  "urgency": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "urgency_score": integer (1 to 10),

  "problem_statement": "Objective, concise summary of the core underlying civic problem",

  "existing_solution_status": "ADEQUATE" | "INSUFFICIENT" | "UNSUITABLE_LOCALLY" | "REPEATEDLY_FAILING" | "UNKNOWN",
  "existing_solution_summary": "Analysis of whether current standard municipal solutions solve this problem or fail",

  "assessment_factors": {
    "public_safety_risk": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
    "recurring_problem": boolean,
    "existing_solution": "ADEQUATE" | "INSUFFICIENT" | "REPEATEDLY_FAILING" | "UNKNOWN",
    "innovation_potential": "HIGH" | "MEDIUM" | "LOW"
  },

  "recommended_next_steps": [
    "Actionable next step 1",
    "Actionable next step 2"
  ],

  "confidence": float (0.50 to 0.99),

  "domain": "electricity" | "water" | "roads" | "sanitation" | "infrastructure" | "health" | "environment" | "agriculture" | "other",
  "issue_type": "string descriptive name (e.g. localized_pothole, exposed_sparking_transformer, groundwater_contamination)",
  "subtype": "string technical classification",
  "safety_risk": integer (1 to 10),
  "health_risk": integer (1 to 10),
  "recurrence": "first_time" | "intermittent" | "frequent" | "continuous",
  "recommended_radius_m": integer (25 to 1000),
  "evidence_confidence": float (0.50 to 1.0),
  "affected_entities": ["string array of affected groups e.g. residents, vehicles, children"],
  "risk_factors": ["string array of concise risk explanations"]
}`;

    const userPrompt = `Analyze this specific civic grievance / societal challenge:
Challenge Category: ${report.category || 'General'}
Citizen Description: "${report.description || 'No description provided'}"
Reported Duration: ${report.duration || 'Unknown'}
Reported Recurrence: ${report.recurrence || 'Unknown'}
Reported Severity: ${report.severity || 'Moderate'}
Immediate Hazard / Risk Present: ${report.isRiskPresent ? 'Yes' : 'No'}
Risk Details: ${report.riskDescription || 'None provided'}
Location: Latitude ${location?.latitude || 'N/A'}, Longitude ${location?.longitude || 'N/A'}, City/Ward: ${location?.city || location?.address || 'Municipal Zone'}

Evaluate independent Immediate Government Action and Innovation / Research Pathway, existing solution feasibility, and required capabilities:`;

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

    try {
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
        model: activeModel,
        rawText
      };
    } catch (apiErr) {
      console.warn(`⚠️ Gemini API request encountered an error (${apiErr.message}). Using scenario-grounded fallback.`);
      const fallbackOutput = generateDeterministicAIAssessment(context);
      return {
        structuredOutput: fallbackOutput,
        tokens: { inputTokens: 100, outputTokens: 100, totalTokens: 200 },
        model: 'gemini-fallback-engine',
        rawText: JSON.stringify(fallbackOutput)
      };
    }
  }
}

/**
 * Scenario-grounded deterministic AI assessment engine (serves as robust fallback adhering 100% to schema)
 */
export function generateDeterministicAIAssessment(context) {
  const { report, location } = context;
  const category = (report.category || 'Other').toLowerCase();
  const desc = (report.description || '').toLowerCase();
  const recurrence = (report.recurrence || '').toLowerCase();
  const severityStr = (report.severity || 'Moderate').toLowerCase();
  const isRisk = Boolean(report.isRiskPresent || report.is_risk_present);

  const isRecurring = recurrence.includes('frequent') || recurrence.includes('almost always') || recurrence.includes('continuous') || desc.includes('recurring') || desc.includes('repeated');
  const isDangerous = severityStr.includes('dangerous') || severityStr.includes('critical') || isRisk;
  const isSerious = severityStr.includes('serious') || severityStr.includes('high');

  // Independent Determination 1: Immediate Action
  let immediateActionRequired = isDangerous || isSerious || ['submitted', 'under review', 'assigned'].includes((report.status || '').toLowerCase());
  let immediateActionDecision = immediateActionRequired ? 'YES' : 'NO';
  let immediateActionSummary = '';
  let immediateActionReason = '';
  let recommendedImmediateActions = [];

  if (category.includes('electr')) {
    if (isDangerous || isSerious || desc.includes('wire') || desc.includes('spark') || desc.includes('shock') || desc.includes('fire') || desc.includes('live')) {
      immediateActionRequired = true;
      immediateActionDecision = 'YES';
      immediateActionSummary = 'Immediate power isolation and physical barrier deployment required to prevent electrocution or electrical fire.';
      immediateActionReason = 'Live exposed electrical components present an acute life-safety risk to passing pedestrians and local residents.';
      recommendedImmediateActions = ['Dispatch electrical emergency line crew', 'Isolate local feeder transformer', 'Erect safety perimeter cordon'];
    } else {
      immediateActionRequired = false;
      immediateActionDecision = 'NO';
      immediateActionSummary = 'Routine electrical fixture replacement scheduled in standard ward maintenance cycle.';
      immediateActionReason = 'Non-hazardous electrical issue without live bare conductor exposure does not pose immediate life-safety risk.';
      recommendedImmediateActions = ['Log ticket with zonal electricity board', 'Replace failed luminaire/bulb in standard maintenance run'];
    }
  } else if (category.includes('water')) {
    if (desc.includes('contaminat') || desc.includes('dirty') || desc.includes('poison') || desc.includes('smell')) {
      immediateActionRequired = true;
      immediateActionDecision = 'YES';
      immediateActionSummary = 'Immediate supply shutoff, water quality sampling, and emergency safe-water tanker deployment recommended.';
      immediateActionReason = 'Reported potable water contamination poses an acute public-health risk of waterborne disease outbreaks across households.';
      recommendedImmediateActions = ['Arrange emergency clean drinking water tankers', 'Collect on-site laboratory water samples', 'Inspect pipeline junction for sewage ingress'];
    } else {
      immediateActionRequired = isDangerous || isSerious;
      immediateActionDecision = immediateActionRequired ? 'YES' : 'NO';
      immediateActionSummary = immediateActionRequired ? 'Immediate municipal drainage suction and pump deployment recommended to alleviate localized waterlogging.' : 'Standard municipal waterworks inspection scheduled.';
      immediateActionReason = immediateActionRequired ? 'Standing water blocks transit and creates breeding risks.' : 'Routine pressure regulation required.';
      recommendedImmediateActions = ['Inspect local control valve', 'Clear debris from primary intake'];
    }
  } else if (category.includes('road')) {
    if (isDangerous || desc.includes('deep') || desc.includes('school') || desc.includes('accident')) {
      immediateActionRequired = true;
      immediateActionDecision = 'YES';
      immediateActionSummary = 'Immediate cold-mix asphalt patching and traffic hazard signage required.';
      immediateActionReason = 'Deep surface deterioration on high-density transit route presents high vehicular accident and two-wheeler collision risk.';
      recommendedImmediateActions = ['Deploy road maintenance quick-patch unit', 'Place reflective warning barricades', 'Level and compact sub-base surface'];
    } else {
      immediateActionRequired = false;
      immediateActionDecision = 'NO';
      immediateActionSummary = 'No emergency closure needed; scheduled for next routine ward resurfacing cycle.';
      immediateActionReason = 'Minor surface abrasion without structural pavement collapse or immediate safety threat.';
      recommendedImmediateActions = ['Log coordinates in municipal road asset registry', 'Inspect during quarterly ward survey'];
    }
  } else if (category.includes('sanitat') || category.includes('waste')) {
    immediateActionRequired = isDangerous || isSerious || isRisk;
    immediateActionDecision = immediateActionRequired ? 'YES' : 'NO';
    immediateActionSummary = immediateActionRequired ? 'Immediate compactor truck dispatch and disinfectant spraying required.' : 'Scheduled in routine daily sanitation collection round.';
    immediateActionReason = immediateActionRequired ? 'Accumulated waste overflowing into pedestrian pathway creating biohazard.' : 'Standard municipal collection cycle sufficient.';
    recommendedImmediateActions = ['Deploy mechanized waste compactor', 'Spray anti-larval disinfectant'];
  } else if (category.includes('agri') || category.includes('crop')) {
    immediateActionRequired = false;
    immediateActionDecision = 'NO';
    immediateActionSummary = 'Direct immediate municipal field dispatch is not indicated; challenge requires agricultural scientific analysis and soil advisory.';
    immediateActionReason = 'Agronomic and crop pathology issues require scientific intervention rather than emergency municipal repair.';
    recommendedImmediateActions = ['Notify District Agriculture Extension Officer', 'Collect soil and leaf tissue specimens for lab culture'];
  } else {
    immediateActionRequired = isDangerous;
    immediateActionDecision = immediateActionRequired ? 'YES' : 'NO';
    immediateActionSummary = immediateActionRequired ? 'Immediate inspection by zonal duty officer recommended.' : 'Routine municipal review scheduled.';
    immediateActionReason = isDangerous ? 'Identified safety hazards require direct municipal mitigation.' : 'Standard administrative processing applies.';
    recommendedImmediateActions = ['Zonal officer on-site inspection', 'Record photographic log in municipal portal'];
  }

  // Independent Determination 2: Innovation & Research
  let innovationRequired = false;
  let innovationDecision = 'NO';
  let innovationSummary = '';
  let innovationReason = '';
  let existingSolutionStatus = 'ADEQUATE';
  let existingSolutionSummary = '';
  const requiredCapabilities = [];

  if (category.includes('water')) {
    if (isRecurring || desc.includes('contaminat') || desc.includes('drainage') || desc.includes('flood')) {
      innovationRequired = true;
      innovationDecision = 'YES';
      innovationSummary = 'Existing drainage and pipeline materials show repeated vulnerability; advanced hydrological modeling and IoT water-quality sensing are recommended.';
      innovationReason = 'The recurring nature of the problem indicates that standard localized patches do not resolve the structural hydraulic root-cause.';
      existingSolutionStatus = isRecurring ? 'REPEATEDLY_FAILING' : 'INSUFFICIENT';
      existingSolutionSummary = 'Conventional pipe patching and manual flushing have failed to prevent recurrent backflow contamination.';
      requiredCapabilities.push('Hydrological Catchment Modeling', 'Water Purification & Heavy Metal Filtration', 'IoT Water Quality Telemetry');
    } else {
      innovationRequired = false;
      innovationDecision = 'NO';
      innovationSummary = 'Standard municipal water engineering procedures are adequate for this isolated incident.';
      innovationReason = 'Known standard operational repair applies without requiring scientific R&D.';
      existingSolutionStatus = 'ADEQUATE';
      existingSolutionSummary = 'Standard valve replacement and pipe coupling procedures are proven and sufficient.';
      requiredCapabilities.push('Municipal Pipeline Maintenance', 'Hydraulic Pressure Regulation');
    }
  } else if (category.includes('road')) {
    if (isRecurring || desc.includes('monsoon') || desc.includes('flood') || desc.includes('soil')) {
      innovationRequired = true;
      innovationDecision = 'YES';
      innovationSummary = 'Sub-base soil instability and monsoon water erosion require advanced polymer-modified bitumen and geotechnical R&D.';
      innovationReason = 'Repeated asphalt breakdown at this location points to sub-surface drainage failure and water table pressure.';
      existingSolutionStatus = 'REPEATEDLY_FAILING';
      existingSolutionSummary = 'Traditional bitumen pothole filling washes away during heavy precipitation cycles.';
      requiredCapabilities.push('Polymer Bitumen Grading', 'Geotechnical Soil Stabilization', 'Automated Pothole Rapid-Filler Mechanism');
    } else {
      innovationRequired = false;
      innovationDecision = 'NO';
      innovationSummary = 'Standard municipal asphalt cold-mix or hot-mix patch is sufficient.';
      innovationReason = 'Isolated surface defect manageable with conventional public works maintenance.';
      existingSolutionStatus = 'ADEQUATE';
      existingSolutionSummary = 'Established hot-mix asphalt compaction methods provide adequate durability.';
      requiredCapabilities.push('Road Infrastructure Maintenance', 'Traffic Management');
    }
  } else if (category.includes('agri') || category.includes('crop') || desc.includes('pest') || desc.includes('soil')) {
    innovationRequired = true;
    innovationDecision = 'YES';
    innovationSummary = 'Crop pathology, pest resilience, and localized micro-climate monitoring require agricultural university research.';
    innovationReason = 'Conventional chemical treatments are failing to contain the recurring agricultural stress pattern.';
    existingSolutionStatus = isRecurring ? 'REPEATEDLY_FAILING' : 'INSUFFICIENT';
    existingSolutionSummary = 'Existing localized pesticide and manual spraying methods have proven inadequate against recurrent crop blights.';
    requiredCapabilities.push('Plant Pathology & Agronomy', 'Precision Soil Sensor Mesh', 'Bio-pesticide Formulation', 'Climate-Resilient Crop Genetics');
  } else if (category.includes('electr')) {
    if (isRecurring || desc.includes('surge') || desc.includes('fluctuation') || desc.includes('transformer')) {
      innovationRequired = true;
      innovationDecision = 'YES';
      innovationSummary = 'Frequent transformer failure and phase imbalance warrant smart grid telemetry and automated arc-fault isolation.';
      innovationReason = 'Systemic grid loading and localized voltage spikes exceed standard fuse protection parameters.';
      existingSolutionStatus = 'INSUFFICIENT';
      existingSolutionSummary = 'Manual fuse wire replacement fails to protect against repeated thermal overloads.';
      requiredCapabilities.push('Smart Grid Fault Telemetry', 'Low-Voltage Arc Detection Sensor', 'Micro-Transformer Thermal Balancing');
    } else {
      innovationRequired = false;
      innovationDecision = 'NO';
      innovationSummary = 'Standard utility line repair and insulator replacement are sufficient.';
      innovationReason = 'Isolated component wear without systemic grid architecture defect.';
      existingSolutionStatus = 'ADEQUATE';
      existingSolutionSummary = 'Standard utility equipment replacement protocols are fully adequate.';
      requiredCapabilities.push('Electrical Distribution Maintenance', 'Safety Grounding');
    }
  } else if (category.includes('sanitat') || category.includes('waste')) {
    if (isRecurring || desc.includes('dump') || desc.includes('leachate') || desc.includes('biomedical')) {
      innovationRequired = true;
      innovationDecision = 'YES';
      innovationSummary = 'Unsegregated waste volume and leachate runoff require decentralized bio-composting and sensor-based smart bins.';
      innovationReason = 'Fixed-route collection schedules fail to adapt to variable community waste generation peaks.';
      existingSolutionStatus = 'INSUFFICIENT';
      existingSolutionSummary = 'Traditional manual collection bins overflow rapidly between scheduled municipal visits.';
      requiredCapabilities.push('Decentralized Bio-waste Reactors', 'Leachate Containment Bio-engineering', 'Ultrasonic Fill-Level Bin Telemetry');
    } else {
      innovationRequired = false;
      innovationDecision = 'NO';
      innovationSummary = 'Standard municipal sanitation collection and scheduled sweepers are adequate.';
      innovationReason = 'Routine accumulation manageable through standard municipal sanitation frequency.';
      existingSolutionStatus = 'ADEQUATE';
      existingSolutionSummary = 'Daily door-to-door municipal collection is sufficient.';
      requiredCapabilities.push('Solid Waste Logistics', 'Sanitation Services');
    }
  } else {
    innovationRequired = isRecurring;
    innovationDecision = isRecurring ? 'YES' : 'NO';
    innovationSummary = isRecurring ? 'Recurrent challenge pattern indicates underlying engineering or material limitations.' : 'Standard operational public works methods are sufficient.';
    innovationReason = isRecurring ? 'Systemic recurrence exceeds conventional repair durability.' : 'Standard maintenance applies.';
    existingSolutionStatus = isRecurring ? 'INSUFFICIENT' : 'ADEQUATE';
    existingSolutionSummary = isRecurring ? 'Current methods require technological enhancement.' : 'Standard methods proven reliable.';
    requiredCapabilities.push('Civic Infrastructure Assessment', 'Applied Sensor Telemetry');
  }

  // Recommended Next Steps
  const recommendedNextSteps = [];
  if (immediateActionRequired && innovationRequired) {
    recommendedNextSteps.push('Initiate immediate municipal field mitigation while simultaneously formulating an HEI Capstone R&D challenge.');
    recommendedNextSteps.push('Transmit evidence and geo-coordinates to matched University Department.');
  } else if (immediateActionRequired) {
    recommendedNextSteps.push('Dispatch designated municipal department field supervisor within SLA window.');
    recommendedNextSteps.push('Upload photographic evidence upon repair completion for citizen sign-off.');
  } else if (innovationRequired) {
    recommendedNextSteps.push('Route challenge to HEI Capstone R&D platform for faculty and student researcher matching.');
    recommendedNextSteps.push('Draft problem specification and research brief with target academic capabilities.');
  } else {
    recommendedNextSteps.push('Log incident in standard municipal operational backlog.');
    recommendedNextSteps.push('Monitor for recurrence during scheduled ward inspections.');
  }

  const severityCategory = isDangerous ? 'CRITICAL' : isSerious ? 'HIGH' : severityStr.includes('moderate') ? 'MEDIUM' : 'LOW';
  const urgencyCategory = isDangerous ? 'CRITICAL' : immediateActionRequired ? 'HIGH' : 'MEDIUM';

  const severityReason = isDangerous
    ? `Critical severity assigned due to reported acute life-safety/health hazard: "${report.description || category}".`
    : isSerious
    ? `High severity assigned due to significant operational disruption or physical deterioration: "${report.description || category}".`
    : `Standard severity assigned based on reported incident characteristics without immediate life-safety risk: "${report.description || category}".`;

  const severityExplanation = [];
  if (category.includes('electr')) {
    if (isDangerous || desc.includes('spark') || desc.includes('wire') || desc.includes('live')) {
      severityExplanation.push('Live exposed electrical components present an immediate electrocution and fire hazard.');
      severityExplanation.push('Physical hazard directly accessible to passing pedestrians and residents.');
      if (desc.includes('rain') || desc.includes('water')) severityExplanation.push('Rain / wet conditions significantly elevate electrical conductivity and short-circuit danger.');
    } else {
      severityExplanation.push('Power disruption affects local household and commercial activity.');
      severityExplanation.push('Non-hazardous electrical issue without live bare conductor exposure.');
    }
  } else if (category.includes('road')) {
    if (isDangerous || desc.includes('deep') || desc.includes('school') || desc.includes('accident')) {
      severityExplanation.push('Deep road damage creates severe accident risk, especially for two-wheelers.');
      severityExplanation.push('Located on an active public transit corridor or school zone.');
    } else {
      severityExplanation.push('Surface wear creates uneven driving conditions.');
      severityExplanation.push('Standard pothole without structural collapse.');
    }
  } else if (category.includes('water')) {
    if (desc.includes('contaminat') || desc.includes('poison') || desc.includes('smell')) {
      severityExplanation.push('Potential contamination of drinking water poses acute public-health risk.');
      severityExplanation.push('Piped supply backflow risks waterborne disease outbreaks across households.');
    } else {
      severityExplanation.push('Water accumulation or leak creates localized mobility disruption.');
      severityExplanation.push('Stagnant stormwater risks foundation seepage.');
    }
  } else if (category.includes('agri') || category.includes('crop')) {
    severityExplanation.push('Agricultural crop blight or soil stress impacts seasonal agricultural yield.');
    severityExplanation.push('Pathological spread across farm blocks threatens farmer livelihood.');
  } else {
    severityExplanation.push(`Incident condition exhibits ${severityCategory.toLowerCase()} structural or environmental impact.`);
    severityExplanation.push(`Classification assigned based on reported ${category} grievance details.`);
  }

  return {
    immediate_action_required: immediateActionRequired,
    immediate_action_decision: immediateActionDecision,
    immediate_action_summary: immediateActionSummary,
    immediate_action_reason: immediateActionReason,
    recommended_immediate_actions: recommendedImmediateActions,

    innovation_required: innovationRequired,
    innovation_decision: innovationDecision,
    innovation_summary: innovationSummary,
    innovation_reason: innovationReason,
    required_capabilities: requiredCapabilities,

    severity: severityCategory,
    severity_score: isDangerous ? 9 : isSerious ? 7 : 5,
    severity_reason: severityReason,
    severity_explanation: severityExplanation,
    urgency: urgencyCategory,
    urgency_score: isDangerous ? 9 : immediateActionRequired ? 8 : 4,

    problem_statement: `${report.description || 'Civic infrastructure defect'} in ${report.category || 'general'} domain at ${location?.city || location?.address || 'municipal area'}.`,

    existing_solution_status: existingSolutionStatus,
    existing_solution_summary: existingSolutionSummary,

    assessment_factors: {
      public_safety_risk: isDangerous ? 'CRITICAL' : isSerious ? 'HIGH' : 'LOW',
      recurring_problem: isRecurring,
      existing_solution: existingSolutionStatus,
      innovation_potential: innovationRequired ? 'HIGH' : 'LOW'
    },

    recommended_next_steps: recommendedNextSteps,
    confidence: isDangerous || isRecurring ? 0.94 : 0.88,

    domain: category,
    issue_type: `${category}_${isRecurring ? 'systemic_issue' : 'localized_incident'}`,
    subtype: isDangerous ? 'acute_hazard' : 'maintenance_item',
    safety_risk: isDangerous ? 9 : isSerious ? 6 : 3,
    health_risk: category.includes('water') || category.includes('sanitat') ? (isDangerous ? 9 : 6) : 2,
    recurrence: isRecurring ? 'frequent' : 'first_time',
    recommended_radius_m: isDangerous ? 300 : 150,
    evidence_confidence: 0.92,
    affected_entities: ['residents', 'pedestrians', 'local transit'],
    risk_factors: [immediateActionReason]
  };
}
