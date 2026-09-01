import { calculateDistanceKm } from '../hotspots.js';

/**
 * Computes lexical Jaccard similarity between two texts
 */
function computeTextSimilarity(textA = '', textB = '') {
  if (!textA || !textB) return 0;
  const wordsA = new Set(String(textA).toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(String(textB).toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(w => w.length > 2));

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }

  const union = new Set([...wordsA, ...wordsB]).size;
  return intersection / union;
}

/**
 * Evaluates Report Volume, Spatial Clustering, and Duplicate Likelihood with category sensitivity
 */
export function evaluateReportCluster({
  targetReport,
  candidateReports = [],
  effectiveRadiusM = 250
}) {
  if (!targetReport || !targetReport.latitude || !targetReport.longitude) {
    return {
      score: 15,
      nearbyCount: 0,
      sameCategoryCount: 0,
      duplicateCount: 0,
      duplicates: [],
      clusterDensity: 'isolated'
    };
  }

  const targetLat = Number(targetReport.latitude);
  const targetLng = Number(targetReport.longitude);
  const targetCreatedAt = new Date(targetReport.created_at || Date.now()).getTime();
  const radiusKm = effectiveRadiusM / 1000;
  const targetCategory = String(targetReport.category || '').toLowerCase();

  const nearby = [];
  const sameCategoryList = [];
  const duplicates = [];
  let aggregateVolumeWeight = 0;

  for (const candidate of candidateReports) {
    if (candidate.id === targetReport.id) continue;
    if (!candidate.latitude || !candidate.longitude) continue;

    const distKm = calculateDistanceKm(targetLat, targetLng, Number(candidate.latitude), Number(candidate.longitude));

    if (distKm <= radiusKm) {
      const distM = Math.round(distKm * 1000);
      const candCreatedAt = new Date(candidate.created_at || Date.now()).getTime();
      const daysDiff = Math.max(0, (targetCreatedAt - candCreatedAt) / (1000 * 60 * 60 * 24));

      // Recency attenuation: recent reports contribute up to 1.0; older decays
      const recencyWeight = Math.max(0.1, 1.0 - (daysDiff / 45));

      // Strict Category Matching
      const candCategory = String(candidate.category || '').toLowerCase();
      const isSameCategory = candCategory === targetCategory;
      const textSim = computeTextSimilarity(targetReport.description, candidate.description);

      // Only same category (or high text similarity) contributes significantly to cluster density
      const categoryMultiplier = isSameCategory ? 1.0 : (textSim > 0.4 ? 0.4 : 0.05);
      const distanceWeight = Math.exp(-distM / Math.max(25, effectiveRadiusM));

      const contribution = distanceWeight * categoryMultiplier * recencyWeight * 20;
      aggregateVolumeWeight += contribution;

      const isDuplicateCandidate = isSameCategory && (distM <= Math.max(20, effectiveRadiusM * 0.25)) && (textSim > 0.45 || distM <= 15);

      const matchInfo = {
        id: candidate.id,
        report_code: candidate.report_code,
        category: candidate.category,
        distanceM: distM,
        similarity: Math.round(textSim * 100) / 100,
        isSameCategory,
        isDuplicate: isDuplicateCandidate
      };

      nearby.push(matchInfo);
      if (isSameCategory) {
        sameCategoryList.push(matchInfo);
      }
      if (isDuplicateCandidate) {
        duplicates.push(matchInfo);
      }
    }
  }

  // Base score 10 + category-grounded volume contributions (capped at 100)
  const finalVolumeScore = Math.min(100, Math.round(10 + aggregateVolumeWeight));

  let clusterDensity = 'isolated';
  if (sameCategoryList.length >= 5 || finalVolumeScore >= 75) clusterDensity = 'critical_hotspot';
  else if (sameCategoryList.length >= 2 || finalVolumeScore >= 45) clusterDensity = 'high_concentration';
  else if (sameCategoryList.length >= 1) clusterDensity = 'cluster';

  return {
    score: finalVolumeScore,
    nearbyCount: nearby.length,
    sameCategoryCount: sameCategoryList.length,
    duplicateCount: duplicates.length,
    duplicates,
    nearbyList: nearby.slice(0, 10),
    sameCategoryList: sameCategoryList.slice(0, 10),
    clusterDensity
  };
}
