const BASE_URL = 'http://localhost:3001';

async function run() {
  console.log('--- 1. Submitting New Citizen Report ---');
  const reportPayload = {
    category: 'Water Contamination',
    description: 'Severe heavy metal and silt backflow in main Ward 14 drinking canal.',
    duration: 'A few weeks',
    recurrence: 'Frequently',
    severity: 'Serious',
    isRiskPresent: false,
    riskDescription: '',
    location: {
      latitude: 12.9165,
      longitude: 79.1325,
      source: 'device',
      address: 'Ward 14 West, Brammapuram Canal',
      city: 'Vellore'
    },
    evidence: []
  };

  const createRes = await fetch(`${BASE_URL}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportPayload)
  });
  const createData = await createRes.json();
  const report = createData.report;
  console.log('Report Created:', report.report_code, 'ID:', report.id);
  const reportId = report.id;

  console.log('\n--- 2. Municipal Issues Routine Work Order (Path A) ---');
  const dispatchRes = await fetch(`${BASE_URL}/api/municipal/work-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reportId,
      departmentName: 'Water Supply & Sewerage Board',
      officerName: 'Eng. R. Shinde',
      targetHours: 24,
      priority: 'High',
      notes: 'Initial drain flushing and crew de-siltation dispatched.'
    })
  });
  const dispatchData = await dispatchRes.json();
  console.log('Work Order Result:', dispatchData);

  console.log('\n--- 3. Crew Uploads Remediation Evidence ---');
  const resolveRes = await fetch(`${BASE_URL}/api/municipal/resolve-dual-signoff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reportId,
      resolutionNotes: 'Culvert flushed and temporary filter barrier installed.',
      resolvedBy: 'Eng. R. Shinde',
      resolutionPhotoUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800'
    })
  });
  const resolveData = await resolveRes.json();
  console.log('Crew Resolution Result:', resolveData);

  console.log('\n--- 4. Citizen Confirms & Signs Off ---');
  const verifyRes = await fetch(`${BASE_URL}/api/reports/${reportId}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      verdict: 'fixed',
      notes: 'Water is clear now, but requires long-term filtration engineering.',
      rating: 5
    })
  });
  const verifyData = await verifyRes.json();
  console.log('Citizen Sign-off Result:', verifyData);

  console.log('\n--- 5. Municipal Escalates Recurring Structural Challenge to HEI (Path B) ---');
  const heiRes = await fetch(`${BASE_URL}/api/municipal/escalate-hei`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reportId,
      researchDomain: 'Hydrology, Biosand/Biochar Filtration & Canal Drainage',
      researchBrief: 'Design a self-cleaning sub-surface microfiltration system for high-silt urban canals.',
      departmentMatch: 'Environmental & Civil Engineering Dept',
      matchPercentage: 96
    })
  });
  const heiData = await heiRes.json();
  console.log('HEI Escalation Result:', heiData);

  console.log('\n--- 6. Verifying Parallel Dual Track in Individual Report ---');
  const singleRes = await fetch(`${BASE_URL}/api/reports/${reportId}`);
  const singleData = await singleRes.json();
  const rep = singleData.report;

  console.log('Report Status (Must NOT be downgraded/destroyed):', rep.status);
  console.log('Has Assignment (Routine Track Preserved):', !!rep.assignment);
  console.log('Has Resolution (Routine Proof Preserved):', !!rep.resolution);
  console.log('Has Verification (Citizen Sign-off Preserved):', rep.verifications.length > 0);
  console.log('Is Escalated to HEI:', rep.is_escalated_to_hei);
  console.log('HEI Challenge Title:', rep.hei_challenge?.title);
  console.log('HEI Project Stage:', rep.hei_project?.current_stage);
  console.log('HEI Project Milestones:', rep.hei_project?.milestones?.length);
  console.log('HEI Student Team:', rep.hei_project?.student_team?.map(s => `${s.name} (${s.hours}h)`).join(', '));

  if (rep.status === 'Confirmed Resolved' && rep.is_escalated_to_hei && rep.hei_project?.milestones?.length === 4) {
    console.log('\n✅ 100% E2E SUCCESS: Routine remediation preserved and parallel HEI track created successfully!');
  } else {
    console.error('\n❌ Verification check failed!');
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Error running test:', err);
  process.exit(1);
});
