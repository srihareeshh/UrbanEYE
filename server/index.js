import express from 'express';
import cors from 'cors';
import multer from 'multer';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import exifr from 'exifr';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { db, initDatabase } from './db.js';
import { clusterReportsByProximity, detectCivicHotspots, detectSystemicPatterns } from './hotspots.js';
import { globalGeminiManager } from './ai/geminiRequestManager.js';
import { AIJobPriority } from './ai/types.js';
import { computeMediaHash } from './ai/mediaHasher.js';
import { calculateDynamicPriority, PRIORITY_POLICY_VERSION, getPriorityBucket, generateSeverityExplanation } from './priority/priorityEngine.js';
import { calculateEffectiveRadius } from './geo/radiusPolicy.js';
import { locationIntelligence } from './geo/locationIntelligence.js';
import { weatherService } from './services/weatherService.js';

// Setup environment and paths
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
// ==========================================
// SWAGGER API DOCUMENTATION
// ==========================================

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'UrbanEYE API',
      version: '1.0.0',
      description:
        'API documentation for the UrbanEYE civic and societal problem-solving platform.'
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Local Development Server'
      }
    ]
  },
  apis: ['./index.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api-docs.json', (req, res) => {
  res.json(swaggerSpec);
});
// Enable CORS and JSON body parser
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Serve sample incident photos statically
const samplesDir = path.join(__dirname, 'samples');
if (fs.existsSync(samplesDir)) {
  app.use('/samples', express.static(samplesDir));
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Helper for parsing JSON safely from PostgreSQL JSONB / string
function parseJsonSafe(val, fallback = null) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return fallback;
  }
}

// -------------------------------------------------------------
// Priority Scoring Engine & Department Rules
// -------------------------------------------------------------
function calculateCivicPriorityScore(params) {
  let score = 30; // base score
  const { severity, isRiskPresent, recurrence, category } = params;

  if (severity === 'Dangerous') score += 35;
  else if (severity === 'Serious') score += 20;
  else if (severity === 'Moderate') score += 10;

  if (isRiskPresent === 1 || isRiskPresent === true || isRiskPresent === '1' || isRiskPresent === 'true') {
    score += 25;
  }

  if (recurrence === 'Continuous') score += 15;
  else if (recurrence === 'Intermittent') score += 8;

  if (['Water', 'Electricity', 'Health'].includes(category)) score += 10;
  if (category === 'Schools') score += 8;

  return Math.min(100, Math.max(1, score));
}

function getDepartmentForCategory(category) {
  switch (category) {
    case 'Water':
      return { dept: 'Water Supply & Sewerage Board', officer: 'Eng. R. Shinde', slaHours: 24 };
    case 'Roads':
      return { dept: 'Roads & Traffic Infrastructure', officer: 'Chief Insp. P. Kulkarni', slaHours: 48 };
    case 'Electricity':
      return { dept: 'Municipal Power Distribution Utility', officer: 'Line Eng. A. Verma', slaHours: 12 };
    case 'Schools':
      return { dept: 'Civic Education & Infrastructure Board', officer: 'Director S. Nair', slaHours: 72 };
    case 'Sanitation':
    case 'Solid Waste':
      return { dept: 'Solid Waste Management & Sanitation', officer: 'Sanitary Insp. V. Jadhav', slaHours: 24 };
    default:
      return { dept: 'General Municipal Engineering Works', officer: 'Zonal Officer M. Khan', slaHours: 48 };
  }
}

