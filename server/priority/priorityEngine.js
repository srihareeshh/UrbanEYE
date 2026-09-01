import { calculateEffectiveRadius } from '../geo/radiusPolicy.js';
import { locationIntelligence } from '../geo/locationIntelligence.js';
import { evaluateReportCluster } from '../geo/clusterEngine.js';
import { weatherService } from '../services/weatherService.js';

export const PRIORITY_POLICY_VERSION = process.env.PRIORITY_POLICY_VERSION || 'v1.1';

/**
 * Domain-specific weight matrices (Must sum to 1.0)
 */
export const DOMAIN_WEIGHT_PROFILES = {
  ELECTRICITY_HAZARD: {
    safety: 0.30,
    location: 0.15,
    severity: 0.20,
    report_volume: 0.05,
    vulnerable_population: 0.10,
    weather: 0.05,
    time_open: 0.05,
    urgency_evidence: 0.10
  },
  FLOODING: {
    safety: 0.20,
    location: 0.10,
    severity: 0.15,
    report_volume: 0.15,
    vulnerable_population: 0.10,
    weather: 0.15,
    time_open: 0.10,
    urgency_evidence: 0.05
  },
  DRINKING_WATER_CONTAMINATION: {
    safety: 0.25,
    location: 0.10,
    severity: 0.15,
    report_volume: 0.10,
    vulnerable_population: 0.20,
    weather: 0.05,
    time_open: 0.05,
    urgency_evidence: 0.10
  },
  POTHOLE: {
    safety: 0.20,
    location: 0.15,
    severity: 0.20,
    report_volume: 0.15,
    vulnerable_population: 0.10,
    weather: 0.05,
    time_open: 0.10,
    urgency_evidence: 0.05
  },
  SANITATION_WASTE: {
    safety: 0.15,
    location: 0.15,
    severity: 0.15,
    report_volume: 0.15,
    vulnerable_population: 0.20,
    weather: 0.05,
    time_open: 0.10,
    urgency_evidence: 0.05
  },
  HEALTHCARE_ACCESS: {
    safety: 0.20,
    location: 0.20,
    severity: 0.15,
    report_volume: 0.10,
    vulnerable_population: 0.20,
    weather: 0.05,
    time_open: 0.05,
    urgency_evidence: 0.05
  },
  DEFAULT: {
    safety: 0.20,
    location: 0.15,
    severity: 0.15,
    report_volume: 0.10,
    vulnerable_population: 0.10,
    weather: 0.10,
    time_open: 0.10,
    urgency_evidence: 0.10
  }
};

/**
 * Maps category/issueType to appropriate Domain Weight Profile
 */
export function resolveDomainWeightProfile(category = '', issueType = '') {
  const norm = `${category}_${issueType}`.toUpperCase();

  if (norm.includes('ELECTR') || norm.includes('POWER') || norm.includes('WIRE') || norm.includes('VOLTAGE') || norm.includes('TRANSFORMER') || norm.includes('SPARK')) {
    return { name: 'ELECTRICITY_HAZARD', weights: DOMAIN_WEIGHT_PROFILES.ELECTRICITY_HAZARD };
  }
  if (norm.includes('FLOOD') || norm.includes('WATERLOGGING') || norm.includes('DRAIN')) {
    return { name: 'FLOODING', weights: DOMAIN_WEIGHT_PROFILES.FLOODING };
  }
  if (norm.includes('CONTAMINATION') || norm.includes('DRINKING_WATER') || norm.includes('POISON') || norm.includes('SEWER')) {
    return { name: 'DRINKING_WATER_CONTAMINATION', weights: DOMAIN_WEIGHT_PROFILES.DRINKING_WATER_CONTAMINATION };
  }
  if (norm.includes('POTHOLE') || norm.includes('ROAD') || norm.includes('CRACK') || norm.includes('BRIDGE')) {
    return { name: 'POTHOLE', weights: DOMAIN_WEIGHT_PROFILES.POTHOLE };
  }
  if (norm.includes('SANITATION') || norm.includes('GARBAGE') || norm.includes('WASTE') || norm.includes('TRASH')) {
    return { name: 'SANITATION_WASTE', weights: DOMAIN_WEIGHT_PROFILES.SANITATION_WASTE };
  }
  if (norm.includes('HEALTH') || norm.includes('HOSPITAL') || norm.includes('CLINIC')) {
    return { name: 'HEALTHCARE_ACCESS', weights: DOMAIN_WEIGHT_PROFILES.HEALTHCARE_ACCESS };
  }
  return { name: 'DEFAULT', weights: DOMAIN_WEIGHT_PROFILES.DEFAULT };
}

