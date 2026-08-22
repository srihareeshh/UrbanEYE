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

  // 15. HEI Innovation Exchange Challenges Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS hei_challenges (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      ward TEXT NOT NULL,
      department_match TEXT NOT NULL,
      match_percentage INTEGER DEFAULT 85,
      status TEXT DEFAULT 'open', -- 'open', 'claimed', 'in_progress', 'completed'
      escalated_by TEXT DEFAULT 'Municipal Commissioner / ULB Triage',
      research_brief TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    );
  `);

  // 16. HEI Multidisciplinary Capstone Projects Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS hei_projects (
      id TEXT PRIMARY KEY,
      challenge_id TEXT,
      report_id TEXT NOT NULL,
      title TEXT NOT NULL,
      institution_name TEXT NOT NULL,
      department TEXT NOT NULL,
      faculty_lead TEXT NOT NULL,
      faculty_email TEXT,
      student_team_json TEXT NOT NULL, -- Array of { name, studentId, apaarId, role, hours }
      current_stage INTEGER DEFAULT 1, -- 1: Feasibility, 2: Simulation, 3: Prototype, 4: Field Deployment
      total_research_hours INTEGER DEFAULT 0,
      total_field_hours INTEGER DEFAULT 0,
      funding_goal REAL DEFAULT 250000,
      funding_pledged REAL DEFAULT 0,
      sdg_goals_json TEXT, -- ['SDG 6', 'SDG 11']
      abstract TEXT,
      status TEXT DEFAULT 'active', -- 'active', 'pilot_ready', 'deployed', 'completed'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    );
  `);

  // 17. HEI Project 4-Stage Milestones Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS hei_project_milestones (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      stage_index INTEGER NOT NULL, -- 1, 2, 3, 4
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
      deliverables_json TEXT, -- { schematicUrl, videoUrl, githubUrl, testDataNotes, telemetryUrl }
      research_hours INTEGER DEFAULT 30,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES hei_projects(id) ON DELETE CASCADE
    );
  `);

  // 18. Student NEP 2020 Experiential Credit Registry Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS student_nep_credits (
      id TEXT PRIMARY KEY,
      student_name TEXT NOT NULL,
      student_id TEXT NOT NULL,
      apaar_id TEXT NOT NULL,
      institution_name TEXT NOT NULL,
      project_id TEXT NOT NULL,
      research_hours INTEGER DEFAULT 0,
      field_hours INTEGER DEFAULT 0,
      credits_awarded REAL DEFAULT 4.0,
      verification_hash TEXT NOT NULL,
      certificate_issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES hei_projects(id) ON DELETE CASCADE
    );
  `);

  // 19. CSR Grants & Corporate Pledges Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS csr_grants (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      corporate_name TEXT NOT NULL,
      cin TEXT NOT NULL, -- Corporate Identification Number
      csr_reg_no TEXT NOT NULL,
      contact_person TEXT,
      contact_email TEXT,
      total_pledge_amount REAL NOT NULL,
      disbursed_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pledged', -- 'pledged', 'partially_disbursed', 'fully_disbursed'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES hei_projects(id) ON DELETE CASCADE
    );
  `);

  // 20. Smart Escrow Tranche Releases Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS csr_escrow_tranches (
      id TEXT PRIMARY KEY,
      grant_id TEXT NOT NULL,
      tranche_number INTEGER NOT NULL, -- 1: 30% on Prototype, 2: 70% on Field Deployment
      percentage REAL NOT NULL,
      amount REAL NOT NULL,
      trigger_condition TEXT NOT NULL,
      status TEXT DEFAULT 'escrow_locked', -- 'escrow_locked', 'approved', 'disbursed'
      disbursed_at DATETIME,
      release_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (grant_id) REFERENCES csr_grants(id) ON DELETE CASCADE
    );
  `);

  // 21. Corporate Mentorship & Tech Transfer Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS corporate_mentors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT NOT NULL,
      designation TEXT NOT NULL,
      expertise_domain TEXT NOT NULL,
      email TEXT NOT NULL,
      office_hours_slot TEXT NOT NULL,
      status TEXT DEFAULT 'available',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tech_transfer_agreements (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      corporate_partner TEXT NOT NULL,
      municipal_partner TEXT NOT NULL,
      agreement_type TEXT NOT NULL, -- 'Exclusive Licensing', 'Municipal Rate Contract', 'Open Pilot'
      royalty_percentage REAL DEFAULT 2.5,
      status TEXT DEFAULT 'in_review', -- 'drafted', 'in_review', 'signed'
      terms_summary TEXT,
      signed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES hei_projects(id) ON DELETE CASCADE
    );
  `);

  // Auto seed realistic community & cross-stakeholder data
  seedCommunityData();
  seedInitialEngagement();
  seedStakeholderEcosystem();

  console.log('Alcheminds Database initialized successfully with Municipal, HEI & Industry models at:', dbPath);
}

export function seedStakeholderEcosystem() {
  const heiCount = db.prepare('SELECT COUNT(*) as count FROM hei_challenges').get().count;
  if (heiCount > 0) return; // Already seeded

  console.log('🌱 Seeding cross-stakeholder demo ecosystem (Municipal -> HEI -> Industry)...');

  const reports = db.prepare('SELECT id, category, description, status, civic_priority_score FROM reports').all();
  const waterReport = reports.find(r => r.category === 'Water') || reports[0];
  const roadReport = reports.find(r => r.category === 'Roads') || reports[1];
  const sanitationReport = reports.find(r => r.category === 'Sanitation') || reports[2];

  const now = new Date().toISOString();
  const pastDate = new Date(Date.now() - 3 * 86400000).toISOString();

  const insertChallenge = db.prepare(`
    INSERT INTO hei_challenges (
      id, report_id, title, description, category, severity, ward, department_match, match_percentage, status, escalated_by, research_brief, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertProject = db.prepare(`
    INSERT INTO hei_projects (
      id, challenge_id, report_id, title, institution_name, department, faculty_lead, faculty_email, student_team_json, current_stage, total_research_hours, total_field_hours, funding_goal, funding_pledged, sdg_goals_json, abstract, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMilestone = db.prepare(`
    INSERT INTO hei_project_milestones (
      id, project_id, stage_index, title, description, status, deliverables_json, research_hours, completed_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertNepCredit = db.prepare(`
    INSERT INTO student_nep_credits (
      id, student_name, student_id, apaar_id, institution_name, project_id, research_hours, field_hours, credits_awarded, verification_hash, certificate_issued_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertGrant = db.prepare(`
    INSERT INTO csr_grants (
      id, project_id, corporate_name, cin, csr_reg_no, contact_person, contact_email, total_pledge_amount, disbursed_amount, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTranche = db.prepare(`
    INSERT INTO csr_escrow_tranches (
      id, grant_id, tranche_number, percentage, amount, trigger_condition, status, disbursed_at, release_notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMentor = db.prepare(`
    INSERT INTO corporate_mentors (
      id, name, company, designation, expertise_domain, email, office_hours_slot, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTechTransfer = db.prepare(`
    INSERT INTO tech_transfer_agreements (
      id, project_id, corporate_partner, municipal_partner, agreement_type, royalty_percentage, status, terms_summary, signed_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const seedEcoTx = db.transaction(() => {
    // Challenge 1: Water Biosand Filtration (Escalated -> Claimed by BIT Mesra -> Working Prototype -> Funded by Tata Steel)
    const chal1Id = 'chal_water_001';
    const proj1Id = 'proj_bit_mesra_01';
    insertChallenge.run(
      chal1Id,
      waterReport.id,
      'Heavy Metal & Organic Runoff Remediation in Stormwater Canals',
      'Municipal drainage channel receives toxic residential and industrial overflow during monsoon. Needs passive low-cost in-situ bio-filtration.',
      'Water',
      'Dangerous',
      'Ward 14 West (Canal Sector)',
      'Environmental & Chemical Engineering Dept',
      96,
      'in_progress',
      'Municipal Corporation of Greater Mumbai (MCGM)',
      'Design a gravity-fed multi-tier bio-sand and activated biochar filtration media compatible with municipal culvert dimensions.',
      pastDate,
      now
    );

    // Project 1
    const studentTeam1 = JSON.stringify([
      { name: 'Aarav Sharma', studentId: '2022-CE-041', apaarId: 'APAAR-9821-4402-1190', role: 'Team Lead & CAD Modeler', hours: 64 },
      { name: 'Pooja Verma', studentId: '2022-ENV-019', apaarId: 'APAAR-7712-3094-8821', role: 'Biochar Chemistry Researcher', hours: 58 },
      { name: 'Nikhil Rane', studentId: '2023-CE-082', apaarId: 'APAAR-4109-8831-5542', role: 'Field Deployment & Telemetry', hours: 42 },
    ]);

    insertProject.run(
      proj1Id,
      chal1Id,
      waterReport.id,
      'Modular Activated Biochar Gravity Filter for Urban Stormwater Canals',
      'Birla Institute of Technology (BIT) Mesra',
      'Department of Civil & Environmental Engineering',
      'Dr. Ananya Sen (Prof. Water Resources)',
      'ananya.sen@bitmesra.ac.in',
      studentTeam1,
      3, // Stage 3: Working Prototype Developed
      128,
      36,
      350000,
      350000,
      JSON.stringify(['SDG 6: Clean Water', 'SDG 11: Sustainable Cities', 'SDG 9: Innovation']),
      'A low-cost permeable biochar filter insert that removes 92% of suspended heavy solids and neutralizes pH in active stormwater culverts.',
      'active',
      pastDate,
      now
    );

    // Milestones for Project 1
    insertMilestone.run(
      'ms_p1_s1',
      proj1Id,
      1,
      'Feasibility & Chemical Contaminant Study',
      'Spectroscopic analysis of Ward 14 canal sludge samples and hydrological flow simulations.',
      'completed',
      JSON.stringify({ schematicUrl: '/samples/lab_schematic_stage1.pdf', testDataNotes: 'TSS: 420mg/L, Lead: 0.18ppm, pH: 5.4' }),
      35,
      pastDate,
      pastDate
    );

    insertMilestone.run(
      'ms_p1_s2',
      proj1Id,
      2,
      'Lab Scale Simulation & Porous Media Testing',
      'Built 1:5 scale column flow test bench. Validated 88% turbidity reduction at 2.4 L/sec flow velocity.',
      'completed',
      JSON.stringify({ githubUrl: 'https://github.com/alcheminds/bit-mesra-biofilter', videoUrl: 'https://youtu.be/sample-lab-test' }),
      45,
      pastDate,
      pastDate
    );

    insertMilestone.run(
      'ms_p1_s3',
      proj1Id,
      3,
      'Working Full-Scale Culvert Prototype Development',
      'Manufactured stainless-steel caged modular biochar cartridge with ultrasonic flow sensor.',
      'completed',
      JSON.stringify({ prototypeUrl: '/samples/prototype_biofilter.jpg', telemetryUrl: 'https://telemetry.alcheminds.gov.in/node-14' }),
      48,
      now,
      pastDate
    );

    insertMilestone.run(
      'ms_p1_s4',
      proj1Id,
      4,
      'Field Deployment & Municipal Pilot Sign-off',
      'Install 4 filter units along Ward 14 West canal culvert and test for 30 consecutive days with municipal engineers.',
      'in_progress',
      JSON.stringify({ deploymentTarget: 'Ward 14 Culvert No. 3', expectedCompletion: '3 Weeks' }),
      0,
      null,
      pastDate
    );

    // NEP 2020 Credit Certificates for Student Team 1
    insertNepCredit.run(
      'nep_cert_001',
      'Aarav Sharma',
      '2022-CE-041',
      'APAAR-9821-4402-1190',
      'BIT Mesra',
      proj1Id,
      64,
      18,
      4.0,
      'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      now,
      now
    );

    insertNepCredit.run(
      'nep_cert_002',
      'Pooja Verma',
      '2022-ENV-019',
      'APAAR-7712-3094-8821',
      'BIT Mesra',
      proj1Id,
      58,
      14,
      4.0,
      'SHA256:4a385f52f854b73b53c7c25e839e55397f37470f1bd9d6f304523d573d45c5c0',
      now,
      now
    );

    // CSR Grant & Escrow Tranches for Project 1 (Tata Steel CSR)
    const grant1Id = 'grant_tata_001';
    insertGrant.run(
      grant1Id,
      proj1Id,
      'Tata Steel Foundation (CSR Division)',
      'L27100MH1907PLC000260',
      'CSR00001248',
      'Vikramaditya Rao (VP Sustainability)',
      'vikramaditya.rao@tatasteel.com',
      350000,
      105000, // 30% disbursed
      'partially_disbursed',
      pastDate,
      now
    );

    insertTranche.run(
      'tranche_1_p1',
      grant1Id,
      1,
      30.0,
      105000,
      'Disbursed upon HEI Lab Prototype Verification & CAD Approval',
      'disbursed',
      now,
      'Tranche 1 (₹1,05,000) released to BIT Mesra R&D Account after prototype review.',
      pastDate
    );

    insertTranche.run(
      'tranche_2_p1',
      grant1Id,
      2,
      70.0,
      245000,
      'Disbursed upon Municipal Field Deployment & Dual-Signoff Pilot Verification',
      'escrow_locked',
      null,
      'Locked in Smart Escrow. Will release automatically upon Municipal Commissioner sign-off.',
      pastDate
    );

    // Challenge 2: Sanitation / Smart Waste (Escalated -> Open for HEIs)
    insertChallenge.run(
      'chal_waste_002',
      sanitationReport.id,
      'Automated IoT Desilting & Clog Detection Robot for Stormwater Culverts',
      'Sub-surface drainage culverts frequently choke with plastic garbage and silt causing upstream backflows in urban roads.',
      'Sanitation',
      'Serious',
      'Ward 14 West (Municipal Canal Lane)',
      'Robotics, Mechanical & IoT Engineering Dept',
      92,
      'open',
      'Municipal Drainage Engineering Dept',
      'Develop an amphibious crawler robot with obstacle sonar to clear silt blockages autonomously.',
      pastDate,
      pastDate
    );

    // Challenge 3: Heavy Pothole & Bitumen (Claimed by IIT Bombay)
    const chal3Id = 'chal_road_003';
    const proj3Id = 'proj_iitb_road_03';
    insertChallenge.run(
      chal3Id,
      roadReport.id,
      'Recycled Plastic-Enhanced Quick-Curing Bituminous Cold Mix for Wet Potholes',
      'Monsoon potholes cannot be repaired using standard hot mix due to moisture and water pooling.',
      'Roads',
      'Serious',
      'Ward 14 West (2nd Cross Road)',
      'Materials Science & Transportation Engineering',
      94,
      'claimed',
      'Roads & Infrastructure Directorate',
      'Formulate a cold-setting emulsion that bonds to submerged bitumen within 2 hours.',
      pastDate,
      pastDate
    );

    insertProject.run(
      proj3Id,
      chal3Id,
      roadReport.id,
      'Eco-Bitumen Polymer Cold Pave for High-Rainfall Urban Arterials',
      'Indian Institute of Technology (IIT) Bombay',
      'Department of Civil Engineering & Center for Technology Alternatives',
      'Prof. Rajesh Kulkarni',
      'kulkarni.r@iitb.ac.in',
      JSON.stringify([
        { name: 'Kavita Menon', studentId: '21D070014', apaarId: 'APAAR-5532-1092-4411', role: 'Polymer Formulation Researcher', hours: 45 },
        { name: 'Farhan Akhtar', studentId: '21D070028', apaarId: 'APAAR-1298-7734-9902', role: 'Marshall Stability Testing', hours: 40 },
      ]),
      2, // Stage 2: Simulation & Lab Testing
      85,
      12,
      200000,
      0,
      JSON.stringify(['SDG 9: Industry & Innovation', 'SDG 11: Sustainable Cities', 'SDG 12: Responsible Consumption']),
      'Cold-mix asphalt modified with waste HDPE/LDPE pellets capable of curing under 100% moisture saturation in 90 minutes.',
      'active',
      pastDate,
      now
    );

    // Corporate Mentors
    insertMentor.run(
      'mentor_01',
      'Dr. Siddharth Mukherjee',
      'Larsen & Toubro (L&T Infrastructure)',
      'Principal Materials Specialist',
      'Civil Hydraulics & Polymer Concrete',
      'siddharth.m@larsentoubro.com',
      'Every Thursday, 4:00 PM - 6:00 PM IST',
      'available',
      pastDate
    );

    insertMentor.run(
      'mentor_02',
      'Meera Swaminathan',
      'Tata Consultancy Services (TCS Research)',
      'Head of Urban IoT & Smart Cities Lab',
      'Smart Sensor Networks & Edge Telemetry',
      'meera.s@tcs.com',
      'Every Tuesday, 3:00 PM - 5:00 PM IST',
      'available',
      pastDate
    );

    // Tech Transfer Agreement
    insertTechTransfer.run(
      'tt_001',
      proj1Id,
      'Tata Steel Environmental Division',
      'Municipal Corporation of Greater Mumbai',
      'Municipal Rate Contract & Pilot Licensing',
      3.0,
      'in_review',
      'Exclusive manufacturing of 50 bio-filter culvert inserts for Ward 14 & Ward 16 at subsidized municipal rate of ₹18,500/unit.',
      null,
      pastDate
    );
  });

  try {
    seedEcoTx();
    console.log('✓ Successfully seeded cross-stakeholder demo ecosystem (Municipal, HEI, Industry).');
  } catch (err) {
    console.warn('Stakeholder seeding note:', err.message);
  }
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
