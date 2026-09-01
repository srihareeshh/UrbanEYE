import { GeminiRequestManager } from '../ai/geminiRequestManager.js';
import { CircuitBreaker } from '../ai/circuitBreaker.js';
import { AIJobStatus } from '../ai/types.js';
import { calculateDynamicPriority } from '../priority/priorityEngine.js';

console.log('🧪 Starting Suite 4: Burst Protection (20 Simultaneous) & High Load (100 Submissions) Tests...');

// -------------------------------------------------------------
// 1. 20-Report Simultaneous Burst Test
// -------------------------------------------------------------
console.log('\n--- 1. Testing 20 Simultaneous Report AI Analysis Burst ---');

class ControlledMockProvider {
  constructor() {
    this.name = 'burst-mock-gemini';
    this.activeCalls = 0;
    this.peakConcurrency = 0;
    this.completedCalls = 0;
    this.callTimestamps = [];
  }

  getModelName() { return 'gemini-3.1-flash-lite'; }

  async analyzeReport(ctx) {
    this.activeCalls += 1;
    if (this.activeCalls > this.peakConcurrency) {
      this.peakConcurrency = this.activeCalls;
    }
    this.callTimestamps.push(Date.now());

    // Artificial network latency
    await new Promise(r => setTimeout(r, 40));

    this.activeCalls -= 1;
    this.completedCalls += 1;

    return {
      structuredOutput: {
        domain: ctx.report.category?.toLowerCase() || 'water',
        issue_type: 'road_hazard',
        severity: 7,
        safety_risk: 7,
        health_risk: 5,
        urgency: 7,
        recommended_radius_m: 250,
        evidence_confidence: 0.9
      },
      tokens: { inputTokens: 400, outputTokens: 150, totalTokens: 550 },
      model: 'gemini-3.1-flash-lite'
    };
  }
}

const burstProvider = new ControlledMockProvider();
const burstManager = new GeminiRequestManager({
  provider: burstProvider,
  circuitBreaker: new CircuitBreaker({ failureThreshold: 5, cooldownMs: 1000 })
});

// Configure test limits: 1 concurrency lock, 50ms spacing
burstManager.maxConcurrency = 1;
burstManager.minRequestIntervalMs = 50;
burstManager.rpmLimit = 120;
burstManager.tpmLimit = 500000;

const burstPromises = [];
for (let i = 1; i <= 20; i++) {
  burstPromises.push(
    burstManager.enqueueAnalysis({
      report: {
        id: `rep_burst_${i}`,
        category: i % 2 === 0 ? 'Water' : 'Roads',
        description: `Burst test report #${i} submitted at same millisecond`,
        severity: i === 1 ? 'Dangerous' : 'Moderate',
        isRiskPresent: i === 1,
        created_at: new Date().toISOString()
      },
      location: { latitude: 19.076 + (i * 0.001), longitude: 72.877 + (i * 0.001) }
    })
  );
}

const burstResults = await Promise.all(burstPromises);

console.log(`✓ 20 reports enqueued simultaneously at ${new Date().toISOString()}`);
console.log(`Initial Queue Depth: ${burstManager.queue.length}`);

// Wait for all 20 jobs to process via the rate limiter
let maxWaitMs = 5000;
const startWait = Date.now();
while (burstProvider.completedCalls < 20 && (Date.now() - startWait) < maxWaitMs) {
  await new Promise(r => setTimeout(r, 60));
}

console.log(`✓ Completed calls: ${burstProvider.completedCalls}/20 in ${Date.now() - startWait}ms`);
console.log(`✓ Peak Concurrency observed: ${burstProvider.peakConcurrency}`);

if (burstProvider.peakConcurrency > 1) {
  throw new Error(`Concurrency violation! Max configured was 1, but peak concurrency was ${burstProvider.peakConcurrency}`);
}

if (burstProvider.completedCalls !== 20) {
  throw new Error(`Expected all 20 jobs to complete, but only ${burstProvider.completedCalls} completed`);
}

// Verify intervals between successive calls
for (let i = 1; i < burstProvider.callTimestamps.length; i++) {
  const interval = burstProvider.callTimestamps[i] - burstProvider.callTimestamps[i - 1];
  // Interval must respect minRequestIntervalMs
  if (interval < (burstManager.minRequestIntervalMs - 15)) { // Allow minor OS jitter
    throw new Error(`Inter-request spacing violated! Interval was ${interval}ms`);
  }
}
console.log('✓ 20-report simultaneous burst test successfully verified without bursting or provider overload!');

// -------------------------------------------------------------
// 2. 100-Report High Volume Simulation Test
// -------------------------------------------------------------
console.log('\n--- 2. Testing 100-Report High Volume Load & Deterministic Priority Engine Stability ---');

const startTime = Date.now();
let successfulScores = 0;
const generatedScores = [];

for (let i = 1; i <= 100; i++) {
  const isHighUrgency = i % 10 === 0;
  const dummyReport = {
    id: `rep_load_${i}`,
    category: ['Water', 'Roads', 'Electricity', 'Sanitation', 'Schools'][i % 5],
    description: `High load civic report #${i} regarding public infrastructure issue`,
    severity: isHighUrgency ? 'Dangerous' : (i % 3 === 0 ? 'Serious' : 'Moderate'),
    is_risk_present: isHighUrgency ? 1 : 0,
    created_at: new Date(Date.now() - (i * 3600000)).toISOString()
  };

  const dynamicRes = await calculateDynamicPriority({
    report: dummyReport,
    location: { latitude: 19.05 + (i * 0.001), longitude: 72.85 + (i * 0.001) },
    candidateReports: []
  });

  if (dynamicRes.score < 0 || dynamicRes.score > 100) {
    throw new Error(`Invalid priority score: ${dynamicRes.score}`);
  }
  if (!['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(dynamicRes.bucket)) {
    throw new Error(`Invalid priority bucket: ${dynamicRes.bucket}`);
  }

  generatedScores.push(dynamicRes.score);
  successfulScores++;
}

const elapsedMs = Date.now() - startTime;
console.log(`✓ Calculated 100 deterministic priority scores in ${elapsedMs}ms (${Math.round(100000 / elapsedMs)} ops/sec)`);
console.log(`✓ Average score: ${Math.round(generatedScores.reduce((a, b) => a + b, 0) / generatedScores.length)}/100`);
console.log(`✓ Min score: ${Math.min(...generatedScores)}/100, Max score: ${Math.max(...generatedScores)}/100`);

console.log('\n🎉 ALL BURST PROTECTION & 100-REPORT LOAD TESTS PASSED! 💯');