/**
 * Calculates Time Open / SLA Score (0 - 100)
 */
export function calculateTimeOpenScore(createdAt, slaHours = 48) {
  if (!createdAt) return 10;
  const createdTime = new Date(createdAt).getTime();
  const now = Date.now();
  const hoursOpen = Math.max(0, (now - createdTime) / (1000 * 60 * 60));

  const slaRatio = hoursOpen / Math.max(1, slaHours);

  if (slaRatio < 0.5) return Math.round(10 + (slaRatio * 40)); // 10 - 30
  if (slaRatio <= 1.0) return Math.round(30 + ((slaRatio - 0.5) * 80)); // 30 - 70
  if (slaRatio <= 2.0) return Math.round(70 + ((slaRatio - 1.0) * 20)); // 70 - 90
  return Math.min(100, Math.round(90 + (slaRatio - 2.0) * 5)); // 90 - 100
}

/**
 * Calculates Vulnerable Population Impact Score (0 - 100)
 */
export function calculateVulnerablePopulationScore({
  category = '',
  description = '',
  locationSensitivity = {},
  aiFactors = null
}) {
  let score = 20; // baseline
  const text = `${category} ${description}`.toLowerCase();

  // Keyword indicators
  if (text.includes('school') || text.includes('children') || text.includes('kids') || text.includes('student')) score += 35;
  if (text.includes('hospital') || text.includes('patient') || text.includes('clinic')) score += 30;
  if (text.includes('elderly') || text.includes('senior') || text.includes('wheelchair') || text.includes('disabled')) score += 25;
  if (text.includes('market') || text.includes('crowd') || text.includes('dense') || text.includes('residential')) score += 15;

  // Proximity bonus from sensitive landmarks
  if (locationSensitivity.isHighSensitivity) {
    score += 20;
  }

  // AI assessment of affected entities
  if (aiFactors && Array.isArray(aiFactors.affected_entities)) {
    if (aiFactors.affected_entities.some(e => ['children', 'elderly', 'patients', 'pedestrians'].includes(String(e).toLowerCase()))) {
      score += 15;
    }
  }

  return Math.min(100, Math.max(10, score));
}

/**
 * Calculates Urgency / Evidence Confidence Score (0 - 100)
 */
export function calculateUrgencyEvidenceScore({
  hasPhoto = false,
  locationSource = 'manual',
  aiConfidence = null,
  userRecurrence = ''
}) {
  let score = 30;

  if (hasPhoto) score += 30;
  if (locationSource === 'exif') score += 20;
  else if (locationSource === 'device') score += 15;

  if (aiConfidence !== null && aiConfidence !== undefined) {
    score += Math.round(Number(aiConfidence) * 20);
  } else {
    score += 10;
  }

  if (userRecurrence === 'Frequently' || userRecurrence === 'frequent' || userRecurrence === 'Almost always') {
    score += 10;
  }

  return Math.min(100, Math.max(10, score));
}

/**
 * Maps Priority Score to Response Bucket
 */
export function getPriorityBucket(score) {
  if (score >= 80) return { bucket: 'CRITICAL', response_target: 'Same-day response (< 12-24h)' };
  if (score >= 50) return { bucket: 'HIGH', response_target: '24–72 hours' };
  if (score >= 25) return { bucket: 'MEDIUM', response_target: '3–14 days' };
  return { bucket: 'LOW', response_target: 'Scheduled maintenance cycle' };
}

