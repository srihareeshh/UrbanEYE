import pg from 'pg';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

// Active database driver: 'postgres' | 'sqlite'
let activeDriver = 'postgres';
let sqliteDb = null;

// -------------------------------------------------------------
// Database Connection Configuration
// -------------------------------------------------------------
let databaseUrl = (process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/alcheminds')
  .replace(/^(postgresql|postgres)\+asyncpg:\/\//, 'postgresql://');

const isCloudUrl = databaseUrl.includes('supabase.co') || 
                   databaseUrl.includes('neon.tech') || 
                   databaseUrl.includes('render.com') || 
                   databaseUrl.includes('amazonaws.com') ||
                   process.env.PG_SSL === 'true';

const poolConfig = {
  connectionString: databaseUrl,
  max: parseInt(process.env.PG_MAX_CLIENTS || '20', 10),
  idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT_MS || '30000', 10),
  connectionTimeoutMillis: 5000,
};

if (isCloudUrl) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err.message);
});

// Helper to convert PostgreSQL parameterized query to SQLite if needed
function translatePgToSqlite(sql, params = []) {
  let sqliteSql = sql;

  sqliteSql = sqliteSql.replace(/ST_SetSRID\(ST_MakePoint\(\s*\$\d+\s*,\s*\$\d+\s*\)\s*,\s*4326\s*\)/gi, 'NULL');
  sqliteSql = sqliteSql.replace(/ST_SetSRID\(ST_MakePoint\(\s*\?\s*,\s*\?\s*\)\s*,\s*4326\s*\)/gi, 'NULL');
  sqliteSql = sqliteSql.replace(/\bILIKE\b/gi, 'LIKE');
  sqliteSql = sqliteSql.replace(/\(NOW\(\)\s*-\s*INTERVAL\s*'(\d+)\s*day[s]?'\)/gi, "datetime('now', '-$1 day')");
  sqliteSql = sqliteSql.replace(/NOW\(\)/gi, 'CURRENT_TIMESTAMP');

  const matches = [...sqliteSql.matchAll(/\$(\d+)/g)];
  let sqliteParams = [];

  if (matches.length > 0) {
    for (const match of matches) {
      const idx = parseInt(match[1], 10) - 1;
      sqliteParams.push(params[idx]);
    }
    sqliteSql = sqliteSql.replace(/\$\d+/g, '?');
  } else {
    sqliteParams = [...params];
  }

  sqliteParams = sqliteParams.map(p => (typeof p === 'boolean' ? (p ? 1 : 0) : p));

  return { sql: sqliteSql, params: sqliteParams };
}

