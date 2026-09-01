import { calculateDynamicPriority, generateSeverityExplanation } from '../priority/priorityEngine.js';

console.log('🧪 Starting Suite 5: Multi-Domain Explainability (Severity + Priority + Factors + Escalation)...');

// -------------------------------------------------------------
// Test 1: Electrical Live Wire (Safety Escalation & Electrocution Rationale)
// -------------------------------------------------------------
console.log('\n--- 1. Testing Electrical Hazard Explainability ---');
const elecReport = {
  id: 'rep_test_elec',
  category: 'Electricity',
  description: 'Exposed live wiring sparking near bus stop sidewalk',
  duration: 'A few hours',
  recurrence: 'First time',
  severity: 'Dangerous',
  is_risk_present: 1,
  created_at: new Date().toISOString()
};

const elecRes = await calculateDynamicPriority({
  report: elecReport,
  location: { latitude: 19.076, longitude: 72.877 },
  candidateReports: []
});

console.log(`Score: ${elecRes.score}/100 (${elecRes.bucket}), Base Score: ${elecRes.base_score}, Severity: ${elecRes.severity_level}`);
console.log('Severity Explanations:', elecRes.severity_explanation);
console.log('Escalation Object:', elecRes.escalation);
console.log('Contributing Factors Count:', elecRes.contributing_factors.length);

if (elecRes.score < 80) throw new Error('Live wire must receive CRITICAL priority (>= 80)');
if (!elecRes.severity_explanation.some(r => r.toLowerCase().includes('electrocution') || r.toLowerCase().includes('hazard'))) {
  throw new Error('Electrical severity explanation must cite electrocution hazard');
}
if (!elecRes.escalation.applied) {
  throw new Error('Severe hazard must record escalation: applied = true');
}
console.log('✓ Electrical hazard severity & priority explanations verified');

// -------------------------------------------------------------
// Test 2: Pothole / Road Damage (Vehicle & Two-wheeler Hazard)
// -------------------------------------------------------------
console.log('\n--- 2. Testing Pothole & Road Hazard Explainability ---');
const potholeReport = {
  id: 'rep_test_pothole',
  category: 'Roads',
  description: 'Deep 2-foot road pothole along main junction',
  duration: 'A few weeks',
  recurrence: 'Frequently',
  severity: 'Serious',
  is_risk_present: 0,
  created_at: new Date().toISOString()
};

const potholeRes = await calculateDynamicPriority({
  report: potholeReport,
  location: { latitude: 19.076, longitude: 72.877 },
  candidateReports: []
});

console.log(`Score: ${potholeRes.score}/100 (${potholeRes.bucket}), Severity: ${potholeRes.severity_level}`);
console.log('Severity Explanations:', potholeRes.severity_explanation);

if (!potholeRes.severity_explanation.some(r => r.toLowerCase().includes('vehicle') || r.toLowerCase().includes('damage') || r.toLowerCase().includes('accident') || r.toLowerCase().includes('two-wheeler'))) {
  throw new Error('Pothole explanation must cite vehicular/accident hazard');
}
console.log('✓ Pothole severity explanation verified');

// -------------------------------------------------------------
// Test 3: Flooding / Drainage Blockage (Water Accumulation & Mobility)
// -------------------------------------------------------------
console.log('\n--- 3. Testing Flooding & Drainage Blockage Explainability ---');
const floodReport = {
  id: 'rep_test_flood',
  category: 'Water',
  description: 'Severe stormwater waterlogging blocking access road after rain',
  duration: 'A few days',
  recurrence: 'Frequently',
  severity: 'Serious',
  is_risk_present: 0,
  created_at: new Date().toISOString()
};

const floodRes = await calculateDynamicPriority({
  report: floodReport,
  location: { latitude: 19.076, longitude: 72.877 },
  candidateReports: []
});