/**
 * Builds Scenario-Grounded Human-Readable Explanations for Score Factors
 */
export function generateScoreExplanation({
  category = '',
  description = '',
  factors,
  safetyFloorApplied,
  overrideApplied,
  overrideReason,
  topLandmark,
  sameCategoryCount = 0,
  weatherInfo = null,
  aiAnalysis = null
}) {
  const bullets = [];
  const text = `${category} ${description}`.toLowerCase();
  const isElectrical = category.toLowerCase().includes('electr') || text.includes('wire') || text.includes('shock') || text.includes('spark') || text.includes('voltage') || text.includes('power') || text.includes('transformer');
  const isWater = category.toLowerCase().includes('water') || text.includes('drain') || text.includes('flood') || text.includes('overflow') || text.includes('pipe');
  const isRoad = category.toLowerCase().includes('road') || text.includes('pothole') || text.includes('crack') || text.includes('bridge') || text.includes('traffic');
  const isSanitation = category.toLowerCase().includes('sanitation') || text.includes('garbage') || text.includes('waste') || text.includes('trash') || text.includes('dump');

  if (overrideApplied) {
    bullets.push(`Regulatory / Municipal Priority Override Active (${overrideReason || 'Administrative priority directive'})`);
  }

  if (safetyFloorApplied) {
    if (isElectrical) {
      bullets.push('Critical Safety Hazard Floor: High electrocution / fire hazard near public thoroughfare');
    } else {
      bullets.push('Critical Safety Hazard Floor Applied (Severe human safety or acute health risk)');
    }
  } else if (factors.safety >= 70) {
    if (isElectrical) {
      bullets.push(`Critical Electrical Safety Risk (${factors.safety}/100): Risk of electrocution, short-circuit, or power failure`);
    } else if (isWater) {
      bullets.push(`High Water Hazard (${factors.safety}/100): Risk of contamination or structural water damage`);
    } else if (isRoad) {
      bullets.push(`Severe Roadway Hazard (${factors.safety}/100): High collision or vehicle damage risk`);
    } else {
      bullets.push(`High Safety/Hazard Potential (${factors.safety}/100): Elevated risk to public safety`);
    }
  } else if (isElectrical && (text.includes('power cut') || text.includes('outage') || text.includes('blackout') || text.includes('no power'))) {
    bullets.push('Grid Outage: Power disruption affecting local residential / commercial activity');
  }

  if (topLandmark && factors.location >= 65) {
    bullets.push(`Critical Proximity to ${topLandmark.name} (${topLandmark.distanceM}m away)`);
  }

  // Only mention cluster volume if there are multiple reports of the SAME category
  if (sameCategoryCount >= 2) {
    bullets.push(`Cluster Concentration: ${sameCategoryCount} recurring ${category.toLowerCase()} reports recorded in local impact zone`);
  }

  // Only mention weather if weather is genuinely stormy / adverse AND relevant
  if (weatherInfo && weatherInfo.severe_weather && factors.weather >= 60) {
    bullets.push(`Adverse Weather Alert (${weatherInfo.condition_summary}): Storm/environmental conditions aggravating site risk`);
  } else if (isWater && weatherInfo && weatherInfo.is_raining && factors.weather >= 50) {
    bullets.push(`Rainfall Amplification: Active precipitation compounding local drainage load`);
  }

  if (factors.vulnerable_population >= 65) {
    bullets.push('Elevated Impact on Sensitive Zone (Nearby School, Hospital, or Dense Pedestrian Area)');
  }

  if (factors.time_open >= 75) {
    bullets.push('SLA Escalation: Grievance has exceeded standard resolution timeframe');
  }

  if (aiAnalysis && aiAnalysis.issue_type && aiAnalysis.status === 'completed') {
    bullets.push(`AI Diagnostic: Identified as ${aiAnalysis.issue_type.replace(/_/g, ' ')} with ${Math.round((aiAnalysis.evidence_confidence || 0.85) * 100)}% evidence confidence`);
  }

  if (bullets.length === 0) {
    bullets.push(`Routine ${category} maintenance assessment scheduled`);
  }

  return bullets;
}