// -------------------------------------------------------------
// Unified Database Interface (PostgreSQL Primary + PostGIS)
// -------------------------------------------------------------
export const db = {
  getActiveDriver() {
    return activeDriver;
  },

  async query(text, params = []) {
    if (activeDriver === 'postgres') {
      try {
        const res = await pool.query(text, params);
        return res;
      } catch (err) {
        if (err.code === 'ECONNREFUSED' || err.message?.includes('Connection terminated') || err.message?.includes('timeout')) {
          console.warn('⚠️ [Database Notice] PostgreSQL disconnected, switching to local storage.');
          activeDriver = 'sqlite';
          await initSqliteFallback();
          return this.query(text, params);
        }
        throw err;
      }
    }

    const { sql: translatedSql, params: translatedParams } = translatePgToSqlite(text, params);
    const isSelect = /^\s*SELECT\b/i.test(translatedSql);

    try {
      if (isSelect) {
        const stmt = sqliteDb.prepare(translatedSql);
        const rows = stmt.all(...translatedParams);
        return { rows, rowCount: rows.length };
      } else {
        const stmt = sqliteDb.prepare(translatedSql);
        const info = stmt.run(...translatedParams);
        return { rows: [], rowCount: info.changes };
      }
    } catch (sqliteErr) {
      console.error('SQLite execution error:', sqliteErr.message);
      throw sqliteErr;
    }
  },

  async transaction(callback) {
    if (activeDriver === 'postgres') {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    const mockClient = {
      query: (text, params) => db.query(text, params)
    };

    sqliteDb.exec('BEGIN');
    try {
      const result = await callback(mockClient);
      sqliteDb.exec('COMMIT');
      return result;
    } catch (err) {
      try { sqliteDb.exec('ROLLBACK'); } catch (rbErr) {}
      throw err;
    }
  }
};

// -------------------------------------------------------------
// SQLite Schema Initialization (Fallback Mode)
// -------------------------------------------------------------
async function initSqliteFallback() {
  const dbPath = path.join(__dirname, 'alcheminds.db');
  if (!sqliteDb) {
    sqliteDb = new Database(dbPath);
    sqliteDb.pragma('journal_mode = WAL');
    sqliteDb.pragma('foreign_keys = ON');
  }

  try {
    sqliteDb.exec(`ALTER TABLE report_location ADD COLUMN location_geom TEXT;`);
  } catch (e) {}
  try {
    sqliteDb.exec(`ALTER TABLE reports ADD COLUMN embedding TEXT;`);
  } catch (e) {}

  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      session_token TEXT UNIQUE,
      name TEXT DEFAULT 'Citizen',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

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

    CREATE TABLE IF NOT EXISTS report_media (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      media_type TEXT NOT NULL,
      original_name TEXT,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      mime_type TEXT,
      file_size INTEGER,
      duration_seconds REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS report_location (
      id TEXT PRIMARY KEY,
      report_id TEXT UNIQUE NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      location_source TEXT NOT NULL,
      accuracy REAL,
      address TEXT,
      city TEXT,
      state TEXT,
      postal_code TEXT,
      location_geom TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS report_metadata (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      media_id TEXT,
      exif_json TEXT,
      device_info TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    );

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

    CREATE TABLE IF NOT EXISTS report_timeline (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      stage TEXT NOT NULL,
      actor_type TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      metadata_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    );

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

    CREATE TABLE IF NOT EXISTS report_verifications (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      verdict TEXT NOT NULL,
      citizen_notes TEXT,
      satisfaction_rating INTEGER,
      follow_up_media_json TEXT,
      verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS report_upvotes (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
      UNIQUE(report_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS report_followers (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
      UNIQUE(report_id, user_id)
    );

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
      status TEXT DEFAULT 'open',
      escalated_by TEXT DEFAULT 'Municipal Commissioner / ULB Triage',
      research_brief TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS hei_projects (
      id TEXT PRIMARY KEY,
      challenge_id TEXT,
      report_id TEXT NOT NULL,
      title TEXT NOT NULL,
      institution_name TEXT NOT NULL,
      department TEXT NOT NULL,
      faculty_lead TEXT NOT NULL,
      faculty_email TEXT,
      student_team_json TEXT NOT NULL,
      current_stage INTEGER DEFAULT 1,
      total_research_hours INTEGER DEFAULT 0,
      total_field_hours INTEGER DEFAULT 0,
      funding_goal REAL DEFAULT 250000,
      funding_pledged REAL DEFAULT 0,
      sdg_goals_json TEXT,
      abstract TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS hei_project_milestones (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      stage_index INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      deliverables_json TEXT,
      research_hours INTEGER DEFAULT 30,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES hei_projects(id) ON DELETE CASCADE
    );

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

    CREATE TABLE IF NOT EXISTS csr_grants (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      corporate_name TEXT NOT NULL,
      cin TEXT NOT NULL,
      csr_reg_no TEXT NOT NULL,
      contact_person TEXT,
      contact_email TEXT,
      total_pledge_amount REAL NOT NULL,
      disbursed_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pledged',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES hei_projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS csr_escrow_tranches (
      id TEXT PRIMARY KEY,
      grant_id TEXT NOT NULL,
      tranche_number INTEGER NOT NULL,
      percentage REAL NOT NULL,
      amount REAL NOT NULL,
      trigger_condition TEXT NOT NULL,
      status TEXT DEFAULT 'escrow_locked',
      disbursed_at DATETIME,
      release_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (grant_id) REFERENCES csr_grants(id) ON DELETE CASCADE
    );

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
      agreement_type TEXT NOT NULL,
      royalty_percentage REAL DEFAULT 2.5,
      status TEXT DEFAULT 'in_review',
      terms_summary TEXT,
      signed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES hei_projects(id) ON DELETE CASCADE
    );
  `);
}

// -------------------------------------------------------------
// Database Initialization (Pure PostgreSQL + PostGIS)
// -------------------------------------------------------------
export async function initDatabase() {
  console.log('🔄 Initializing PostgreSQL database with PostGIS extensions...');

  try {
    // 1. Check PostgreSQL connection
    await pool.query('SELECT 1');
    activeDriver = 'postgres';
    console.log('✓ Connected to PostgreSQL. Initializing PostgreSQL schema & PostGIS extensions...');

    try {
      await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
      console.log('✓ PostgreSQL Extension: uuid-ossp enabled');
    } catch (e) {
      console.warn('Note on uuid-ossp extension:', e.message);
    }

    try {
      await pool.query(`CREATE EXTENSION IF NOT EXISTS "postgis";`);
      console.log('✓ PostgreSQL Extension: postgis enabled (Spatial Geo-Queries)');
    } catch (e) {
      console.warn('Note on postgis extension:', e.message);
    }

    // 2. Create All PostgreSQL Tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        session_token TEXT UNIQUE,
        name VARCHAR(150) DEFAULT 'Citizen',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        report_code VARCHAR(50) UNIQUE NOT NULL,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        duration VARCHAR(100),
        recurrence VARCHAR(100),
        severity VARCHAR(50),
        is_risk_present BOOLEAN DEFAULT FALSE,
        risk_description TEXT,
        status VARCHAR(50) DEFAULT 'Submitted',
        civic_priority_score INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS report_media (
        id TEXT PRIMARY KEY,
        report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        media_type VARCHAR(50) NOT NULL,
        original_name TEXT,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        mime_type VARCHAR(100),
        file_size BIGINT,
        duration_seconds DOUBLE PRECISION,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS report_location (
        id TEXT PRIMARY KEY,
        report_id TEXT UNIQUE NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        location_source VARCHAR(50) NOT NULL,
        accuracy DOUBLE PRECISION,
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        postal_code VARCHAR(20),
        location_geom geometry(Point, 4326),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_report_location_geom ON report_location USING GIST(location_geom);

      CREATE TABLE IF NOT EXISTS report_metadata (
        id TEXT PRIMARY KEY,
        report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        media_id TEXT REFERENCES report_media(id) ON DELETE SET NULL,
        exif_json JSONB,
        device_info JSONB,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS issue_details (
        id TEXT PRIMARY KEY,
        report_id TEXT UNIQUE NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        category VARCHAR(100) NOT NULL,
        duration VARCHAR(100),
        recurrence VARCHAR(100),
        severity VARCHAR(50),
        smart_suggested BOOLEAN DEFAULT FALSE,
        extra_context_json JSONB,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS report_timeline (
        id TEXT PRIMARY KEY,
        report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        stage VARCHAR(50) NOT NULL,
        actor_type VARCHAR(50) NOT NULL,
        actor_name VARCHAR(150) NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        metadata_json JSONB,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS report_assignments (
        id TEXT PRIMARY KEY,
        report_id TEXT UNIQUE NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        department_name VARCHAR(200) NOT NULL,
        officer_name VARCHAR(150) NOT NULL,
        scheduled_date VARCHAR(100),
        sla_target_date VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS report_resolutions (
        id TEXT PRIMARY KEY,
        report_id TEXT UNIQUE NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        resolution_notes TEXT NOT NULL,
        resolved_by VARCHAR(150) NOT NULL,
        resolution_photo_url TEXT,
        resolution_photo_name TEXT,
        resolution_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS report_verifications (
        id TEXT PRIMARY KEY,
        report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        verdict VARCHAR(50) NOT NULL,
        citizen_notes TEXT,
        satisfaction_rating INTEGER,
        follow_up_media_json JSONB,
        verified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS report_upvotes (
        id TEXT PRIMARY KEY,
        report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(report_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS report_followers (
        id TEXT PRIMARY KEY,
        report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(report_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS user_notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS hei_challenges (
        id TEXT PRIMARY KEY,
        report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        severity VARCHAR(50) NOT NULL,
        ward VARCHAR(150) NOT NULL,
        department_match VARCHAR(200) NOT NULL,
        match_percentage INTEGER DEFAULT 85,
        status VARCHAR(50) DEFAULT 'open',
        escalated_by VARCHAR(150) DEFAULT 'Municipal Commissioner / ULB Triage',
        research_brief TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS hei_projects (
        id TEXT PRIMARY KEY,
        challenge_id TEXT REFERENCES hei_challenges(id) ON DELETE SET NULL,
        report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        institution_name VARCHAR(200) NOT NULL,
        department VARCHAR(200) NOT NULL,
        faculty_lead VARCHAR(150) NOT NULL,
        faculty_email VARCHAR(150),
        student_team_json JSONB NOT NULL,
        current_stage INTEGER DEFAULT 1,
        total_research_hours INTEGER DEFAULT 0,
        total_field_hours INTEGER DEFAULT 0,
        funding_goal DOUBLE PRECISION DEFAULT 250000,
        funding_pledged DOUBLE PRECISION DEFAULT 0,
        sdg_goals_json JSONB,
        abstract TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS hei_project_milestones (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES hei_projects(id) ON DELETE CASCADE,
        stage_index INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        deliverables_json JSONB,
        research_hours INTEGER DEFAULT 30,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS student_nep_credits (
        id TEXT PRIMARY KEY,
        student_name VARCHAR(150) NOT NULL,
        student_id VARCHAR(100) NOT NULL,
        apaar_id VARCHAR(100) NOT NULL,
        institution_name VARCHAR(200) NOT NULL,
        project_id TEXT NOT NULL REFERENCES hei_projects(id) ON DELETE CASCADE,
        research_hours INTEGER DEFAULT 0,
        field_hours INTEGER DEFAULT 0,
        credits_awarded DOUBLE PRECISION DEFAULT 4.0,
        verification_hash TEXT NOT NULL,
        certificate_issued_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS csr_grants (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES hei_projects(id) ON DELETE CASCADE,
        corporate_name VARCHAR(200) NOT NULL,
        cin VARCHAR(100) NOT NULL,
        csr_reg_no VARCHAR(100) NOT NULL,
        contact_person VARCHAR(150),
        contact_email VARCHAR(150),
        total_pledge_amount DOUBLE PRECISION NOT NULL,
        disbursed_amount DOUBLE PRECISION DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pledged',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS csr_escrow_tranches (
        id TEXT PRIMARY KEY,
        grant_id TEXT NOT NULL REFERENCES csr_grants(id) ON DELETE CASCADE,
        tranche_number INTEGER NOT NULL,
        percentage DOUBLE PRECISION NOT NULL,
        amount DOUBLE PRECISION NOT NULL,
        trigger_condition TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'escrow_locked',
        disbursed_at TIMESTAMPTZ,
        release_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS corporate_mentors (
        id TEXT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        company VARCHAR(200) NOT NULL,
        designation VARCHAR(150) NOT NULL,
        expertise_domain VARCHAR(200) NOT NULL,
        email VARCHAR(150) NOT NULL,
        office_hours_slot VARCHAR(150) NOT NULL,
        status VARCHAR(50) DEFAULT 'available',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tech_transfer_agreements (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES hei_projects(id) ON DELETE CASCADE,
        corporate_partner VARCHAR(200) NOT NULL,
        municipal_partner VARCHAR(200) NOT NULL,
        agreement_type VARCHAR(150) NOT NULL,
        royalty_percentage DOUBLE PRECISION DEFAULT 2.5,
        status VARCHAR(50) DEFAULT 'in_review',
        terms_summary TEXT,
        signed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

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

    console.log('✓ [PostgreSQL + PostGIS] Running with pure live citizen reported data (0 sample data).');
  } catch (err) {
    console.error('PostgreSQL connection error:', err.message);
    activeDriver = 'sqlite';
    await initSqliteFallback();
    console.log('✓ [SQLite Storage] Initialized clean database without sample data.');
  }
}

export default db;
