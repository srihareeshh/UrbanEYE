import crypto from 'crypto';
import fs from 'fs';

/**
 * Computes a SHA-256 hash for media file or buffer
 */
export function computeMediaHash(filePathOrBuffer) {
  try {
    if (!filePathOrBuffer) return null;
    const hash = crypto.createHash('sha256');

    if (Buffer.isBuffer(filePathOrBuffer)) {
      hash.update(filePathOrBuffer);
      return hash.digest('hex');
    }

    if (typeof filePathOrBuffer === 'string') {
      if (fs.existsSync(filePathOrBuffer)) {
        const fileBuffer = fs.readFileSync(filePathOrBuffer);
        hash.update(fileBuffer);
        return hash.digest('hex');
      }
      // If it's a string identifier or URL
      hash.update(filePathOrBuffer);
      return hash.digest('hex');
    }

    return null;
  } catch (err) {
    console.warn('⚠️ Media hash computation error:', err.message);
    return null;
  }
}

/**
 * Generates an idempotency cache key for an analysis request
 */
export function generateAnalysisKey(reportId, mediaHash, analysisVersion = 'v1', modelName = 'gemini-3.1-flash-lite') {
  return `${reportId}:${mediaHash || 'nomedia'}:${analysisVersion}:${modelName}`;
}
