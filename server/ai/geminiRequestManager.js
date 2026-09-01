import { GeminiProvider } from './geminiProvider.js';
import { CircuitBreaker, CircuitState } from './circuitBreaker.js';
import { computeMediaHash, generateAnalysisKey } from './mediaHasher.js';
import { AIErrorCategory, AIJobStatus, AIJobPriority, normalizeAIError } from './types.js';

export class GeminiRequestManager {
  constructor(options = {}) {
    this.provider = options.provider || new GeminiProvider();
    this.circuitBreaker = options.circuitBreaker || new CircuitBreaker();

    // Rate Limit Config
    this.rpmLimit = parseInt(process.env.GEMINI_RPM_LIMIT || '6', 10);
    this.tpmLimit = parseInt(process.env.GEMINI_TPM_LIMIT || '150000', 10);
    this.dailyRequestLimit = parseInt(process.env.GEMINI_DAILY_REQUEST_LIMIT || '1000', 10);
    this.dailyTokenLimit = parseInt(process.env.GEMINI_DAILY_TOKEN_LIMIT || '2000000', 10);
    this.maxConcurrency = parseInt(process.env.GEMINI_MAX_CONCURRENCY || '1', 10);
    this.minRequestIntervalMs = parseInt(process.env.GEMINI_MIN_REQUEST_INTERVAL_MS || '10000', 10);

    // Backoff Config
    this.maxRetries = parseInt(process.env.GEMINI_MAX_RETRIES || '4', 10);
    this.initialBackoffMs = parseInt(process.env.GEMINI_INITIAL_BACKOFF_MS || '2000', 10);
    this.maxBackoffMs = parseInt(process.env.GEMINI_MAX_BACKOFF_MS || '16000', 10);

    this.analysisVersion = process.env.AI_ANALYSIS_VERSION || 'v1';

    // State Tracking
    this.queue = [];
    this.activeRequests = 0;
    this.lastRequestTimestamp = 0;
    this.cooldownUntil = 0;

    // Rolling Windows (60 seconds)
    this.requestTimestamps = [];
    this.tokenHistory = []; // { timestamp, tokens }

    // Daily Counters
    this.dailyResetDate = new Date().toDateString();
    this.dailyRequestCount = 0;
    this.dailyTokenCount = 0;

    // In-memory idempotency cache & job tracker
    this.cache = new Map(); // key -> result
    this.activeJobKeys = new Map(); // key -> status ('pending'|'processing'|'completed'|'failed')

    this.isProcessingLoopActive = false;
    this.onJobCompletedCallbacks = new Set();
  }

  /**
   * Register listener for completed AI jobs
   */
  onJobCompleted(callback) {
    this.onJobCompletedCallbacks.add(callback);
    return () => this.onJobCompletedCallbacks.delete(callback);
  }

  /**
   * Resets daily counters if new calendar day has started
   */
  _checkDailyReset() {
    const today = new Date().toDateString();
    if (this.dailyResetDate !== today) {
      this.dailyResetDate = today;
      this.dailyRequestCount = 0;
      this.dailyTokenCount = 0;
    }
  }

  /**
   * Prunes rolling 60-second history windows
   */
  _pruneRollingWindows() {
    const now = Date.now();
    const windowStart = now - 60000;
    this.requestTimestamps = this.requestTimestamps.filter((t) => t > windowStart);
    this.tokenHistory = this.tokenHistory.filter((item) => item.timestamp > windowStart);
  }

  getRollingTokens() {
    this._pruneRollingWindows();
    return this.tokenHistory.reduce((sum, item) => sum + item.tokens, 0);
  }

  getRollingRPM() {
    this._pruneRollingWindows();
    return this.requestTimestamps.length;
  }

