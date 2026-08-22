import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { SAMPLE_COMMUNITY_REPORTS } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'alcheminds.db');
const db = new Database(dbPath);

// Enable WAL mode and foreign keys for high performance & integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function seedCommunityData() {
  const count = db.prepare('SELECT COUNT(*) as count FROM reports').get().count;
  if (count >= 14) return; // Already seeded

  console.log('🌱 Seeding realistic community civic incidents for Phase 3 Map & Hotspot Engine...');

  const insertReport = db.prepare(`
    INSERT INTO reports (
      id, report_code, category, description, duration, recurrence, severity,
      is_risk_present, risk_description, status, civic_priority_score, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertLocation = db.prepare(`
    INSERT INTO report_location (
      id, report_id, latitude, longitude, location_source, accuracy, address, city, state, postal_code, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertDetails = db.prepare(`
    INSERT INTO issue_details (
      id, report_id, category, duration, recurrence, severity, smart_suggested, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTimeline = db.prepare(`
    INSERT INTO report_timeline (
      id, report_id, stage, actor_type, actor_name, title, description, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAssignment = db.prepare(`
    INSERT INTO report_assignments (
      id, report_id, department_name, officer_name, scheduled_date, sla_target_date, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMedia = db.prepare(`
    INSERT INTO report_media (
      id, report_id, media_type, original_name, file_name, file_path, file_size, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertResolution = db.prepare(`
    INSERT INTO report_resolutions (
      id, report_id, resolution_notes, resolved_by, resolution_photo_url, resolution_photo_name, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertVerification = db.prepare(`
    INSERT INTO report_verifications (
      id, report_id, verdict, citizen_notes, satisfaction_rating, verified_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const seedTransaction = db.transaction(() => {
    SAMPLE_COMMUNITY_REPORTS.forEach((sample, i) => {
      const id = `rep_seed_${i + 1}_${Date.now()}`;
      const code = `ALC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const createdAtDate = new Date(Date.now() - (sample.daysAgo || 1) * 24 * 60 * 60 * 1000);
      const createdAt = createdAtDate.toISOString();

      insertReport.run(
        id,
        code,
        sample.category,
        sample.description,
        sample.duration,
        sample.recurrence,
        sample.severity,
        sample.isRiskPresent || 0,
        sample.riskDescription || null,
        sample.status,
        sample.civic_priority_score,
        createdAt,
        createdAt
      );

      insertLocation.run(
        `loc_${id}`,
        id,
        sample.latitude,
        sample.longitude,
        sample.source || 'manual',
        10,
        sample.address,
        sample.city || 'Mumbai',
        'Maharashtra',
        '400001',
        createdAt
      );

      insertDetails.run(
        `det_${id}`,
        id,
        sample.category,
        sample.duration,
        sample.recurrence,
        sample.severity,
        1,
        createdAt
      );

      // Seed Initial Timeline Event
      insertTimeline.run(
        `time_1_${id}`,
        id,
        'Submitted',
        'citizen',
        'Citizen Reporter',
        'Report Submitted',
        `Incident reported with priority score ${sample.civic_priority_score}/100 and queued for municipal triage.`,
        createdAt
      );

      // Add attached sample photo
      insertMedia.run(
        `med_${id}`,
        id,
        'image',
        `${sample.category.toLowerCase()}_incident.jpg`,
        'flooded_road_mumbai.jpg',
        '/samples/flooded_road_mumbai.jpg',
        102400,
        createdAt
      );

      // Add departmental timeline & assignment for In Progress / Resolved / Assigned
      if (['Assigned', 'Action Scheduled', 'In Progress', 'Resolved', 'Confirmed Resolved'].includes(sample.status)) {
        const dept = sample.category === 'Water'
          ? 'Water Supply & Sewerage Board'
          : sample.category === 'Roads'
          ? 'Roads & Traffic Infrastructure'
          : sample.category === 'Electricity'
          ? 'Municipal Power Distribution Utility'
          : sample.category === 'Schools'
          ? 'Civic Education & Infrastructure Board'
          : 'Solid Waste Management & Sanitation';

        insertAssignment.run(
          `asgn_${id}`,
          id,
          dept,
          'Eng. R. Shinde',
          'Tomorrow, 10:00 AM',
          '48 Hours',
          `Zonal maintenance team assigned to investigate ${sample.category.toLowerCase()} report.`,
          createdAt
        );

        insertTimeline.run(
          `time_2_${id}`,
          id,
          'Assigned',
          'authority',
          dept,
          `Assigned to ${dept}`,
          `Designated to Officer Eng. R. Shinde for priority field remediation.`,
          createdAt
        );
      }

      if (['Resolved', 'Confirmed Resolved'].includes(sample.status)) {
        insertResolution.run(
          `res_${id}`,
          id,
          'Remediation crew completed work on site. Obstruction removed and flow/safety restored.',
          'Eng. R. Shinde',
          '/samples/flooded_road_mumbai.jpg',
          'remediation_proof.jpg',
          createdAt
        );

        insertTimeline.run(
          `time_res_${id}`,
          id,
          'Resolved',
          'authority',
          'Municipal Engineering',
          'Remediation Completed by Authority',
          'Field work completed. Photographic proof attached.',
          createdAt
        );
      }

      if (sample.status === 'Confirmed Resolved') {
        insertVerification.run(
          `ver_${id}`,
          id,
          'fixed',
          'Problem verified fixed. Thank you for the quick action.',
          5,
          createdAt,
          createdAt
        );

        insertTimeline.run(
          `time_ver_${id}`,
          id,
          'Confirmed Resolved',
          'citizen',
          'Citizen Reporter',
          'Citizen Confirmed Resolution',
          'Citizen confirmed work on site with 5-star rating.',
          createdAt
        );
      }
    });
  });

  seedTransaction();
  console.log(`✓ Successfully seeded ${SAMPLE_COMMUNITY_REPORTS.length} realistic community civic reports.`);
}

export function initDatabase() {
  // 1. Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      session_token TEXT UNIQUE,
      name TEXT DEFAULT 'Citizen',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Reports Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      report_code TEXT UNIQUE NOT NULL,
      user_id TEXT,
      category TEXT NOT NULL,
      description TEXT,
      duration TEXT,
      recurrence TEXT,
      severity TEXT,
      is_risk_present INTEGER DEFAULT 0,
      risk_description TEXT,
      status TEXT DEFAULT 'Submitted',
      civic_priority_score INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // 3. Report Media Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS report_media (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      media_type TEXT NOT NULL, -- 'image', 'video', 'audio'
      original_name TEXT,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      mime_type TEXT,
      file_size INTEGER,
      duration_seconds REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    );
  `);

  // 4. Report Location Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS report_location (
      id TEXT PRIMARY KEY,
      report_id TEXT UNIQUE NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      location_source TEXT NOT NULL, -- 'exif', 'device', 'manual'
      accuracy REAL,
      address TEXT,
      city TEXT,
      state TEXT,
      postal_code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    );
  `);

  // 5. Report Metadata Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS report_metadata (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      media_id TEXT,
      exif_json TEXT,
      device_info TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
      FOREIGN KEY (media_id) REFERENCES report_media(id) ON DELETE SET NULL
    );
  `);

  // 6. Issue Details Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS issue_details (
      id TEXT PRIMARY KEY,
      report_id TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      duration TEXT,
      recurrence TEXT,
      severity TEXT,
      smart_suggested INTEGER DEFAULT 0,
      extra_context_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    );
  `);

  // 7. Phase 2: Activity Timeline Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS report_timeline (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      stage TEXT NOT NULL,
      actor_type TEXT NOT NULL, -- 'system', 'authority', 'citizen'
      actor_name TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      metadata_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    );
  `);

  // 8. Phase 2: Department Assignment Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS report_assignments (
      id TEXT PRIMARY KEY,
      report_id TEXT UNIQUE NOT NULL,
      department_name TEXT NOT NULL,
      officer_name TEXT NOT NULL,
      scheduled_date TEXT,
      sla_target_date TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    );
  `);

  // 9. Phase 2: Authority Resolution Evidence Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS report_resolutions (
      id TEXT PRIMARY KEY,
      report_id TEXT UNIQUE NOT NULL,
      resolution_notes TEXT NOT NULL,
      resolved_by TEXT NOT NULL,
      resolution_photo_url TEXT,
      resolution_photo_name TEXT,
      resolution_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    );
  `);

  // 10. Phase 2: Citizen Verification Feedback Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS report_verifications (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      verdict TEXT NOT NULL, -- 'fixed', 'partially_fixed', 'not_fixed'
      citizen_notes TEXT,
      satisfaction_rating INTEGER, -- 1-5
      follow_up_media_json TEXT,
      verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    );
  `);

  // 11. Community Upvotes Table (Guaranteed 1 vote per user per report)
  db.exec(`
    CREATE TABLE IF NOT EXISTS report_upvotes (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
      UNIQUE(report_id, user_id)
    );
  `);

  // 12. Report Followers Table (Guaranteed 1 follow per user per report)
  db.exec(`
    CREATE TABLE IF NOT EXISTS report_followers (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
      UNIQUE(report_id, user_id)
    );
  `);

  // 13. User Notifications Table (In-app notifications on followed issue milestones)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      report_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    );
  `);

  // 14. Performance Indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
    CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
    CREATE INDEX IF NOT EXISTS idx_location_coords ON report_location(latitude, longitude);
    CREATE INDEX IF NOT EXISTS idx_media_report_id ON report_media(report_id);
    CREATE INDEX IF NOT EXISTS idx_metadata_report_id ON report_metadata(report_id);
    CREATE INDEX IF NOT EXISTS idx_timeline_report_id ON report_timeline(report_id);
    CREATE INDEX IF NOT EXISTS idx_assignments_report_id ON report_assignments(report_id);
    CREATE INDEX IF NOT EXISTS idx_resolutions_report_id ON report_resolutions(report_id);
    CREATE INDEX IF NOT EXISTS idx_verifications_report_id ON report_verifications(report_id);
    CREATE INDEX IF NOT EXISTS idx_upvotes_report_id ON report_upvotes(report_id);
    CREATE INDEX IF NOT EXISTS idx_upvotes_user_id ON report_upvotes(user_id);
    CREATE INDEX IF NOT EXISTS idx_followers_report_id ON report_followers(report_id);
    CREATE INDEX IF NOT EXISTS idx_followers_user_id ON report_followers(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON user_notifications(user_id, is_read);
  `);

  // Auto seed realistic community data for Phase 3 & 4
  seedCommunityData();
  seedInitialEngagement();

  console.log('Alcheminds Database initialized successfully with Community Upvotes & Following at:', dbPath);
}

export function seedInitialEngagement() {
  const upvoteCount = db.prepare('SELECT COUNT(*) as count FROM report_upvotes').get().count;
  if (upvoteCount > 0) return; // Already seeded

  console.log('🌱 Seeding realistic civic upvotes and followers for community feed...');
  const reports = db.prepare('SELECT id, civic_priority_score FROM reports').all();

  const insertUpvote = db.prepare(`
    INSERT OR IGNORE INTO report_upvotes (id, report_id, user_id, created_at)
    VALUES (?, ?, ?, ?)
  `);

  const insertFollower = db.prepare(`
    INSERT OR IGNORE INTO report_followers (id, report_id, user_id, created_at)
    VALUES (?, ?, ?, ?)
  `);

  const engagementTx = db.transaction(() => {
    reports.forEach((rep, idx) => {
      // Scale upvotes based on priority score and sample index (e.g. between 12 and 48 votes)
      const voteCount = Math.max(5, Math.floor((rep.civic_priority_score || 50) * 0.45) + (idx % 8) * 3);
      for (let v = 1; v <= voteCount; v++) {
        const fakeUserId = `usr_civic_${v}_seed`;
        const createdAt = new Date(Date.now() - (v * 3600000 * 4)).toISOString();
        insertUpvote.run(`upv_${rep.id}_${v}`, rep.id, fakeUserId, createdAt);
        
        // 60% of upvoters also follow
        if (v % 3 !== 0) {
          insertFollower.run(`fol_${rep.id}_${v}`, rep.id, fakeUserId, createdAt);
        }
      }
    });
  });

  try {
    engagementTx();
    console.log('✓ Successfully seeded realistic civic upvotes and followers.');
  } catch (err) {
    console.warn('Engagement seeding note:', err.message);
  }
}

export default db;
