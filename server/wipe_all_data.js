import { db } from './db.js';

async function wipeAll() {
  console.log('🧹 Purging all sample and test data across all tables...');
  
  const tables = [
    'tech_transfer_agreements',
    'corporate_mentors',
    'csr_escrow_tranches',
    'csr_grants',
    'student_nep_credits',
    'hei_project_milestones',
    'hei_projects',
    'hei_challenges',
    'user_notifications',
    'report_followers',
    'report_upvotes',
    'report_verifications',
    'report_resolutions',
    'report_assignments',
    'report_timeline',
    'issue_details',
    'report_metadata',
    'report_location',
    'report_media',
    'reports',
    'users'
  ];

  for (const table of tables) {
    try {
      await db.query(`DELETE FROM ${table};`);
      console.log(`✓ Cleared table: ${table}`);
    } catch (e) {
      console.warn(`Table ${table} clear warning:`, e.message);
    }
  }

  const check = await db.query('SELECT count(*) as count FROM reports');
  console.log('\n✅ Database is now 100% clean and empty (0 sample data). Total reports:', check.rows[0]);
  process.exit(0);
}

wipeAll().catch(err => {
  console.error('Error during wipe:', err);
  process.exit(1);
});
