import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import exifr from 'exifr';
import db, { initDatabase } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Database schema with Phase 2 extensions
initDatabase();

const app = express();
const PORT = process.env.PORT || 3001;

// Uploads directory setup
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Sample test images directory
const samplesDir = path.join(__dirname, 'samples');
if (!fs.existsSync(samplesDir)) {
  fs.mkdirSync(samplesDir, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for uploads and samples
app.use('/uploads', express.static(uploadsDir));
app.use('/samples', express.static(samplesDir));

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const safeName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, safeName);
  },
});

// File filter for images, videos, and audio
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/gif',
    // Videos
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska',
    // Audio
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/aac', 'audio/x-m4a'
  ];

  if (allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB max
});

function getMediaType(mimetype) {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  return 'other';
}

function calculateCivicPriority({ category, severity, recurrence, duration, is_risk_present }) {
  let score = 20;
  if (severity === 'Dangerous') score += 35;
  else if (severity === 'Serious') score += 25;
  else if (severity === 'Moderate') score += 15;
  else if (severity === 'Low') score += 5;

  if (is_risk_present) score += 20;

  const highImpactCategories = ['Electricity', 'Water', 'Sanitation', 'Roads', 'Schools'];
  if (highImpactCategories.includes(category)) score += 15;
  else score += 8;

  if (recurrence === 'Almost always') score += 15;
  else if (recurrence === 'Frequently') score += 10;
  else if (recurrence === 'Sometimes') score += 5;

  if (duration === 'A few months' || duration === 'Longer') score += 15;
  else if (duration === 'A few weeks') score += 10;
  else if (duration === 'A few days') score += 5;

  return Math.min(100, Math.max(10, score));
}

// Department recommendation mapper based on category
function getDepartmentForCategory(category) {
  switch (category) {
    case 'Water':
      return {
        dept: 'Water Supply & Sewerage Board (Drainage Division)',
        officer: 'Eng. R. Shinde',
        slaHours: 24,
      };
    case 'Roads':
      return {
        dept: 'Roads & Transit Infrastructure Wing',
        officer: 'Insp. A. Kulkarni',
        slaHours: 48,
      };
    case 'Electricity':
      return {
        dept: 'Power Distribution & Emergency Grid Wing',
        officer: 'Eng. V. Nair',
        slaHours: 12,
      };
    case 'Sanitation':
      return {
        dept: 'Solid Waste Management & Sanitation Dept',
        officer: 'Supervisor S. Patil',
        slaHours: 24,
      };
    case 'Schools':
      return {
        dept: 'Department of Public School Infrastructure',
        officer: 'Officer M. Fernandes',
        slaHours: 36,
      };
    default:
      return {
        dept: 'Municipal Engineering & Public Works Division',
        officer: 'Duty Officer K. Sharma',
        slaHours: 48,
      };
  }
}

// ==========================================
// API ROUTES
// ==========================================

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Alcheminds Engine Phase 1 & 2 (Lifecycle Active)',
    time: new Date().toISOString(),
    database: 'connected'
  });
});

// 2. Upload Media Endpoint
app.post('/api/upload', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files were uploaded.' });
    }

    const processedFiles = await Promise.all(
      req.files.map(async (file) => {
        const mediaType = getMediaType(file.mimetype);
        let exifData = null;
        let gps = null;

        if (mediaType === 'image') {
          try {
            const fullExif = await exifr.parse(file.path, {
              gps: true,
              tiff: true,
              exif: true,
              iptc: true,
              xmp: true
            });

            if (fullExif) {
              exifData = {
                make: fullExif.Make || null,
                model: fullExif.Model || null,
                dateTimeOriginal: fullExif.DateTimeOriginal || fullExif.CreateDate || null,
                orientation: fullExif.Orientation || null,
                software: fullExif.Software || null,
                exposureTime: fullExif.ExposureTime || null,
                fNumber: fullExif.FNumber || null,
                iso: fullExif.ISO || null,
              };

              if (fullExif.latitude !== undefined && fullExif.longitude !== undefined) {
                gps = {
                  latitude: Number(fullExif.latitude),
                  longitude: Number(fullExif.longitude),
                  altitude: fullExif.GPSAltitude ? Number(fullExif.GPSAltitude) : null,
                  source: 'exif'
                };
              }
            }
          } catch (exifErr) {
            console.warn('EXIF parsing warning for', file.originalname, exifErr.message);
          }
        }

        return {
          mediaId: `med_${crypto.randomBytes(8).toString('hex')}`,
          fileName: file.filename,
          originalName: file.originalname,
          filePath: `/uploads/${file.filename}`,
          mimeType: file.mimetype,
          fileSize: file.size,
          mediaType,
          exif: exifData,
          gps
        };
      })
    );

    res.json({
      success: true,
      files: processedFiles
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Failed to process and store media.' });
  }
});

