/**
 * Alcheminds Government Dashboard Prototype Data Adapter
 * Provides structured, isolated prototype models for HEI capability matching,
 * real-world community pilots, and district references.
 *
 * NOTE: This is isolated prototype data for future ecosystem entities (HEIs, Pilots)
 * while real challenges, assignments, and reports are fetched directly from the database.
 */

export interface HEIProfile {
  id: string;
  name: string;
  shortName: string;
  type: 'IIT' | 'NIT' | 'State University' | 'IIIT' | 'Deemed University';
  location: string;
  state: string;
  departments: string[];
  capabilities: string[];
  researchCenters: string[];
  activeProjectsCount: number;
  completedPilotsCount: number;
  nepAccredited: boolean;
  contactEmail: string;
}

export interface PilotMonitoringRecord {
  id: string;
  challengeId?: string;
  reportCode?: string;
  title: string;
  domain: string;
  district: string;
  community: string;
  leadInstitution: string;
  industryPartner?: string;
  durationMonths: number;
  currentMonth: number;
  devicesDeployed: number;
  householdsBenefited: number;
  status: 'active' | 'evaluating' | 'completed' | 'scaling';
  technicalPerformance: number; // 0 - 100%
  problemReductionPct: number; // e.g. 78% reduction
  communitySatisfactionPct: number; // e.g. 92%
  keyMetricName: string;
  keyMetricValue: string;
  keyMetricBaseline: string;
  notes: string;
  deploymentDate: string;
}

export const JHARKHAND_DISTRICTS = [
  'All Districts',
  'Ranchi',
  'Dhanbad',
  'East Singhbhum (Jamshedpur)',
  'Bokaro',
  'Hazaribagh',
  'Deoghar',
  'Dumka',
  'Ramgarh',
  'Giridih',
  'Palamu',
  'West Singhbhum',
  'Saraikela Kharsawan',
];