  /**
   * Checks if safe rate limits permit a dispatch right now
   */
  canDispatch() {
    const now = Date.now();
    this._checkDailyReset();
    this._pruneRollingWindows();

    // 1. Cooldown from 429 rate limit
    if (now < this.cooldownUntil) {
      return { allowed: false, reason: 'in_cooldown', waitMs: this.cooldownUntil - now };
    }

    // 2. Circuit Breaker
    if (!this.circuitBreaker.canExecute()) {
      return { allowed: false, reason: 'circuit_breaker_open', waitMs: 5000 };
    }

    // 3. Concurrency
    if (this.activeRequests >= this.maxConcurrency) {
      return { allowed: false, reason: 'concurrency_limit', waitMs: 500 };
    }

    // 4. Minimum Request Interval Spacing
    const timeSinceLast = now - this.lastRequestTimestamp;
    if (timeSinceLast < this.minRequestIntervalMs) {
      return { allowed: false, reason: 'interval_spacing', waitMs: this.minRequestIntervalMs - timeSinceLast };
    }

    // 5. Rolling RPM Limit
    if (this.requestTimestamps.length >= this.rpmLimit) {
      const oldest = this.requestTimestamps[0];
      const waitMs = Math.max(100, 60000 - (now - oldest));
      return { allowed: false, reason: 'rpm_limit', waitMs };
    }

    // 6. Rolling TPM Limit (estimate 1500 tokens per request)
    const rollingTokens = this.getRollingTokens();
    if (rollingTokens + 1500 > this.tpmLimit) {
      const oldestToken = this.tokenHistory[0]?.timestamp || now;
      const waitMs = Math.max(100, 60000 - (now - oldestToken));
      return { allowed: false, reason: 'tpm_limit', waitMs };
    }

    // 7. Daily Guards
    if (this.dailyRequestCount >= this.dailyRequestLimit) {
      return { allowed: false, reason: 'daily_request_limit', waitMs: 60000 };
    }

    if (this.dailyTokenCount >= this.dailyTokenLimit) {
      return { allowed: false, reason: 'daily_token_limit', waitMs: 60000 };
    }

    return { allowed: true, waitMs: 0 };
  }

  /**
   * Enqueues an AI analysis job
   */
  async enqueueAnalysis(jobPayload) {
    const { report, location, mediaPath, mimeType, priority = AIJobPriority.NORMAL, onResult = null } = jobPayload;
    const mediaHash = computeMediaHash(mediaPath);
    const cacheKey = generateAnalysisKey(report.id, mediaHash, this.analysisVersion, this.provider.getModelName());

    // 1. Idempotency Check: Already cached?
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (onResult) onResult(null, { ...cached, isCached: true });
      return { status: AIJobStatus.COMPLETED, isCached: true, result: cached };
    }

    // 2. Deduplication Check: Already pending or processing?
    if (this.activeJobKeys.has(cacheKey) && ['pending', 'processing', 'retrying'].includes(this.activeJobKeys.get(cacheKey))) {
      return { status: this.activeJobKeys.get(cacheKey), deduplicated: true };
    }