console.log(`Score: ${floodRes.score}/100 (${floodRes.bucket}), Severity: ${floodRes.severity_level}`);
console.log('Severity Explanations:', floodRes.severity_explanation);

if (!floodRes.severity_explanation.some(r => r.toLowerCase().includes('water') || r.toLowerCase().includes('blocking') || r.toLowerCase().includes('accumulation'))) {
  throw new Error('Flooding explanation must cite water accumulation/roadway blockage');
}
console.log('✓ Flooding severity explanation verified');

// -------------------------------------------------------------
// Test 4: Drinking Water Contamination (Public Health & Pipe Backflow)
// -------------------------------------------------------------
console.log('\n--- 4. Testing Drinking Water Contamination Explainability ---');
const contamReport = {
  id: 'rep_test_contam',
  category: 'Water',
  description: 'Brown discolored sewage odor in municipal drinking water pipeline',
  duration: 'A few days',
  recurrence: 'First time',
  severity: 'Dangerous',
  is_risk_present: 1,
  created_at: new Date().toISOString()
};

const contamRes = await calculateDynamicPriority({
  report: contamReport,
  location: { latitude: 19.076, longitude: 72.877 },
  candidateReports: []
});

console.log(`Score: ${contamRes.score}/100 (${contamRes.bucket}), Severity: ${contamRes.severity_level}`);
console.log('Severity Explanations:', contamRes.severity_explanation);

if (!contamRes.severity_explanation.some(r => r.toLowerCase().includes('drinking water') || r.toLowerCase().includes('health') || r.toLowerCase().includes('contaminat'))) {
  throw new Error('Water contamination explanation must cite public health/drinking water');
}
console.log('✓ Water contamination severity explanation verified');

// -------------------------------------------------------------
// Test 5: Sanitation / Waste Dump (Odor & Waste Concerns)
// -------------------------------------------------------------
console.log('\n--- 5. Testing Sanitation / Solid Waste Dump Explainability ---');
const garbageReport = {
  id: 'rep_test_garbage',
  category: 'Sanitation',
  description: 'Uncollected garbage pile overflowing on residential corner for 4 days',
  duration: 'A few days',
  recurrence: 'Frequently',
  severity: 'Moderate',
  is_risk_present: 0,
  created_at: new Date().toISOString()
};

const garbageRes = await calculateDynamicPriority({
  report: garbageReport,
  location: { latitude: 19.076, longitude: 72.877 },
  candidateReports: []
});

console.log(`Score: ${garbageRes.score}/100 (${garbageRes.bucket}), Severity: ${garbageRes.severity_level}`);
console.log('Severity Explanations:', garbageRes.severity_explanation);

if (!garbageRes.severity_explanation.some(r => r.toLowerCase().includes('waste') || r.toLowerCase().includes('sanitation') || r.toLowerCase().includes('odor'))) {
  throw new Error('Garbage explanation must cite waste accumulation/sanitation concerns');
}
console.log('✓ Sanitation / garbage severity explanation verified');

// -------------------------------------------------------------
// Test 6: Factor Breakdown Mathematical Consistency
// -------------------------------------------------------------
console.log('\n--- 6. Testing Mathematical Consistency of Contributing Factors ---');
let manualSum = 0;
let totalWeight = 0;
for (const factor of elecRes.contributing_factors) {
  manualSum += factor.weighted_points;
  totalWeight += factor.weight;
}

if (Math.abs(totalWeight - 1.0) > 0.01) {
  throw new Error(`Total factor weights must equal 1.0, got ${totalWeight}`);
}
if (Math.abs(Math.round(manualSum) - elecRes.base_score) > 2) {
  throw new Error(`Sum of factor weighted points (${manualSum}) must match base_score (${elecRes.base_score})`);
}
console.log(`✓ Contributing factors math matches base_score: ${Math.round(manualSum)} == ${elecRes.base_score}`);

console.log('\n🎉 ALL MULTI-DOMAIN EXPLAINABILITY TESTS PASSED! 💯');