export const HEI_PROFILES: HEIProfile[] = [
  {
    id: 'hei_iit_dhanbad',
    name: 'Indian Institute of Technology (ISM) Dhanbad',
    shortName: 'IIT (ISM) Dhanbad',
    type: 'IIT',
    location: 'Dhanbad',
    state: 'Jharkhand',
    departments: [
      'Environmental Science & Engineering',
      'Civil & Infrastructure Engineering',
      'Mining & Geo-technical Engineering',
      'Electronics & IoT Engineering',
      'Chemical Engineering',
    ],
    capabilities: [
      'Groundwater Contamination Remediation',
      'Heavy Metal Extraction',
      'IoT Sensor Mesh Telemetry',
      'Structural Geo-hazard Mitigation',
      'Mine Runoff Drainage Modeling',
    ],
    researchCenters: [
      'Centre of Excellence in Water Resources',
      'National Mining & Environmental Tech Lab',
    ],
    activeProjectsCount: 8,
    completedPilotsCount: 5,
    nepAccredited: true,
    contactEmail: 'director@iitism.ac.in',
  },
  {
    id: 'hei_bit_mesra',
    name: 'Birla Institute of Technology (BIT) Mesra',
    shortName: 'BIT Mesra',
    type: 'Deemed University',
    location: 'Ranchi',
    state: 'Jharkhand',
    departments: [
      'Civil & Environmental Engineering',
      'Electrical & Electronics Engineering',
      'Computer Science & AI',
      'Bio-Technology & Pharmaceutical',
      'Remote Sensing & GIS',
    ],
    capabilities: [
      'Smart Grid & Fault Isolation',
      'Urban Runoff & Stormwater Drainage Modeling',
      'Biopolymer Road Patching Materials',
      'Satellite GIS Landslide Prediction',
      'Municipal Solid Waste Composting Bio-reactors',
    ],
    researchCenters: [
      'Centre for Environmental Sensing & AI',
      'Smart Infrastructure Prototyping Facility',
    ],
    activeProjectsCount: 11,
    completedPilotsCount: 7,
    nepAccredited: true,
    contactEmail: 'research@bitmesra.ac.in',
  },
  {
    id: 'hei_nit_jamshedpur',
    name: 'National Institute of Technology (NIT) Jamshedpur',
    shortName: 'NIT Jamshedpur',
    type: 'NIT',
    location: 'Jamshedpur',
    state: 'Jharkhand',
    departments: [
      'Mechanical & Manufacturing Engineering',
      'Civil Engineering & Hydrodynamics',
      'Electrical Engineering',
      'Metallurgical & Materials Engineering',
    ],
    capabilities: [
      'Corrosion-Resistant Pipelining',
      'Industrial Waste Water Filtration',
      'Automated Pothole Rapid-Filler Mechanisms',
      'Micro-Hydro Kinetic Energy Generators',
    ],
    researchCenters: [
      'Advanced Materials & Manufacturing Lab',
      'Municipal Hydraulics Testing Facility',
    ],
    activeProjectsCount: 6,
    completedPilotsCount: 4,
    nepAccredited: true,
    contactEmail: 'deansr@nitjsr.ac.in',
  },
  {
    id: 'hei_bau_ranchi',
    name: 'Birsa Agricultural University (BAU)',
    shortName: 'BAU Ranchi',
    type: 'State University',
    location: 'Kanke, Ranchi',
    state: 'Jharkhand',
    departments: [
      'Agricultural Engineering & Soil Conservation',
      'Forestry & Environmental Ecology',
      'Veterinary & Animal Husbandry',
      'Horticulture & Plant Pathology',
    ],
    capabilities: [
      'Soil Erosion & Check-Dam Bio-engineering',
      'Rural Micro-Irrigation Channel De-siltation',
      'Agricultural Waste Biomass Briquetting',
      'Vector Control & Livestock Disease Prevention',
    ],
    researchCenters: [
      'Tribal Agro-Ecology Research Station',
      'Catchment Hydrology Research Cell',
    ],
    activeProjectsCount: 5,
    completedPilotsCount: 6,
    nepAccredited: true,
    contactEmail: 'agri.research@bauranchi.org',
  },
  {
    id: 'hei_iiit_ranchi',
    name: 'Indian Institute of Information Technology (IIIT) Ranchi',
    shortName: 'IIIT Ranchi',
    type: 'IIIT',
    location: 'Ranchi',
    state: 'Jharkhand',
    departments: [
      'Computer Science & Engineering',
      'Electronics & Communication Engineering',
      'Data Science & AI Lab',
    ],
    capabilities: [
      'Low-Power LoRaWAN Water Level Sensing',
      'Computer Vision Road Surface Distress Detection',
      'Predictive Civic Outage Forecasting Models',
    ],
    researchCenters: [
      'Smart City AI & Embedded Telemetry Lab',
    ],
    activeProjectsCount: 4,
    completedPilotsCount: 3,
    nepAccredited: true,
    contactEmail: 'rnd@iiitranchi.ac.in',
  },
];