// 3. Create & Persist Report (With Initial Timeline Event)
app.post('/api/reports', (req, res) => {
  const {
    category,
    description,
    duration = 'Today',
    recurrence = 'First time',
    severity = 'Moderate',
    isRiskPresent = false,
    riskDescription = '',
    location,
    media = [],
    smartSuggested = false,
    extraContext = {}
  } = req.body;

  if (!category) {
    return res.status(400).json({ error: 'Issue category is required.' });
  }

  if (!description && media.length === 0) {
    return res.status(400).json({ error: 'Report must include a description or at least one piece of evidence.' });
  }

  if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
    return res.status(400).json({ error: 'A valid incident location is required.' });
  }

  const reportId = `rep_${crypto.randomBytes(8).toString('hex')}`;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const reportCode = `ALC-${new Date().getFullYear()}-${randomSuffix}`;
  const userId = req.body.userId || `usr_${crypto.randomBytes(6).toString('hex')}`;

  const priorityScore = calculateCivicPriority({
    category,
    severity,
    recurrence,
    duration,
    is_risk_present: isRiskPresent
  });

  const insertReportTx = db.transaction(() => {
    // 1. User
    db.prepare(`
      INSERT OR IGNORE INTO users (id, session_token, name)
      VALUES (?, ?, ?)
    `).run(userId, `sess_${userId}`, 'Citizen Reporter');

    // 2. Report
    db.prepare(`
      INSERT INTO reports (
        id, report_code, user_id, category, description, duration, recurrence,
        severity, is_risk_present, risk_description, status, civic_priority_score,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      reportId,
      reportCode,
      userId,
      category,
      description || '',
      duration,
      recurrence,
      severity,
      isRiskPresent ? 1 : 0,
      riskDescription || null,
      priorityScore
    );

    // 3. Location
    db.prepare(`
      INSERT INTO report_location (
        id, report_id, latitude, longitude, location_source, accuracy, address, city, state, postal_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `loc_${crypto.randomBytes(6).toString('hex')}`,
      reportId,
      location.latitude,
      location.longitude,
      location.source || 'manual',
      location.accuracy || null,
      location.address || null,
      location.city || null,
      location.state || null,
      location.postalCode || null
    );

    // 4. Issue Details
    db.prepare(`
      INSERT INTO issue_details (
        id, report_id, category, duration, recurrence, severity, smart_suggested, extra_context_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `iss_${crypto.randomBytes(6).toString('hex')}`,
      reportId,
      category,
      duration,
      recurrence,
      severity,
      smartSuggested ? 1 : 0,
      JSON.stringify(extraContext)
    );

    // 5. Media & Metadata
    const mediaStmt = db.prepare(`
      INSERT INTO report_media (
        id, report_id, media_type, original_name, file_name, file_path, mime_type, file_size, duration_seconds
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const metaStmt = db.prepare(`
      INSERT INTO report_metadata (
        id, report_id, media_id, exif_json, device_info
      ) VALUES (?, ?, ?, ?, ?)
    `);

    for (const item of media) {
      const mediaId = item.mediaId || `med_${crypto.randomBytes(8).toString('hex')}`;
      mediaStmt.run(
        mediaId,
        reportId,
        item.mediaType || 'image',
        item.originalName || 'uploaded_media',
        item.fileName || path.basename(item.filePath || ''),
        item.filePath,
        item.mimeType || null,
        item.fileSize || null,
        item.durationSeconds || null
      );

      if (item.exif || item.deviceInfo) {
        metaStmt.run(
          `met_${crypto.randomBytes(6).toString('hex')}`,
          reportId,
          mediaId,
          item.exif ? JSON.stringify(item.exif) : null,
          item.deviceInfo ? JSON.stringify(item.deviceInfo) : null
        );
      }
    }

    // 6. Phase 2: Seed Initial Timeline Event ("Report Submitted")
    db.prepare(`
      INSERT INTO report_timeline (
        id, report_id, stage, actor_type, actor_name, title, description, created_at
      ) VALUES (?, ?, 'Submitted', 'citizen', 'Citizen Reporter', 'Report Submitted', ?, CURRENT_TIMESTAMP)
    `).run(
      `tml_${crypto.randomBytes(6).toString('hex')}`,
      reportId,
      `Report registered with priority score ${priorityScore}/100 and queued for review.`
    );
  });

  try {
    insertReportTx();

    const report = db.prepare(`SELECT * FROM reports WHERE id = ?`).get(reportId);
    const loc = db.prepare(`SELECT * FROM report_location WHERE report_id = ?`).get(reportId);
    const mediaItems = db.prepare(`SELECT * FROM report_media WHERE report_id = ?`).all(reportId);
    const issueDetails = db.prepare(`SELECT * FROM issue_details WHERE report_id = ?`).get(reportId);
    const timeline = db.prepare(`SELECT * FROM report_timeline WHERE report_id = ? ORDER BY created_at ASC`).all(reportId);

    res.status(201).json({
      success: true,
      report: {
        ...report,
        location: loc,
        media: mediaItems,
        issueDetails,
        timeline
      }
    });
  } catch (dbError) {
    console.error('Database insertion error:', dbError);
    res.status(500).json({ error: 'Failed to persist report to database.' });
  }
});

// 4. List All Reports
app.get('/api/reports', (req, res) => {
  try {
    const reports = db.prepare(`
      SELECT r.*, 
             l.latitude, l.longitude, l.location_source, l.accuracy, l.address, l.city
      FROM reports r
      LEFT JOIN report_location l ON r.id = l.report_id
      ORDER BY r.created_at DESC
    `).all();

    const mediaList = db.prepare(`SELECT * FROM report_media`).all();
    const metadataList = db.prepare(`SELECT * FROM report_metadata`).all();
    const assignmentsList = db.prepare(`SELECT * FROM report_assignments`).all();
    const resolutionsList = db.prepare(`SELECT * FROM report_resolutions`).all();

    const enriched = reports.map(r => ({
      ...r,
      media: mediaList.filter(m => m.report_id === r.id),
      assignment: assignmentsList.find(a => a.report_id === r.id) || null,
      resolution: resolutionsList.find(res => res.report_id === r.id) || null,
      metadata: metadataList.filter(m => m.report_id === r.id).map(m => ({
        ...m,
        exif: m.exif_json ? JSON.parse(m.exif_json) : null
      }))
    }));

    res.json({
      success: true,
      count: enriched.length,
      reports: enriched
    });
  } catch (err) {
    console.error('Fetch reports error:', err);
    res.status(500).json({ error: 'Failed to retrieve reports.' });
  }
});

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
function notifyReportFollowers(reportId, eventType, title, message, excludeUserId = null) {
  try {
    const followers = db.prepare(`SELECT user_id FROM report_followers WHERE report_id = ?`).all(reportId);
    const insertNotif = db.prepare(`
      INSERT INTO user_notifications (id, user_id, report_id, event_type, title, message, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
    `);

    for (const fol of followers) {
      if (excludeUserId && fol.user_id === excludeUserId) continue;
      insertNotif.run(
        `notif_${crypto.randomBytes(6).toString('hex')}`,
        fol.user_id,
        reportId,
        eventType,
        title,
        message
      );
    }
  } catch (e) {
    console.warn('Failed to dispatch follower notifications:', e.message);
  }
}

// 5. Get Individual Report & Full Lifecycle Details
app.get('/api/reports/:id', (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] || req.query.userId || null;

    const report = db.prepare(`
      SELECT * FROM reports WHERE id = ? OR report_code = ?
    `).get(id, id);

    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    const location = db.prepare(`SELECT * FROM report_location WHERE report_id = ?`).get(report.id);
    const media = db.prepare(`SELECT * FROM report_media WHERE report_id = ?`).all(report.id);
    const issueDetails = db.prepare(`SELECT * FROM issue_details WHERE report_id = ?`).get(report.id);
    const metadata = db.prepare(`SELECT * FROM report_metadata WHERE report_id = ?`).all(report.id);
    const timeline = db.prepare(`SELECT * FROM report_timeline WHERE report_id = ? ORDER BY created_at ASC`).all(report.id);
    const assignment = db.prepare(`SELECT * FROM report_assignments WHERE report_id = ?`).get(report.id);
    const resolution = db.prepare(`SELECT * FROM report_resolutions WHERE report_id = ?`).get(report.id);
    const verifications = db.prepare(`SELECT * FROM report_verifications WHERE report_id = ? ORDER BY created_at DESC`).all(report.id);

    // Civic Upvotes & Followers
    const upvoteCount = db.prepare(`SELECT COUNT(*) as count FROM report_upvotes WHERE report_id = ?`).get(report.id)?.count || 0;
    const followerCount = db.prepare(`SELECT COUNT(*) as count FROM report_followers WHERE report_id = ?`).get(report.id)?.count || 0;

    let isUpvoted = false;
    let isFollowed = false;
    if (userId) {
      isUpvoted = !!db.prepare(`SELECT 1 FROM report_upvotes WHERE report_id = ? AND user_id = ?`).get(report.id, userId);
      isFollowed = !!db.prepare(`SELECT 1 FROM report_followers WHERE report_id = ? AND user_id = ?`).get(report.id, userId);
    }

    res.json({
      success: true,
      report: {
        ...report,
        location,
        media,
        issueDetails,
        timeline,
        assignment: assignment || null,
        resolution: resolution || null,
        upvote_count: upvoteCount,
        follower_count: followerCount,
        is_upvoted: isUpvoted,
        is_followed: isFollowed,
        verifications: verifications.map(v => ({
          ...v,
          followUpMedia: v.follow_up_media_json ? JSON.parse(v.follow_up_media_json) : []
        })),
        metadata: metadata.map(m => ({
          ...m,
          exif: m.exif_json ? JSON.parse(m.exif_json) : null
        }))
      }
    });
  } catch (err) {
    console.error('Fetch single report error:', err);
    res.status(500).json({ error: 'Failed to fetch report details.' });
  }
});

