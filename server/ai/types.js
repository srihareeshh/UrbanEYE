/**
 * Standardized AI Engine Enums & Error Categories
 */

export const AIErrorCategory = {
  AUTHENTICATION_ERROR: 'authentication_error',
  PERMISSION_ERROR: 'permission_error',
  MODEL_NOT_FOUND: 'model_not_found',
  INVALID_REQUEST: 'invalid_request',
  RATE_LIMITED: 'rate_limited',
  QUOTA_EXHAUSTED: 'quota_exhausted',
  TIMEOUT: 'timeout',
  SERVICE_UNAVAILABLE: 'service_unavailable',
  SERVER_ERROR: 'server_error',
  CIRCUIT_OPEN: 'circuit_open',
  UNKNOWN: 'unknown'
};

export const AIJobStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  RETRYING: 'retrying',
  FALLBACK: 'fallback'
};

export const AIJobPriority = {
  CRITICAL: 1,
  HIGH: 2,
  NORMAL: 3,
  BACKGROUND: 4
};

/**
 * Maps raw HTTP or SDK errors into normalized AIErrorCategory
 */
export function normalizeAIError(err) {
  if (!err) return { category: AIErrorCategory.UNKNOWN, message: 'Unknown error', retryable: false };

  const message = err.message || String(err);
  const status = err.status || err.statusCode || (err.response && err.response.status);

  if (status === 401 || message.includes('API_KEY_INVALID') || message.includes('apiKey') || message.includes('Unauthorized')) {
    return { category: AIErrorCategory.AUTHENTICATION_ERROR, status: 401, message, retryable: false };
  }

  if (status === 403 || message.includes('PERMISSION_DENIED')) {
    return { category: AIErrorCategory.PERMISSION_ERROR, status: 403, message, retryable: false };
  }

  if (status === 404 || message.includes('not found') || message.includes('is not supported')) {
    return { category: AIErrorCategory.MODEL_NOT_FOUND, status: 404, message, retryable: false };
  }

  if (status === 429 || message.includes('RESOURCE_EXHAUSTED') || message.includes('rate limit') || message.includes('quota')) {
    return { category: AIErrorCategory.RATE_LIMITED, status: 429, message, retryable: true };
  }

  if (status === 408 || message.includes('timeout') || message.includes('ETIMEDOUT') || message.includes('ESOCKETTIMEDOUT')) {
    return { category: AIErrorCategory.TIMEOUT, status: 408, message, retryable: true };
  }

  if (status === 500 || status === 502 || status === 503 || status === 504 || message.includes('Service Unavailable') || message.includes('Bad Gateway')) {
    return { category: AIErrorCategory.SERVICE_UNAVAILABLE, status: status || 503, message, retryable: true };
  }

  if (status === 400 || message.includes('INVALID_ARGUMENT')) {
    return { category: AIErrorCategory.INVALID_REQUEST, status: 400, message, retryable: false };
  }

  return { category: AIErrorCategory.UNKNOWN, status: status || 500, message, retryable: false };
}
