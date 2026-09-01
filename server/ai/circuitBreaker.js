/**
 * Lightweight Circuit Breaker for External AI Services
 */

export const CircuitState = {
  CLOSED: 'closed',
  OPEN: 'open',
  HALF_OPEN: 'half_open'
};

export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || parseInt(process.env.GEMINI_CIRCUIT_BREAKER_FAILURE_THRESHOLD || '3', 10);
    this.cooldownMs = options.cooldownMs || parseInt(process.env.GEMINI_CIRCUIT_BREAKER_COOLDOWN_MS || '30000', 10);
    this.state = CircuitState.CLOSED;
    this.consecutiveFailures = 0;
    this.lastFailureTime = null;
    this.halfOpenProbePending = false;
  }

  canExecute() {
    const now = Date.now();

    if (this.state === CircuitState.CLOSED) {
      return true;
    }

    if (this.state === CircuitState.OPEN) {
      if (now - this.lastFailureTime > this.cooldownMs) {
        this.state = CircuitState.HALF_OPEN;
        this.halfOpenProbePending = false;
        return true;
      }
      return false;
    }

    if (this.state === CircuitState.HALF_OPEN) {
      // In half-open, only permit a single test request through
      if (!this.halfOpenProbePending) {
        this.halfOpenProbePending = true;
        return true;
      }
      return false;
    }

    return false;
  }

  recordSuccess() {
    this.consecutiveFailures = 0;
    this.lastFailureTime = null;
    this.halfOpenProbePending = false;
    this.state = CircuitState.CLOSED;
  }

  recordFailure(isTransient = true) {
    this.lastFailureTime = Date.now();
    this.consecutiveFailures += 1;
    this.halfOpenProbePending = false;

    if (this.state === CircuitState.HALF_OPEN || this.consecutiveFailures >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }

  getState() {
    return {
      state: this.state,
      consecutiveFailures: this.consecutiveFailures,
      lastFailureTime: this.lastFailureTime,
      cooldownMs: this.cooldownMs,
      failureThreshold: this.failureThreshold
    };
  }

  reset() {
    this.state = CircuitState.CLOSED;
    this.consecutiveFailures = 0;
    this.lastFailureTime = null;
    this.halfOpenProbePending = false;
  }
}