// 6. Phase 2: Transition Stage Endpoint
app.post('/api/reports/:id/stage', (req, res) => {
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

    const report = db.prepare(`SELECT * FROM reports WHERE id = ? OR report_code = ?`).get(id, id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    const tx = db.transaction(() => {
      // 1. Update Report Status
      db.prepare(`UPDATE reports SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(stage, report.id);

      // 2. Add Timeline event
      const eventTitle = title || `Status updated to ${stage}`;
      db.prepare(`
        INSERT INTO report_timeline (id, report_id, stage, actor_type, actor_name, title, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        `tml_${crypto.randomBytes(6).toString('hex')}`,
        report.id,
        stage,
        actorType,
        actorName,
        eventTitle,
        description
      );

      // 3. Handle Assignment if provided
      if (departmentName && officerName) {
        db.prepare(`
          INSERT INTO report_assignments (id, report_id, department_name, officer_name, scheduled_date, notes, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(report_id) DO UPDATE SET
            department_name = excluded.department_name,
            officer_name = excluded.officer_name,
            scheduled_date = excluded.scheduled_date,
            notes = excluded.notes,
            updated_at = CURRENT_TIMESTAMP
        `).run(
          `asg_${crypto.randomBytes(6).toString('hex')}`,
          report.id,
          departmentName,
          officerName,
          scheduledDate || null,
          description || null
        );
      }

      // 4. Handle Resolution if marked Resolved
      if (stage === 'Resolved' && resolutionNotes) {
        db.prepare(`
          INSERT INTO report_resolutions (id, report_id, resolution_notes, resolved_by, resolution_photo_url, resolution_photo_name)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(report_id) DO UPDATE SET
            resolution_notes = excluded.resolution_notes,
            resolved_by = excluded.resolved_by,
            resolution_photo_url = excluded.resolution_photo_url,
            resolution_photo_name = excluded.resolution_photo_name,
            resolution_timestamp = CURRENT_TIMESTAMP
        `).run(
          `res_${crypto.randomBytes(6).toString('hex')}`,
          report.id,
          resolutionNotes,
          officerName || actorName,
          resolutionPhotoUrl || null,
          resolutionPhotoName || null
        );
      }
    });

    tx();

    // Push notification to all citizens following this report
    notifyReportFollowers(
      report.id,
      'stage_change',
      `Report ${report.report_code}: Status changed to ${stage}`,
      description || `Authority updated stage to ${stage}. Remediation is progressing.`
    );

    // Return updated report
    const updated = db.prepare(`SELECT * FROM reports WHERE id = ?`).get(report.id);
    const timeline = db.prepare(`SELECT * FROM report_timeline WHERE report_id = ? ORDER BY created_at ASC`).all(report.id);
    const assignment = db.prepare(`SELECT * FROM report_assignments WHERE report_id = ?`).get(report.id);
    const resolution = db.prepare(`SELECT * FROM report_resolutions WHERE report_id = ?`).get(report.id);

    res.json({
      success: true,
      report: {
        ...updated,
        timeline,
        assignment: assignment || null,
        resolution: resolution || null
      }
    });
  } catch (err) {
    console.error('Stage transition error:', err);
    res.status(500).json({ error: 'Failed to update report stage.' });
  }
});

// 7. Phase 2: Citizen Verification Feedback Loop Endpoint
app.post('/api/reports/:id/verify', (req, res) => {
  try {
    const { id } = req.params;
    const {
      verdict, // 'fixed', 'partially_fixed', 'not_fixed'
      citizenNotes = '',
      satisfactionRating = 5,
      followUpMedia = []
    } = req.body;

    if (!verdict) {
      return res.status(400).json({ error: 'Verification verdict is required.' });
    }

    const report = db.prepare(`SELECT * FROM reports WHERE id = ? OR report_code = ?`).get(id, id);
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

    const tx = db.transaction(() => {
      // 1. Update Report Status
      db.prepare(`UPDATE reports SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(newStatus, report.id);

      // 2. Insert Verification Log
      db.prepare(`
        INSERT INTO report_verifications (
          id, report_id, verdict, citizen_notes, satisfaction_rating, follow_up_media_json, verified_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        `ver_${crypto.randomBytes(6).toString('hex')}`,
        report.id,
        verdict,
        citizenNotes,
        satisfactionRating,
        JSON.stringify(followUpMedia)
      );

      // 3. Insert Timeline Record
      db.prepare(`
        INSERT INTO report_timeline (
          id, report_id, stage, actor_type, actor_name, title, description, created_at
        ) VALUES (?, ?, ?, 'citizen', 'Citizen Reporter', ?, ?, CURRENT_TIMESTAMP)
      `).run(
        `tml_${crypto.randomBytes(6).toString('hex')}`,
        report.id,
        newStatus,
        timelineTitle,
        timelineDesc
      );
    });

    tx();

    const updated = db.prepare(`SELECT * FROM reports WHERE id = ?`).get(report.id);
    const timeline = db.prepare(`SELECT * FROM report_timeline WHERE report_id = ? ORDER BY created_at ASC`).all(report.id);
    const verifications = db.prepare(`SELECT * FROM report_verifications WHERE report_id = ? ORDER BY created_at DESC`).all(report.id);

    res.json({
      success: true,
      report: {
        ...updated,
        timeline,
        verifications
      }
    });
  } catch (err) {
    console.error('Citizen verification error:', err);
    res.status(500).json({ error: 'Failed to record citizen verification.' });
  }
});

// 8. Phase 2: Authority Simulation Helper Endpoint
// Advances a report automatically to the next stage or directly to 'Resolved' for testing
app.post('/api/reports/:id/simulate-advance', (req, res) => {
  try {
    const { id } = req.params;
    const { targetStage } = req.body;

    const report = db.prepare(`SELECT * FROM reports WHERE id = ? OR report_code = ?`).get(id, id);
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

    // Simulate stage details
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
      // Use sample resolved photo
      resolutionPhotoUrl = '/samples/flooded_road_mumbai.jpg';
    }

    const tx = db.transaction(() => {
      // 1. Update status
      db.prepare(`UPDATE reports SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(nextStage, report.id);

      // 2. Timeline
      db.prepare(`
        INSERT INTO report_timeline (id, report_id, stage, actor_type, actor_name, title, description, created_at)
        VALUES (?, ?, ?, 'authority', ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        `tml_${crypto.randomBytes(6).toString('hex')}`,
        report.id,
        nextStage,
        deptInfo.officer,
        stageTitle,
        stageDesc
      );

      // 3. Assignment
      db.prepare(`
        INSERT INTO report_assignments (id, report_id, department_name, officer_name, scheduled_date, notes, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(report_id) DO UPDATE SET
          department_name = excluded.department_name,
          officer_name = excluded.officer_name,
          notes = excluded.notes,
          updated_at = CURRENT_TIMESTAMP
      `).run(
        `asg_${crypto.randomBytes(6).toString('hex')}`,
        report.id,
        deptInfo.dept,
        deptInfo.officer,
        new Date(Date.now() + deptInfo.slaHours * 3600000).toLocaleString(),
        stageDesc
      );

      // 4. Resolution if Resolved
      if (nextStage === 'Resolved') {
        db.prepare(`
          INSERT INTO report_resolutions (id, report_id, resolution_notes, resolved_by, resolution_photo_url, resolution_photo_name)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(report_id) DO UPDATE SET
            resolution_notes = excluded.resolution_notes,
            resolved_by = excluded.resolved_by,
            resolution_photo_url = excluded.resolution_photo_url,
            resolution_photo_name = excluded.resolution_photo_name,
            resolution_timestamp = CURRENT_TIMESTAMP
        `).run(
          `res_${crypto.randomBytes(6).toString('hex')}`,
          report.id,
          resolutionNotes,
          deptInfo.officer,
          resolutionPhotoUrl,
          'remediation_proof_site.jpg'
        );
      }
    });

    tx();

    // Push notification to followers on simulate-advance
    notifyReportFollowers(
      report.id,
      'stage_change',
      `Report ${report.report_code}: Status changed to ${nextStage}`,
      stageDesc || `Authority updated stage to ${nextStage}. Remediation is progressing.`
    );

    // Fetch refreshed complete entity
    const updated = db.prepare(`SELECT * FROM reports WHERE id = ?`).get(report.id);
    const timeline = db.prepare(`SELECT * FROM report_timeline WHERE report_id = ? ORDER BY created_at ASC`).all(report.id);
    const assignment = db.prepare(`SELECT * FROM report_assignments WHERE report_id = ?`).get(report.id);
    const resolution = db.prepare(`SELECT * FROM report_resolutions WHERE report_id = ?`).get(report.id);

    res.json({
      success: true,
      report: {
        ...updated,
        timeline,
        assignment: assignment || null,
        resolution: resolution || null
      }
    });
  } catch (err) {
    console.error('Simulation advance error:', err);
    res.status(500).json({ error: 'Failed to simulate lifecycle stage.' });
  }
});

// ==========================================
// PHASE 4: COMMUNITY ISSUES & UPVOTING ROUTES
// ==========================================

// 9. Community Issues Feed Endpoint
app.get('/api/community/issues', (req, res) => {
  try {
    const {
      lat = 19.0760,
      lng = 72.8777,
      sort = 'nearby', // 'nearby' | 'supported' | 'recent' | 'serious'
      category = 'all',
      search = '',
    } = req.query;

    const userId = req.headers['x-user-id'] || req.query.userId || null;
    const userLat = parseFloat(lat) || 19.0760;
    const userLng = parseFloat(lng) || 72.8777;

    // Base query fetching reports with locations
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

    // Filter by category
    if (category && category !== 'all' && category !== 'All') {
      query += ` AND r.category = ?`;
      params.push(category);
    }

    // Filter by search query
    if (search && search.trim()) {
      query += ` AND (r.report_code LIKE ? OR r.description LIKE ? OR l.address LIKE ? OR r.category LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    const rows = db.prepare(query).all(...params);

    // Get list of upvoted and followed reports for current user in one quick query
    let userUpvotedSet = new Set();
    let userFollowedSet = new Set();
    if (userId) {
      const userUpvotes = db.prepare(`SELECT report_id FROM report_upvotes WHERE user_id = ?`).all(userId);
      userUpvotes.forEach(u => userUpvotedSet.add(u.report_id));

      const userFollows = db.prepare(`SELECT report_id FROM report_followers WHERE user_id = ?`).all(userId);
      userFollows.forEach(f => userFollowedSet.add(f.report_id));
    }

    // Enrich rows with distance, privacy-safe approximate location, and user interaction states
    const enriched = rows.map((r) => {
      const distance = calculateHaversineDistance(userLat, userLng, r.latitude, r.longitude);
      const approxLocation = getApproximateLocationText(r.address, r.city, distance);

      // Severity weight for sorting
      let severityWeight = 2;
      if (r.severity === 'Dangerous') severityWeight = 4;
      else if (r.severity === 'Serious') severityWeight = 3;
      else if (r.severity === 'Moderate') severityWeight = 2;
      else if (r.severity === 'Low') severityWeight = 1;

      return {
        ...r,
        distance_km: distance,
        approx_location: approxLocation,
        is_upvoted: userUpvotedSet.has(r.id),
        is_followed: userFollowedSet.has(r.id),
        severity_weight: severityWeight,
      };
    });

    // Sort according to requested civic sorting mode
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
      // 'recent'
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

// 10. Upvote Toggle Endpoint (Enforces 1 upvote per user, auto-follows)
app.post('/api/reports/:id/upvote', (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId || req.headers['x-user-id'];

    if (!userId) {
      return res.status(400).json({ error: 'User identity is required to upvote.' });
    }

    const report = db.prepare(`SELECT * FROM reports WHERE id = ? OR report_code = ?`).get(id, id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    let isUpvotedNow = false;
    let isFollowedNow = false;

    const upvoteTx = db.transaction(() => {
      const existing = db.prepare(`
        SELECT id FROM report_upvotes WHERE report_id = ? AND user_id = ?
      `).get(report.id, userId);

      if (existing) {
        // Toggle OFF: Remove upvote
        db.prepare(`
          DELETE FROM report_upvotes WHERE report_id = ? AND user_id = ?
        `).run(report.id, userId);
        isUpvotedNow = false;
      } else {
        // Toggle ON: Insert upvote
        db.prepare(`
          INSERT INTO report_upvotes (id, report_id, user_id, created_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `).run(`upv_${crypto.randomBytes(6).toString('hex')}`, report.id, userId);
        isUpvotedNow = true;

        // Auto-follow when citizen upvotes issue
        db.prepare(`
          INSERT OR IGNORE INTO report_followers (id, report_id, user_id, created_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `).run(`fol_${crypto.randomBytes(6).toString('hex')}`, report.id, userId);
      }

      // Check final follower state
      const followCheck = db.prepare(`
        SELECT 1 FROM report_followers WHERE report_id = ? AND user_id = ?
      `).get(report.id, userId);
      isFollowedNow = !!followCheck;
    });

    upvoteTx();

    const upvoteCount = db.prepare(`
      SELECT COUNT(*) as count FROM report_upvotes WHERE report_id = ?
    `).get(report.id)?.count || 0;

    const followerCount = db.prepare(`
      SELECT COUNT(*) as count FROM report_followers WHERE report_id = ?
    `).get(report.id)?.count || 0;

    res.json({
      success: true,
      report_id: report.id,
      is_upvoted: isUpvotedNow,
      upvote_count: upvoteCount,
      is_followed: isFollowedNow,
      follower_count: followerCount,
      message: isUpvotedNow
        ? 'Support recorded. You are now tracking updates for this civic issue.'
        : 'Support removed.',
    });
  } catch (err) {
    console.error('Upvote error:', err);
    res.status(500).json({ error: 'Failed to record upvote.' });
  }
});

// 11. Follow Toggle Endpoint (Follow / Unfollow for lifecycle updates)
app.post('/api/reports/:id/follow', (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId || req.headers['x-user-id'];

    if (!userId) {
      return res.status(400).json({ error: 'User identity is required to follow.' });
    }

    const report = db.prepare(`SELECT * FROM reports WHERE id = ? OR report_code = ?`).get(id, id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    let isFollowedNow = false;

    const followTx = db.transaction(() => {
      const existing = db.prepare(`
        SELECT id FROM report_followers WHERE report_id = ? AND user_id = ?
      `).get(report.id, userId);

      if (existing) {
        db.prepare(`
          DELETE FROM report_followers WHERE report_id = ? AND user_id = ?
        `).run(report.id, userId);
        isFollowedNow = false;
      } else {
        db.prepare(`
          INSERT INTO report_followers (id, report_id, user_id, created_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `).run(`fol_${crypto.randomBytes(6).toString('hex')}`, report.id, userId);
        isFollowedNow = true;
      }
    });

    followTx();

    const followerCount = db.prepare(`
      SELECT COUNT(*) as count FROM report_followers WHERE report_id = ?
    `).get(report.id)?.count || 0;

    res.json({
      success: true,
      report_id: report.id,
      is_followed: isFollowedNow,
      follower_count: followerCount,
      message: isFollowedNow
        ? 'You are now following this issue for status updates.'
        : 'Unfollowed issue.',
    });
  } catch (err) {
    console.error('Follow error:', err);
    res.status(500).json({ error: 'Failed to toggle follow status.' });
  }
});

// 12. User Activity & Subscribed Issues Endpoint (My Reports, Following, Upvoted, Notifications)
app.get('/api/user/activity', (req, res) => {
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
          distance_km: distance,
          approx_location: approxLocation,
        };
      });
    };

    // My Reports
    const myReportsRaw = db.prepare(`
      SELECT r.*, l.latitude, l.longitude, l.address, l.city,
             (SELECT file_path FROM report_media WHERE report_id = r.id AND media_type = 'image' LIMIT 1) as photo_url,
             (SELECT COUNT(*) FROM report_upvotes WHERE report_id = r.id) as upvote_count,
             (SELECT COUNT(*) FROM report_followers WHERE report_id = r.id) as follower_count
      FROM reports r
      LEFT JOIN report_location l ON r.id = l.report_id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `).all(userId);

    // Followed Reports
    const followedReportsRaw = db.prepare(`
      SELECT r.*, l.latitude, l.longitude, l.address, l.city,
             (SELECT file_path FROM report_media WHERE report_id = r.id AND media_type = 'image' LIMIT 1) as photo_url,
             (SELECT COUNT(*) FROM report_upvotes WHERE report_id = r.id) as upvote_count,
             (SELECT COUNT(*) FROM report_followers WHERE report_id = r.id) as follower_count
      FROM reports r
      LEFT JOIN report_location l ON r.id = l.report_id
      INNER JOIN report_followers f ON r.id = f.report_id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).all(userId);

    // Upvoted Reports
    const upvotedReportsRaw = db.prepare(`
      SELECT r.*, l.latitude, l.longitude, l.address, l.city,
             (SELECT file_path FROM report_media WHERE report_id = r.id AND media_type = 'image' LIMIT 1) as photo_url,
             (SELECT COUNT(*) FROM report_upvotes WHERE report_id = r.id) as upvote_count,
             (SELECT COUNT(*) FROM report_followers WHERE report_id = r.id) as follower_count
      FROM reports r
      LEFT JOIN report_location l ON r.id = l.report_id
      INNER JOIN report_upvotes u ON r.id = u.report_id
      WHERE u.user_id = ?
      ORDER BY u.created_at DESC
    `).all(userId);

    // Notifications Feed
    const notifications = db.prepare(`
      SELECT n.*, r.report_code, r.category, r.status
      FROM user_notifications n
      LEFT JOIN reports r ON n.report_id = r.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50
    `).all(userId);

    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM user_notifications WHERE user_id = ? AND is_read = 0
    `).get(userId)?.count || 0;

    res.json({
      success: true,
      myReports: enrichReportsList(myReportsRaw),
      followingReports: enrichReportsList(followedReportsRaw),
      upvotedReports: enrichReportsList(upvotedReportsRaw),
      notifications,
      unreadCount,
    });
  } catch (err) {
    console.error('User activity error:', err);
    res.status(500).json({ error: 'Failed to fetch user activity.' });
  }
});

// 13. Mark Notification as Read
app.post('/api/user/notifications/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare(`UPDATE user_notifications SET is_read = 1 WHERE id = ?`).run(id);
    res.json({ success: true });
  } catch (err) {
    console.error('Notification read error:', err);
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

// 14. Mark All Notifications as Read
app.post('/api/user/notifications/read-all', (req, res) => {
  try {
    const userId = req.body.userId || req.headers['x-user-id'];
    if (userId) {
      db.prepare(`UPDATE user_notifications SET is_read = 1 WHERE user_id = ?`).run(userId);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Notification read all error:', err);
    res.status(500).json({ error: 'Failed to mark notifications as read.' });
  }
});

// ==========================================
// PHASE 3: COMMUNITY MAP & HOTSPOTS ROUTES
// ==========================================
import { clusterReportsByProximity, detectCivicHotspots, detectSystemicPatterns } from './hotspots.js';

// Helper function to fetch enriched map reports with query filters
function getEnrichedMapReports(filters = {}) {
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
    query += ` AND r.category = ?`;
    params.push(category);
  }

  // Status filter (active, resolved, emerging, or specific status)
  if (status && status !== 'all' && status !== 'All') {
    if (status === 'active' || status === 'Active') {
      query += ` AND r.status NOT IN ('Confirmed Resolved', 'Resolved')`;
    } else if (status === 'resolved' || status === 'Resolved') {
      query += ` AND r.status IN ('Confirmed Resolved', 'Resolved')`;
    } else if (status === 'emerging' || status === 'Emerging') {
      query += ` AND r.created_at >= datetime('now', '-2 days') AND r.severity IN ('Dangerous', 'Serious')`;
    } else {
      query += ` AND r.status = ?`;
      params.push(status);
    }
  }

  // Timeframe filter (today, 7d, 30d, all)
  if (timeframe && timeframe !== 'all' && timeframe !== 'All') {
    if (timeframe === 'today' || timeframe === 'Today') {
      query += ` AND r.created_at >= datetime('now', '-1 days')`;
    } else if (timeframe === '7d' || timeframe === '7 Days') {
      query += ` AND r.created_at >= datetime('now', '-7 days')`;
    } else if (timeframe === '30d' || timeframe === '30 Days') {
      query += ` AND r.created_at >= datetime('now', '-30 days')`;
    }
  }

  // Bounding box filter if provided
  if (minLat && maxLat && minLng && maxLng) {
    query += ` AND l.latitude BETWEEN ? AND ? AND l.longitude BETWEEN ? AND ?`;
    params.push(Number(minLat), Number(maxLat), Number(minLng), Number(maxLng));
  }

  query += ` ORDER BY r.created_at DESC`;

  return db.prepare(query).all(...params);
}

// 9. Phase 3: Map Reports & Clusters Endpoint
app.get('/api/map/reports', (req, res) => {
  try {
    const reports = getEnrichedMapReports(req.query);
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

// 10. Phase 3: Civic Hotspots Endpoint
app.get('/api/map/hotspots', (req, res) => {
  try {
    const reports = getEnrichedMapReports(req.query);
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

// 11. Phase 3: "The Bigger Picture" Problem Genome Pattern Detection Endpoint
app.get('/api/map/patterns', (req, res) => {
  try {
    const reports = getEnrichedMapReports(req.query);
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

// Start Express Server
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`  ALCHEMINDS PHASE 1, 2 & 3 API SERVER   `);
  console.log(`  Port: ${PORT}                           `);
  console.log(`  Uploads: ${uploadsDir}                 `);
  console.log(`=========================================`);
});

