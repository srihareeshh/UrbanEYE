import { GeminiRequestManager } from '../ai/geminiRequestManager.js';
import { CircuitBreaker, CircuitState } from '../ai/circuitBreaker.js';
import { AIErrorCategory, AIJobStatus, normalizeAIError } from '../ai/types.js';
import { computeMediaHash, generateAnalysisKey } from '../ai/mediaHasher.js';

console.log('🧪 Starting Suite 1: Gemini Rate Limiter, Token Budget & Circuit Breaker Tests...');

// 1. Test Circuit Breaker State Machine
console.log('\n--- 1. Testing Circuit Breaker State Machine ---');
const cb = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 200 });
if (cb.state !== CircuitState.CLOSED) throw new Error('Circuit breaker should start in CLOSED state');
if (!cb.canExecute()) throw new Error('CLOSED circuit breaker must permit execution');

cb.recordFailure(true);
cb.recordFailure(true);
if (cb.state !== CircuitState.CLOSED) throw new Error('Should remain CLOSED before threshold');

cb.recordFailure(true); // 3rd failure -> OPEN
if (cb.state !== CircuitState.OPEN) throw new Error('Should transition to OPEN after 3 failures');
if (cb.canExecute()) throw new Error('OPEN circuit breaker must reject execution');

// Wait for cooldown
await new Promise(r => setTimeout(r, 220));
if (!cb.canExecute()) throw new Error('Should transition to HALF_OPEN after cooldown');
if (cb.state !== CircuitState.HALF_OPEN) throw new Error('State must be HALF_OPEN');

// Success in half-open resets to CLOSED
cb.recordSuccess();
if (cb.state !== CircuitState.CLOSED) throw new Error('Success in HALF_OPEN must reset to CLOSED');
console.log('✓ Circuit Breaker state transitions verified (CLOSED -> OPEN -> HALF-OPEN -> CLOSED)');

// 2. Test Media Hashing & Cache Key Generation
console.log('\n--- 2. Testing Media Hashing & Idempotency Cache Keys ---');
const bufferA = Buffer.from('image-pixel-data-a');
const bufferB = Buffer.from('image-pixel-data-b');
const hashA1 = computeMediaHash(bufferA);
const hashA2 = computeMediaHash(bufferA);
const hashB = computeMediaHash(bufferB);

if (hashA1 !== hashA2) throw new Error('Same buffer must generate identical SHA-256 hash');
if (hashA1 === hashB) throw new Error('Different buffers must generate different hashes');

const key1 = generateAnalysisKey('rep_123', hashA1, 'v1', 'gemini-3.1-flash-lite');
const key2 = generateAnalysisKey('rep_123', hashA1, 'v1', 'gemini-3.1-flash-lite');
const key3 = generateAnalysisKey('rep_123', hashA1, 'v2', 'gemini-3.1-flash-lite');

if (key1 !== key2) throw new Error('Identical report/media/model/version must yield identical key');
if (key1 === key3) throw new Error('Different analysis version must yield different key');
console.log('✓ Media hashing and idempotency keying verified');

// 3. Test Rate Limiter Inter-Request Spacing & Budgeting
console.log('\n--- 3. Testing Rate Limiter Inter-Request Spacing & Concurrency ---');
class MockAIProvider {
  constructor() {
    this.name = 'mock-gemini';
    this.callCount = 0;
  }
  getModelName() { return 'mock-gemini-3.1'; }
  async analyzeReport(ctx) {
    this.callCount += 1;
    await new Promise(r => setTimeout(r, 50));
    return {
      structuredOutput: {
        domain: 'water',
        issue_type: 'pothole',
        severity: 7,
        safety_risk: 8,
        health_risk: 4,
        urgency: 7,
        recommended_radius_m: 200,
        evidence_confidence: 0.95
      },
      tokens: { inputTokens: 500, outputTokens: 200, totalTokens: 700 },
      model: 'mock-gemini-3.1'
    };
  }
}

const mockProvider = new MockAIProvider();
const requestManager = new GeminiRequestManager({
  provider: mockProvider,
  circuitBreaker: new CircuitBreaker({ failureThreshold: 3, cooldownMs: 1000 })
});

// Configure rapid parameters for unit test
requestManager.rpmLimit = 60;
requestManager.tpmLimit = 100000;
requestManager.minRequestIntervalMs = 80;
requestManager.maxConcurrency = 1;

const res1 = await requestManager.enqueueAnalysis({
  report: { id: 'rep_test_1', category: 'Water' },
  location: { latitude: 19.07, longitude: 72.87 }
});

if (res1.status !== AIJobStatus.PENDING) throw new Error('First job should enqueue as PENDING');

// Wait for job 1 to complete
await new Promise(r => setTimeout(r, 180));
if (mockProvider.callCount !== 1) throw new Error(`Expected 1 provider call, got ${mockProvider.callCount}`);

// 4. Test Idempotency Cache Hit (No second call)
console.log('\n--- 4. Testing Idempotency Cache Hit ---');
const resCached = await requestManager.enqueueAnalysis({
  report: { id: 'rep_test_1', category: 'Water' },
  location: { latitude: 19.07, longitude: 72.87 }
});

if (!resCached.isCached) throw new Error('Identical job must return cached result');
if (mockProvider.callCount !== 1) throw new Error('Provider must NOT be called on cache hit');
console.log('✓ Idempotency cache hit verified (zero redundant token consumption)');

// 5. Test 429 Error Handling & Cooldown
console.log('\n--- 5. Testing 429 Rate Limit Cooldown ---');
class RateLimitedProvider {
  constructor() { this.name = 'rate-limited-gemini'; }
  getModelName() { return 'gemini-3.1-flash-lite'; }
  async analyzeReport() {
    const err = new Error('Resource exhausted (429): quota exceeded');
    err.status = 429;
    throw err;
  }
}

const rateLimitedManager = new GeminiRequestManager({
  provider: new RateLimitedProvider(),
  circuitBreaker: new CircuitBreaker({ failureThreshold: 2, cooldownMs: 500 })
});
rateLimitedManager.maxRetries = 1;
rateLimitedManager.initialBackoffMs = 50;

await rateLimitedManager.enqueueAnalysis({
  report: { id: 'rep_rate_limited', category: 'Roads' },
  location: { latitude: 19.07, longitude: 72.87 }
});

await new Promise(r => setTimeout(r, 200));
const metrics = rateLimitedManager.getMetrics();
if (!metrics.in_cooldown) throw new Error('429 rate limit must place manager into cooldown');
console.log('✓ 429 Rate Limit handling and queue pause cooldown verified');

console.log('\n🎉 ALL RATE LIMITER & CIRCUIT BREAKER TESTS PASSED! 💯');
