import { calculateEffectiveRadius } from '../geo/radiusPolicy.js';
import { locationIntelligence } from '../geo/locationIntelligence.js';
import { evaluateReportCluster } from '../geo/clusterEngine.js';
import { calculateDistanceKm } from '../hotspots.js';

console.log('🧪 Starting Suite 3: Geographic Intelligence, Radius Policy & Clustering Tests...');

// 1. Test Issue-Specific Radius & Dynamic AI Clamping
console.log('\n--- 1. Testing Issue-Specific Radius & Clamping ---');

// Pothole policy: 50m default, 25m min, 100m max
const potholeNormal = calculateEffectiveRadius('Roads', 'pothole', null);
if (potholeNormal.effective_radius_m !== 50) throw new Error(`Expected default 50m, got ${potholeNormal.effective_radius_m}`);

const potholeAiValid = calculateEffectiveRadius('Roads', 'pothole', 80);
if (potholeAiValid.effective_radius_m !== 80) throw new Error(`Expected 80m, got ${potholeAiValid.effective_radius_m}`);

const potholeAiExceeded = calculateEffectiveRadius('Roads', 'pothole', 500);
if (potholeAiExceeded.effective_radius_m !== 100) throw new Error(`Expected clamped max 100m, got ${potholeAiExceeded.effective_radius_m}`);

const potholeAiSubMin = calculateEffectiveRadius('Roads', 'pothole', 10);
if (potholeAiSubMin.effective_radius_m !== 25) throw new Error(`Expected clamped min 25m, got ${potholeAiSubMin.effective_radius_m}`);

// Major Flooding policy: 500m default, 250m min, 1000m max
const floodAi = calculateEffectiveRadius('Water', 'major_flooding', 850);
if (floodAi.effective_radius_m !== 850) throw new Error(`Expected 850m for flood, got ${floodAi.effective_radius_m}`);

console.log('✓ Dynamic radius clamping successfully verified against domain policies');

// 2. Test Location Sensitivity & Sensitive Landmark Proximity
console.log('\n--- 2. Testing Sensitive Landmark Proximity ---');
// Coordinates very close to KEM Hospital in Mumbai (19.0028, 72.8427)
const hospitalProximity = locationIntelligence.evaluateLocationSensitivity(19.0030, 72.8430, 1000);
if (hospitalProximity.score < 70) throw new Error(`Near hospital should have high sensitivity >= 70, got ${hospitalProximity.score}`);
if (!hospitalProximity.isHighSensitivity) throw new Error('isHighSensitivity must be true near hospital');

// Coordinates far in rural area
const remoteLocation = locationIntelligence.evaluateLocationSensitivity(20.5000, 74.5000, 1000);
if (remoteLocation.score > 35) throw new Error(`Remote location should score low baseline, got ${remoteLocation.score}`);

console.log(`✓ Landmark proximity scoring verified: Near KEM Hospital (${hospitalProximity.score}/100) vs Remote (${remoteLocation.score}/100)`);

// 3. Test Spatial Clustering & Duplicate Detection
console.log('\n--- 3. Testing Spatial Clustering & Duplicate Detection ---');
const baseReport = {
  id: 'rep_origin',
  category: 'Water',
  description: 'Severe waterlogging blocking traffic on main road',
  latitude: 19.0760,
  longitude: 72.8777,
  created_at: new Date().toISOString()
};

const candidateReports = [
  // Very close, same category, similar description -> Duplicate
  {
    id: 'rep_dup_1',
    report_code: 'ALC-001',
    category: 'Water',
    description: 'Road flooded with water near signal',
    latitude: 19.0761,
    longitude: 72.8778, // ~15 meters away
    created_at: new Date().toISOString()
  },
  // In impact radius (150m away)
  {
    id: 'rep_near_2',
    report_code: 'ALC-002',
    category: 'Water',
    description: 'Water accumulation on side lane',
    latitude: 19.0770,
    longitude: 72.8777, // ~110 meters away
    created_at: new Date().toISOString()
  },
  // Outside radius (5km away)
  {
    id: 'rep_far_3',
    report_code: 'ALC-003',
    category: 'Water',
    description: 'Puddle in distant suburb',
    latitude: 19.1200,
    longitude: 72.8777,
    created_at: new Date().toISOString()
  }
];

const clusterResult = evaluateReportCluster({
  targetReport: baseReport,
  candidateReports,
  effectiveRadiusM: 250
});

if (clusterResult.nearbyCount !== 2) throw new Error(`Expected 2 nearby reports, found ${clusterResult.nearbyCount}`);
if (clusterResult.duplicateCount < 1) throw new Error('Must detect at least 1 duplicate report in tight proximity');
console.log(`✓ Spatial clustering and duplicate detection verified (Nearby: ${clusterResult.nearbyCount}, Duplicates: ${clusterResult.duplicateCount})`);

console.log('\n🎉 ALL GEOGRAPHIC & CLUSTERING TESTS PASSED! 💯');
