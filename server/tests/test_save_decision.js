import { db, initDatabase } from '../db.js';

async function test() {
  await initDatabase();
  const reports = await db.query('SELECT id FROM reports LIMIT 1');
  if (reports.rows.length === 0) {
    console.log('No reports found.');
    return;
  }
  const reportId = reports.rows[0].id;
  console.log('Testing decision update on report:', reportId);

  const decisionPayload = {
    status: 'overridden',
    action_decision: true,
    innovation_decision: true,
    override_reason: 'Testing official override rationale',
    reviewed_by: 'Test Officer',
    reviewed_at: new Date().toISOString()
  };

  const aiRes = await db.query(`SELECT id FROM report_ai_analysis WHERE report_id = $1 ORDER BY created_at DESC LIMIT 1`, [reportId]);
  if (aiRes.rows.length > 0) {
    await db.query(`
      UPDATE report_ai_analysis SET government_decision_json = $1 WHERE id = $2
    `, [JSON.stringify(decisionPayload), aiRes.rows[0].id]);
    console.log('Successfully updated AI analysis row with government decision!');
  } else {
    await db.query(`
      INSERT INTO report_ai_analysis (id, report_id, status, government_decision_json, created_at)
      VALUES ($1, $2, 'completed', $3, CURRENT_TIMESTAMP)
    `, ['ai_test_override', reportId, JSON.stringify(decisionPayload)]);
    console.log('Successfully inserted AI analysis row with government decision!');
  }

  // Verify fetch
  const verifyRes = await db.query(`SELECT * FROM report_ai_analysis WHERE report_id = $1 ORDER BY created_at DESC LIMIT 1`, [reportId]);
  console.log('Fetched government_decision_json:', verifyRes.rows[0]?.government_decision_json);
}

test().catch(console.error);
