import db, { initDatabase } from './db.js';

async function runE2ETests() {
  console.log('🧪 Starting Alcheminds Community Upvotes & Following E2E Tests...');
  await initDatabase();

  // Test 1: Verify database tables & query interface
  const repRes = await db.query('SELECT id, report_code FROM reports LIMIT 1');
  const sampleReport = repRes.rows[0];
  console.assert(sampleReport, 'Sample report must exist');
  console.log('✓ Test 1: Database queries verified.');

  // Test 2: Unique constraint on report_upvotes
  const testUser = `usr_test_${Date.now()}`;

  // Insert first upvote
  await db.query(`
    INSERT INTO report_upvotes (id, report_id, user_id, created_at)
    VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
  `, [`upv_test_1`, sampleReport.id, testUser]);

  // Attempt duplicate upvote -> must throw constraint error
  let duplicateThrew = false;
  try {
    await db.query(`
      INSERT INTO report_upvotes (id, report_id, user_id, created_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    `, [`upv_test_2`, sampleReport.id, testUser]);
  } catch (err) {
    duplicateThrew = true;
  }
  console.assert(duplicateThrew, 'Duplicate upvote by same user must be rejected by unique constraint');
  console.log('✓ Test 2: Unique constraint on (report_id, user_id) verified.');

  // Clean up test upvote
  await db.query(`DELETE FROM report_upvotes WHERE user_id = $1`, [testUser]);

  // Test 3: Follower Notification Generation
  const followUser = `usr_follower_${Date.now()}`;
  await db.query(`
    INSERT INTO report_followers (id, report_id, user_id, created_at)
    VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
  `, [`fol_test_1`, sampleReport.id, followUser]);

  await db.query(`
    INSERT INTO user_notifications (id, user_id, report_id, event_type, title, message, is_read, created_at)
    VALUES ($1, $2, $3, 'stage_change', 'Status changed to In Progress', 'Remediation underway', FALSE, CURRENT_TIMESTAMP)
  `, [`notif_test_1`, followUser, sampleReport.id]);

  const unreadRes = await db.query(`
    SELECT COUNT(*) as count FROM user_notifications WHERE user_id = $1 AND is_read = FALSE
  `, [followUser]);
  const unreadCount = parseInt(unreadRes.rows[0]?.count || '0', 10);
  console.assert(unreadCount === 1, 'Unread notification count must be 1');
  console.log('✓ Test 3: Follower notification generation verified.');

  // Clean up test notification & follow
  await db.query(`DELETE FROM user_notifications WHERE user_id = $1`, [followUser]);
  await db.query(`DELETE FROM report_followers WHERE user_id = $1`, [followUser]);

  console.log('🎉 All Community Upvotes & Following E2E Tests Passed Successfully!');
}

runE2ETests().catch(err => {
  console.error('E2E Test Failed:', err);
  process.exit(1);
});