    const job = {
      id: `ai_job_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      reportId: report.id,
      cacheKey,
      mediaHash,
      priority,
      context: { report, location, mediaPath, mimeType },
      attempts: 0,
      status: AIJobStatus.PENDING,
      queuedAt: Date.now(),
      onResult
    };

    this.activeJobKeys.set(cacheKey, AIJobStatus.PENDING);

    // Insert sorted by priority (lowest numeric value = highest priority)
    const insertIdx = this.queue.findIndex((item) => item.priority > job.priority);
    if (insertIdx === -1) {
      this.queue.push(job);
    } else {
      this.queue.splice(insertIdx, 0, job);
    }

    this._triggerQueueProcessor();

    return { status: AIJobStatus.PENDING, jobId: job.id, queueDepth: this.queue.length };
  }

  /**
   * Internal queue processor loop
   */
  _triggerQueueProcessor() {
    if (this.isProcessingLoopActive) return;
    this.isProcessingLoopActive = true;

    const processNext = async () => {
      if (this.queue.length === 0) {
        this.isProcessingLoopActive = false;
        return;
      }

      const dispatchCheck = this.canDispatch();
      if (!dispatchCheck.allowed) {
        setTimeout(processNext, Math.max(250, dispatchCheck.waitMs));
        return;
      }

      // Dequeue highest priority job
      const job = this.queue.shift();
      if (!job) {
        this.isProcessingLoopActive = false;
        return;
      }

      this.activeRequests += 1;
      this.lastRequestTimestamp = Date.now();
      this.requestTimestamps.push(this.lastRequestTimestamp);
      this.dailyRequestCount += 1;
      job.status = AIJobStatus.PROCESSING;
      this.activeJobKeys.set(job.cacheKey, AIJobStatus.PROCESSING);

      try {
        job.attempts += 1;
        const result = await this.provider.analyzeReport(job.context);

        // Record metrics
        const totalTokens = result.tokens?.totalTokens || 1000;
        this.tokenHistory.push({ timestamp: Date.now(), tokens: totalTokens });
        this.dailyTokenCount += totalTokens;
        this.circuitBreaker.recordSuccess();

        job.status = AIJobStatus.COMPLETED;
        this.activeJobKeys.set(job.cacheKey, AIJobStatus.COMPLETED);
        this.cache.set(job.cacheKey, result);

        // Notify callbacks
        if (job.onResult) job.onResult(null, result);
        for (const cb of this.onJobCompletedCallbacks) {
          try {
            cb(job.reportId, result, null);
          } catch (cbErr) {
            console.error('Job completed callback error:', cbErr.message);
          }
        }
      } catch (err) {
        const normError = normalizeAIError(err);

        if (normError.category === AIErrorCategory.RATE_LIMITED) {
          // 429: Enter cooldown and pause queue
          this.cooldownUntil = Date.now() + 20000;
          this.circuitBreaker.recordFailure(true);
        } else if (normError.retryable) {
          this.circuitBreaker.recordFailure(true);
        } else {
          // Non-retryable error (e.g. invalid API key or bad prompt)
          this.circuitBreaker.recordFailure(false);
        }

        // Retry logic for transient errors
        if (normError.retryable && job.attempts < this.maxRetries) {
          job.status = AIJobStatus.RETRYING;
          this.activeJobKeys.set(job.cacheKey, AIJobStatus.RETRYING);

          // Calculate jittered exponential backoff
          const baseDelay = this.initialBackoffMs * Math.pow(2, job.attempts - 1);
          const jitter = Math.floor(Math.random() * 1000);
          const backoffDelay = Math.min(this.maxBackoffMs, baseDelay + jitter);

          setTimeout(() => {
            this.queue.unshift(job); // Re-queue at the front
            this._triggerQueueProcessor();
          }, backoffDelay);
        } else {
          job.status = AIJobStatus.FALLBACK;
          this.activeJobKeys.set(job.cacheKey, AIJobStatus.FALLBACK);

          if (job.onResult) job.onResult(normError, null);
          for (const cb of this.onJobCompletedCallbacks) {
            try {
              cb(job.reportId, null, normError);
            } catch (cbErr) {
              console.error('Job error callback error:', cbErr.message);
            }
          }
        }
      } finally {
        this.activeRequests = Math.max(0, this.activeRequests - 1);
        setTimeout(processNext, 100);
      }
    };

    processNext();
  }

  /**
   * Health and Observability Metrics (Zero sensitive secret leakage)
   */
  getMetrics() {
    this._checkDailyReset();
    this._pruneRollingWindows();

    return {
      provider: this.provider.name,
      model: this.provider.getModelName(),
      status: this.circuitBreaker.state === CircuitState.OPEN ? 'degraded' : 'healthy',
      queue_depth: this.queue.length,
      active_requests: this.activeRequests,
      requests_last_minute: this.requestTimestamps.length,
      estimated_tokens_last_minute: this.getRollingTokens(),
      daily_requests: this.dailyRequestCount,
      daily_tokens: this.dailyTokenCount,
      circuit_breaker: this.circuitBreaker.state,
      in_cooldown: Date.now() < this.cooldownUntil
    };
  }
}

// Global Singleton Instance
export const globalGeminiManager = new GeminiRequestManager();