// Haversine distance calculator in kilometers
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return null;
  const numLat1 = Number(lat1);
  const numLon1 = Number(lon1);
  const numLat2 = Number(lat2);
  const numLon2 = Number(lon2);
  if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) return null;

  const R = 6371; // Earth's radius in km
  const dLat = (numLat2 - numLat1) * (Math.PI / 180);
  const dLon = (numLon2 - numLon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(numLat1 * (Math.PI / 180)) *
      Math.cos(numLat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Approximate location formatter (protects raw coordinates in public feed)
function getApproximateLocationText(address, city, distanceKm) {
  let locationPart = 'Nearby Civic Area';
  if (address) {
    const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      locationPart = `Near ${parts[1] || parts[0]}`;
      if (parts[0] && parts[0] !== parts[1]) {
        locationPart += ` (${parts[0]})`;
      }
    } else if (parts.length === 1) {
      locationPart = `Near ${parts[0]}`;
    }
  } else if (city) {
    locationPart = `Near ${city}`;
  }

  if (distanceKm !== null && distanceKm !== undefined) {
    if (distanceKm < 0.2) {
      return `Within 200m · ${locationPart}`;
    } else {
      return `${distanceKm} km away · ${locationPart}`;
    }
  }
  return locationPart;
}

// In-app follower notification dispatcher
async function notifyReportFollowers(reportId, eventType, title, message, excludeUserId = null) {
  try {
    const followersRes = await db.query(`SELECT user_id FROM report_followers WHERE report_id = $1`, [reportId]);
    const followers = followersRes.rows;

    for (const fol of followers) {
      if (excludeUserId && fol.user_id === excludeUserId) continue;
      await db.query(`
        INSERT INTO user_notifications (id, user_id, report_id, event_type, title, message, is_read, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, FALSE, CURRENT_TIMESTAMP)
      `, [`notif_${crypto.randomBytes(6).toString('hex')}`, fol.user_id, reportId, eventType, title, message]);
    }
  } catch (e) {
    console.warn('Failed to dispatch follower notifications:', e.message);
  }
}

// -------------------------------------------------------------
// AI Analysis Completion & Priority Recalculation Listener
// -------------------------------------------------------------
export async function processReportAICompletion(reportId, aiResult, aiError) {
  try {
    const reportRes = await db.query(`SELECT * FROM reports WHERE id = $1`, [reportId]);
    const report = reportRes.rows[0];
    if (!report) return;

    const locRes = await db.query(`SELECT * FROM report_location WHERE report_id = $1`, [reportId]);
    const location = locRes.rows[0] || {};
    const mediaRes = await db.query(`SELECT * FROM report_media WHERE report_id = $1`, [reportId]);
    const mediaList = mediaRes.rows;

    const structured = aiResult?.structuredOutput;
    const firstMedia = mediaList[0];
    const mediaDiskPath = firstMedia?.file_path ? path.join(__dirname, firstMedia.file_path.replace(/^\//, '')) : null;
    const mediaHash = computeMediaHash(mediaDiskPath);

    const aiAnalysisId = `ai_${crypto.randomBytes(8).toString('hex')}`;
    const radiusInfo = calculateEffectiveRadius(report.category, structured?.issue_type, structured?.recommended_radius_m);

    if (aiResult && structured) {
      await db.query(`
        INSERT INTO report_ai_analysis (
          id, report_id, media_hash, model_provider, model_name, model_version, analysis_version,
          domain, issue_type, subtype, severity, safety_risk, health_risk, urgency, recurrence,
          evidence_confidence, recommended_radius_m, effective_radius_m, structured_output_json, status,
          completed_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        aiAnalysisId,
        reportId,
        mediaHash,
        'gemini',
        aiResult.model || process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
        '1.0',
        process.env.AI_ANALYSIS_VERSION || 'v1',
        structured.domain || report.category,
        structured.issue_type || null,
        structured.subtype || null,
        structured.severity || null,
        structured.safety_risk || null,
        structured.health_risk || null,
        structured.urgency || null,
        structured.recurrence || report.recurrence || null,
        structured.evidence_confidence || 0.85,
        radiusInfo.ai_recommended_radius_m,
        radiusInfo.effective_radius_m,
        JSON.stringify(structured)
      ]);
    } else {
      await db.query(`
        INSERT INTO report_ai_analysis (
          id, report_id, media_hash, model_provider, model_name, analysis_version, status,
          error_message, failed_at, created_at
        ) VALUES ($1, $2, $3, 'gemini', $4, $5, 'fallback', $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        aiAnalysisId,
        reportId,
        mediaHash,
        process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
        process.env.AI_ANALYSIS_VERSION || 'v1',
        aiError?.message || 'AI service fallback scoring applied'
      ]);
    }

    // Fetch candidate reports for spatial clustering & volume assessment
    const allReportsRes = await db.query(`
      SELECT r.*, l.latitude, l.longitude FROM reports r
      LEFT JOIN report_location l ON r.id = l.report_id
      WHERE r.id != $1
    `, [reportId]);

    const dynamicPriority = await calculateDynamicPriority({
      report: { ...report, photo_url: firstMedia?.file_path, media_count: mediaList.length },
      location,
      candidateReports: allReportsRes.rows,
      aiAnalysis: structured
    });

    // Update Report Priority Score
    await db.query(`
      UPDATE reports SET civic_priority_score = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
    `, [dynamicPriority.score, reportId]);

    // Save Historical Priority Snapshot
    const priorityId = `pri_${crypto.randomBytes(8).toString('hex')}`;
    const explanationPayload = {
      explanations: dynamicPriority.explanations,
      structured_explanations: dynamicPriority.structured_explanations,
      base_score: dynamicPriority.base_score,
      escalation: dynamicPriority.escalation,
      severity_level: dynamicPriority.severity_level,
      severity_explanation: dynamicPriority.severity_explanation,
      contributing_factors: dynamicPriority.contributing_factors
    };

    await db.query(`
      INSERT INTO report_priority_scores (
        id, report_id, score, bucket, policy_version, weights_json, factor_scores_json,
        radius_json, override_json, explanation_json, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
    `, [
      priorityId,
      reportId,
      dynamicPriority.score,
      dynamicPriority.bucket,
      dynamicPriority.policy_version,
      JSON.stringify(dynamicPriority.weights),
      JSON.stringify(dynamicPriority.factors),
      JSON.stringify(dynamicPriority.radius),
      JSON.stringify(dynamicPriority.override),
      JSON.stringify(explanationPayload)
    ]);

    // Add Timeline Event for AI Analysis completion
    const timelineTitle = aiResult ? `AI Civic Intelligence Analysis Completed` : `Deterministic Priority Score Computed (Fallback)`;
    const timelineDesc = `Priority Score: ${dynamicPriority.score}/100 (${dynamicPriority.bucket}). Impact Radius: ${dynamicPriority.radius.effective_radius_m}m. Primary Factors: ${dynamicPriority.explanations.slice(0, 2).join('; ')}`;

    await db.query(`
      INSERT INTO report_timeline (id, report_id, stage, actor_type, actor_name, title, description, created_at)
      VALUES ($1, $2, $3, 'system', 'Civic AI Engine', $4, $5, CURRENT_TIMESTAMP)
    `, [
      `tml_${crypto.randomBytes(6).toString('hex')}`,
      reportId,
      report.status || 'Submitted',
      timelineTitle,
      timelineDesc
    ]);
  } catch (err) {
    console.error('⚠️ processReportAICompletion error:', err.message);
  }
}

globalGeminiManager.onJobCompleted(processReportAICompletion);

// ==========================================
// 1. HEALTH CHECK & DATABASE STATUS
// ==========================================
app.get('/api/health', async (req, res) => {
  try {
    const dbTest = await db.query('SELECT NOW() as current_time, COUNT(*) as report_count FROM reports');
    res.json({
      status: 'ok',
      database: 'PostgreSQL',
      currentTime: dbTest.rows[0]?.current_time,
      reportCount: parseInt(dbTest.rows[0]?.report_count || '0', 10),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      database: 'PostgreSQL connection failed',
      error: err.message
    });
  }
});

// ==========================================
// 2. MULTI-FILE & EXIF MEDIA EXTRACTION
// ==========================================
app.post('/api/upload', upload.any(), async (req, res) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    const processedFiles = [];
    for (const file of files) {
      const filePath = file.path;
      const fileExt = path.extname(file.originalname).toLowerCase();
      let exifData = null;
      let gps = null;
      let timestamp = null;
      let camera = null;

      if (['.jpg', '.jpeg', '.tiff', '.png', '.heic'].includes(fileExt)) {
        try {
          const parsed = await exifr.parse(filePath, { gps: true, tiff: true });

          if (parsed) {
            exifData = parsed;
            if (parsed.latitude && parsed.longitude) {
              gps = {
                latitude: parsed.latitude,
                longitude: parsed.longitude,
                altitude: parsed.GPSAltitude || null,
                source: 'exif'
              };
            }
            timestamp = parsed.DateTimeOriginal || parsed.CreateDate || parsed.ModifyDate || null;
            if (parsed.Make || parsed.Model) {
              camera = `${parsed.Make || ''} ${parsed.Model || ''}`.trim();
            }
          }
        } catch (exifErr) {
          console.warn('EXIF parse warning:', exifErr.message);
        }
      }

      processedFiles.push({
        mediaId: `med_${crypto.randomBytes(8).toString('hex')}`,
        fileName: file.filename,
        originalName: file.originalname,
        filePath: `/uploads/${file.filename}`,
        mimeType: file.mimetype,
        fileSize: file.size,
        mediaType: file.mimetype.startsWith('video/') ? 'video' : file.mimetype.startsWith('audio/') ? 'audio' : 'image',
        gps,
        timestamp,
        camera,
        exif: exifData
      });
    }

    res.json({
      success: true,
      count: processedFiles.length,
      files: processedFiles
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process upload.' });
  }
});

app.post('/api/media/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let exifData = null;
    let location = null;
    let timestamp = null;
    let camera = null;

    if (['.jpg', '.jpeg', '.tiff', '.png', '.heic'].includes(fileExt)) {
      try {
        const parsed = await exifr.parse(filePath, { gps: true, tiff: true });

        if (parsed) {
          exifData = parsed;
          if (parsed.latitude && parsed.longitude) {
            location = {
              latitude: parsed.latitude,
              longitude: parsed.longitude,
              altitude: parsed.GPSAltitude || null,
              source: 'exif'
            };
          }
          timestamp = parsed.DateTimeOriginal || parsed.CreateDate || parsed.ModifyDate || null;
          if (parsed.Make || parsed.Model) {
            camera = `${parsed.Make || ''} ${parsed.Model || ''}`.trim();
          }
        }
      } catch (exifErr) {
        console.warn('EXIF parse warning:', exifErr.message);
      }
    }

    const mediaId = `med_${crypto.randomBytes(8).toString('hex')}`;

    res.json({
      success: true,
      media: {
        id: mediaId,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        filePath: `/uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        mediaType: req.file.mimetype.startsWith('video/') ? 'video' : req.file.mimetype.startsWith('audio/') ? 'audio' : 'image',
        location,
        timestamp,
        camera,
        exif: exifData
      }
    });
  } catch (error) {
    console.error('Upload handling error:', error);
    res.status(500).json({ error: 'Failed to process uploaded file.' });
  }
});

// ==========================================
// 3. CREATE CIVIC REPORT
// ==========================================
app.post('/api/reports', upload.any(), async (req, res) => {
  try {
    let {
      userId,
      category,
      description,
      duration,
      recurrence,
      severity,
      isRiskPresent,
      is_risk_present,
      riskDescription,
      risk_description,
      location,
      latitude,
      longitude,
      locationSource,
      location_source,
      accuracy,
      address,
      city,
      state,
      postalCode,
      postal_code,
      media = [],
      extraContext = {},
      smartSuggested = false,
      smart_suggested = false
    } = req.body;

    const safeCategory = category || 'Other';
    const parsedRisk = (isRiskPresent !== undefined ? isRiskPresent : is_risk_present);
    const safeIsRiskPresent = Boolean(parsedRisk === true || parsedRisk === 'true' || parsedRisk === 1 || parsedRisk === '1');
    const safeRiskDesc = riskDescription || risk_description || null;
    const safeSmartSuggested = Boolean(smartSuggested === true || smartSuggested === 'true' || smart_suggested === true || smart_suggested === 'true');

    // Parse nested objects if sent as strings in FormData
    let parsedLocation = typeof location === 'string' ? parseJsonSafe(location, {}) : (location || {});
    let parsedMedia = typeof media === 'string' ? parseJsonSafe(media, []) : (Array.isArray(media) ? media : []);
    let parsedExtraContext = typeof extraContext === 'string' ? parseJsonSafe(extraContext, {}) : (extraContext || {});

    // Resolve location parameters
    const safeLat = parseFloat(parsedLocation.latitude !== undefined ? parsedLocation.latitude : latitude);
    const safeLng = parseFloat(parsedLocation.longitude !== undefined ? parsedLocation.longitude : longitude);
    const safeLocSource = parsedLocation.source || locationSource || location_source || 'manual';
    const safeAccuracy = parseFloat(parsedLocation.accuracy !== undefined ? parsedLocation.accuracy : accuracy) || null;
    const safeAddress = parsedLocation.address || address || null;
    const safeCity = parsedLocation.city || city || null;
    const safeState = parsedLocation.state || state || null;
    const safePostalCode = parsedLocation.postalCode || postalCode || postal_code || null;

    if (isNaN(safeLat) || isNaN(safeLng)) {
      return res.status(400).json({ error: 'Valid latitude and longitude are required.' });
    }

    // Attach any multipart uploaded files to media list
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      req.files.forEach(file => {
        parsedMedia.push({
          mediaId: `med_${crypto.randomBytes(8).toString('hex')}`,
          fileName: file.filename,
          originalName: file.originalname,
          filePath: `/uploads/${file.filename}`,
          mimeType: file.mimetype,
          fileSize: file.size,
          mediaType: file.mimetype.startsWith('video/') ? 'video' : file.mimetype.startsWith('audio/') ? 'audio' : 'image'
        });
      });
    }

    const reportId = `rep_${crypto.randomBytes(8).toString('hex')}`;
    const reportCode = `ALC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const priorityScore = calculateCivicPriorityScore({
      severity,
      isRiskPresent: safeIsRiskPresent,
      recurrence,
      category: safeCategory
    });

    await db.transaction(async (client) => {
      // 1. Ensure user exists
      if (userId) {
        await client.query(`
          INSERT INTO users (id, name, created_at)
          VALUES ($1, 'Citizen', CURRENT_TIMESTAMP)
          ON CONFLICT (id) DO NOTHING
        `, [userId]);
      }

      // 2. Insert Report
      await client.query(`
        INSERT INTO reports (
          id, report_code, user_id, category, description, duration, recurrence, severity,
          is_risk_present, risk_description, status, civic_priority_score, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Submitted', $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        reportId,
        reportCode,
        userId || null,
        safeCategory,
        description || '',
        duration || null,
        recurrence || null,
        severity || null,
        safeIsRiskPresent,
        safeRiskDesc,
        priorityScore
      ]);

      // 3. Insert Report Location (with PostGIS geometry)
      await client.query(`
        INSERT INTO report_location (
          id, report_id, latitude, longitude, location_source, accuracy, address, city, state, postal_code, location_geom, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, ST_SetSRID(ST_MakePoint($4, $3), 4326), CURRENT_TIMESTAMP)
      `, [
        `loc_${crypto.randomBytes(6).toString('hex')}`,
        reportId,
        safeLat,
        safeLng,
        safeLocSource,
        safeAccuracy,
        safeAddress,
        safeCity,
        safeState,
        safePostalCode
      ]);

      // 4. Issue Details
      await client.query(`
        INSERT INTO issue_details (
          id, report_id, category, duration, recurrence, severity, smart_suggested, extra_context_json, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      `, [
        `iss_${crypto.randomBytes(6).toString('hex')}`,
        reportId,
        safeCategory,
        duration || null,
        recurrence || null,
        severity || null,
        safeSmartSuggested,
        JSON.stringify(parsedExtraContext)
      ]);

      // 5. Media & Metadata
      for (const item of parsedMedia) {
        const mediaId = `med_${crypto.randomBytes(8).toString('hex')}`;
        await client.query(`
          INSERT INTO report_media (
            id, report_id, media_type, original_name, file_name, file_path, mime_type, file_size, duration_seconds, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
        `, [
          mediaId,
          reportId,
          item.mediaType || 'image',
          item.originalName || 'uploaded_media',
          item.fileName || path.basename(item.filePath || ''),
          item.filePath || '',
          item.mimeType || null,
          item.fileSize || null,
          item.durationSeconds || null
        ]);

        if (item.exif || item.deviceInfo) {
          await client.query(`
            INSERT INTO report_metadata (
              id, report_id, media_id, exif_json, device_info, created_at
            ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
          `, [
            `met_${crypto.randomBytes(6).toString('hex')}`,
            reportId,
            mediaId,
            item.exif ? JSON.stringify(item.exif) : null,
            item.deviceInfo ? JSON.stringify(item.deviceInfo) : null
          ]);
        }
      }

      // 6. Seed Initial Timeline Event
      await client.query(`
        INSERT INTO report_timeline (
          id, report_id, stage, actor_type, actor_name, title, description, created_at
        ) VALUES ($1, $2, 'Submitted', 'citizen', 'Citizen Reporter', 'Report Submitted', $3, CURRENT_TIMESTAMP)
      `, [
        `tml_${crypto.randomBytes(6).toString('hex')}`,
        reportId,
        `Report registered with priority score ${priorityScore}/100 and queued for municipal triage.`
      ]);
    });

    const reportRes = await db.query(`SELECT * FROM reports WHERE id = $1`, [reportId]);
    const locRes = await db.query(`SELECT * FROM report_location WHERE report_id = $1`, [reportId]);
    const mediaRes = await db.query(`SELECT * FROM report_media WHERE report_id = $1`, [reportId]);
    const detailsRes = await db.query(`SELECT * FROM issue_details WHERE report_id = $1`, [reportId]);
    const timelineRes = await db.query(`SELECT * FROM report_timeline WHERE report_id = $1 ORDER BY created_at ASC`, [reportId]);

    // Asynchronously enqueue AI Civic Intelligence Analysis (never blocks report response)
    let aiJobPriority = AIJobPriority.NORMAL;
    if (safeIsRiskPresent || severity === 'Dangerous') {
      aiJobPriority = AIJobPriority.CRITICAL;
    } else if (severity === 'Serious') {
      aiJobPriority = AIJobPriority.HIGH;
    }

    const firstMedia = mediaRes.rows[0];
    const mediaDiskPath = firstMedia ? path.join(__dirname, firstMedia.file_path.replace(/^\//, '')) : null;

    globalGeminiManager.enqueueAnalysis({
      report: {
        id: reportId,
        report_code: reportCode,
        category: safeCategory,
        description: description || '',
        duration: duration || '',
        recurrence: recurrence || '',
        severity: severity || 'Moderate',
        isRiskPresent: safeIsRiskPresent,
        riskDescription: safeRiskDesc,
        created_at: new Date().toISOString()
      },
      location: {
        latitude: safeLat,
        longitude: safeLng,
        city: safeCity
      },
      mediaPath: mediaDiskPath,
      mimeType: firstMedia?.mime_type,
      priority: aiJobPriority
    }).catch(aiEnqueueErr => {
      console.warn('⚠️ Asynchronous AI queueing notice:', aiEnqueueErr.message);
    });

    res.status(201).json({
      success: true,
      report: {
        ...reportRes.rows[0],
        location: locRes.rows[0] || null,
        media: mediaRes.rows,
        issueDetails: detailsRes.rows[0] || null,
        timeline: timelineRes.rows,
        civic_priority_score: priorityScore,
        priority_bucket: getPriorityBucket(priorityScore).bucket
      }
    });
  } catch (error) {
    console.error('Report submission error:', error);
    res.status(500).json({ error: error.message || 'Failed to persist report to database.' });
  }
});

// ==========================================
// 4. LIST ALL REPORTS
// ==========================================
app.get('/api/reports', async (req, res) => {
  try {
    const reportsRes = await db.query(`
      SELECT r.*, 
             l.latitude, l.longitude, l.location_source, l.accuracy, l.address, l.city
      FROM reports r
      LEFT JOIN report_location l ON r.id = l.report_id
      ORDER BY r.created_at DESC
    `);
    const reports = reportsRes.rows;

    const mediaListRes = await db.query(`SELECT * FROM report_media`);
    const metadataListRes = await db.query(`SELECT * FROM report_metadata`);
    const assignmentsListRes = await db.query(`SELECT * FROM report_assignments`);
    const resolutionsListRes = await db.query(`SELECT * FROM report_resolutions`);
    const challengesListRes = await db.query(`SELECT * FROM hei_challenges`);
    const projectsListRes = await db.query(`SELECT * FROM hei_projects`);

    const mediaList = mediaListRes.rows;
    const metadataList = metadataListRes.rows;
    const assignmentsList = assignmentsListRes.rows;
    const resolutionsList = resolutionsListRes.rows;
    const challengesList = challengesListRes.rows;
    const projectsList = projectsListRes.rows;

    const enriched = reports.map(r => {
      const bucketInfo = getPriorityBucket(r.civic_priority_score || 30);
      const radiusInfo = calculateEffectiveRadius(r.category);

      return {
        ...r,
        priority_bucket: bucketInfo.bucket,
        effective_radius_m: radiusInfo.effective_radius_m,
        media: mediaList.filter(m => m.report_id === r.id),
        assignment: assignmentsList.find(a => a.report_id === r.id) || null,
        resolution: resolutionsList.find(res => res.report_id === r.id) || null,
        hei_challenge: challengesList.find(c => c.report_id === r.id) || null,
        hei_project: projectsList.find(p => p.report_id === r.id) || null,
        is_escalated_to_hei: !!challengesList.find(c => c.report_id === r.id),
        metadata: metadataList.filter(m => m.report_id === r.id).map(m => ({
          ...m,
          exif: parseJsonSafe(m.exif_json)
        }))
      };
    });

    res.json({
      success: true,
      count: enriched.length,
      reports: enriched
    });
  } catch (err) {
    console.error('Fetch reports error:', err);
    res.status(500).json({ error: 'Failed to retrieve reports from PostgreSQL.' });
  }
});

// ==========================================
// 5. GET INDIVIDUAL REPORT & FULL LIFECYCLE
// ==========================================
app.get('/api/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] || req.query.userId || null;

    const reportRes = await db.query(`
      SELECT * FROM reports WHERE id = $1 OR report_code = $1
    `, [id]);

    const report = reportRes.rows[0];
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    const locRes = await db.query(`SELECT * FROM report_location WHERE report_id = $1`, [report.id]);
    const mediaRes = await db.query(`SELECT * FROM report_media WHERE report_id = $1`, [report.id]);
    const detailsRes = await db.query(`SELECT * FROM issue_details WHERE report_id = $1`, [report.id]);
    const metadataRes = await db.query(`SELECT * FROM report_metadata WHERE report_id = $1`, [report.id]);
    const timelineRes = await db.query(`SELECT * FROM report_timeline WHERE report_id = $1 ORDER BY created_at ASC`, [report.id]);
    const assignRes = await db.query(`SELECT * FROM report_assignments WHERE report_id = $1`, [report.id]);
    const resRes = await db.query(`SELECT * FROM report_resolutions WHERE report_id = $1`, [report.id]);
    const verifRes = await db.query(`SELECT * FROM report_verifications WHERE report_id = $1 ORDER BY created_at DESC`, [report.id]);

    const upvoteRes = await db.query(`SELECT COUNT(*) as count FROM report_upvotes WHERE report_id = $1`, [report.id]);
    const followRes = await db.query(`SELECT COUNT(*) as count FROM report_followers WHERE report_id = $1`, [report.id]);

    const upvoteCount = parseInt(upvoteRes.rows[0]?.count || '0', 10);
    const followerCount = parseInt(followRes.rows[0]?.count || '0', 10);

    // Fetch associated HEI Challenge & Project data if escalated
    const challengeRes = await db.query(`SELECT * FROM hei_challenges WHERE report_id = $1 ORDER BY created_at DESC LIMIT 1`, [report.id]);
    const projectRes = await db.query(`SELECT * FROM hei_projects WHERE report_id = $1 ORDER BY created_at DESC LIMIT 1`, [report.id]);
    let milestones = [];
    if (projectRes.rows.length > 0) {
      const msRes = await db.query(`SELECT * FROM hei_project_milestones WHERE project_id = $1 ORDER BY stage_index ASC`, [projectRes.rows[0].id]);
      milestones = msRes.rows;
    }

    let isUpvoted = false;
    let isFollowed = false;
    if (userId) {
      const upCheck = await db.query(`SELECT 1 FROM report_upvotes WHERE report_id = $1 AND user_id = $2`, [report.id, userId]);
      const folCheck = await db.query(`SELECT 1 FROM report_followers WHERE report_id = $1 AND user_id = $2`, [report.id, userId]);
      isUpvoted = upCheck.rows.length > 0;
      isFollowed = folCheck.rows.length > 0;
    }

    // Fetch latest AI analysis & priority breakdown
    const aiRes = await db.query(`SELECT * FROM report_ai_analysis WHERE report_id = $1 ORDER BY created_at DESC LIMIT 1`, [report.id]);
    const priorityRes = await db.query(`SELECT * FROM report_priority_scores WHERE report_id = $1 ORDER BY created_at DESC LIMIT 1`, [report.id]);

    const latestAi = aiRes.rows[0] || null;
    const latestPriority = priorityRes.rows[0] || null;

    let priorityData = null;
    if (latestPriority) {
      const rawExp = parseJsonSafe(latestPriority.explanation_json, []);
      const isRichExp = rawExp && typeof rawExp === 'object' && !Array.isArray(rawExp);

      priorityData = {
        score: latestPriority.score,
        base_score: isRichExp ? (rawExp.base_score ?? latestPriority.score) : latestPriority.score,
        bucket: latestPriority.bucket,
        policy_version: latestPriority.policy_version,
        severity_level: isRichExp ? rawExp.severity_level : (latestAi?.structured_output?.severity >= 8 ? 'Critical' : report.severity || 'Moderate'),
        severity_explanation: isRichExp ? rawExp.severity_explanation : [report.description || 'Assessed based on reported incident impact.'],
        escalation: isRichExp ? rawExp.escalation : { applied: false, points_added: 0, reason: null },
        weights: parseJsonSafe(latestPriority.weights_json, {}),
        factors: parseJsonSafe(latestPriority.factor_scores_json, {}),
        contributing_factors: isRichExp ? (rawExp.contributing_factors || []) : [],
        radius: parseJsonSafe(latestPriority.radius_json, {}),
        override: parseJsonSafe(latestPriority.override_json, null),
        explanations: isRichExp ? rawExp.explanations : (Array.isArray(rawExp) ? rawExp : []),
        structured_explanations: isRichExp ? (rawExp.structured_explanations || []) : []
      };
    } else {
      // Dynamic on-the-fly priority evaluation if snapshot not yet written
      const fallbackBucket = getPriorityBucket(report.civic_priority_score || 30);
      const fallbackRadius = calculateEffectiveRadius(report.category);
      const sevLevel = report.severity === 'Dangerous' ? 'Critical' : report.severity === 'Serious' ? 'High' : report.severity === 'Moderate' ? 'Medium' : 'Low';
      const sevExp = generateSeverityExplanation({ category: report.category, description: report.description, severityLevel: sevLevel, isRiskPresent: report.is_risk_present });

      priorityData = {
        score: report.civic_priority_score || 30,
        base_score: report.civic_priority_score || 30,
        bucket: fallbackBucket.bucket,
        policy_version: PRIORITY_POLICY_VERSION,
        severity_level: sevLevel,
        severity_explanation: sevExp,
        escalation: { applied: false, points_added: 0, reason: null },
        weights: {},
        factors: { safety: 50, location: 40, severity: 50, report_volume: 30, vulnerable_population: 30, weather: 10, time_open: 20, urgency_evidence: 40 },
        contributing_factors: [],
        radius: fallbackRadius,
        override: null,
        explanations: ['Initial baseline priority scheduled in municipal workflow'],
        structured_explanations: []
      };
    }

    res.json({
      success: true,
      report: {
        ...report,
        location: locRes.rows[0] || null,
        media: mediaRes.rows,
        issueDetails: detailsRes.rows[0] || null,
        timeline: timelineRes.rows,
        assignment: assignRes.rows[0] || null,
        resolution: resRes.rows[0] || null,
        upvote_count: upvoteCount,
        follower_count: followerCount,
        is_upvoted: isUpvoted,
        is_followed: isFollowed,
        is_escalated_to_hei: challengeRes.rows.length > 0,
        hei_challenge: challengeRes.rows[0] || null,
        hei_project: projectRes.rows.length > 0 ? {
          ...projectRes.rows[0],
          student_team: parseJsonSafe(projectRes.rows[0].student_team_json, []),
          sdg_goals: parseJsonSafe(projectRes.rows[0].sdg_goals_json, []),
          milestones
        } : null,
        ai_analysis: latestAi ? {
          ...latestAi,
          structured_output: parseJsonSafe(latestAi.structured_output_json, null)
        } : null,
        priority_breakdown: priorityData,
        priority_bucket: priorityData.bucket,
        effective_radius_m: priorityData.radius?.effective_radius_m || 150,
        verifications: verifRes.rows.map(v => ({
          ...v,
          followUpMedia: parseJsonSafe(v.follow_up_media_json, [])
        })),
        metadata: metadataRes.rows.map(m => ({
          ...m,
          exif: parseJsonSafe(m.exif_json)
        }))
      }
    });
  } catch (err) {
    console.error('Fetch single report error:', err);
    res.status(500).json({ error: 'Failed to fetch report details.' });
  }
});

// ==========================================
// 5A. AI CIVIC INTELLIGENCE HEALTH & METRICS
// ==========================================
app.get('/api/health/ai', (req, res) => {
  try {
    const metrics = globalGeminiManager.getMetrics();
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...metrics
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve AI health metrics.', details: err.message });
  }
});

// ==========================================
// 5B. TRIGGER / RE-RUN AI REPORT ANALYSIS
// ==========================================
app.post('/api/reports/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params;
    const reportRes = await db.query(`SELECT * FROM reports WHERE id = $1 OR report_code = $1`, [id]);
    const report = reportRes.rows[0];
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    const locRes = await db.query(`SELECT * FROM report_location WHERE report_id = $1`, [report.id]);
    const mediaRes = await db.query(`SELECT * FROM report_media WHERE report_id = $1`, [report.id]);

    const firstMedia = mediaRes.rows[0];
    const mediaDiskPath = firstMedia ? path.join(__dirname, firstMedia.file_path.replace(/^\//, '')) : null;

    let priority = AIJobPriority.NORMAL;
    if (report.is_risk_present || report.severity === 'Dangerous') priority = AIJobPriority.CRITICAL;
    else if (report.severity === 'Serious') priority = AIJobPriority.HIGH;

    const enqueueRes = await globalGeminiManager.enqueueAnalysis({
      report: {
        id: report.id,
        report_code: report.report_code,
        category: report.category,
        description: report.description,
        duration: report.duration,
        recurrence: report.recurrence,
        severity: report.severity,
        isRiskPresent: report.is_risk_present,
        riskDescription: report.risk_description,
        created_at: report.created_at
      },
      location: locRes.rows[0] || {},
      mediaPath: mediaDiskPath,
      mimeType: firstMedia?.mime_type,
      priority
    });

    res.json({
      success: true,
      message: 'AI analysis job queued successfully.',
      status: enqueueRes.status,
      queue_depth: enqueueRes.queueDepth
    });
  } catch (err) {
    console.error('Trigger AI analysis error:', err);
    res.status(500).json({ error: 'Failed to enqueue AI analysis.', details: err.message });
  }
});

// ==========================================
// 5C. GET LATEST AI ANALYSIS FOR REPORT
// ==========================================
app.get('/api/reports/:id/ai-analysis', async (req, res) => {
  try {
    const { id } = req.params;
    const reportRes = await db.query(`SELECT id FROM reports WHERE id = $1 OR report_code = $1`, [id]);
    const report = reportRes.rows[0];
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    const aiRes = await db.query(`SELECT * FROM report_ai_analysis WHERE report_id = $1 ORDER BY created_at DESC LIMIT 1`, [report.id]);
    const row = aiRes.rows[0];

    if (!row) {
      return res.json({
        success: true,
        status: 'pending',
        message: 'AI analysis is currently queued or in-progress.'
      });
    }

    res.json({
      success: true,
      analysis: {
        ...row,
        structured_output: parseJsonSafe(row.structured_output_json)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch AI analysis.', details: err.message });
  }
});

// ==========================================
// 5D. GET DYNAMIC PRIORITY BREAKDOWN
// ==========================================
app.get('/api/reports/:id/priority', async (req, res) => {
  try {
    const { id } = req.params;
    const reportRes = await db.query(`SELECT * FROM reports WHERE id = $1 OR report_code = $1`, [id]);
    const report = reportRes.rows[0];
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    const locRes = await db.query(`SELECT * FROM report_location WHERE report_id = $1`, [report.id]);
    const mediaRes = await db.query(`SELECT * FROM report_media WHERE report_id = $1`, [report.id]);
    const aiRes = await db.query(`SELECT * FROM report_ai_analysis WHERE report_id = $1 ORDER BY created_at DESC LIMIT 1`, [report.id]);
    const structured = parseJsonSafe(aiRes.rows[0]?.structured_output_json, null);

    const allReportsRes = await db.query(`
      SELECT r.*, l.latitude, l.longitude FROM reports r
      LEFT JOIN report_location l ON r.id = l.report_id
      WHERE r.id != $1
    `, [report.id]);

    const dynamicPriority = await calculateDynamicPriority({
      report: { ...report, photo_url: mediaRes.rows[0]?.file_path, media_count: mediaRes.rows.length },
      location: locRes.rows[0] || {},
      candidateReports: allReportsRes.rows,
      aiAnalysis: structured
    });

    res.json({
      success: true,
      priority: {
        score: dynamicPriority.score,
        bucket: dynamicPriority.bucket,
        response_target: dynamicPriority.response_target
      },
      radius: dynamicPriority.radius,
      factors: dynamicPriority.factors,
      weights: dynamicPriority.weights,
      domain_profile: dynamicPriority.domain_profile,
      policy_version: dynamicPriority.policy_version,
      cluster: dynamicPriority.cluster,
      location_intelligence: dynamicPriority.location_intelligence,
      weather: dynamicPriority.weather,
      explanations: dynamicPriority.explanations
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate report priority.', details: err.message });
  }
});

// ==========================================
// 5E. GET PRIORITY EXPLANATION
// ==========================================
app.get('/api/reports/:id/priority-explanation', async (req, res) => {
  try {
    const { id } = req.params;
    const reportRes = await db.query(`SELECT * FROM reports WHERE id = $1 OR report_code = $1`, [id]);
    const report = reportRes.rows[0];
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    const priorityRes = await db.query(`SELECT * FROM report_priority_scores WHERE report_id = $1 ORDER BY created_at DESC LIMIT 1`, [report.id]);
    const latest = priorityRes.rows[0];

    if (latest && latest.explanation_json) {
      return res.json({
        success: true,
        score: latest.score,
        bucket: latest.bucket,
        explanations: parseJsonSafe(latest.explanation_json, []),
        factors: parseJsonSafe(latest.factor_scores_json, {})
      });
    }

    // Dynamic fallback
    const locRes = await db.query(`SELECT * FROM report_location WHERE report_id = $1`, [report.id]);
    const dynamicPriority = await calculateDynamicPriority({
      report,
      location: locRes.rows[0] || {},
      candidateReports: []
    });

    res.json({
      success: true,
      score: dynamicPriority.score,
      bucket: dynamicPriority.bucket,
      explanations: dynamicPriority.explanations,
      factors: dynamicPriority.factors
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve score explanation.', details: err.message });
  }
});

// ==========================================
// 5F. REGULATORY / MUNICIPAL PRIORITY OVERRIDE
// ==========================================
app.post('/api/reports/:id/override', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      override_enabled = true,
      override_type = 'vip_route',
      override_reason = 'Designated emergency transit route',
      override_priority_floor = 85,
      officer_name = 'Municipal Commissioner'
    } = req.body;

    const reportRes = await db.query(`SELECT * FROM reports WHERE id = $1 OR report_code = $1`, [id]);
    const report = reportRes.rows[0];
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    const locRes = await db.query(`SELECT * FROM report_location WHERE report_id = $1`, [report.id]);
    const aiRes = await db.query(`SELECT * FROM report_ai_analysis WHERE report_id = $1 ORDER BY created_at DESC LIMIT 1`, [report.id]);
    const structured = parseJsonSafe(aiRes.rows[0]?.structured_output_json, null);

    const overrideObj = {
      override_enabled: Boolean(override_enabled),
      override_type,
      override_reason,
      override_priority_floor: Number(override_priority_floor),
      authorized_by: officer_name,
      timestamp: new Date().toISOString()
    };

    const dynamicPriority = await calculateDynamicPriority({
      report,
      location: locRes.rows[0] || {},
      candidateReports: [],
      aiAnalysis: structured,
      override: overrideObj
    });

    // Update Report Score
    await db.query(`UPDATE reports SET civic_priority_score = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [dynamicPriority.score, report.id]);

    // Save Historical Priority Snapshot
    const priorityId = `pri_${crypto.randomBytes(8).toString('hex')}`;
    await db.query(`
      INSERT INTO report_priority_scores (
        id, report_id, score, bucket, policy_version, weights_json, factor_scores_json,
        radius_json, override_json, explanation_json, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
    `, [
      priorityId,
      report.id,
      dynamicPriority.score,
      dynamicPriority.bucket,
      dynamicPriority.policy_version,
      JSON.stringify(dynamicPriority.weights),
      JSON.stringify(dynamicPriority.factors),
      JSON.stringify(dynamicPriority.radius),
      JSON.stringify(overrideObj),
      JSON.stringify(dynamicPriority.explanations)
    ]);

    // Add Timeline Event for Auditability
    await db.query(`
      INSERT INTO report_timeline (id, report_id, stage, actor_type, actor_name, title, description, created_at)
      VALUES ($1, $2, $3, 'authority', $4, 'Regulatory Priority Override Applied', $5, CURRENT_TIMESTAMP)
    `, [
      `tml_${crypto.randomBytes(6).toString('hex')}`,
      report.id,
      report.status || 'Submitted',
      officer_name,
      `Priority floor elevated to ${override_priority_floor}/100. Reason: ${override_reason}`
    ]);

    res.json({
      success: true,
      message: 'Priority override successfully applied.',
      new_priority_score: dynamicPriority.score,
      priority_bucket: dynamicPriority.bucket,
      override: overrideObj
    });
  } catch (err) {
    console.error('Priority override error:', err);
    res.status(500).json({ error: 'Failed to apply priority override.', details: err.message });
  }
});

// ==========================================
// 6. TRANSITION STAGE ENDPOINT
// ==========================================
app.post('/api/reports/:id/stage', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      stage,
      actorName = 'Municipal Authority',
      actorType = 'authority',
      title,
      description = '',
      departmentName,
      officerName,
      scheduledDate,
      resolutionNotes,
      resolutionPhotoUrl,
      resolutionPhotoName
    } = req.body;

    const reportRes = await db.query(`SELECT * FROM reports WHERE id = $1 OR report_code = $1`, [id]);
    const report = reportRes.rows[0];
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    await db.transaction(async (client) => {
      // 1. Update Report Status
      await client.query(`UPDATE reports SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [stage, report.id]);

      // 2. Add Timeline event
      const eventTitle = title || `Status updated to ${stage}`;
      await client.query(`
        INSERT INTO report_timeline (id, report_id, stage, actor_type, actor_name, title, description, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      `, [
        `tml_${crypto.randomBytes(6).toString('hex')}`,
        report.id,
        stage,
        actorType,
        actorName,
        eventTitle,
        description
      ]);

      // 3. Handle Assignment if provided
      if (departmentName && officerName) {
        await client.query(`
          INSERT INTO report_assignments (id, report_id, department_name, officer_name, scheduled_date, notes, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
          ON CONFLICT(report_id) DO UPDATE SET
            department_name = EXCLUDED.department_name,
            officer_name = EXCLUDED.officer_name,
            scheduled_date = EXCLUDED.scheduled_date,
            notes = EXCLUDED.notes,
            updated_at = CURRENT_TIMESTAMP
        `, [
          `asg_${crypto.randomBytes(6).toString('hex')}`,
          report.id,
          departmentName,
          officerName,
          scheduledDate || null,
          description || null
        ]);
      }

      // 4. Handle Resolution if marked Resolved
      if (stage === 'Resolved' && resolutionNotes) {
        await client.query(`
          INSERT INTO report_resolutions (id, report_id, resolution_notes, resolved_by, resolution_photo_url, resolution_photo_name, resolution_timestamp, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT(report_id) DO UPDATE SET
            resolution_notes = EXCLUDED.resolution_notes,
            resolved_by = EXCLUDED.resolved_by,
            resolution_photo_url = EXCLUDED.resolution_photo_url,
            resolution_photo_name = EXCLUDED.resolution_photo_name,
            resolution_timestamp = CURRENT_TIMESTAMP
        `, [
          `res_${crypto.randomBytes(6).toString('hex')}`,
          report.id,
          resolutionNotes,
          officerName || actorName,
          resolutionPhotoUrl || null,
          resolutionPhotoName || null
        ]);
      }
    });

    // Notify followers
    notifyReportFollowers(
      report.id,
      'stage_change',
      `Report ${report.report_code}: Status changed to ${stage}`,
      description || `Authority updated stage to ${stage}. Remediation is progressing.`
    );

    const updatedRes = await db.query(`SELECT * FROM reports WHERE id = $1`, [report.id]);
    const timelineRes = await db.query(`SELECT * FROM report_timeline WHERE report_id = $1 ORDER BY created_at ASC`, [report.id]);
    const assignRes = await db.query(`SELECT * FROM report_assignments WHERE report_id = $1`, [report.id]);
    const resRes = await db.query(`SELECT * FROM report_resolutions WHERE report_id = $1`, [report.id]);

    res.json({
      success: true,
      report: {
        ...updatedRes.rows[0],
        timeline: timelineRes.rows,
        assignment: assignRes.rows[0] || null,
        resolution: resRes.rows[0] || null
      }
    });
  } catch (err) {
    console.error('Stage transition error:', err);
    res.status(500).json({ error: 'Failed to update report stage.' });
  }
});

// ==========================================
// 7. CITIZEN VERIFICATION FEEDBACK LOOP
// ==========================================
app.post('/api/reports/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      verdict,
      citizenNotes = '',
      satisfactionRating = 5,
      followUpMedia = []
    } = req.body;

    if (!verdict) {
      return res.status(400).json({ error: 'Verification verdict is required.' });
    }

    const reportRes = await db.query(`SELECT * FROM reports WHERE id = $1 OR report_code = $1`, [id]);
    const report = reportRes.rows[0];
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    let newStatus = 'Confirmed Resolved';
    let timelineTitle = 'Citizen Confirmed Resolution';
    let timelineDesc = citizenNotes || 'Citizen verified that the civic problem has been completely fixed.';

    if (verdict === 'not_fixed') {
      newStatus = 'Follow-up Required';
      timelineTitle = 'Citizen Flagged: Issue Not Resolved';
      timelineDesc = citizenNotes || 'Citizen reported that the issue remains unresolved. Follow-up action required.';
    } else if (verdict === 'partially_fixed') {
      newStatus = 'Follow-up Required';
      timelineTitle = 'Citizen Flagged: Partially Fixed';
      timelineDesc = citizenNotes || 'Citizen reported the issue was only partially resolved. Additional inspection needed.';
    }

    await db.transaction(async (client) => {
      await client.query(`UPDATE reports SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [newStatus, report.id]);

      await client.query(`
        INSERT INTO report_verifications (
          id, report_id, verdict, citizen_notes, satisfaction_rating, follow_up_media_json, verified_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        `ver_${crypto.randomBytes(6).toString('hex')}`,
        report.id,
        verdict,
        citizenNotes,
        satisfactionRating,
        JSON.stringify(followUpMedia)
      ]);

      await client.query(`
        INSERT INTO report_timeline (
          id, report_id, stage, actor_type, actor_name, title, description, created_at
        ) VALUES ($1, $2, $3, 'citizen', 'Citizen Reporter', $4, $5, CURRENT_TIMESTAMP)
      `, [
        `tml_${crypto.randomBytes(6).toString('hex')}`,
        report.id,
        newStatus,
        timelineTitle,
        timelineDesc
      ]);
    });

    const updatedRes = await db.query(`SELECT * FROM reports WHERE id = $1`, [report.id]);
    const timelineRes = await db.query(`SELECT * FROM report_timeline WHERE report_id = $1 ORDER BY created_at ASC`, [report.id]);
    const verifRes = await db.query(`SELECT * FROM report_verifications WHERE report_id = $1 ORDER BY created_at DESC`, [report.id]);

    res.json({
      success: true,
      report: {
        ...updatedRes.rows[0],
        timeline: timelineRes.rows,
        verifications: verifRes.rows
      }
    });
  } catch (err) {
    console.error('Citizen verification error:', err);
    res.status(500).json({ error: 'Failed to record citizen verification.' });
  }
});

// ==========================================
// 8. SIMULATE ADVANCE ENDPOINT
// ==========================================
app.post('/api/reports/:id/simulate-advance', async (req, res) => {
  try {
    const { id } = req.params;
    const { targetStage } = req.body;

    const reportRes = await db.query(`SELECT * FROM reports WHERE id = $1 OR report_code = $1`, [id]);
    const report = reportRes.rows[0];
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    const deptInfo = getDepartmentForCategory(report.category);

    const stagesOrder = [
      'Submitted',
      'Under Review',
      'Assigned',
      'Action Scheduled',
      'In Progress',
      'Resolved',
    ];

    let currentIdx = stagesOrder.indexOf(report.status);
    if (currentIdx === -1) currentIdx = 0;

    let nextStage = targetStage || (currentIdx < stagesOrder.length - 1 ? stagesOrder[currentIdx + 1] : 'Resolved');

    let stageTitle = '';
    let stageDesc = '';
    let resolutionNotes = null;
    let resolutionPhotoUrl = null;

    if (nextStage === 'Under Review') {
      stageTitle = 'Report Under Municipal Review';
      stageDesc = `Automated validation and geo-cluster check completed. Incident triaged to ${deptInfo.dept}.`;
    } else if (nextStage === 'Assigned') {
      stageTitle = `Assigned to ${deptInfo.dept}`;
      stageDesc = `Assigned to Field Supervisor ${deptInfo.officer} for on-site assessment.`;
    } else if (nextStage === 'Action Scheduled') {
      stageTitle = 'Field Inspection & Repair Scheduled';
      stageDesc = `Work order scheduled for inspection within ${deptInfo.slaHours} hours. Crew dispatched.`;
    } else if (nextStage === 'In Progress') {
      stageTitle = 'Repair & Remediation in Progress';
      stageDesc = `Field team on site. Debris cleared / repairs commenced under supervision of ${deptInfo.officer}.`;
    } else if (nextStage === 'Resolved') {
      stageTitle = 'Remediation Completed by Authority';
      stageDesc = `Work completed. Waterway unblocked and reinforced with concrete grading. Photographic proof submitted.`;
      resolutionNotes = `Field crew resolved blockage and cleaned 45 meters of drainage channel. Normal flow restored.`;
      resolutionPhotoUrl = '/samples/flooded_road_mumbai.jpg';
    }

    await db.transaction(async (client) => {
      await client.query(`UPDATE reports SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [nextStage, report.id]);

      await client.query(`
        INSERT INTO report_timeline (id, report_id, stage, actor_type, actor_name, title, description, created_at)
        VALUES ($1, $2, $3, 'authority', $4, $5, $6, CURRENT_TIMESTAMP)
      `, [
        `tml_${crypto.randomBytes(6).toString('hex')}`,
        report.id,
        nextStage,
        deptInfo.officer,
        stageTitle,
        stageDesc
      ]);

      await client.query(`
        INSERT INTO report_assignments (id, report_id, department_name, officer_name, scheduled_date, notes, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        ON CONFLICT(report_id) DO UPDATE SET
          department_name = EXCLUDED.department_name,
          officer_name = EXCLUDED.officer_name,
          notes = EXCLUDED.notes,
          updated_at = CURRENT_TIMESTAMP
      `, [
        `asg_${crypto.randomBytes(6).toString('hex')}`,
        report.id,
        deptInfo.dept,
        deptInfo.officer,
        new Date(Date.now() + deptInfo.slaHours * 3600000).toLocaleString(),
        stageDesc
      ]);

      if (nextStage === 'Resolved') {
        await client.query(`
          INSERT INTO report_resolutions (id, report_id, resolution_notes, resolved_by, resolution_photo_url, resolution_photo_name, resolution_timestamp, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT(report_id) DO UPDATE SET
            resolution_notes = EXCLUDED.resolution_notes,
            resolved_by = EXCLUDED.resolved_by,
            resolution_photo_url = EXCLUDED.resolution_photo_url,
            resolution_photo_name = EXCLUDED.resolution_photo_name,
            resolution_timestamp = CURRENT_TIMESTAMP
        `, [
          `res_${crypto.randomBytes(6).toString('hex')}`,
          report.id,
          resolutionNotes,
          deptInfo.officer,
          resolutionPhotoUrl,
          'remediation_proof_site.jpg'
        ]);
      }
    });

    notifyReportFollowers(
      report.id,
      'stage_change',
      `Report ${report.report_code}: Status changed to ${nextStage}`,
      stageDesc || `Authority updated stage to ${nextStage}. Remediation is progressing.`
    );

    const updatedRes = await db.query(`SELECT * FROM reports WHERE id = $1`, [report.id]);
    const timelineRes = await db.query(`SELECT * FROM report_timeline WHERE report_id = $1 ORDER BY created_at ASC`, [report.id]);
    const assignRes = await db.query(`SELECT * FROM report_assignments WHERE report_id = $1`, [report.id]);
    const resRes = await db.query(`SELECT * FROM report_resolutions WHERE report_id = $1`, [report.id]);

    res.json({
      success: true,
      report: {
        ...updatedRes.rows[0],
        timeline: timelineRes.rows,
        assignment: assignRes.rows[0] || null,
        resolution: resRes.rows[0] || null
      }
    });
  } catch (err) {
    console.error('Simulation advance error:', err);
    res.status(500).json({ error: 'Failed to simulate lifecycle stage.' });
  }
});

// ==========================================
// 9. COMMUNITY ISSUES FEED ENDPOINT
// ==========================================
app.get('/api/community/issues', async (req, res) => {
  try {
    const {
      lat = 19.0760,
      lng = 72.8777,
      sort = 'nearby',
      category = 'all',
      priority = 'all',
      search = '',
    } = req.query;

    const userId = req.headers['x-user-id'] || req.query.userId || null;
    const userLat = parseFloat(lat) || 19.0760;
    const userLng = parseFloat(lng) || 72.8777;

    let query = `
      SELECT r.*,
             l.latitude, l.longitude, l.location_source, l.accuracy, l.address, l.city,
             (SELECT file_path FROM report_media WHERE report_id = r.id AND media_type = 'image' LIMIT 1) as photo_url,
             (SELECT COUNT(*) FROM report_media WHERE report_id = r.id) as media_count,
             (SELECT COUNT(*) FROM report_upvotes WHERE report_id = r.id) as upvote_count,
             (SELECT COUNT(*) FROM report_followers WHERE report_id = r.id) as follower_count
      FROM reports r
      LEFT JOIN report_location l ON r.id = l.report_id
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'all' && category !== 'All') {
      params.push(category);
      query += ` AND r.category = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      const pIdx = params.length;
      query += ` AND (r.report_code ILIKE $${pIdx} OR r.description ILIKE $${pIdx} OR l.address ILIKE $${pIdx} OR r.category ILIKE $${pIdx})`;
    }

    const rowsRes = await db.query(query, params);
    const rows = rowsRes.rows;

    let userUpvotedSet = new Set();
    let userFollowedSet = new Set();
    if (userId) {
      const userUpvotesRes = await db.query(`SELECT report_id FROM report_upvotes WHERE user_id = $1`, [userId]);
      userUpvotesRes.rows.forEach(u => userUpvotedSet.add(u.report_id));

      const userFollowsRes = await db.query(`SELECT report_id FROM report_followers WHERE user_id = $1`, [userId]);
      userFollowsRes.rows.forEach(f => userFollowedSet.add(f.report_id));
    }

    let enriched = rows.map((r) => {
      const distance = calculateHaversineDistance(userLat, userLng, r.latitude, r.longitude);
      const approxLocation = getApproximateLocationText(r.address, r.city, distance);

      let severityWeight = 2;
      if (r.severity === 'Dangerous') severityWeight = 4;
      else if (r.severity === 'Serious') severityWeight = 3;
      else if (r.severity === 'Moderate') severityWeight = 2;
      else if (r.severity === 'Low') severityWeight = 1;

      const bucketInfo = getPriorityBucket(r.civic_priority_score || 30);
      const radiusInfo = calculateEffectiveRadius(r.category);

      return {
        ...r,
        priority_bucket: bucketInfo.bucket,
        effective_radius_m: radiusInfo.effective_radius_m,
        upvote_count: parseInt(r.upvote_count || '0', 10),
        follower_count: parseInt(r.follower_count || '0', 10),
        distance_km: distance,
        approx_location: approxLocation,
        is_upvoted: userUpvotedSet.has(r.id),
        is_followed: userFollowedSet.has(r.id),
        severity_weight: severityWeight,
      };
    });

    if (priority && priority !== 'all' && priority !== 'All') {
      enriched = enriched.filter(item => String(item.priority_bucket).toUpperCase() === String(priority).toUpperCase());
    }

    if (sort === 'nearby') {
      enriched.sort((a, b) => {
        if (a.distance_km === null) return 1;
        if (b.distance_km === null) return -1;
        return a.distance_km - b.distance_km;
      });
    } else if (sort === 'supported' || sort === 'Most Supported') {
      enriched.sort((a, b) => (b.upvote_count - a.upvote_count) || (b.civic_priority_score - a.civic_priority_score));
    } else if (sort === 'serious' || sort === 'Serious') {
      enriched.sort((a, b) => (b.severity_weight - a.severity_weight) || (b.civic_priority_score - a.civic_priority_score));
    } else {
      enriched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    res.json({
      success: true,
      count: enriched.length,
      userLocation: { lat: userLat, lng: userLng },
      sort,
      issues: enriched,
    });
  } catch (err) {
    console.error('Community issues error:', err);
    res.status(500).json({ error: 'Failed to retrieve community issues.' });
  }
});

// ==========================================
// 10. UPVOTE TOGGLE ENDPOINT
// ==========================================
app.post('/api/reports/:id/upvote', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId || req.headers['x-user-id'];

    if (!userId) {
      return res.status(400).json({ error: 'User identity is required to upvote.' });
    }

    const reportRes = await db.query(`SELECT * FROM reports WHERE id = $1 OR report_code = $1`, [id]);
    const report = reportRes.rows[0];
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    let isUpvotedNow = false;
    let isFollowedNow = false;

    await db.transaction(async (client) => {
      const existingRes = await client.query(`
        SELECT id FROM report_upvotes WHERE report_id = $1 AND user_id = $2
      `, [report.id, userId]);

      if (existingRes.rows.length > 0) {
        await client.query(`
          DELETE FROM report_upvotes WHERE report_id = $1 AND user_id = $2
        `, [report.id, userId]);
        isUpvotedNow = false;
      } else {
        await client.query(`
          INSERT INTO report_upvotes (id, report_id, user_id, created_at)
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        `, [`upv_${crypto.randomBytes(6).toString('hex')}`, report.id, userId]);
        isUpvotedNow = true;

        await client.query(`
          INSERT INTO report_followers (id, report_id, user_id, created_at)
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
          ON CONFLICT (report_id, user_id) DO NOTHING
        `, [`fol_${crypto.randomBytes(6).toString('hex')}`, report.id, userId]);
      }

      const followCheckRes = await client.query(`
        SELECT 1 FROM report_followers WHERE report_id = $1 AND user_id = $2
      `, [report.id, userId]);
      isFollowedNow = followCheckRes.rows.length > 0;
    });

    const upvoteCountRes = await db.query(`SELECT COUNT(*) as count FROM report_upvotes WHERE report_id = $1`, [report.id]);
    const followerCountRes = await db.query(`SELECT COUNT(*) as count FROM report_followers WHERE report_id = $1`, [report.id]);

    res.json({
      success: true,
      report_id: report.id,
      is_upvoted: isUpvotedNow,
      upvote_count: parseInt(upvoteCountRes.rows[0]?.count || '0', 10),
      is_followed: isFollowedNow,
      follower_count: parseInt(followerCountRes.rows[0]?.count || '0', 10),
      message: isUpvotedNow
        ? 'Support recorded. You are now tracking updates for this civic issue.'
        : 'Support removed.',
    });
  } catch (err) {
    console.error('Upvote error:', err);
    res.status(500).json({ error: 'Failed to record upvote.' });
  }
});

// ==========================================
// 11. FOLLOW TOGGLE ENDPOINT
// ==========================================
app.post('/api/reports/:id/follow', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId || req.headers['x-user-id'];

    if (!userId) {
      return res.status(400).json({ error: 'User identity is required to follow.' });
    }

    const reportRes = await db.query(`SELECT * FROM reports WHERE id = $1 OR report_code = $1`, [id]);
    const report = reportRes.rows[0];
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    let isFollowedNow = false;

    await db.transaction(async (client) => {
      const existingRes = await client.query(`
        SELECT id FROM report_followers WHERE report_id = $1 AND user_id = $2
      `, [report.id, userId]);

      if (existingRes.rows.length > 0) {
        await client.query(`
          DELETE FROM report_followers WHERE report_id = $1 AND user_id = $2
        `, [report.id, userId]);
        isFollowedNow = false;
      } else {
        await client.query(`
          INSERT INTO report_followers (id, report_id, user_id, created_at)
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        `, [`fol_${crypto.randomBytes(6).toString('hex')}`, report.id, userId]);
        isFollowedNow = true;
      }
    });

    const followerCountRes = await db.query(`SELECT COUNT(*) as count FROM report_followers WHERE report_id = $1`, [report.id]);

    res.json({
      success: true,
      report_id: report.id,
      is_followed: isFollowedNow,
      follower_count: parseInt(followerCountRes.rows[0]?.count || '0', 10),
      message: isFollowedNow
        ? 'You are now following this issue for status updates.'
        : 'Unfollowed issue.',
    });
  } catch (err) {
    console.error('Follow error:', err);
    res.status(500).json({ error: 'Failed to toggle follow status.' });
  }
});

// ==========================================
// 12. USER ACTIVITY & NOTIFICATIONS ENDPOINT
// ==========================================
app.get('/api/user/activity', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.query.userId;
    const userLat = parseFloat(req.query.lat) || 19.0760;
    const userLng = parseFloat(req.query.lng) || 72.8777;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required.' });
    }

    const enrichReportsList = (reportList) => {
      return reportList.map((r) => {
        const distance = calculateHaversineDistance(userLat, userLng, r.latitude, r.longitude);
        const approxLocation = getApproximateLocationText(r.address, r.city, distance);
        return {
          ...r,
          upvote_count: parseInt(r.upvote_count || '0', 10),
          follower_count: parseInt(r.follower_count || '0', 10),
          distance_km: distance,
          approx_location: approxLocation,
        };
      });
    };

    const myReportsRes = await db.query(`
      SELECT r.*, l.latitude, l.longitude, l.address, l.city,
             (SELECT file_path FROM report_media WHERE report_id = r.id AND media_type = 'image' LIMIT 1) as photo_url,
             (SELECT COUNT(*) FROM report_upvotes WHERE report_id = r.id) as upvote_count,
             (SELECT COUNT(*) FROM report_followers WHERE report_id = r.id) as follower_count
      FROM reports r
      LEFT JOIN report_location l ON r.id = l.report_id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
    `, [userId]);

    const followedReportsRes = await db.query(`
      SELECT r.*, l.latitude, l.longitude, l.address, l.city,
             (SELECT file_path FROM report_media WHERE report_id = r.id AND media_type = 'image' LIMIT 1) as photo_url,
             (SELECT COUNT(*) FROM report_upvotes WHERE report_id = r.id) as upvote_count,
             (SELECT COUNT(*) FROM report_followers WHERE report_id = r.id) as follower_count
      FROM reports r
      LEFT JOIN report_location l ON r.id = l.report_id
      INNER JOIN report_followers f ON r.id = f.report_id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
    `, [userId]);

    const upvotedReportsRes = await db.query(`
      SELECT r.*, l.latitude, l.longitude, l.address, l.city,
             (SELECT file_path FROM report_media WHERE report_id = r.id AND media_type = 'image' LIMIT 1) as photo_url,
             (SELECT COUNT(*) FROM report_upvotes WHERE report_id = r.id) as upvote_count,
             (SELECT COUNT(*) FROM report_followers WHERE report_id = r.id) as follower_count
      FROM reports r
      LEFT JOIN report_location l ON r.id = l.report_id
      INNER JOIN report_upvotes u ON r.id = u.report_id
      WHERE u.user_id = $1
      ORDER BY u.created_at DESC
    `, [userId]);

    const notificationsRes = await db.query(`
      SELECT n.*, r.report_code, r.category, r.status
      FROM user_notifications n
      LEFT JOIN reports r ON n.report_id = r.id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [userId]);

    const unreadRes = await db.query(`
      SELECT COUNT(*) as count FROM user_notifications WHERE user_id = $1 AND is_read = FALSE
    `, [userId]);

    res.json({
      success: true,
      myReports: enrichReportsList(myReportsRes.rows),
      followingReports: enrichReportsList(followedReportsRes.rows),
      upvotedReports: enrichReportsList(upvotedReportsRes.rows),
      notifications: notificationsRes.rows,
      unreadCount: parseInt(unreadRes.rows[0]?.count || '0', 10),
    });
  } catch (err) {
    console.error('User activity error:', err);
    res.status(500).json({ error: 'Failed to fetch user activity.' });
  }
});

// Mark Notification as Read
app.post('/api/user/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(`UPDATE user_notifications SET is_read = TRUE WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Notification read error:', err);
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

// Mark All Notifications as Read
app.post('/api/user/notifications/read-all', async (req, res) => {
  try {
    const userId = req.body.userId || req.headers['x-user-id'];
    if (userId) {
      await db.query(`UPDATE user_notifications SET is_read = TRUE WHERE user_id = $1`, [userId]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Notification read all error:', err);
    res.status(500).json({ error: 'Failed to mark notifications as read.' });
  }
});

// ==========================================
// PHASE 3: COMMUNITY MAP & HOTSPOTS ROUTES (POSTGIS COMPATIBLE)
// ==========================================
async function getEnrichedMapReports(filters = {}) {
  const { category, status, timeframe, minLat, maxLat, minLng, maxLng } = filters;

  let query = `
    SELECT r.*,
           l.latitude, l.longitude, l.location_source, l.accuracy, l.address, l.city,
           (SELECT file_path FROM report_media WHERE report_id = r.id AND media_type = 'image' LIMIT 1) as photo_url
    FROM reports r
    JOIN report_location l ON r.id = l.report_id
    WHERE 1=1
  `;
  const params = [];

  // Category filter
  if (category && category !== 'all' && category !== 'All') {
    params.push(category);
    query += ` AND r.category = $${params.length}`;
  }

  // Status filter
  if (status && status !== 'all' && status !== 'All') {
    if (status === 'active' || status === 'Active') {
      query += ` AND r.status NOT IN ('Confirmed Resolved', 'Resolved')`;
    } else if (status === 'resolved' || status === 'Resolved') {
      query += ` AND r.status IN ('Confirmed Resolved', 'Resolved')`;
    } else if (status === 'emerging' || status === 'Emerging') {
      query += ` AND r.created_at >= (NOW() - INTERVAL '2 days') AND r.severity IN ('Dangerous', 'Serious')`;
    } else {
      params.push(status);
      query += ` AND r.status = $${params.length}`;
    }
  }

  // Timeframe filter
  if (timeframe && timeframe !== 'all' && timeframe !== 'All') {
    if (timeframe === 'today' || timeframe === 'Today') {
      query += ` AND r.created_at >= (NOW() - INTERVAL '1 day')`;
    } else if (timeframe === '7d' || timeframe === '7 Days') {
      query += ` AND r.created_at >= (NOW() - INTERVAL '7 days')`;
    } else if (timeframe === '30d' || timeframe === '30 Days') {
      query += ` AND r.created_at >= (NOW() - INTERVAL '30 days')`;
    }
  }

  // Bounding box filter (compatible with PostGIS coordinates)
  if (minLat && maxLat && minLng && maxLng) {
    params.push(Number(minLat), Number(maxLat), Number(minLng), Number(maxLng));
    const p1 = params.length - 3;
    const p2 = params.length - 2;
    const p3 = params.length - 1;
    const p4 = params.length;
    query += ` AND l.latitude BETWEEN $${p1} AND $${p2} AND l.longitude BETWEEN $${p3} AND $${p4}`;
  }

  const res = await db.query(query, params);
  return res.rows.map(r => {
    const bucketInfo = getPriorityBucket(r.civic_priority_score || 30);
    const radiusInfo = calculateEffectiveRadius(r.category);
    return {
      ...r,
      priority_bucket: bucketInfo.bucket,
      effective_radius_m: radiusInfo.effective_radius_m
    };
  });
}

app.get('/api/map/reports', async (req, res) => {
  try {
    const reports = await getEnrichedMapReports(req.query);
    const clusters = clusterReportsByProximity(reports, 0.8);

    res.json({
      success: true,
      count: reports.length,
      reports,
      clusters
    });
  } catch (err) {
    console.error('Map reports error:', err);
    res.status(500).json({ error: 'Failed to fetch map reports.' });
  }
});

app.get('/api/map/hotspots', async (req, res) => {
  try {
    const reports = await getEnrichedMapReports(req.query);
    const hotspots = detectCivicHotspots(reports);

    res.json({
      success: true,
      count: hotspots.length,
      hotspots
    });
  } catch (err) {
    console.error('Hotspots error:', err);
    res.status(500).json({ error: 'Failed to compute civic hotspots.' });
  }
});

app.get('/api/map/patterns', async (req, res) => {
  try {
    const reports = await getEnrichedMapReports(req.query);
    const patterns = detectSystemicPatterns(reports);

    res.json({
      success: true,
      count: patterns.length,
      patterns
    });
  } catch (err) {
    console.error('Patterns error:', err);
    res.status(500).json({ error: 'Failed to analyze systemic civic patterns.' });
  }
});

// ==========================================
// MUNICIPAL CORPORATION DASHBOARD ENDPOINTS
// ==========================================
app.get('/api/municipal/overview', async (req, res) => {
  try {
    const totalReportsRes = await db.query('SELECT COUNT(*) as c FROM reports');
    const activeRes = await db.query("SELECT COUNT(*) as c FROM reports WHERE status NOT IN ('Confirmed Resolved')");
    const pendingRes = await db.query("SELECT COUNT(*) as c FROM reports WHERE status IN ('Submitted', 'Under Review')");
    const heiRes = await db.query("SELECT COUNT(*) as c FROM hei_challenges");
    const resolvedRes = await db.query("SELECT COUNT(*) as c FROM reports WHERE status IN ('Resolved', 'Citizen Confirmation', 'Confirmed Resolved')");

    const totalReports = parseInt(totalReportsRes.rows[0]?.c || '0', 10);
    const activeGrievances = parseInt(activeRes.rows[0]?.c || '0', 10);
    const pendingTriage = parseInt(pendingRes.rows[0]?.c || '0', 10);
    const escalatedToHEI = parseInt(heiRes.rows[0]?.c || '0', 10);
    const resolvedCount = parseInt(resolvedRes.rows[0]?.c || '0', 10);

    const slaCompliancePct = totalReports > 0 
      ? Number(((resolvedCount / totalReports) * 100).toFixed(1))
      : 100.0;
    const avgTATDays = totalReports > 0 ? 1.5 : 0.0;

    // Dynamically calculate zonal ward metrics from citizen reported locations in PostgreSQL
    const reportsWithLoc = await db.query(`
      SELECT r.id, r.status, r.severity, l.address, l.city
      FROM reports r
      LEFT JOIN report_location l ON r.id = l.report_id
    `);

    const wardMap = new Map();
    reportsWithLoc.rows.forEach(r => {
      const wardName = r.city || r.address || 'Central Municipal Zone';
      if (!wardMap.has(wardName)) {
        wardMap.set(wardName, { ward: wardName, active: 0, resolved: 0, highSeverity: 0 });
      }
      const item = wardMap.get(wardName);
      if (['Resolved', 'Citizen Confirmation', 'Confirmed Resolved'].includes(r.status)) {
        item.resolved += 1;
      } else {
        item.active += 1;
      }
      if (['Critical', 'Serious', 'Dangerous'].includes(r.severity)) {
        item.highSeverity += 1;
      }
    });

    const wards = Array.from(wardMap.values()).map(w => {
      const total = w.active + w.resolved;
      const compliance = total > 0 ? Number(((w.resolved / total) * 100).toFixed(1)) : 100.0;
      return { ...w, compliance };
    });

    res.json({
      success: true,
      metrics: {
        totalReports,
        activeGrievances,
        pendingTriage,
        escalatedToHEI,
        resolvedCount,
        slaCompliancePct,
        avgTATDays,
        wards
      }
    });
  } catch (err) {
    console.error('Municipal overview error:', err);
    res.status(500).json({ error: 'Failed to retrieve municipal KPI overview.' });
  }
});

app.get('/api/municipal/triage-issues', async (req, res) => {
  try {
    const reportsRes = await db.query(`
      SELECT r.*, 
             l.latitude, l.longitude, l.location_source, l.accuracy, l.address, l.city
      FROM reports r
      LEFT JOIN report_location l ON r.id = l.report_id
      ORDER BY r.civic_priority_score DESC, r.created_at DESC
    `);
    const reports = reportsRes.rows;

    const mediaListRes = await db.query(`SELECT * FROM report_media`);
    const assignmentsListRes = await db.query(`SELECT * FROM report_assignments`);
    const resolutionsListRes = await db.query(`SELECT * FROM report_resolutions`);
    const challengesListRes = await db.query(`SELECT * FROM hei_challenges`);
    const upvotesRes = await db.query(`SELECT report_id, COUNT(*) as vote_count FROM report_upvotes GROUP BY report_id`);

    const voteMap = new Map();
    upvotesRes.rows.forEach(u => voteMap.set(u.report_id, parseInt(u.vote_count || '0', 10)));

    const enriched = reports.map(r => ({
      ...r,
      upvote_count: voteMap.get(r.id) || 0,
      media: mediaListRes.rows.filter(m => m.report_id === r.id),
      assignment: assignmentsListRes.rows.find(a => a.report_id === r.id) || null,
      resolution: resolutionsListRes.rows.find(res => res.report_id === r.id) || null,
      hei_challenge: challengesListRes.rows.find(c => c.report_id === r.id) || null,
      is_escalated_to_hei: !!challengesListRes.rows.find(c => c.report_id === r.id)
    }));

    res.json({
      success: true,
      count: enriched.length,
      issues: enriched
    });
  } catch (err) {
    console.error('Municipal triage issues error:', err);
    res.status(500).json({ error: 'Failed to retrieve municipal issues.' });
  }
});

app.post('/api/municipal/work-order', async (req, res) => {
  try {
    const { reportId, departmentName, officerName, targetHours = 48, priority = 'High', notes } = req.body;

    const reportRes = await db.query('SELECT * FROM reports WHERE id = $1', [reportId]);
    const report = reportRes.rows[0];
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    const scheduledDate = new Date(Date.now() + targetHours * 3600000).toLocaleString();
    const slaTargetDate = `${targetHours} Hours Target`;

    await db.transaction(async (client) => {
      await client.query("UPDATE reports SET status = 'In Progress', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [reportId]);

      await client.query(`
        INSERT INTO report_assignments (id, report_id, department_name, officer_name, scheduled_date, sla_target_date, notes, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        ON CONFLICT(report_id) DO UPDATE SET
          department_name = EXCLUDED.department_name,
          officer_name = EXCLUDED.officer_name,
          scheduled_date = EXCLUDED.scheduled_date,
          sla_target_date = EXCLUDED.sla_target_date,
          notes = EXCLUDED.notes,
          updated_at = CURRENT_TIMESTAMP
      `, [
        `asg_${crypto.randomBytes(6).toString('hex')}`,
        reportId,
        departmentName,
        officerName,
        scheduledDate,
        slaTargetDate,
        notes || `Assigned to ${officerName} with ${targetHours}h SLA.`
      ]);

      await client.query(`
        INSERT INTO report_timeline (id, report_id, stage, actor_type, actor_name, title, description, created_at)
        VALUES ($1, $2, 'In Progress', 'authority', $3, 'Municipal Work Order Dispatched', $4, CURRENT_TIMESTAMP)
      `, [
        `tml_${crypto.randomBytes(6).toString('hex')}`,
        reportId,
        departmentName,
        `Assigned to ${officerName}. Priority: ${priority}. Target SLA: ${targetHours}h. Note: ${notes || 'Crew dispatched.'}`
      ]);
    });

    notifyReportFollowers(
      reportId,
      'work_order_dispatched',
      `Work Order Issued: ${report.report_code}`,
      `Municipal crew (${officerName}, ${departmentName}) dispatched. Target resolution within ${targetHours} hours.`
    );

    res.json({ success: true, message: 'Work order dispatched successfully.' });
  } catch (err) {
    console.error('Work order dispatch error:', err);
    res.status(500).json({ error: 'Failed to create work order.' });
  }
});

app.post('/api/municipal/escalate-hei', async (req, res) => {
  try {
    const { reportId, researchDomain, researchBrief, departmentMatch = 'Environmental & Civil Engineering Dept', matchPercentage = 94 } = req.body;

    const reportRes = await db.query('SELECT * FROM reports WHERE id = $1', [reportId]);
    const report = reportRes.rows[0];
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    const locRes = await db.query('SELECT * FROM report_location WHERE report_id = $1', [reportId]);
    const ward = locRes.rows[0]?.city || locRes.rows[0]?.address || 'Municipal Ward';
    const challengeId = `chal_${crypto.randomBytes(6).toString('hex')}`;
    const projectId = `proj_${crypto.randomBytes(6).toString('hex')}`;

    await db.transaction(async (client) => {
      // PRESERVE the existing lifecycle status (do not downgrade/overwrite)
      // Only set status to 'Under Review' if report was still in initial 'Submitted' state
      if (report.status === 'Submitted') {
        await client.query("UPDATE reports SET status = 'Under Review', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [reportId]);
      }

      // Create new HEI Challenge
      await client.query(`
        INSERT INTO hei_challenges (
          id, report_id, title, description, category, severity, ward, department_match, match_percentage, status, escalated_by, research_brief, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'open', 'Municipal Corporation Triage Wing', $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        challengeId,
        reportId,
        `R&D Challenge: ${report.category} Structural Solution for ${ward}`,
        report.description || 'Complex civic issue escalated for multidisciplinary academic capstone innovation.',
        report.category,
        report.severity || 'Serious',
        ward,
        departmentMatch,
        matchPercentage,
        researchBrief || researchDomain || 'Novel applied technology capstone challenge.'
      ]);

      // Create parallel HEI Innovation Project entity with 4 research milestones
      const studentTeam = [
        { name: 'Aarav Sharma', studentId: 'IITB-CE-2024-041', apaarId: '9844-2201-8842', role: 'Lead Design & Hydro Dynamics', hours: 42 },
        { name: 'Pooja Iyer', studentId: 'IITB-EE-2024-118', apaarId: '9844-2201-9931', role: 'Edge Telemetry & Sensing', hours: 38 },
        { name: 'Vikram Seth', studentId: 'IITB-ME-2024-082', apaarId: '9844-2201-4412', role: 'Fabrication & Prototype Testing', hours: 35 }
      ];

      await client.query(`
        INSERT INTO hei_projects (
          id, challenge_id, report_id, title, institution_name, department, faculty_lead, faculty_email,
          student_team_json, current_stage, total_research_hours, total_field_hours, funding_goal, funding_pledged,
          sdg_goals_json, abstract, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 2, 115, 48, 250000, 75000, $10, $11, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        projectId,
        challengeId,
        reportId,
        `Multidisciplinary R&D: ${report.category} Infrastructure Engineering for ${ward}`,
        'Indian Institute of Technology (IIT) / National Institute of Technology (NIT)',
        departmentMatch,
        'Prof. Dr. A. V. Deshmukh',
        'a.deshmukh@civiclabs.edu',
        JSON.stringify(studentTeam),
        JSON.stringify(['SDG 6: Clean Water', 'SDG 9: Resilient Infrastructure', 'SDG 11: Sustainable Cities']),
        researchBrief || 'Field sensing, prototype fabrication, and IoT telemetric municipal pilot.'
      ]);

      // Insert 4 project milestones
      const milestones = [
        { idx: 1, title: 'Stage 1: Problem Definition & Ward Telemetry', desc: 'Geospatial survey, LiDAR mapping and catchment telemetry on site.', status: 'completed', hours: 35 },
        { idx: 2, title: 'Stage 2: Lab Simulation & Prototyping', desc: 'Material formulation, hydraulic flow modeling, and rapid 3D fabrication.', status: 'in_progress', hours: 40 },
        { idx: 3, title: 'Stage 3: Field Pilot Testing in Ward', desc: 'On-site installation and 30-day live municipal stress testing.', status: 'pending', hours: 25 },
        { idx: 4, title: 'Stage 4: Tech Transfer & Municipal Rate Contract', desc: 'Full certification, NEP credit transcript release, and municipal rate contract licensing.', status: 'pending', hours: 15 }
      ];

      for (const ms of milestones) {
        await client.query(`
          INSERT INTO hei_project_milestones (id, project_id, stage_index, title, description, status, research_hours, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        `, [
          `ms_${crypto.randomBytes(6).toString('hex')}`,
          projectId,
          ms.idx,
          ms.title,
          ms.desc,
          ms.status,
          ms.hours
        ]);
      }

      // Add timeline event to report without overwriting prior routine repair steps
      await client.query(`
        INSERT INTO report_timeline (id, report_id, stage, actor_type, actor_name, title, description, created_at)
        VALUES ($1, $2, 'Under Review', 'authority', 'Municipal R&D Board', 'Escalated to HEI Innovation Exchange', $3, CURRENT_TIMESTAMP)
      `, [
        `tml_${crypto.randomBytes(6).toString('hex')}`,
        reportId,
        `Escalated to Higher Education Institutions (${departmentMatch}). Matched compatibility: ${matchPercentage}%. Parallel academic research track created.`
      ]);
    });

    notifyReportFollowers(
      reportId,
      'hei_escalated',
      `Academic R&D Escalation: ${report.report_code}`,
      `Issue identified as recurring structural challenge and escalated to HEI Innovation Exchange for university research & prototyping.`
    );

    res.json({ success: true, challengeId, projectId, message: 'Challenge escalated to HEI repository with parallel project track.' });
  } catch (err) {
    console.error('HEI escalation error:', err);
    res.status(500).json({ error: 'Failed to escalate to HEI.' });
  }
});

app.post('/api/municipal/resolve-dual-signoff', async (req, res) => {
  try {
    const { reportId, resolutionNotes, resolvedBy = 'Municipal Field Crew', resolutionPhotoUrl, resolutionPhotoName, latitude, longitude } = req.body;

    const reportRes = await db.query('SELECT * FROM reports WHERE id = $1', [reportId]);
    const report = reportRes.rows[0];
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    await db.transaction(async (client) => {
      await client.query("UPDATE reports SET status = 'Citizen Confirmation', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [reportId]);

      await client.query(`
        INSERT INTO report_resolutions (id, report_id, resolution_notes, resolved_by, resolution_photo_url, resolution_photo_name, resolution_timestamp, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(report_id) DO UPDATE SET
          resolution_notes = EXCLUDED.resolution_notes,
          resolved_by = EXCLUDED.resolved_by,
          resolution_photo_url = EXCLUDED.resolution_photo_url,
          resolution_photo_name = EXCLUDED.resolution_photo_name,
          resolution_timestamp = CURRENT_TIMESTAMP
      `, [
        `res_${crypto.randomBytes(6).toString('hex')}`,
        reportId,
        resolutionNotes || 'Field remediation completed. Awaiting citizen confirmation.',
        resolvedBy,
        resolutionPhotoUrl || '/samples/flooded_road_mumbai.jpg',
        resolutionPhotoName || 'repair_site_evidence.jpg'
      ]);

      await client.query(`
        INSERT INTO report_timeline (id, report_id, stage, actor_type, actor_name, title, description, created_at)
        VALUES ($1, $2, 'Citizen Confirmation', 'authority', $3, 'Remediation Uploaded - Pending Citizen Sign-off', $4, CURRENT_TIMESTAMP)
      `, [
        `tml_${crypto.randomBytes(6).toString('hex')}`,
        reportId,
        resolvedBy,
        `Field crew uploaded completion photos and remediation notes (GPS: ${latitude || 19.076}, ${longitude || 72.877}). Awaiting original reporting citizen sign-off.`
      ]);
    });

    notifyReportFollowers(
      reportId,
      'remediation_pending_signoff',
      `Action Completed - Please Confirm: ${report.report_code}`,
      `Field crew has finished remediation. Please review photos and confirm closure in your citizen activity tracker.`
    );

    res.json({ success: true, message: 'Remediation proof uploaded. Citizen sign-off requested.' });
  } catch (err) {
    console.error('Dual signoff error:', err);
    res.status(500).json({ error: 'Failed to record dual-signoff.' });
  }
});

// ==========================================
// HEI / INSTITUTION DASHBOARD ENDPOINTS
// ==========================================
app.get('/api/institution/challenges', async (req, res) => {
  try {
    const challengesRes = await db.query(`
      SELECT c.*, r.report_code, r.civic_priority_score,
             l.latitude, l.longitude, l.address, l.city
      FROM hei_challenges c
      JOIN reports r ON c.report_id = r.id
      LEFT JOIN report_location l ON r.id = l.report_id
      ORDER BY c.created_at DESC
    `);

    res.json({ success: true, count: challengesRes.rows.length, challenges: challengesRes.rows });
  } catch (err) {
    console.error('HEI challenges fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch HEI challenges.' });
  }
});

app.post('/api/institution/challenges/:id/claim', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      institutionName = 'BIT Mesra / IIT Bombay',
      department = 'Civil & Environmental Engineering',
      facultyLead = 'Dr. Supervising Professor',
      facultyEmail = 'faculty@univ.ac.in',
      studentTeam = [],
      fundingGoal = 300000,
      abstract = 'Applied Capstone R&D project addressing local municipal challenge.'
    } = req.body;

    const challengeRes = await db.query('SELECT * FROM hei_challenges WHERE id = $1', [id]);
    const challenge = challengeRes.rows[0];
    if (!challenge) return res.status(404).json({ error: 'Challenge not found.' });

    const projectId = `proj_${crypto.randomBytes(6).toString('hex')}`;

    await db.transaction(async (client) => {
      await client.query("UPDATE hei_challenges SET status = 'claimed', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);

      await client.query(`
        INSERT INTO hei_projects (
          id, challenge_id, report_id, title, institution_name, department, faculty_lead, faculty_email, student_team_json, current_stage, total_research_hours, total_field_hours, funding_goal, funding_pledged, sdg_goals_json, abstract, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1, 30, 10, $10, 0, $11, $12, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        projectId,
        id,
        challenge.report_id,
        challenge.title,
        institutionName,
        department,
        facultyLead,
        facultyEmail,
        JSON.stringify(studentTeam),
        fundingGoal,
        JSON.stringify(['SDG 6: Clean Water', 'SDG 11: Sustainable Cities']),
        abstract
      ]);

      const milestones = [
        { stage: 1, title: 'Feasibility & Literature Study', desc: 'Baseline testing and engineering specs.' },
        { stage: 2, title: 'Simulation & CAD/Lab Testing', desc: 'Computational model and scale bench test.' },
        { stage: 3, title: 'Working Prototype Development', desc: 'Fabricate physical prototype with sensor telemetry.' },
        { stage: 4, title: 'Field Deployment & Municipal Pilot', desc: 'On-site municipal pilot validation.' },
      ];

      for (let idx = 0; idx < milestones.length; idx++) {
        const m = milestones[idx];
        await client.query(`
          INSERT INTO hei_project_milestones (id, project_id, stage_index, title, description, status, research_hours, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        `, [
          `ms_${projectId}_s${m.stage}`,
          projectId,
          m.stage,
          m.title,
          m.desc,
          idx === 0 ? 'in_progress' : 'pending',
          idx === 0 ? 30 : 0
        ]);
      }

      await client.query(`
        INSERT INTO report_timeline (id, report_id, stage, actor_type, actor_name, title, description, created_at)
        VALUES ($1, $2, 'In Progress', 'authority', $3, 'Capstone R&D Claimed by University', $4, CURRENT_TIMESTAMP)
      `, [
        `tml_${crypto.randomBytes(6).toString('hex')}`,
        challenge.report_id,
        institutionName,
        `${institutionName} (${department}) claimed challenge under lead ${facultyLead}. Student team assembled.`
      ]);
    });

    res.json({ success: true, projectId, message: 'Challenge claimed and Capstone workspace initialized.' });
  } catch (err) {
    console.error('Claim challenge error:', err);
    res.status(500).json({ error: 'Failed to claim challenge.' });
  }
});

app.get('/api/institution/projects', async (req, res) => {
  try {
    const projectsRes = await db.query(`
      SELECT p.*, r.report_code, r.category as report_category
      FROM hei_projects p
      JOIN reports r ON p.report_id = r.id
      ORDER BY p.updated_at DESC
    `);
    const projects = projectsRes.rows;

    const milestonesRes = await db.query('SELECT * FROM hei_project_milestones ORDER BY stage_index ASC');
    const grantsRes = await db.query('SELECT * FROM csr_grants');
    const tranchesRes = await db.query('SELECT * FROM csr_escrow_tranches');

    const enriched = projects.map(p => ({
      ...p,
      student_team: parseJsonSafe(p.student_team_json, []),
      sdg_goals: parseJsonSafe(p.sdg_goals_json, []),
      milestones: milestonesRes.rows.filter(m => m.project_id === p.id).map(m => ({
        ...m,
        deliverables: parseJsonSafe(m.deliverables_json)
      })),
      grants: grantsRes.rows.filter(g => g.project_id === p.id).map(g => ({
        ...g,
        tranches: tranchesRes.rows.filter(t => t.grant_id === g.id)
      }))
    }));

    res.json({ success: true, count: enriched.length, projects: enriched });
  } catch (err) {
    console.error('HEI projects fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch HEI projects.' });
  }
});

app.post('/api/institution/projects/:id/milestones/:stageIndex', async (req, res) => {
  try {
    const { id, stageIndex } = req.params;
    const { status = 'completed', deliverables = {}, researchHours = 35 } = req.body;
    const stageNum = parseInt(stageIndex, 10);

    const projectRes = await db.query('SELECT * FROM hei_projects WHERE id = $1', [id]);
    const project = projectRes.rows[0];
    if (!project) return res.status(404).json({ error: 'Project not found.' });

    await db.transaction(async (client) => {
      await client.query(`
        UPDATE hei_project_milestones
        SET status = $1, deliverables_json = $2, research_hours = $3, completed_at = CURRENT_TIMESTAMP
        WHERE project_id = $4 AND stage_index = $5
      `, [status, JSON.stringify(deliverables), researchHours, id, stageNum]);

      if (status === 'completed' && stageNum < 4) {
        await client.query(`
          UPDATE hei_project_milestones
          SET status = 'in_progress'
          WHERE project_id = $1 AND stage_index = $2 AND status = 'pending'
        `, [id, stageNum + 1]);

        await client.query(`
          UPDATE hei_projects
          SET current_stage = $1, total_research_hours = total_research_hours + $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [stageNum + 1, researchHours, id]);
      } else if (status === 'completed' && stageNum === 4) {
        await client.query(`
          UPDATE hei_projects
          SET current_stage = 4, status = 'pilot_ready', total_research_hours = total_research_hours + $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [researchHours, id]);
      }

      await client.query(`
        INSERT INTO report_timeline (id, report_id, stage, actor_type, actor_name, title, description, created_at)
        VALUES ($1, $2, 'In Progress', 'authority', $3, 'Capstone Milestone Advanced', $4, CURRENT_TIMESTAMP)
      `, [
        `tml_${crypto.randomBytes(6).toString('hex')}`,
        project.report_id,
        project.institution_name,
        `Stage ${stageNum} milestone completed. Deliverables uploaded to R&D registry.`
      ]);
    });

    res.json({ success: true, message: `Stage ${stageNum} milestone updated successfully.` });
  } catch (err) {
    console.error('Milestone update error:', err);
    res.status(500).json({ error: 'Failed to update milestone.' });
  }
});

app.get('/api/institution/nep-registry', async (req, res) => {
  try {
    const creditsRes = await db.query(`
      SELECT c.*, p.title as project_title, p.institution_name as institution
      FROM student_nep_credits c
      JOIN hei_projects p ON c.project_id = p.id
      ORDER BY c.created_at DESC
    `);

    res.json({ success: true, count: creditsRes.rows.length, credits: creditsRes.rows });
  } catch (err) {
    console.error('NEP registry fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch NEP credit registry.' });
  }
});

app.post('/api/institution/nep-registry/generate-certificate', async (req, res) => {
  try {
    const { studentName, studentId, apaarId, institutionName, projectId, researchHours = 60, fieldHours = 20 } = req.body;
    const certId = `nep_cert_${crypto.randomBytes(6).toString('hex')}`;
    const verificationHash = `SHA256:${crypto.createHash('sha256').update(`${studentId}-${apaarId}-${projectId}-${Date.now()}`).digest('hex')}`;
    const creditsAwarded = Math.round(((researchHours + fieldHours) / 20) * 10) / 10;

    await db.query(`
      INSERT INTO student_nep_credits (
        id, student_name, student_id, apaar_id, institution_name, project_id, research_hours, field_hours, credits_awarded, verification_hash, certificate_issued_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      certId,
      studentName,
      studentId,
      apaarId,
      institutionName,
      projectId,
      researchHours,
      fieldHours,
      creditsAwarded,
      verificationHash
    ]);

    res.json({
      success: true,
      certificate: {
        id: certId,
        studentName,
        studentId,
        apaarId,
        institutionName,
        creditsAwarded,
        verificationHash,
        issuedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Certificate generation error:', err);
    res.status(500).json({ error: 'Failed to generate certificate.' });
  }
});

// ==========================================
// INDUSTRY & CSR PARTNER DASHBOARD ENDPOINTS
// ==========================================
app.get('/api/industry/marketplace', async (req, res) => {
  try {
    const projectsRes = await db.query(`
      SELECT p.*, r.report_code, r.category as report_category,
             l.address, l.city, l.latitude, l.longitude
      FROM hei_projects p
      JOIN reports r ON p.report_id = r.id
      LEFT JOIN report_location l ON r.id = l.report_id
      ORDER BY p.funding_pledged DESC, p.created_at DESC
    `);
    const projects = projectsRes.rows;

    const milestonesRes = await db.query('SELECT * FROM hei_project_milestones ORDER BY stage_index ASC');
    const grantsRes = await db.query('SELECT * FROM csr_grants');
    const tranchesRes = await db.query('SELECT * FROM csr_escrow_tranches');

    const marketplace = projects.map(p => ({
      ...p,
      student_team: parseJsonSafe(p.student_team_json, []),
      sdg_goals: parseJsonSafe(p.sdg_goals_json, []),
      milestones: milestonesRes.rows.filter(m => m.project_id === p.id),
      grants: grantsRes.rows.filter(g => g.project_id === p.id).map(g => ({
        ...g,
        tranches: tranchesRes.rows.filter(t => t.grant_id === g.id)
      }))
    }));

    res.json({ success: true, count: marketplace.length, marketplace });
  } catch (err) {
    console.error('Industry marketplace fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch marketplace.' });
  }
});

app.post('/api/industry/pledge', async (req, res) => {
  try {
    const { projectId, corporateName, cin, csrRegNo, contactPerson, contactEmail, amount = 250000 } = req.body;

    const projectRes = await db.query('SELECT * FROM hei_projects WHERE id = $1', [projectId]);
    const project = projectRes.rows[0];
    if (!project) return res.status(404).json({ error: 'Project not found.' });

    const grantId = `grant_${crypto.randomBytes(6).toString('hex')}`;
    const t1Amount = amount * 0.3;
    const t2Amount = amount * 0.7;

    await db.transaction(async (client) => {
      await client.query(`
        INSERT INTO csr_grants (
          id, project_id, corporate_name, cin, csr_reg_no, contact_person, contact_email, total_pledge_amount, disbursed_amount, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 'pledged', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        grantId,
        projectId,
        corporateName,
        cin || 'L27100MH1907PLC000260',
        csrRegNo || 'CSR00001248',
        contactPerson,
        contactEmail,
        amount
      ]);

      await client.query(`
        INSERT INTO csr_escrow_tranches (id, grant_id, tranche_number, percentage, amount, trigger_condition, status, created_at)
        VALUES ($1, $2, 1, 30.0, $3, 'Disbursed upon HEI Lab Prototype Verification & CAD Approval', 'escrow_locked', CURRENT_TIMESTAMP)
      `, [`tranche_1_${grantId}`, grantId, t1Amount]);

      await client.query(`
        INSERT INTO csr_escrow_tranches (id, grant_id, tranche_number, percentage, amount, trigger_condition, status, created_at)
        VALUES ($1, $2, 2, 70.0, $3, 'Disbursed upon Municipal Field Deployment & Dual-Signoff Pilot Verification', 'escrow_locked', CURRENT_TIMESTAMP)
      `, [`tranche_2_${grantId}`, grantId, t2Amount]);

      await client.query(`
        UPDATE hei_projects
        SET funding_pledged = funding_pledged + $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [amount, projectId]);

      await client.query(`
        INSERT INTO report_timeline (id, report_id, stage, actor_type, actor_name, title, description, created_at)
        VALUES ($1, $2, 'In Progress', 'authority', $3, 'CSR Grant Pledged by Corporate Partner', $4, CURRENT_TIMESTAMP)
      `, [
        `tml_${crypto.randomBytes(6).toString('hex')}`,
        project.report_id,
        corporateName,
        `${corporateName} pledged ₹${amount.toLocaleString('en-IN')} CSR grant (30/70 Escrow Tranche structure) for student prototype & pilot deployment.`
      ]);
    });

    res.json({ success: true, grantId, message: 'CSR Grant Pledged and smart escrow allocated.' });
  } catch (err) {
    console.error('CSR pledge error:', err);
    res.status(500).json({ error: 'Failed to record CSR pledge.' });
  }
});

app.post('/api/industry/escrow/release', async (req, res) => {
  try {
    const { trancheId, releaseNotes = 'Tranche released following technical verification' } = req.body;

    const trancheRes = await db.query('SELECT * FROM csr_escrow_tranches WHERE id = $1', [trancheId]);
    const tranche = trancheRes.rows[0];
    if (!tranche) return res.status(404).json({ error: 'Tranche not found.' });

    const grantRes = await db.query('SELECT * FROM csr_grants WHERE id = $1', [tranche.grant_id]);
    const grant = grantRes.rows[0];

    const projectRes = await db.query('SELECT * FROM hei_projects WHERE id = $1', [grant.project_id]);
    const project = projectRes.rows[0];

    await db.transaction(async (client) => {
      await client.query(`
        UPDATE csr_escrow_tranches
        SET status = 'disbursed', disbursed_at = CURRENT_TIMESTAMP, release_notes = $1
        WHERE id = $2
      `, [releaseNotes, trancheId]);

      await client.query(`
        UPDATE csr_grants
        SET disbursed_amount = disbursed_amount + $1,
            status = CASE WHEN disbursed_amount + $1 >= total_pledge_amount THEN 'fully_disbursed' ELSE 'partially_disbursed' END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [tranche.amount, grant.id]);

      await client.query(`
        INSERT INTO report_timeline (id, report_id, stage, actor_type, actor_name, title, description, created_at)
        VALUES ($1, $2, 'In Progress', 'authority', $3, 'CSR Escrow Tranche Disbursed', $4, CURRENT_TIMESTAMP)
      `, [
        `tml_${crypto.randomBytes(6).toString('hex')}`,
        project.report_id,
        grant.corporate_name,
        `Tranche ${tranche.tranche_number} (₹${tranche.amount.toLocaleString('en-IN')}) disbursed from Escrow to ${project.institution_name} R&D account.`
      ]);
    });

    res.json({ success: true, message: `Tranche ${tranche.tranche_number} released successfully.` });
  } catch (err) {
    console.error('Escrow release error:', err);
    res.status(500).json({ error: 'Failed to release escrow tranche.' });
  }
});

app.get('/api/industry/mentorship-hub', async (req, res) => {
  try {
    const mentorsRes = await db.query('SELECT * FROM corporate_mentors ORDER BY created_at DESC');
    const agreementsRes = await db.query(`
      SELECT t.*, p.title as project_title, p.institution_name
      FROM tech_transfer_agreements t
      JOIN hei_projects p ON t.project_id = p.id
      ORDER BY t.created_at DESC
    `);

    res.json({ success: true, mentors: mentorsRes.rows, agreements: agreementsRes.rows });
  } catch (err) {
    console.error('Mentorship hub error:', err);
    res.status(500).json({ error: 'Failed to fetch mentorship hub.' });
  }
});

app.post('/api/industry/mentorship/register', async (req, res) => {
  try {
    const { name, company, designation, expertiseDomain, email, officeHoursSlot } = req.body;
    const mentorId = `mentor_${crypto.randomBytes(6).toString('hex')}`;

    await db.query(`
      INSERT INTO corporate_mentors (id, name, company, designation, expertise_domain, email, office_hours_slot, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'available', CURRENT_TIMESTAMP)
    `, [mentorId, name, company, designation, expertiseDomain, email, officeHoursSlot]);

    res.json({ success: true, mentorId, message: 'Corporate mentor registered successfully.' });
  } catch (err) {
    console.error('Mentor registration error:', err);
    res.status(500).json({ error: 'Failed to register mentor.' });
  }
});

app.post('/api/industry/tech-transfer/initiate', async (req, res) => {
  try {
    const { projectId, corporatePartner, municipalPartner, agreementType = 'Municipal Rate Contract', royaltyPercentage = 3.0, termsSummary } = req.body;
    const agreementId = `tt_${crypto.randomBytes(6).toString('hex')}`;

    await db.query(`
      INSERT INTO tech_transfer_agreements (id, project_id, corporate_partner, municipal_partner, agreement_type, royalty_percentage, status, terms_summary, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'in_review', $7, CURRENT_TIMESTAMP)
    `, [agreementId, projectId, corporatePartner, municipalPartner, agreementType, royaltyPercentage, termsSummary]);

    res.json({ success: true, agreementId, message: 'Tech transfer agreement initiated.' });
  } catch (err) {
    console.error('Tech transfer initiation error:', err);
    res.status(500).json({ error: 'Failed to initiate tech transfer.' });
  }
});

// ==========================================
// INITIALIZE DATABASE AND START SERVER
// ==========================================
async function startServer() {
  try {
    await initDatabase();
  } catch (dbInitErr) {
    console.error('⚠️ Database initialization warning:', dbInitErr.message);
    console.warn('Backend server will start and retry queries on incoming requests.');
  }

  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  ALCHEMINDS MULTI-STAKEHOLDER POSTGRESQL API SERVER   `);
    console.log(`  Extensions: PostGIS (Spatial) & pgvector (AI Search) `);
    console.log(`  Port: ${PORT}                                       `);
    console.log(`  Uploads: ${uploadsDir}                              `);
    console.log(`=======================================================`);
  });
}

startServer();
