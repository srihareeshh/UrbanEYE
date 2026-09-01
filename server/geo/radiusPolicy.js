/**
 * Issue-Specific Geographic Impact Radius Policy & Dynamic Clamping
 */

export const RADIUS_POLICIES = {
  // Roads & Traffic
  pothole: { default: 50, min: 25, max: 100 },
  damaged_sidewalk: { default: 50, min: 25, max: 100 },
  traffic_signal: { default: 100, min: 50, max: 200 },
  road_blockage: { default: 100, min: 50, max: 250 },
  roads: { default: 75, min: 25, max: 150 },

  // Water & Drainage
  localized_waterlogging: { default: 250, min: 100, max: 500 },
  major_flooding: { default: 500, min: 250, max: 1000 },
  overflowing_drain: { default: 150, min: 75, max: 300 },
  water_leakage: { default: 100, min: 50, max: 250 },
  drinking_water_contamination: { default: 500, min: 250, max: 2000 },
  water_supply_failure: { default: 500, min: 250, max: 2000 },
  water: { default: 250, min: 100, max: 500 },

  // Electricity & Utilities
  streetlight: { default: 100, min: 50, max: 200 },
  exposed_wire: { default: 100, min: 50, max: 200 },
  transformer_failure: { default: 300, min: 100, max: 600 },
  electricity: { default: 150, min: 50, max: 300 },

  // Sanitation & Public Health
  garbage: { default: 100, min: 50, max: 250 },
  solid_waste: { default: 100, min: 50, max: 250 },
  mosquito_breeding: { default: 300, min: 100, max: 1000 },
  sanitation: { default: 150, min: 50, max: 300 },
  healthcare_access: { default: 1000, min: 500, max: 5000 },
  health: { default: 500, min: 200, max: 2000 },

  // Infrastructure & Schools
  unsafe_structure: { default: 150, min: 50, max: 500 },
  schools: { default: 150, min: 50, max: 500 },
  fallen_tree: { default: 100, min: 50, max: 250 },

  // Agriculture & Environment
  crop_disease: { default: 1500, min: 500, max: 5000 },
  agricultural_irrigation: { default: 500, min: 250, max: 2000 },
  livestock_disease: { default: 2000, min: 500, max: 10000 },
  agriculture: { default: 1000, min: 300, max: 3000 },
  pollution: { default: 500, min: 250, max: 5000 },
  environment: { default: 500, min: 200, max: 2000 },

  // Fallback
  default: { default: 150, min: 50, max: 500 }
};

/**
 * Resolves policy matching key
 */
function resolvePolicyKey(category = '', issueType = '') {
  const normType = String(issueType).toLowerCase().replace(/[\s-]/g, '_');
  const normCat = String(category).toLowerCase().replace(/[\s-]/g, '_');

  if (normType && RADIUS_POLICIES[normType]) return normType;
  if (normCat && RADIUS_POLICIES[normCat]) return normCat;

  // Partial matches
  for (const key of Object.keys(RADIUS_POLICIES)) {
    if (normType.includes(key) || normCat.includes(key)) {
      return key;
    }
  }

  return 'default';
}

/**
 * Calculates effective clamped radius based on policy and AI recommendation
 */
export function calculateEffectiveRadius(category, issueType, aiRecommendedRadius = null) {
  const policyKey = resolvePolicyKey(category, issueType);
  const policy = RADIUS_POLICIES[policyKey] || RADIUS_POLICIES.default;

  const baseRadius = policy.default;
  const minRadius = policy.min;
  const maxRadius = policy.max;

  let effectiveRadius = baseRadius;

  if (aiRecommendedRadius !== null && aiRecommendedRadius !== undefined && !isNaN(Number(aiRecommendedRadius))) {
    const numAiRadius = Number(aiRecommendedRadius);
    effectiveRadius = Math.max(minRadius, Math.min(maxRadius, Math.round(numAiRadius)));
  }

  return {
    policyKey,
    base_radius_m: baseRadius,
    ai_recommended_radius_m: aiRecommendedRadius ? Number(aiRecommendedRadius) : null,
    effective_radius_m: effectiveRadius,
    minimum_radius_m: minRadius,
    maximum_radius_m: maxRadius
  };
}
