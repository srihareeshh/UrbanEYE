import {
  calculateDynamicPriority,
  getPriorityBucket,
  resolveDomainWeightProfile,
  calculateTimeOpenScore,
  PRIORITY_POLICY_VERSION
} from '../priority/priorityEngine.js';

console.log('🧪 Starting Suite 2: Deterministic Priority Scoring Engine Tests...');

// 1. Test Priority Buckets
console.log('\n--- 1. Testing Priority Bucket Boundaries ---');
if (getPriorityBucket(95).bucket !== 'CRITICAL') throw new Error('95 must be CRITICAL');
if (getPriorityBucket(80).bucket !== 'CRITICAL') throw new Error('80 must be CRITICAL');
if (getPriorityBucket(79).bucket !== 'HIGH') throw new Error('79 must be HIGH');
if (getPriorityBucket(50).bucket !== 'HIGH') throw new Error('50 must be HIGH');
if (getPriorityBucket(49).bucket !== 'MEDIUM') throw new Error('49 must be MEDIUM');
if (getPriorityBucket(25).bucket !== 'MEDIUM') throw new Error('25 must be MEDIUM');
if (getPriorityBucket(24).bucket !== 'LOW') throw new Error('24 must be LOW');
if (getPriorityBucket(0).bucket !== 'LOW') throw new Error('0 must be LOW');
console.log('✓ Priority bucket boundary thresholds verified');

// 2. Test Domain Weight Profiles
console.log('\n--- 2. Testing Domain Weight Profiles ---');
const floodProfile = resolveDomainWeightProfile('Water', 'localized_waterlogging');
if (floodProfile.name !== 'FLOODING' || floodProfile.weights.weather !== 0.15) {
  throw new Error('Flooding profile must prioritize weather at 15%');
}

const potholeProfile = resolveDomainWeightProfile('Roads', 'pothole');
if (potholeProfile.name !== 'POTHOLE' || potholeProfile.weights.severity !== 0.20) {
  throw new Error('Pothole profile must prioritize severity at 20%');
}

const waterContamProfile = resolveDomainWeightProfile('Water', 'drinking_water_contamination');
if (waterContamProfile.name !== 'DRINKING_WATER_CONTAMINATION' || waterContamProfile.weights.safety !== 0.25) {
  throw new Error('Drinking water contamination profile must prioritize safety at 25%');
}
console.log('✓ Domain weight profiles correctly resolved and validated');

// 3. Test SLA Escalation Curve
console.log('\n--- 3. Testing Time Open / SLA Escalation Curve ---');
const now = Date.now();
const oneHourAgo = new Date(now - 1 * 3600000).toISOString();
const twentyFourHoursAgo = new Date(now - 24 * 3600000).toISOString();
const seventyTwoHoursAgo = new Date(now - 72 * 3600000).toISOString();

const scoreNew = calculateTimeOpenScore(oneHourAgo, 48);
const scoreApproaching = calculateTimeOpenScore(twentyFourHoursAgo, 48);
const scoreBreached = calculateTimeOpenScore(seventyTwoHoursAgo, 48);

if (scoreNew >= scoreApproaching || scoreApproaching >= scoreBreached) {
  throw new Error('Time open score must strictly increase as SLA target approaches and breaches');
}
if (scoreBreached < 70) throw new Error('Breached SLA must score >= 70');
console.log(`✓ SLA curve validated: New (${scoreNew}) -> Approaching (${scoreApproaching}) -> Breached (${scoreBreached})`);

// 4. Test Safety Floor Rule
console.log('\n--- 4. Testing Critical Safety Floor Policy ---');
const hazardousReport = {
  id: 'rep_danger_wire',
  category: 'Electricity',
  description: 'Exposed high voltage sparking wire near school gate',
  severity: 'Dangerous',
  is_risk_present: 1,
  created_at: new Date().toISOString()
};

const resultHazard = await calculateDynamicPriority({
  report: hazardousReport,
  location: { latitude: 19.076, longitude: 72.877 },
  candidateReports: [], // isolated, 0 nearby reports
  aiAnalysis: {
    safety_risk: 10,
    health_risk: 9,
    severity: 9,
    recommended_radius_m: 150,
    evidence_confidence: 0.95
  }
});

if (resultHazard.score < 80) throw new Error(`Safety hazard score must apply floor >= 80, got ${resultHazard.score}`);
if (resultHazard.bucket !== 'CRITICAL') throw new Error('Severe hazard must be in CRITICAL bucket');
if (!resultHazard.safety_floor_applied) throw new Error('safety_floor_applied flag must be true');
console.log(`✓ Safety Floor rule verified: Score is ${resultHazard.score}/100 (${resultHazard.bucket})`);

// 5. Test Regulatory / Political Priority Override
console.log('\n--- 5. Testing Regulatory Override ---');
const normalReport = {
  id: 'rep_routine_park',
  category: 'Environment',
  description: 'Park bench paint peeling',
  severity: 'Low',
  is_risk_present: 0,
  created_at: new Date().toISOString()
};

const normalResult = await calculateDynamicPriority({
  report: normalReport,
  location: { latitude: 19.076, longitude: 72.877 },
  candidateReports: []
});

const overrideResult = await calculateDynamicPriority({
  report: normalReport,
  location: { latitude: 19.076, longitude: 72.877 },
  candidateReports: [],
  override: {
    override_enabled: true,
    override_type: 'vip_event',
    override_reason: 'National Dignitary Transit Corridor',
    override_priority_floor: 85
  }
});

if (normalResult.score >= 50) throw new Error('Routine report should score LOW/MEDIUM');
if (overrideResult.score < 85) throw new Error('Override floor must enforce minimum score 85');
if (overrideResult.bucket !== 'CRITICAL') throw new Error('Override to 85 must be CRITICAL');
console.log(`✓ Regulatory override verified: Base (${normalResult.score}) -> Overridden (${overrideResult.score})`);

// 6. Test Structured Explanations
console.log('\n--- 6. Testing Structured Score Explanations ---');
if (!resultHazard.explanations || resultHazard.explanations.length === 0) {
  throw new Error('Priority result must include human-readable explanations');
}
console.log('Sample Explanation Bullets:', resultHazard.explanations);

console.log('\n🎉 ALL DETERMINISTIC PRIORITY ENGINE TESTS PASSED! 💯');
