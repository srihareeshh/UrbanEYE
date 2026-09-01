import { calculateDistanceKm } from '../hotspots.js';

/**
 * Known sensitive civic landmark types and baseline weights
 */
export const SENSITIVE_LANDMARK_TYPES = {
  HOSPITAL: { name: 'Hospital / Trauma Center', weight: 95, impactRadiusM: 800 },
  CLINIC: { name: 'Health Clinic / Maternity Home', weight: 80, impactRadiusM: 500 },
  SCHOOL: { name: 'School / Childcare Center', weight: 90, impactRadiusM: 400 },
  ELDERCARE: { name: 'Senior Care / Nursing Home', weight: 85, impactRadiusM: 500 },
  TRANSIT_HUB: { name: 'Railway / Metro / Bus Terminal', weight: 85, impactRadiusM: 600 },
  MARKET: { name: 'Dense Commercial Market / Bazaar', weight: 75, impactRadiusM: 500 },
  EMERGENCY_ROUTE: { name: 'Designated Arterial / Fire Route', weight: 90, impactRadiusM: 300 },
  GOVERNMENT_OFFICE: { name: 'Municipal / District HQ', weight: 65, impactRadiusM: 400 }
};

// Seed dataset of prominent sensitive civic anchors (easily extensible via DB or OSM)
export const KNOWN_CIVIC_ANCHORS = [
  // Mumbai / Maharashtra Anchors
  { name: 'KEM Hospital & Medical College', type: 'HOSPITAL', latitude: 19.0028, longitude: 72.8427 },
  { name: 'Sion Municipal Hospital', type: 'HOSPITAL', latitude: 19.0366, longitude: 72.8601 },
  { name: 'Lilavati Hospital & Research Centre', type: 'HOSPITAL', latitude: 19.0514, longitude: 72.8295 },
  { name: 'Dharavi Primary Health Center', type: 'CLINIC', latitude: 19.0435, longitude: 72.8567 },
  { name: 'St. Xavier High School Fort', type: 'SCHOOL', latitude: 18.9438, longitude: 72.8335 },
  { name: 'Dharavi Municipal Secondary School', type: 'SCHOOL', latitude: 19.0412, longitude: 72.8532 },
  { name: 'Bandra Terminus Station Area', type: 'TRANSIT_HUB', latitude: 19.0596, longitude: 72.8406 },
  { name: 'Dadar Central Transit Hub', type: 'TRANSIT_HUB', latitude: 19.0178, longitude: 72.8478 },
  { name: 'Crawford Wholesale Market', type: 'MARKET', latitude: 18.9472, longitude: 72.8344 },

  // Ranchi / Jharkhand Anchors (Core SIH Problem Context)
  { name: 'RIMS Super Specialty Hospital', type: 'HOSPITAL', latitude: 23.3854, longitude: 85.3524 },
  { name: 'Sadar Hospital Ranchi', type: 'HOSPITAL', latitude: 23.3689, longitude: 85.3262 },
  { name: 'St. Xavier College Ranchi', type: 'SCHOOL', latitude: 23.3621, longitude: 85.3256 },
  { name: 'Ranchi Railway Station Area', type: 'TRANSIT_HUB', latitude: 23.3512, longitude: 85.3341 },
  { name: 'Birsa Bus Terminal Khadgarha', type: 'TRANSIT_HUB', latitude: 23.3644, longitude: 85.3511 },
  { name: 'Main Road Daily Market', type: 'MARKET', latitude: 23.3618, longitude: 85.3275 },
  { name: 'Harmu Arterial Emergency Route', type: 'EMERGENCY_ROUTE', latitude: 23.3582, longitude: 85.3089 }
];

export class LocationIntelligenceService {
  constructor(customAnchors = []) {
    this.anchors = [...KNOWN_CIVIC_ANCHORS, ...customAnchors];
  }

  /**
   * Evaluates proximity of GPS point to sensitive civic locations
   */
  evaluateLocationSensitivity(latitude, longitude, searchRadiusM = 1500) {
    if (latitude === undefined || longitude === undefined || isNaN(Number(latitude)) || isNaN(Number(longitude))) {
      return { score: 30, nearbySensitiveLandmarks: [], isHighSensitivity: false };
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    const searchRadiusKm = searchRadiusM / 1000;

    const matches = [];

    for (const anchor of this.anchors) {
      const distKm = calculateDistanceKm(lat, lng, anchor.latitude, anchor.longitude);
      if (distKm <= searchRadiusKm) {
        const distM = Math.round(distKm * 1000);
        const meta = SENSITIVE_LANDMARK_TYPES[anchor.type] || { name: anchor.type, weight: 60, impactRadiusM: 500 };

        // Proximity attenuation: closer = higher multiplier (1.0 at 0m, decaying to 0.2 at impact edge)
        const radiusRatio = Math.min(1.0, distM / meta.impactRadiusM);
        const proximityWeight = Math.max(0.2, 1.0 - (radiusRatio * 0.8));
        const effectiveScore = Math.round(meta.weight * proximityWeight);

        matches.push({
          name: anchor.name,
          type: anchor.type,
          typeName: meta.name,
          distanceM: distM,
          baseWeight: meta.weight,
          effectiveScore
        });
      }
    }

    // Sort by effective score descending
    matches.sort((a, b) => b.effectiveScore - a.effectiveScore);

    if (matches.length === 0) {
      return {
        score: 25, // Baseline normal residential area
        nearbySensitiveLandmarks: [],
        isHighSensitivity: false,
        topLandmark: null
      };
    }

    // Primary score is the highest matching landmark, boosted slightly if multiple sensitive zones overlap
    const topMatch = matches[0];
    let aggregateScore = topMatch.effectiveScore;

    if (matches.length > 1) {
      // Add small bonus for multiple nearby sensitive zones (capped at +15)
      const secondaryBonus = Math.min(15, (matches.length - 1) * 5);
      aggregateScore = Math.min(100, aggregateScore + secondaryBonus);
    }

    return {
      score: Math.min(100, Math.max(1, aggregateScore)),
      nearbySensitiveLandmarks: matches.slice(0, 5),
      isHighSensitivity: aggregateScore >= 70,
      topLandmark: topMatch
    };
  }
}

export const locationIntelligence = new LocationIntelligenceService();
