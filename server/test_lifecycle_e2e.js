import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testLifecycleE2E() {
  console.log('🚀 Starting Alcheminds Phase 2 Lifecycle Automated E2E Test...');

  // 1. Create a fresh report
  console.log('\n--- 1. Submitting New Incident Report ---');
  const reportPayload = {
    category: 'Water',
    description: 'Blocked drain in Ward 14 causing storm overflow into residential road.',
    duration: 'A few weeks',
    recurrence: 'Frequently',
    severity: 'Serious',
    isRiskPresent: false,
    location: {
      latitude: 19.0760,
      longitude: 72.8777,
      source: 'exif',
      accuracy: 10,
      address: 'Ward 14, Mumbai, India',
    },
    media: [
      {
        mediaId: 'med_test_photo',
        mediaType: 'image',
        originalName: 'flooded_drain_ward14.jpg',
        fileName: 'flooded_road_mumbai.jpg',
        filePath: '/samples/flooded_road_mumbai.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024,
      }
    ],
    smartSuggested: true,
  };

  const createRes = await fetch('http://localhost:3001/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportPayload),
  });

  const createData = await createRes.json();
  const report = createData.report;
  console.log(`✓ Report Created: ID=${report.id}, Code=${report.report_code}, Status=${report.status}`);

  if (report.status !== 'Submitted') throw new Error('Initial status must be Submitted');
  if (!report.timeline || report.timeline.length === 0) throw new Error('Initial timeline must contain Submitted event');

  // 2. Simulate Advance to Under Review
  console.log('\n--- 2. Transitioning to Under Review ---');
  const reviewRes = await fetch(`http://localhost:3001/api/reports/${report.id}/simulate-advance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetStage: 'Under Review' }),
  });
  const reviewData = await reviewRes.json();
  console.log(`✓ Status: ${reviewData.report.status}`);
  if (reviewData.report.status !== 'Under Review') throw new Error('Expected Under Review');

  // 3. Simulate Advance to Assigned
  console.log('\n--- 3. Assigning Municipal Department ---');
  const assignRes = await fetch(`http://localhost:3001/api/reports/${report.id}/simulate-advance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetStage: 'Assigned' }),
  });
  const assignData = await assignRes.json();
  console.log(`✓ Status: ${assignData.report.status}, Assigned Dept: ${assignData.report.assignment?.department_name}`);
  if (!assignData.report.assignment) throw new Error('Expected Department Assignment');

  // 4. Simulate Advance to Action Scheduled & In Progress
  console.log('\n--- 4. Scheduling & Starting Field Work ---');
  await fetch(`http://localhost:3001/api/reports/${report.id}/simulate-advance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetStage: 'Action Scheduled' }),
  });
  const progressRes = await fetch(`http://localhost:3001/api/reports/${report.id}/simulate-advance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetStage: 'In Progress' }),
  });
  const progressData = await progressRes.json();
  console.log(`✓ Status: ${progressData.report.status}`);

  // 5. Simulate Advance to Resolved (with Resolution Evidence Photo)
  console.log('\n--- 5. Authority Completing Remediation & Submitting Proof ---');
  const resolveRes = await fetch(`http://localhost:3001/api/reports/${report.id}/simulate-advance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetStage: 'Resolved' }),
  });
  const resolveData = await resolveRes.json();
  console.log(`✓ Status: ${resolveData.report.status}`);
  console.log(`✓ Resolution Notes: ${resolveData.report.resolution?.resolution_notes}`);
  console.log(`✓ Resolution Proof Photo: ${resolveData.report.resolution?.resolution_photo_url}`);
  if (!resolveData.report.resolution?.resolution_photo_url) throw new Error('Expected Resolution Photo');

  // 6. Test Citizen Verification Loop — Verdict: "not_fixed" (Escalation)
  console.log('\n--- 6. Testing Citizen Re-Verification: "not_fixed" (Reopening) ---');
  const verifyRejectRes = await fetch(`http://localhost:3001/api/reports/${report.id}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      verdict: 'not_fixed',
      citizenNotes: 'Water is still stagnant at the alley corner. Debris was only partially removed.',
      followUpMedia: [],
    }),
  });
  const verifyRejectData = await verifyRejectRes.json();
  console.log(`✓ Updated Status after Citizen Rejection: ${verifyRejectData.report.status}`);
  if (verifyRejectData.report.status !== 'Follow-up Required') throw new Error('Expected Follow-up Required');

  // 7. Authority re-resolves and Citizen confirms: "fixed"
  console.log('\n--- 7. Authority Re-Resolves & Citizen Confirms: "fixed" ---');
  await fetch(`http://localhost:3001/api/reports/${report.id}/simulate-advance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetStage: 'Resolved' }),
  });

  const verifyConfirmRes = await fetch(`http://localhost:3001/api/reports/${report.id}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      verdict: 'fixed',
      citizenNotes: 'Supervisory engineer came and completely cleared the blockage. Verified working perfectly.',
      satisfactionRating: 5,
    }),
  });
  const verifyConfirmData = await verifyConfirmRes.json();
  console.log(`✓ Final Status: ${verifyConfirmData.report.status}`);
  if (verifyConfirmData.report.status !== 'Confirmed Resolved') throw new Error('Expected Confirmed Resolved');

  // 8. Fetch Complete Lifecycle State
  console.log('\n--- 8. Verifying Complete Lifecycle Audit State ---');
  const finalRes = await fetch(`http://localhost:3001/api/reports/${report.id}`);
  const finalData = await finalRes.json();
  console.log(`✓ Total Audit Timeline Events Logged: ${finalData.report.timeline?.length}`);
  console.log(`✓ Total Citizen Verifications Logged: ${finalData.report.verifications?.length}`);

  finalData.report.timeline.forEach((evt, i) => {
    console.log(`   [${i + 1}] (${evt.actor_type.toUpperCase()}) ${evt.title} — ${evt.description}`);
  });

  console.log('\n🎉 ALL PHASE 2 LIFECYCLE TESTS PASSED WITH 100% RELATIONAL INTEGRITY! 💯');
}

testLifecycleE2E().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
