/**
 * test_gemini_assessment_contract.js
 * Comprehensive contract and dual-branch independent decision verification for Gemini AI Assessment
 */

import assert from 'assert';
import { generateDeterministicAIAssessment } from '../ai/geminiProvider.js';

async function runAssessmentTests() {
  console.log('🧪 Starting Gemini AI Assessment Contract & Independence Verification Suite...\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
    }
  }

  // TEST 1: Schema Completeness
  test('Generated AI output adheres strictly to 10-point structured contract schema', () => {
    const res = generateDeterministicAIAssessment({
      report: {
        id: 'rep_test_01',
        category: 'Water',
        description: 'Persistent industrial toxic runoff detected near community reservoir.',
        severity: 'Dangerous',
        recurrence: 'Frequently',
        isRiskPresent: 1,
        created_at: new Date().toISOString()
      },
      location: { address: 'Industrial Area Zone 4, Chennai' }
    });

    assert.ok(typeof res.immediate_action_required === 'boolean', 'immediate_action_required must be boolean');
    assert.ok(['YES', 'NO', 'UNCERTAIN'].includes(res.immediate_action_decision), 'immediate_action_decision must be valid');
    assert.ok(typeof res.immediate_action_summary === 'string' && res.immediate_action_summary.length > 5, 'immediate_action_summary required');
    assert.ok(typeof res.immediate_action_reason === 'string' && res.immediate_action_reason.length > 5, 'immediate_action_reason required');

    assert.ok(typeof res.innovation_required === 'boolean', 'innovation_required must be boolean');
    assert.ok(['YES', 'NO', 'UNCERTAIN'].includes(res.innovation_decision), 'innovation_decision must be valid');
    assert.ok(typeof res.innovation_summary === 'string' && res.innovation_summary.length > 5, 'innovation_summary required');
    assert.ok(typeof res.innovation_reason === 'string' && res.innovation_reason.length > 5, 'innovation_reason required');

    assert.ok(Array.isArray(res.required_capabilities) && res.required_capabilities.length > 0, 'required_capabilities must be non-empty array');
    assert.ok(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(res.severity), 'severity level must be valid');
    assert.ok(typeof res.severity_reason === 'string' && res.severity_reason.length > 5, 'severity_reason must be non-empty string');
    assert.ok(Array.isArray(res.severity_explanation) && res.severity_explanation.length > 0, 'severity_explanation must be non-empty array');
    assert.ok(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(res.urgency), 'urgency level must be valid');
    assert.ok(typeof res.problem_statement === 'string' && res.problem_statement.length > 10, 'problem_statement required');
    assert.ok(['ADEQUATE', 'INSUFFICIENT', 'UNSUITABLE_LOCALLY', 'REPEATEDLY_FAILING', 'UNKNOWN'].includes(res.existing_solution_status), 'existing_solution_status valid');
    assert.ok(typeof res.confidence === 'number' && res.confidence >= 0 && res.confidence <= 1, 'confidence must be float 0-1');
  });

  // TEST 2: Scenario A - Immediate Action ONLY (Dangerous pothole near school, isolated)
  test('Scenario A: Immediate Action ONLY (Hazard present, conventional repair adequate, no innovation needed)', () => {
    const res = generateDeterministicAIAssessment({
      report: {
        id: 'rep_scen_a',
        category: 'Roads',
        description: 'Large deep pothole on Main Street outside St. Mary School causing two-wheelers to slip.',
        severity: 'Dangerous',
        recurrence: 'First time / Rare',
        isRiskPresent: 1,
        created_at: new Date().toISOString()
      },
      location: { address: 'School Road, Ward 12' }
    });

    assert.strictEqual(res.immediate_action_decision, 'YES', 'Should require immediate government action');
    assert.strictEqual(res.immediate_action_required, true);
    assert.strictEqual(res.innovation_decision, 'NO', 'Should NOT require university innovation for standard isolated pothole');
    assert.strictEqual(res.innovation_required, false);
    assert.strictEqual(res.existing_solution_status, 'ADEQUATE');
  });

  // TEST 3: Scenario B - Innovation ONLY (Recurring low-danger crop disease / soil salinity)
  test('Scenario B: Innovation ONLY (Recurring systemic challenge without immediate acute life hazard)', () => {
    const res = generateDeterministicAIAssessment({
      report: {
        id: 'rep_scen_b',
        category: 'Agriculture',
        description: 'Gradual crop blight and recurring soil salinity affecting paddy harvest across multiple seasons.',
        severity: 'Moderate',
        recurrence: 'Frequently',
        isRiskPresent: 0,
        created_at: new Date().toISOString()
      },
      location: { address: 'Agricultural Block 7' }
    });

    assert.strictEqual(res.immediate_action_decision, 'NO', 'Should NOT require emergency work order');
    assert.strictEqual(res.immediate_action_required, false);
    assert.strictEqual(res.innovation_decision, 'YES', 'Should require university R&D for recurring agricultural blight');
    assert.strictEqual(res.innovation_required, true);
    assert.strictEqual(res.existing_solution_status, 'REPEATEDLY_FAILING');
  });

  // TEST 4: Scenario C - BOTH Immediate Action AND Innovation (Severe Toxic Contamination)
  test('Scenario C: BOTH Immediate Action AND Innovation Pathway (Acute hazard + systemic recurring cause)', () => {
    const res = generateDeterministicAIAssessment({
      report: {
        id: 'rep_scen_c',
        category: 'Water',
        description: 'Dangerous chemical contamination and discolored water supply leaking into residential taps, recurring every monsoon.',
        severity: 'Dangerous',
        recurrence: 'Frequently',
        isRiskPresent: 1,
        created_at: new Date().toISOString()
      },
      location: { address: 'Sector 5 Residential' }
    });

    assert.strictEqual(res.immediate_action_decision, 'YES', 'Should require emergency supply shutoff & safe water dispatch');
    assert.strictEqual(res.immediate_action_required, true);
    assert.strictEqual(res.innovation_decision, 'YES', 'Should require academic R&D for advanced catchment filtration');
    assert.strictEqual(res.innovation_required, true);
  });

  // TEST 5: Scenario D - NEITHER Immediate Action NOR Innovation (Routine minor maintenance)
  test('Scenario D: Routine maintenance (Neither immediate action nor innovation required)', () => {
    const res = generateDeterministicAIAssessment({
      report: {
        id: 'rep_scen_d',
        category: 'Electricity',
        description: 'Single non-functional LED bulb on internal park pathway.',
        severity: 'Low',
        recurrence: 'First time / Rare',
        isRiskPresent: 0,
        created_at: new Date().toISOString()
      },
      location: { address: 'Community Park Ward 4' }
    });

    assert.strictEqual(res.immediate_action_decision, 'NO', 'Should NOT require emergency dispatch');
    assert.strictEqual(res.immediate_action_required, false);
    assert.strictEqual(res.innovation_decision, 'NO', 'Should NOT require academic innovation');
    assert.strictEqual(res.innovation_required, false);
    assert.strictEqual(res.existing_solution_status, 'ADEQUATE');
  });

  console.log(`\n========================================`);
  console.log(`Results: ${passed}/${total} tests passed.`);
  console.log(`========================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runAssessmentTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
