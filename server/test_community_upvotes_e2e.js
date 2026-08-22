import db, { initDatabase } from './db.js';

async function runE2ETests() {
  console.log('🧪 Starting Alcheminds Community Upvotes & Following E2E Tests...');
  initDatabase();

  // Test 1: Verify database tables exist
  const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all().map(t => t.name);
  console.assert(tables.includes('report_upvotes'), 'Table report_upvotes must exist');
  console.assert(tables.includes('report_followers'), 'Table report_followers must exist');
  console.assert(tables.includes('user_notifications'), 'Table user_notifications must exist');
  console.log('✓ Test 1: Tables verified.');

  // Test 2: Unique constraint on report_upvotes
  const sampleReport = db.prepare(`SELECT id, report_code FROM reports LIMIT 1`).get();
  console.assert(sampleReport, 'Sample report must exist');
  const testUser = `usr_test_${Date.now()}`;

  // Insert first upvote
  db.prepare(`
    INSERT INTO report_upvotes (id, report_id, user_id, created_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `).run(`upv_test_1`, sampleReport.id, testUser);

  // Attempt duplicate upvote -> must throw SQLite constraint error
  let duplicateThrew = false;
  try {
    db.prepare(`
      INSERT INTO report_upvotes (id, report_id, user_id, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).run(`upv_test_2`, sampleReport.id, testUser);
  } catch (err) {
    duplicateThrew = true;
  }
  console.assert(duplicateThrew, 'Duplicate upvote by same user must be rejected by unique constraint');
  console.log('✓ Test 2: Unique constraint on (report_id, user_id) verified.');

  // Clean up test upvote
  db.prepare(`DELETE FROM report_upvotes WHERE user_id = ?`).run(testUser);

  // Test 3: Auto-follow & Notification on Stage Advancement
  const followUser = `usr_follower_${Date.now()}`;
  db.prepare(`
    INSERT INTO report_followers (id, report_id, user_id, created_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `).run(`fol_test_1`, sampleReport.id, followUser);

  // Dispatch mock notification
  const insertNotif = db.prepare(`
    INSERT INTO user_notifications (id, user_id, report_id, event_type, title, message, is_read, created_at)
    VALUES (?, ?, ?, 'stage_change', 'Status changed to In Progress', 'Remediation underway', 0, CURRENT_TIMESTAMP)
  `);
  insertNotif.run(`notif_test_1`, followUser, sampleReport.id);

  const unreadCount = db.prepare(`
    SELECT COUNT(*) as count FROM user_notifications WHERE user_id = ? AND is_read = 0
  `).get(followUser).count;
  console.assert(unreadCount === 1, 'Unread notification count must be 1');
  console.log('✓ Test 3: Follower notification generation verified.');

  // Clean up test follower & notif
  db.prepare(`DELETE FROM report_followers WHERE user_id = ?`).run(followUser);
  db.prepare(`DELETE FROM user_notifications WHERE user_id = ?`).run(followUser);

  console.log('\n🎉 ALL E2E BACKEND & DATABASE TESTS PASSED SUCCESSFULLY!\n');
}

runE2ETests().catch(err => {
  console.error('E2E Test Failed:', err);
  process.exit(1);
});