/**
 * Master Deterministic Priority Engine
 */
export async function calculateDynamicPriority({
  report,
  location,
  candidateReports = [],
  aiAnalysis = null,
  override = null,
  slaHours = 48
}) {
  const category = report.category || 'Other';
  const description = report.description || '';
  const userSeverity = report.severity || 'Moderate';
  const isRiskPresent = Boolean(report.is_risk_present || report.isRiskPresent);

  // 1. Resolve Effective Radius
  const aiRecommendedRadius = aiAnalysis?.recommended_radius_m || aiAnalysis?.recommendedRadiusM || null;
  const radiusInfo = calculateEffectiveRadius(category, aiAnalysis?.issue_type, aiRecommendedRadius);

  // 2. Geographic Sensitivity
  const locationSensitivity = locationIntelligence.evaluateLocationSensitivity(
    location?.latitude,
    location?.longitude,
    radiusInfo.effective_radius_m * 2
  );

  // 3. Spatial Clustering & Volume (category-sensitive)
  const clusterInfo = evaluateReportCluster({
    targetReport: { ...report, latitude: location?.latitude, longitude: location?.longitude },
    candidateReports,
    effectiveRadiusM: radiusInfo.effective_radius_m
  });

  // 4. Weather Intelligence (grounded in category and coordinates)
  const weatherInfo = await weatherService.getContext(location?.latitude, location?.longitude, report.created_at, category);

  // 5. Individual Factor Calculations (0 - 100)
  // Factor 1: Safety Hazard
  let safetyScore = 20;
  const text = `${category} ${description}`.toLowerCase();
  const isHighDangerKeywords = text.includes('spark') || text.includes('wire') || text.includes('shock') || text.includes('fire') || text.includes('sinkhole') || text.includes('gas');

  if (isRiskPresent) safetyScore += 35;
  if (isHighDangerKeywords) safetyScore += 25;
  if (userSeverity === 'Dangerous') safetyScore += 35;
  else if (userSeverity === 'Serious') safetyScore += 20;
  else if (userSeverity === 'Moderate') safetyScore += 10;

  if (aiAnalysis) {
    const aiSafety = (Number(aiAnalysis.safety_risk) || 5) * 10;
    const aiHealth = (Number(aiAnalysis.health_risk) || 5) * 10;
    const maxAiRisk = Math.max(aiSafety, aiHealth);
    safetyScore = Math.round((safetyScore * 0.4) + (maxAiRisk * 0.6));
  }
  const safety_hazard_score = Math.min(100, Math.max(5, safetyScore));

  // Factor 2: Location Sensitivity
  const location_sensitivity_score = locationSensitivity.score;

  // Factor 3: Severity
  let baseSev = 30;
  if (userSeverity === 'Dangerous') baseSev = 90;
  else if (userSeverity === 'Serious') baseSev = 70;
  else if (userSeverity === 'Moderate') baseSev = 45;
  else if (userSeverity === 'Low') baseSev = 20;

  if (aiAnalysis?.severity) {
    const aiSev = Number(aiAnalysis.severity) * 10;
    baseSev = Math.round((baseSev * 0.5) + (aiSev * 0.5));
  }
  const severity_score = Math.min(100, Math.max(5, baseSev));

  // Factor 4: Report Volume
  const report_volume_score = clusterInfo.score;

  // Factor 5: Vulnerable Population
  const vulnerable_population_score = calculateVulnerablePopulationScore({
    category,
    description,
    locationSensitivity,
    aiFactors: aiAnalysis
  });

  // Factor 6: Weather
  const weather_score = weatherInfo.weather_score;

  // Factor 7: Time Open / SLA
  const time_open_score = calculateTimeOpenScore(report.created_at, slaHours);

  // Factor 8: Urgency & Evidence Confidence
  const urgency_evidence_score = calculateUrgencyEvidenceScore({
    hasPhoto: Boolean(report.photo_url || report.media_count > 0 || (report.media && report.media.length > 0)),
    locationSource: location?.location_source || location?.source || 'manual',
    aiConfidence: aiAnalysis?.evidence_confidence,
    userRecurrence: report.recurrence
  });

  // 6. Domain Weight Profile Resolution
  const domainProfile = resolveDomainWeightProfile(category, aiAnalysis?.issue_type);
  const weights = domainProfile.weights;

  // 7. Weighted Composite Score
  let weightedScore =
    (safety_hazard_score * weights.safety) +
    (location_sensitivity_score * weights.location) +
    (severity_score * weights.severity) +
    (report_volume_score * weights.report_volume) +
    (vulnerable_population_score * weights.vulnerable_population) +
    (weather_score * weights.weather) +
    (time_open_score * weights.time_open) +
    (urgency_evidence_score * weights.urgency_evidence);

  let finalScore = Math.round(weightedScore);

  // 8. Safety Floor Rule: If safety or health hazard >= 90 or exposed live wire/shock risk, enforce minimum 80 CRITICAL
  let safetyFloorApplied = false;
  const healthRisk = aiAnalysis?.health_risk ? Number(aiAnalysis.health_risk) * 10 : 0;
  if (safety_hazard_score >= 90 || healthRisk >= 90) {
    if (finalScore < 80) {
      finalScore = 80;
      safetyFloorApplied = true;
    }
  }

  // 9. Regulatory / Political Overrides (Authority Only)
  let overrideApplied = false;
  let overrideReason = null;
  if (override && override.override_enabled) {
    overrideApplied = true;
    overrideReason = override.override_reason || 'Administrative priority override';
    const floor = Number(override.override_priority_floor || 85);
    finalScore = Math.max(finalScore, floor);
  }

  finalScore = Math.min(100, Math.max(1, finalScore));
  const bucketInfo = getPriorityBucket(finalScore);

  const explanations = generateScoreExplanation({
    category,
    description,
    factors: {
      safety: safety_hazard_score,
      location: location_sensitivity_score,
      severity: severity_score,
      report_volume: report_volume_score,
      vulnerable_population: vulnerable_population_score,
      weather: weather_score,
      time_open: time_open_score,
      urgency_evidence: urgency_evidence_score
    },
    safetyFloorApplied,
    overrideApplied,
    overrideReason,
    topLandmark: locationSensitivity.topLandmark,
    sameCategoryCount: clusterInfo.sameCategoryCount,
    weatherInfo,
    aiAnalysis
  });

  return {
    score: finalScore,
    bucket: bucketInfo.bucket,
    response_target: bucketInfo.response_target,
    safety_floor_applied: safetyFloorApplied,
    override_applied: overrideApplied,
    policy_version: PRIORITY_POLICY_VERSION,
    domain_profile: domainProfile.name,
    weights,
    factors: {
      safety: safety_hazard_score,
      location: location_sensitivity_score,
      severity: severity_score,
      report_volume: report_volume_score,
      vulnerable_population: vulnerable_population_score,
      weather: weather_score,
      time_open: time_open_score,
      urgency_evidence: urgency_evidence_score
    },
    radius: {
      base_radius_m: radiusInfo.base_radius_m,
      ai_recommended_radius_m: aiRecommendedRadius,
      effective_radius_m: radiusInfo.effective_radius_m,
      minimum_radius_m: radiusInfo.minimum_radius_m,
      maximum_radius_m: radiusInfo.maximum_radius_m
    },
    cluster: {
      nearby_count: clusterInfo.nearbyCount,
      same_category_count: clusterInfo.sameCategoryCount,
      duplicate_count: clusterInfo.duplicateCount,
      cluster_density: clusterInfo.clusterDensity
    },
    weather: {
      condition: weatherInfo.condition_summary,
      weather_score: weather_score,
      is_severe: weatherInfo.severe_weather
    },
    override: overrideApplied ? { enabled: true, reason: overrideReason } : null,
    explanations
  };
}