export const PROTOTYPE_PILOTS: PilotMonitoringRecord[] = [
  {
    id: 'pilot_01',
    reportCode: 'ALC-2026-4192',
    title: 'Solar-Powered Multi-Stage Arsenic & Fluoride Water Purifier',
    domain: 'Water',
    district: 'Ranchi',
    community: 'Tupudana Tribal Cluster (Ward 14)',
    leadInstitution: 'IIT (ISM) Dhanbad',
    industryPartner: 'Tata Steel CSR Foundation',
    durationMonths: 6,
    currentMonth: 4,
    devicesDeployed: 8,
    householdsBenefited: 450,
    status: 'active',
    technicalPerformance: 96,
    problemReductionPct: 88,
    communitySatisfactionPct: 94,
    keyMetricName: 'Water Purity (PPM Fluoride)',
    keyMetricValue: '0.42 mg/L',
    keyMetricBaseline: '3.85 mg/L (Critical Hazard)',
    notes: 'Filtration units operating continuously with IoT turbidity telemetry streaming to Municipal Water Board.',
    deploymentDate: '15 May 2026',
  },
  {
    id: 'pilot_02',
    reportCode: 'ALC-2026-8831',
    title: 'Recycled Plastic Polymer Cold-Mix Asphalt Patching Pilot',
    domain: 'Roads',
    district: 'Dhanbad',
    community: 'Bank More - Jharia Link Road Corridor',
    leadInstitution: 'BIT Mesra',
    industryPartner: 'BCCL CSR Initiative',
    durationMonths: 4,
    currentMonth: 3,
    devicesDeployed: 12,
    householdsBenefited: 3200,
    status: 'active',
    technicalPerformance: 92,
    problemReductionPct: 75,
    communitySatisfactionPct: 89,
    keyMetricName: 'Pothole Recurrence Rate',
    keyMetricValue: '4% after 90 days',
    keyMetricBaseline: '65% recurrence with standard bitumen',
    notes: 'Cold-mix applied during active rain survived 120mm precipitation without aggregate unraveling.',
    deploymentDate: '10 Jun 2026',
  },
  {
    id: 'pilot_03',
    reportCode: 'ALC-2026-3104',
    title: 'LoRaWAN Ultrasonic Urban Stormwater Siphon Gate Trigger',
    domain: 'Water',
    district: 'East Singhbhum (Jamshedpur)',
    community: 'Bistupur Low-Lying Stormwater Canal',
    leadInstitution: 'NIT Jamshedpur',
    industryPartner: 'Jusco Utilities Partnership',
    durationMonths: 3,
    currentMonth: 3,
    devicesDeployed: 6,
    householdsBenefited: 1100,
    status: 'scaling',
    technicalPerformance: 98,
    problemReductionPct: 92,
    communitySatisfactionPct: 96,
    keyMetricName: 'Water Stagnation Clearance Time',
    keyMetricValue: '18 minutes',
    keyMetricBaseline: '4.5 hours (Pre-pilot flood duration)',
    notes: 'Automated siphons triggered successfully during 3 heavy downpours. Slated for city-wide ULB adoption.',
    deploymentDate: '01 Jul 2026',
  },
];

/**
 * Intelligent Capability Matcher for HEI Recommendations
 */
export function getRecommendedHEIsForChallenge(category: string, description: string = '') {
  const text = `${category} ${description}`.toLowerCase();

  return HEI_PROFILES.map((hei) => {
    let score = 50;
    const matchingCapabilities: string[] = [];

    hei.capabilities.forEach((cap) => {
      const capLower = cap.toLowerCase();
      if (
        (text.includes('water') && (capLower.includes('water') || capLower.includes('drainage') || capLower.includes('groundwater'))) ||
        (text.includes('road') && (capLower.includes('road') || capLower.includes('asphalt') || capLower.includes('pothole') || capLower.includes('surface'))) ||
        (text.includes('electr') && (capLower.includes('grid') || capLower.includes('electrical') || capLower.includes('sensor') || capLower.includes('fault'))) ||
        (text.includes('flood') && (capLower.includes('stormwater') || capLower.includes('drainage') || capLower.includes('hydraulic'))) ||
        (text.includes('garbage') && (capLower.includes('waste') || capLower.includes('bio-reactor') || capLower.includes('environmental'))) ||
        (text.includes('soil') && capLower.includes('soil'))
      ) {
        score += 18;
        matchingCapabilities.push(cap);
      }
    });

    if (category.toLowerCase().includes('water') && hei.shortName.includes('IIT (ISM)')) score += 15;
    if (category.toLowerCase().includes('road') && hei.shortName.includes('BIT Mesra')) score += 15;
    if (category.toLowerCase().includes('electr') && hei.shortName.includes('BIT Mesra')) score += 12;
    if (category.toLowerCase().includes('agri') && hei.shortName.includes('BAU')) score += 25;

    const finalMatchPct = Math.min(98, Math.max(68, score));

    return {
      hei,
      matchPercentage: finalMatchPct,
      matchingCapabilities: matchingCapabilities.length > 0 ? matchingCapabilities : hei.capabilities.slice(0, 2),
      relevantDepartment: hei.departments[0],
      reason: `High compatibility with ${hei.shortName}'s ${hei.researchCenters[0]} in ${hei.location}.`,
    };
  }).sort((a, b) => b.matchPercentage - a.matchPercentage);
}
