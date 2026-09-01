import { calculateDynamicPriority } from '../priority/priorityEngine.js';

console.log('🧪 Testing Scenario-Grounded Analysis for Electrical Grievances...');

// Test 1: Sparking Exposed Wire (High Hazard)
console.log('\n--- Test 1: Exposed Sparking Wire on Street ---');
const electricalReport1 = {
  id: 'rep_elec_wire_1',
  category: 'Electricity',
  description: 'Exposed live wire sparking continuously after storm wind snapped pole near street corner.',
  duration: 'A few hours',
  recurrence: 'First time',
  severity: 'Dangerous',
  is_risk_present: 1,
  created_at: new Date().toISOString()
};

const result1 = await calculateDynamicPriority({
  report: electricalReport1,
  location: { latitude: 19.0760, longitude: 72.8777 },
  candidateReports: [
    // Unrelated water reports in database
    { id: 'rep_w1', category: 'Water', description: 'Drain issue', latitude: 19.0760, longitude: 72.8777 },
    { id: 'rep_w2', category: 'Water', description: 'Puddle', latitude: 19.0760, longitude: 72.8777 },
  ]
});

console.log('Priority Score:', `${result1.score}/100 (${result1.bucket})`);
console.log('Domain Profile:', result1.domain_profile);
console.log('Effective Radius:', `${result1.radius.effective_radius_m}m`);
console.log('Factor Breakdown:', result1.factors);
console.log('Score Explanations:\n', result1.explanations.map(e => `  • ${e}`).join('\n'));

// Assertions for Test 1
if (result1.domain_profile !== 'ELECTRICITY_HAZARD') {
  throw new Error(`Expected ELECTRICITY_HAZARD domain profile, got ${result1.domain_profile}`);
}
if (result1.score < 80) {
  throw new Error(`Dangerous electrical wire must score >= 80 (CRITICAL), got ${result1.score}`);
}
const expText1 = result1.explanations.join(' ');
if (expText1.includes('Flood') || expText1.includes('Heavy Rainfall Warning')) {
  throw new Error('Electrical report must NOT hallucinate or overfeed flood warnings!');
}
if (expText1.includes('8 nearby')) {
  throw new Error('Must not count unrelated categories as electrical cluster!');
}
console.log('✓ Test 1: Critical electrical hazard correctly scored and explained without hallucinations!');

// Test 2: Local Power Cut / Outage (Non-dangerous, but disruptive)
console.log('\n--- Test 2: Power Cut / Outage in Residential Block ---');
const electricalReport2 = {
  id: 'rep_elec_outage_2',
  category: 'Electricity',
  description: 'Power cut in entire street lane for past 6 hours. No electricity in 20 residential homes.',
  duration: 'A few hours',
  recurrence: 'Frequently',
  severity: 'Moderate',
  is_risk_present: 0,
  created_at: new Date().toISOString()
};

const result2 = await calculateDynamicPriority({
  report: electricalReport2,
  location: { latitude: 19.0760, longitude: 72.8777 },
  candidateReports: []
});

console.log('Priority Score:', `${result2.score}/100 (${result2.bucket})`);
console.log('Domain Profile:', result2.domain_profile);
console.log('Score Explanations:\n', result2.explanations.map(e => `  • ${e}`).join('\n'));

const expText2 = result2.explanations.join(' ');
if (expText2.includes('Flood')) {
  throw new Error('Power cut must not mention flooding!');
}
if (!expText2.includes('Power') && !expText2.includes('Outage') && !expText2.includes('Grid') && !expText2.includes('Disruption') && !expText2.includes('Electricity')) {
  throw new Error('Power outage explanation must mention power disruption or electrical maintenance!');
}
console.log('✓ Test 2: Power outage correctly explained without canned templates!');

console.log('\n🎉 ALL SCENARIO-GROUNDED ELECTRICAL TESTS PASSED! 💯');
