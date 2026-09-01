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
  if (score >= 80) return { bucket: 'CRITICAL', response_target: 'Same-day response (< 12–24h)' };
  if (score >= 50) return { bucket: 'HIGH', response_target: '24–72 hours' };
  if (score >= 25) return { bucket: 'MEDIUM', response_target: '3–14 days' };
  return { bucket: 'LOW', response_target: 'Scheduled maintenance cycle' };
}

/**
 * Generates Scenario-Grounded Severity Explanations ("Why this severity?")
 */
export function generateSeverityExplanation({
  category = '',
  description = '',
  severityLevel = 'Moderate',
  aiAnalysis = null,
  isRiskPresent = false
}) {
  const reasons = [];
  const text = `${category} ${description}`.toLowerCase();
  const sevUpper = String(severityLevel || 'MODERATE').toUpperCase();

  // 1. If AI structured analysis provided custom severity explanations, use them directly
  if (aiAnalysis && Array.isArray(aiAnalysis.severity_explanation) && aiAnalysis.severity_explanation.length > 0) {
    aiAnalysis.severity_explanation.forEach(se => {
      const clean = String(se).trim();
      if (clean && !reasons.includes(clean)) {
        reasons.push(clean.charAt(0).toUpperCase() + clean.slice(1));
      }
    });
  }

  // 1B. If AI structured analysis provided risk factors, append them
  if (aiAnalysis && Array.isArray(aiAnalysis.risk_factors) && aiAnalysis.risk_factors.length > 0) {
    aiAnalysis.risk_factors.slice(0, 3).forEach(rf => {
      const clean = String(rf).trim();
      if (clean && !reasons.includes(clean)) {
        reasons.push(clean.charAt(0).toUpperCase() + clean.slice(1));
      }
    });
  }

  // 2. Domain-Specific Severity Fallback Rules if AI list is empty
  if (reasons.length === 0) {
    const isElec = category.toLowerCase().includes('electr') || text.includes('wire') || text.includes('spark') || text.includes('transformer') || text.includes('voltage');
    const isWater = category.toLowerCase().includes('water') || text.includes('flood') || text.includes('drain') || text.includes('pipe') || text.includes('sewage');
    const isRoad = category.toLowerCase().includes('road') || text.includes('pothole') || text.includes('crack') || text.includes('bridge') || text.includes('traffic');
    const isSanitation = category.toLowerCase().includes('sanit') || text.includes('garbage') || text.includes('waste') || text.includes('trash') || text.includes('dump');
    const isHealth = category.toLowerCase().includes('health') || text.includes('hospital') || text.includes('clinic') || text.includes('disease');
    const isLight = category.toLowerCase().includes('light') || text.includes('streetlight') || text.includes('dark');

    if (isElec) {
      if (sevUpper === 'CRITICAL' || sevUpper === 'DANGEROUS' || isRiskPresent) {
        reasons.push('Exposed electrical components present an immediate electrocution and fire hazard.');
        reasons.push('The hazard is directly accessible to passing pedestrians and local residents.');
        reasons.push('Uninsulated active current requires urgent power isolation and repair.');
      } else {
        reasons.push('Power disruption affects local household and commercial activity.');
        reasons.push('Electrical fault requires scheduled lineman diagnosis.');
      }
    } else if (isRoad) {
      if (sevUpper === 'CRITICAL' || sevUpper === 'DANGEROUS' || sevUpper === 'HIGH' || sevUpper === 'SERIOUS') {
        reasons.push('Deep road damage may cause vehicle accidents, particularly for two-wheelers.');
        reasons.push('Located on a high-speed or active public transit corridor.');
      } else {
        reasons.push('Surface wear and minor potholes create uneven driving conditions.');
        reasons.push('Requires inclusion in routine asphalt patching cycle.');
      }
    } else if (isWater) {
      if (text.includes('contaminat') || text.includes('drinking') || text.includes('smell') || text.includes('poison')) {
        reasons.push('Potential contamination of drinking water can affect public health across the community.');
        reasons.push('Piped supply backflow poses acute risks to children and vulnerable residents.');
      } else if (sevUpper === 'CRITICAL' || sevUpper === 'DANGEROUS' || text.includes('flood') || text.includes('waterlog')) {
        reasons.push('Significant water accumulation is blocking the roadway and creates safety and mobility risks.');
        reasons.push('Stagnant stormwater risks vector breeding and foundation water seepage.');
      } else {
        reasons.push('Minor water leak or slow drainage creates inconvenience in local lane.');
        reasons.push('Scheduled drain clearing and valve maintenance required.');
      }
    } else if (isSanitation) {
      if (sevUpper === 'CRITICAL' || sevUpper === 'DANGEROUS' || text.includes('biohazard') || text.includes('medical')) {
        reasons.push('Hazardous or medical waste accumulation poses acute contamination risks.');
      } else {
        reasons.push('Accumulated solid waste creates sanitation concerns but no immediate severe hazard is detected.');
        reasons.push('Odor and street aesthetic degradation in residential vicinity.');
      }
    } else if (isHealth) {
      reasons.push('Direct risk to public health and sanitization standards in community zone.');
    } else if (isLight) {
      reasons.push('Reduced visibility on street increases pedestrian tripping and vehicle safety risks.');
      reasons.push('Dark road corridor elevates localized night security concerns.');
    } else {
      reasons.push(`Incident severity reflects reported ${sevUpper.toLowerCase()} structural impact.`);
      reasons.push('Physical condition requires municipal inspection and remedial action.');
    }
  }

  return reasons;
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
    bullets.push({
      icon: '🚨',
      tag: 'REGULATORY OVERRIDE',
      title: 'Administrative Priority Directive Active',
      text: overrideReason || 'Authorized authority directive applied a mandatory priority floor.'
    });
  }

  if (safetyFloorApplied) {
    if (isElectrical) {
      bullets.push({
        icon: '⚠️',
        tag: 'CRITICAL HAZARD ESCALATION',
        title: 'Emergency Life-Safety Floor Triggered',
        text: 'The safety risk crossed the critical threshold (safety risk >= 90), triggering the emergency priority policy for electrocution / fire danger.'
      });
    } else {
      bullets.push({
        icon: '⚠️',
        tag: 'CRITICAL HAZARD ESCALATION',
        title: 'Emergency Life-Safety Floor Triggered',
        text: 'The safety risk crossed the critical threshold, triggering the emergency priority policy.'
      });
    }
  } else if (factors.safety >= 70) {
    if (isElectrical) {
      bullets.push({
        icon: '⚡',
        tag: 'SAFETY HAZARD',
        title: 'High Electrical Danger Potential',
        text: `Safety score ${factors.safety}/100: Elevated risk of electrocution, short-circuit, or power infrastructure failure.`
      });
    } else if (isWater) {
      bullets.push({
        icon: '💧',
        tag: 'SAFETY HAZARD',
        title: 'High Hydrological Risk',
        text: `Safety score ${factors.safety}/100: Risk of water contamination or road foundation damage.`
      });
    } else if (isRoad) {
      bullets.push({
        icon: '🚗',
        tag: 'SAFETY HAZARD',
        title: 'Severe Roadway Danger',
        text: `Safety score ${factors.safety}/100: High vehicle collision or two-wheeler skidding risk.`
      });
    } else {
      bullets.push({
        icon: '⚠️',
        tag: 'SAFETY HAZARD',
        title: 'Elevated Safety Hazard',
        text: `Safety score ${factors.safety}/100: Direct risk of physical injury or property damage.`
      });
    }
  } else if (isElectrical && (text.includes('power cut') || text.includes('outage') || text.includes('blackout') || text.includes('no power'))) {
    bullets.push({
      icon: '🔌',
      tag: 'GRID DISRUPTION',
      title: 'Localized Power Outage',
      text: 'Power supply interruption affecting local residents and commercial facilities.'
    });
  }

  if (topLandmark && factors.location >= 65) {
    bullets.push({
      icon: '📍',
      tag: 'LOCATION SENSITIVITY',
      title: `Critical Proximity to ${topLandmark.name}`,
      text: `Located ${topLandmark.distanceM}m away from a sensitive public landmark / transit facility.`
    });
  }

  // Only mention cluster volume if there are multiple reports of the SAME category
  if (sameCategoryCount >= 2) {
    bullets.push({
      icon: '🔄',
      tag: 'CLUSTER RECURRENCE',
      title: `${sameCategoryCount} Similar Community Reports`,
      text: `Cluster density identified: ${sameCategoryCount} recurring ${category.toLowerCase()} grievances recorded in the effective impact zone.`
    });
  }

  // Only mention weather if weather is genuinely stormy / adverse AND relevant
  if (weatherInfo && weatherInfo.severe_weather && factors.weather >= 60) {
    bullets.push({
      icon: '🌧',
      tag: 'WEATHER AMPLIFICATION',
      title: `Adverse Weather (${weatherInfo.condition_summary})`,
      text: 'Active severe weather conditions are compounding the severity and urgency of this issue.'
    });
  } else if (isWater && weatherInfo && weatherInfo.is_raining && factors.weather >= 50) {
    bullets.push({
      icon: '🌧',
      tag: 'WEATHER AMPLIFICATION',
      title: 'Rainfall Load Amplification',
      text: 'Active precipitation is compounding local drainage load and surface water accumulation.'
    });
  }

  if (factors.vulnerable_population >= 65) {
    bullets.push({
      icon: '👥',
      tag: 'VULNERABLE POPULATION',
      title: 'Elevated Impact on Sensitive Groups',
      text: 'The affected area impacts schools, children, elderly residents, or healthcare facilities.'
    });
  }

  if (factors.time_open >= 75) {
    bullets.push({
      icon: '⏱',
      tag: 'SLA ESCALATION',
      title: 'Resolution SLA Overdue',
      text: 'This grievance has exceeded the standard municipal triage turnaround target.'
    });
  } else if (factors.urgency_evidence >= 75) {
    bullets.push({
      icon: '⏱',
      tag: 'URGENCY & EVIDENCE',
      title: 'High Verification Urgency',
      text: 'Verified evidence and incident characteristics indicate urgent municipal intervention is recommended.'
    });
  }

  if (bullets.length === 0) {
    bullets.push({
      icon: '📋',
      tag: 'ROUTINE CIVIC TRIAGE',
      title: 'Standard Civic Maintenance Priority',
      text: `Assigned standard triage turnaround in the regular ${category} municipal work cycle.`
    });
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
  const isHighDangerKeywords = text.includes('spark') || text.includes('wire') || text.includes('shock') || text.includes('fire') || text.includes('sinkhole') || text.includes('gas') || text.includes('collapse') || text.includes('burst');

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
  const rawWeightedScore =
    (safety_hazard_score * weights.safety) +
    (location_sensitivity_score * weights.location) +
    (severity_score * weights.severity) +
    (report_volume_score * weights.report_volume) +
    (vulnerable_population_score * weights.vulnerable_population) +
    (weather_score * weights.weather) +
    (time_open_score * weights.time_open) +
    (urgency_evidence_score * weights.urgency_evidence);

  const baseWeightedScore = Math.round(rawWeightedScore);
  let finalScore = baseWeightedScore;

  // 8. Safety Floor Rule: If safety or health hazard >= 90 or exposed live wire/shock risk, enforce minimum 80 CRITICAL
  let safetyFloorApplied = false;
  let safetyEscalationPoints = 0;
  const healthRisk = aiAnalysis?.health_risk ? Number(aiAnalysis.health_risk) * 10 : 0;

  if (safety_hazard_score >= 90 || healthRisk >= 90) {
    if (finalScore < 80) {
      safetyEscalationPoints = 80 - finalScore;
      finalScore = 80;
      safetyFloorApplied = true;
    }
  }

  // 9. Regulatory / Political Overrides (Authority Only)
  let overrideApplied = false;
  let overrideReason = null;
  let overridePoints = 0;

  if (override && override.override_enabled) {
    overrideApplied = true;
    overrideReason = override.override_reason || 'Administrative priority override';
    const floor = Number(override.override_priority_floor || 85);
    if (finalScore < floor) {
      overridePoints = floor - finalScore;
      finalScore = floor;
    }
  }

  finalScore = Math.min(100, Math.max(1, finalScore));
  const bucketInfo = getPriorityBucket(finalScore);

  // 10. Severity Level & Explanation Generation
  let severityLevel = userSeverity;
  if (severity_score >= 85) severityLevel = 'Critical';
  else if (severity_score >= 65) severityLevel = 'High';
  else if (severity_score >= 40) severityLevel = 'Medium';
  else severityLevel = 'Low';

  const severityExplanations = generateSeverityExplanation({
    category,
    description,
    severityLevel,
    aiAnalysis,
    isRiskPresent
  });

  // 11. Priority Explanations & Contributing Factors Array
  const structuredExplanations = generateScoreExplanation({
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

  const contributingFactors = [
    {
      key: 'safety',
      label: 'Safety & Hazard Potential',
      score: safety_hazard_score,
      weight: weights.safety,
      weight_percent: Math.round(weights.safety * 100),
      weighted_points: Math.round((safety_hazard_score * weights.safety) * 10) / 10,
      status: safety_hazard_score >= 80 ? 'critical' : safety_hazard_score >= 50 ? 'elevated' : 'normal',
      detail: isHighDangerKeywords ? 'High electrocution/collapse hazard detected' : null
    },
    {
      key: 'location',
      label: 'Location Sensitivity',
      score: location_sensitivity_score,
      weight: weights.location,
      weight_percent: Math.round(weights.location * 100),
      weighted_points: Math.round((location_sensitivity_score * weights.location) * 10) / 10,
      status: location_sensitivity_score >= 65 ? 'high' : 'normal',
      detail: locationSensitivity.topLandmark ? `${locationSensitivity.topLandmark.name} (${locationSensitivity.topLandmark.distanceM}m away)` : 'Standard sector'
    },
    {
      key: 'severity',
      label: 'Incident Severity',
      score: severity_score,
      weight: weights.severity,
      weight_percent: Math.round(weights.severity * 100),
      weighted_points: Math.round((severity_score * weights.severity) * 10) / 10,
      status: severity_score >= 70 ? 'high' : 'normal',
      detail: `Assessed at ${severityLevel} level`
    },
    {
      key: 'report_volume',
      label: 'Cluster Volume & Duplicates',
      score: report_volume_score,
      weight: weights.report_volume,
      weight_percent: Math.round(weights.report_volume * 100),
      weighted_points: Math.round((report_volume_score * weights.report_volume) * 10) / 10,
      status: clusterInfo.sameCategoryCount >= 2 ? 'elevated' : 'normal',
      detail: clusterInfo.sameCategoryCount >= 1 ? `${clusterInfo.sameCategoryCount} recurring ${category.toLowerCase()} report(s) in radius` : 'Isolated incident'
    },
    {
      key: 'vulnerable_population',
      label: 'Vulnerable Population Impact',
      score: vulnerable_population_score,
      weight: weights.vulnerable_population,
      weight_percent: Math.round(weights.vulnerable_population * 100),
      weighted_points: Math.round((vulnerable_population_score * weights.vulnerable_population) * 10) / 10,
      status: vulnerable_population_score >= 65 ? 'high' : 'normal',
      detail: vulnerable_population_score >= 65 ? 'Proximity to schools, clinics, or dense pedestrian area' : 'Standard residential/transit zone'
    },
    {
      key: 'weather',
      label: 'Weather & Environmental Amplification',
      score: weather_score,
      weight: weights.weather,
      weight_percent: Math.round(weights.weather * 100),
      weighted_points: Math.round((weather_score * weights.weather) * 10) / 10,
      status: weather_score >= 60 ? 'elevated' : 'normal',
      detail: weatherInfo.condition_summary
    },
    {
      key: 'time_open',
      label: 'Time Open & SLA Status',
      score: time_open_score,
      weight: weights.time_open,
      weight_percent: Math.round(weights.time_open * 100),
      weighted_points: Math.round((time_open_score * weights.time_open) * 10) / 10,
      status: time_open_score >= 70 ? 'overdue' : 'on_track',
      detail: time_open_score >= 70 ? 'SLA resolution target exceeded' : 'Within initial municipal response SLA'
    },
    {
      key: 'urgency_evidence',
      label: 'Urgency & Evidence Confidence',
      score: urgency_evidence_score,
      weight: weights.urgency_evidence,
      weight_percent: Math.round(weights.urgency_evidence * 100),
      weighted_points: Math.round((urgency_evidence_score * weights.urgency_evidence) * 10) / 10,
      status: urgency_evidence_score >= 70 ? 'high' : 'normal',
      detail: report.photo_url || (report.media && report.media.length > 0) ? 'Photo/geotagged evidence verified' : 'Citizen description'
    }
  ];

  return {
    score: finalScore,
    base_score: baseWeightedScore,
    bucket: bucketInfo.bucket,
    response_target: bucketInfo.response_target,
    severity_level: severityLevel,
    severity_explanation: severityExplanations,
    safety_floor_applied: safetyFloorApplied,
    override_applied: overrideApplied,
    escalation: {
      applied: safetyFloorApplied || overrideApplied,
      type: overrideApplied ? 'REGULATORY_OVERRIDE' : (safetyFloorApplied ? 'SAFETY_HAZARD_FLOOR' : null),
      base_score: baseWeightedScore,
      final_score: finalScore,
      points_added: overrideApplied ? overridePoints : safetyEscalationPoints,
      reason: overrideApplied
        ? `Regulatory directive applied priority floor ${finalScore}`
        : (safetyFloorApplied ? 'Extreme safety/health risk exceeded critical threshold (>=90), enforcing emergency priority policy floor.' : null)
    },
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
    contributing_factors: contributingFactors,
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
    explanations: structuredExplanations.map(e => (typeof e === 'string' ? e : e.title || e.text)),
    structured_explanations: structuredExplanations
  };
}
