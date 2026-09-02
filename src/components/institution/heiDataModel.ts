/**
 * Alcheminds Higher Education Institution (HEI) Data Model & Prototype Adapter
 * Provides centralized models for University Profiles, Faculty, Research Teams,
 * Proposals, Prototype Iterations, Industry Collaborations, Pilot Readiness, and Impact Metrics.
 */

import type { HEIProfile, PilotMonitoringRecord } from '../government/governmentPrototypeData';
import { HEI_PROFILES } from '../government/governmentPrototypeData';

export { HEI_PROFILES };
export type { HEIProfile, PilotMonitoringRecord };

export interface FacultyMember {
  id: string;
  name: string;
  designation: string;
  department: string;
  institutionId: string;
  institutionName: string;
  email: string;
  specialization: string[];
  activeProjectsCount: number;
  completedPilotsCount: number;
  hIndex: number;
  availableForMentoring: boolean;
}

export interface StudentResearcher {
  id: string;
  name: string;
  studentId: string;
  apaarId: string;
  department: string;
  year: '3rd Year B.Tech' | '4th Year B.Tech' | 'M.Tech' | 'Ph.D. Scholar';
  skills: string[];
  researchHours: number;
  nepCreditsEarned: number;
  activeProject?: string;
  role: string;
}

export type HEIPerspective = 'nodal' | 'faculty';

export interface PerspectivePermissions {
  canReviewMatchedChallenges: boolean;
  canAcceptChallenge: boolean;
  canDeclineChallenge: boolean;
  canAssignFaculty: boolean;
  canReviewProposals: boolean;
  canApproveProposal: boolean;
  canViewInstitutionProjects: boolean;
  canViewInstitutionAnalytics: boolean;
  canReviewAssignedChallenges: boolean;
  canPerformFeasibility: boolean;
  canCreateResearchTeam: boolean;
  canCreateProposal: boolean;
  canSubmitProposal: boolean;
  canViewOwnProjects: boolean;
  canManageInstitutionCapabilities: boolean;
}

export function getPerspectivePermissions(perspective: HEIPerspective): PerspectivePermissions {
  if (perspective === 'nodal') {
    return {
      canReviewMatchedChallenges: true,
      canAcceptChallenge: true,
      canDeclineChallenge: true,
      canAssignFaculty: true,
      canReviewProposals: true,
      canApproveProposal: true,
      canViewInstitutionProjects: true,
      canViewInstitutionAnalytics: true,
      canReviewAssignedChallenges: false,
      canPerformFeasibility: false,
      canCreateResearchTeam: false,
      canCreateProposal: false,
      canSubmitProposal: false,
      canViewOwnProjects: false,
      canManageInstitutionCapabilities: true,
    };
  }
  return {
    canReviewMatchedChallenges: false,
    canAcceptChallenge: false,
    canDeclineChallenge: false,
    canAssignFaculty: false,
    canReviewProposals: false,
    canApproveProposal: false,
    canViewInstitutionProjects: false,
    canViewInstitutionAnalytics: false,
    canReviewAssignedChallenges: true,
    canPerformFeasibility: true,
    canCreateResearchTeam: true,
    canCreateProposal: true,
    canSubmitProposal: true,
    canViewOwnProjects: true,
    canManageInstitutionCapabilities: false,
  };
}

export const NODAL_OFFICER_IDENTITY = {
  id: 'nodal_lead',
  name: 'Dr. Institutional Innovation Coordinator',
  designation: 'Head, Innovation & Incubation Cell (IIC)',
  department: 'Central Innovation & Incubation Cell',
  institution: 'BIT Mesra',
};

export type HEIWorkflowStatus =
  | 'MATCHED'
  | 'UNDER_HEI_REVIEW'
  | 'ACCEPTED_FOR_EVALUATION'
  | 'FACULTY_EVALUATION'
  | 'TEAM_FORMING'
  | 'PROPOSAL_DRAFT'
  | 'PROPOSAL_SUBMITTED'
  | 'PROJECT_ACTIVE'
  | 'PROTOTYPE_DEVELOPMENT'
  | 'PILOT_ACTIVE'
  | 'COMPLETED'
  | 'DECLINED_BY_HEI'
  | 'NOT_FEASIBLE'
  | 'PAUSED';

export type FeasibilityDecision =
  | 'FEASIBLE'
  | 'NEEDS_INVESTIGATION'
  | 'NEEDS_EXTERNAL_COLLAB'
  | 'NOT_FEASIBLE';

export interface EvaluatedChallenge {
  id: string;
  challengeId: string;
  reportCode: string;
  title: string;
  category: string;
  ward: string;
  status: HEIWorkflowStatus;
  nodalDecision: {
    decision: 'ACCEPTED' | 'DECLINED';
    acceptedAt?: string;
    declinedReason?: string;
    assignedDepartment: string;
    assignedFaculty: FacultyMember;
  };
  facultyEvaluation?: {
    feasibility: FeasibilityDecision;
    technicalNotes: string;
    evaluatedAt: string;
    requiredResources: string[];
  };
  teamFormation?: {
    teamStatus: 'Proposed' | 'Forming' | 'Active' | 'Completed';
    facultyLead: FacultyMember;
    studentMembers: StudentResearcher[];
  };
  created_at: string;
  updated_at: string;
}

export interface CapabilityMatchItem {
  requiredCapability: string;
  availableAtHEI: boolean;
  facilityOrLabName?: string;
  notes: string;
}

export interface ExplainableCapabilityMatch {
  overallScorePct: number;
  matchingCapabilitiesCount: number;
  totalRequiredCount: number;
  items: CapabilityMatchItem[];
  matchingDepartment: string;
  recommendedLab: string;
}

export interface ResearchProposal {
  id: string;
  challengeId: string;
  reportCode?: string;
  title: string;
  domain: string;
  institutionName: string;
  department: string;
  facultyLead: FacultyMember;
  studentTeam: StudentResearcher[];
  problemStatement: string;
  hypothesis: string;
  methodology: string;
  budgetRequested: number;
  estimatedDurationMonths: number;
  deliverables: string[];
  prototypePlan: string;
  pilotPlan: string;
  status: 'draft' | 'submitted' | 'under_evaluation' | 'approved' | 'declined';
  submittedAt?: string;
  approvedAt?: string;
  reviewerNotes?: string;
}

export interface PrototypeRecord {
  id: string;
  projectId: string;
  challengeId?: string;
  reportCode?: string;
  projectTitle: string;
  version: string;
  prototypeName: string;
  prototypeType: 'Hardware (IoT/Sensor)' | 'Material / Chemical' | 'Software / AI Model' | 'Mechanical Rig';
  status: 'design' | 'fabrication' | 'bench_testing' | 'field_validated';
  description: string;
  keySpecifications: Record<string, string>;
  testResults: {
    metric: string;
    target: string;
    achieved: string;
    passed: boolean;
  }[];
  knownLimitations: string;
  nextIterationFocus: string;
  schematicOrRepoUrl?: string;
  updatedAt: string;
}

export interface IndustryPartnerCollab {
  id: string;
  corporateName: string;
  industryDomain: string;
  cin: string;
  csrRegNo: string;
  partnerType: 'Technology / Cloud Sponsor' | 'Manufacturing & Hardware' | 'CSR Research Grant' | 'Industry Mentorship';
  linkedProject: string;
  linkedProjectTitle: string;
  contributionSummary: string;
  pledgeAmount?: number;
  escrowStatus: 'locked' | 'tranche_1_released' | 'tranche_2_released' | 'fully_disbursed';
  mentorName?: string;
  mentorTitle?: string;
  status: 'active' | 'in_review' | 'mou_signed';
  signedDate: string;
}

export interface PilotReadinessCheck {
  prototypeReady: boolean;
  prototypeNotes: string;
  governmentPermission: 'approved' | 'pending' | 'not_requested';
  governmentNotes: string;
  infrastructureAvailable: boolean;
  infrastructureNotes: string;
  industryRequirements: 'complete' | 'in_progress' | 'pending';
  industryNotes: string;
  communityIdentified: boolean;
  communityNotes: string;
  measurementPlanReady: boolean;
  measurementNotes: string;
}

export interface ImpactOutcomeRecord {
  id: string;
  projectId: string;
  projectTitle: string;
  challengeId: string;
  reportCode: string;
  domain: string;
  communityLocation: string;
  district: string;
  pilotDurationMonths: number;
  benefitedHouseholds: number;
  beforeMetrics: {
    metricName: string;
    value: string;
    unit: string;
  }[];
  afterMetrics: {
    metricName: string;
    value: string;
    unit: string;
  }[];
  percentageImprovement: {
    label: string;
    changePct: number; // e.g. +75 or -62
    isPositiveChange: boolean;
  }[];
  citizenVerificationRating: number; // e.g. 4.8 / 5.0
  citizenFeedbackSummary: string;
  nepCreditsGenerated: number;
  completedDate: string;
}

// ==========================================
// SEED PROTOTYPE DATA
// ==========================================

export const ACTIVE_INSTITUTION: HEIProfile = HEI_PROFILES[1]; // BIT Mesra (Default)

export const SEED_FACULTY: FacultyMember[] = [
  {
    id: 'fac_1',
    name: 'Dr. Anandita Sen Sharma',
    designation: 'Professor & Head, Civil & Environmental Engineering',
    department: 'Civil & Environmental Engineering',
    institutionId: 'hei_bit_mesra',
    institutionName: 'BIT Mesra',
    email: 'anandita.sen@bitmesra.ac.in',
    specialization: ['Urban Hydrology', 'Stormwater Drainage', 'Permeable Pavements'],
    activeProjectsCount: 2,
    completedPilotsCount: 3,
    hIndex: 24,
    availableForMentoring: true,
  },
  {
    id: 'fac_2',
    name: 'Dr. Rajeshwar K. Verma',
    designation: 'Associate Professor, Electronics & IoT',
    department: 'Electrical & Electronics Engineering',
    institutionId: 'hei_bit_mesra',
    institutionName: 'BIT Mesra',
    email: 'rkverma@bitmesra.ac.in',
    specialization: ['Embedded Sensor Meshes', 'Ultra-low Power Telemetry', 'Smart Grids'],
    activeProjectsCount: 3,
    completedPilotsCount: 4,
    hIndex: 19,
    availableForMentoring: true,
  },
  {
    id: 'fac_3',
    name: 'Dr. Priya S. Nambiar',
    designation: 'Associate Professor, Computer Science & AI',
    department: 'Computer Science & AI',
    institutionId: 'hei_bit_mesra',
    institutionName: 'BIT Mesra',
    email: 'priya.nambiar@bitmesra.ac.in',
    specialization: ['Spatial Geo-AI', 'Anomaly Detection in Urban Utility Networks', 'Computer Vision'],
    activeProjectsCount: 1,
    completedPilotsCount: 2,
    hIndex: 16,
    availableForMentoring: true,
  },
  {
    id: 'fac_4',
    name: 'Dr. Sunil K. Mahato',
    designation: 'Assistant Professor, Bio-Technology & Agri-Tech',
    department: 'Bio-Technology & Pharmaceutical',
    institutionId: 'hei_bit_mesra',
    institutionName: 'BIT Mesra',
    email: 'sunil.mahato@bitmesra.ac.in',
    specialization: ['Soil Salinity Remediation', 'Bio-fertilizer Formulations', 'Crop Disease Vision AI'],
    activeProjectsCount: 2,
    completedPilotsCount: 1,
    hIndex: 12,
    availableForMentoring: true,
  },
];

export const SEED_STUDENT_RESEARCHERS: StudentResearcher[] = [
  {
    id: 'stu_1',
    name: 'Rohit Kumar Murmu',
    studentId: 'BTECH/CE/2022/045',
    apaarId: 'APAAR-JH-9920-4412',
    department: 'Civil & Environmental Engineering',
    year: '4th Year B.Tech',
    skills: ['Hydraulic Modeling', 'GIS Spatial Mapping', 'AutoCAD Civil 3D'],
    researchHours: 140,
    nepCreditsEarned: 4,
    activeProject: 'proj_bio_drain_01',
    role: 'Lead Hydro-modeling Researcher',
  },
  {
    id: 'stu_2',
    name: 'Ananya Roy',
    studentId: 'BTECH/ECE/2022/102',
    apaarId: 'APAAR-JH-8831-5509',
    department: 'Electrical & Electronics Engineering',
    year: '4th Year B.Tech',
    skills: ['ESP32 / LoRaWAN', 'PCB Layout Design', 'Edge Impulse TinyML'],
    researchHours: 165,
    nepCreditsEarned: 4,
    activeProject: 'proj_sensor_flood_02',
    role: 'IoT Hardware Lead',
  },
  {
    id: 'stu_3',
    name: 'Devashish Pandey',
    studentId: 'MTECH/CS/2023/018',
    apaarId: 'APAAR-JH-7740-9921',
    department: 'Computer Science & AI',
    year: 'M.Tech',
    skills: ['PyTorch', 'Time-series Forecasting', 'FastAPI', 'Docker'],
    researchHours: 210,
    nepCreditsEarned: 6,
    activeProject: 'proj_sensor_flood_02',
    role: 'Predictive Analytics Lead',
  },
  {
    id: 'stu_4',
    name: 'Sneha Kumari',
    studentId: 'BTECH/BT/2023/067',
    apaarId: 'APAAR-JH-6612-3344',
    department: 'Bio-Technology & Pharmaceutical',
    year: '3rd Year B.Tech',
    skills: ['Soil Microbial Analysis', 'Bio-polymer Extraction', 'Spectrophotometry'],
    researchHours: 95,
    nepCreditsEarned: 2,
    activeProject: 'proj_soil_salinity_03',
    role: 'Biochemical Assay Lead',
  },
];

export const SEED_PROPOSALS: ResearchProposal[] = [
  {
    id: 'prop_01',
    challengeId: 'rep_0c92203d19e9bfbb',
    reportCode: 'REP-7429',
    title: 'Multi-Chamber Bioremediation Drainage System for Chronic Low-Lying Waterlogging',
    domain: 'Water Supply & Drainage',
    institutionName: 'BIT Mesra',
    department: 'Civil & Environmental Engineering',
    facultyLead: SEED_FACULTY[0],
    studentTeam: [SEED_STUDENT_RESEARCHERS[0], SEED_STUDENT_RESEARCHERS[1]],
    problemStatement: 'Recurrent flash ponding and backflow in Ward 14 caused by silt-clogged gravity pipes and localized soil saturation.',
    hypothesis: 'Integrating permeable biopolymer sub-base with automated solar-powered LoRa siphon drains will accelerate water dissipation by 65%.',
    methodology: 'Phase 1: 3D hydrodynamic modeling of runoff basin. Phase 2: Fabrication of modular sub-surface bio-drainage cell. Phase 3: Field bench test in campus stormwater ditch. Phase 4: Ward 14 municipal pilot.',
    budgetRequested: 275000,
    estimatedDurationMonths: 4,
    deliverables: ['CAD Schematic Blueprints', 'TinyML Siphon Trigger Firmware', 'Prototype Bio-Cell Unit', 'Municipal Pilot Impact Report'],
    prototypePlan: 'Fabricate 1:1 scale permeable bio-concrete chamber with integrated water-level pressure transducer.',
    pilotPlan: 'Deploy across a 120m test stretch along Old Hazaribagh Road during pre-monsoon showers.',
    status: 'approved',
    submittedAt: '2026-08-20T10:00:00Z',
    approvedAt: '2026-08-25T14:30:00Z',
    reviewerNotes: 'Strong engineering grounding and direct municipal relevance. Approved under University Capstone Grant.',
  },
  {
    id: 'prop_02',
    challengeId: 'rep_agri_blight_02',
    reportCode: 'REP-9104',
    title: 'Microbial Halotolerant Bio-Consortium for Rapid Soil Desalination & Blight Suppression',
    domain: 'Agriculture & Soil Health',
    institutionName: 'BIT Mesra',
    department: 'Bio-Technology & Pharmaceutical',
    facultyLead: SEED_FACULTY[3],
    studentTeam: [SEED_STUDENT_RESEARCHERS[3]],
    problemStatement: 'Persistent soil salinity accumulation (>4.2 dS/m) and root fungal infestation in peri-urban vegetable cluster.',
    hypothesis: 'Inoculation with native Bacillus & Trichoderma strains alongside organic calcium amendments will reduce effective root-zone salinity by 40% in 45 days.',
    methodology: 'Lab culture isolation, pot trials with infected soil samples, formulation of shelf-stable microbial carrier granules, and field testing in 2 farmer demonstration plots.',
    budgetRequested: 180000,
    estimatedDurationMonths: 3,
    deliverables: ['Microbial Strain Sequencing Data', 'Granular Inoculant Formulation Protocol', 'Farmer Demonstration Kit'],
    prototypePlan: 'Batch production of 50kg bio-active granulate in fermentation pilot plant.',
    pilotPlan: 'Apply across 3 acres of affected tomato & eggplant plots in Namkum block.',
    status: 'under_evaluation',
    submittedAt: '2026-08-28T16:00:00Z',
    reviewerNotes: 'Faculty evaluation committee reviewing bio-safety protocols.',
  },
];

export const SEED_PROTOTYPES: PrototypeRecord[] = [
  {
    id: 'proto_01',
    projectId: 'proj_bio_drain_01',
    challengeId: 'rep_0c92203d19e9bfbb',
    reportCode: 'REP-7429',
    projectTitle: 'Multi-Chamber Bioremediation Drainage System',
    version: 'V1.2 (Bench Test Validation)',
    prototypeName: 'HydroCell-Mesh Alpha',
    prototypeType: 'Hardware (IoT/Sensor)',
    status: 'bench_testing',
    description: 'Modular subterranean permeable concrete cell equipped with ultrasonic level sensor, solar-charged LiFePO4 battery, and LoRaWAN telemetry beacon.',
    keySpecifications: {
      'Percolation Rate': '42 L/min/m²',
      'Sensor Accuracy': '± 2 mm ultrasonic depth',
      'Telemetry Protocol': 'LoRaWAN 865-867 MHz (IN865)',
      'Battery Autonomy': '18 days zero-sunlight endurance',
      'Compressive Strength': '32 MPa (Traffic Rated)',
    },
    testResults: [
      { metric: 'Percolation Flow Capacity', target: '> 35 L/min', achieved: '42.4 L/min', passed: true },
      { metric: 'Telemetry Latency to Gateway', target: '< 5 sec', achieved: '1.8 sec', passed: true },
      { metric: 'Continuous Submersion Waterproofing', target: 'IP68 certified', achieved: 'IP68 validated (48h)', passed: true },
      { metric: 'Heavy Vehicle Load Simulation', target: '25 Tonnes', achieved: '28.5 Tonnes', passed: true },
    ],
    knownLimitations: 'Ultrasonic transducer dome requires hydrophobic coating to prevent false echoes during torrential splashback.',
    nextIterationFocus: 'Integrate self-cleaning optical sensor dome and miniaturized gateway relay for V2.0 field pilot unit.',
    schematicOrRepoUrl: 'https://github.com/bitmesra-rnd/hydrocell-mesh-v1',
    updatedAt: '2026-08-30T11:45:00Z',
  },
  {
    id: 'proto_02',
    projectId: 'proj_sensor_flood_02',
    challengeId: 'rep_sensor_flood_01',
    reportCode: 'REP-3810',
    projectTitle: 'Smart Autonomous Early-Warning Flood Node',
    version: 'V2.0 (Pre-Pilot Field Build)',
    prototypeName: 'UrbanEye HydroNode Sentinel',
    prototypeType: 'Hardware (IoT/Sensor)',
    status: 'field_validated',
    description: 'Solar-powered smart culvert monitor with dual millimeter-wave radar and sub-surface pressure transducer for real-time blockage detection.',
    keySpecifications: {
      'Detection Modality': '60GHz mmWave Radar + Hydrostatic Pressure',
      'Power Source': '10W Monocrystalline + 12V 10Ah Battery',
      'Alert Trigger Time': '< 30 seconds upon threshold breach',
      'Operating Temperature': '-5°C to 55°C',
    },
    testResults: [
      { metric: 'Silt / Debris Blockage Precision', target: '> 90%', achieved: '94.2%', passed: true },
      { metric: 'False Alarm Rate in Heavy Rain', target: '< 3%', achieved: '1.1%', passed: true },
      { metric: 'Solar Recharge Efficiency in Monsoons', target: '> 80%', achieved: '87%', passed: true },
    ],
    knownLimitations: 'Requires secure anti-theft pole mount with tamper detection switch.',
    nextIterationFocus: 'Deploy 4 nodes along Main Road culvert network for live municipal pilot.',
    schematicOrRepoUrl: 'https://github.com/bitmesra-rnd/hydronode-sentinel-cad',
    updatedAt: '2026-08-31T15:20:00Z',
  },
];

export const SEED_INDUSTRY_COLLABS: IndustryPartnerCollab[] = [
  {
    id: 'collab_01',
    corporateName: 'Tata Steel CSR & Sustainability Division',
    industryDomain: 'Infrastructure & Materials',
    cin: 'L27100MH1907PLC000260',
    csrRegNo: 'CSR00001294',
    partnerType: 'CSR Research Grant',
    linkedProject: 'proj_bio_drain_01',
    linkedProjectTitle: 'Multi-Chamber Bioremediation Drainage System',
    contributionSummary: 'Co-funding student capstone prototype fabrication and providing corrosion-resistant slag aggregate additives.',
    pledgeAmount: 350000,
    escrowStatus: 'tranche_1_released',
    mentorName: 'Er. Sandeep Mukherjee',
    mentorTitle: 'Chief Civil Engineer, Urban Infrastructure Projects',
    status: 'active',
    signedDate: '2026-08-15',
  },
  {
    id: 'collab_02',
    corporateName: 'Schneider Electric India Innovation Hub',
    industryDomain: 'Smart Grid & IoT Sensors',
    cin: 'U74899DL1995PTC068007',
    csrRegNo: 'CSR00004921',
    partnerType: 'Technology / Cloud Sponsor',
    linkedProject: 'proj_sensor_flood_02',
    linkedProjectTitle: 'Smart Autonomous Early-Warning Flood Node',
    contributionSummary: 'Donated 10 LoRaWAN field gateways and cloud telemetry credits for student research dashboard.',
    pledgeAmount: 200000,
    escrowStatus: 'fully_disbursed',
    mentorName: 'Dr. Vivek Swaminathan',
    mentorTitle: 'Principal IoT Solutions Architect',
    status: 'active',
    signedDate: '2026-07-22',
  },
];

export const SEED_PILOT_READINESS: Record<string, PilotReadinessCheck> = {
  proj_bio_drain_01: {
    prototypeReady: true,
    prototypeNotes: 'V1.2 Bench test passed 42 L/min percolation flow test. 2 units ready for field embedding.',
    governmentPermission: 'approved',
    governmentNotes: 'Ranchi Municipal Corporation (RMC) issued road-cut permit and excavation clearance for Ward 14 test site.',
    infrastructureAvailable: true,
    infrastructureNotes: 'Drainage trench survey completed; solar access verified for telemetry mast.',
    industryRequirements: 'complete',
    industryNotes: 'Tata Steel aggregate shipment delivered to BIT Mesra Civil testing yard.',
    communityIdentified: true,
    communityNotes: 'Ward 14 Resident Welfare Association briefed and agreed to pilot observation schedule.',
    measurementPlanReady: true,
    measurementNotes: 'Baseline waterlogging duration (avg 4.5 hrs) documented with citizen time logs.',
  },
  proj_sensor_flood_02: {
    prototypeReady: true,
    prototypeNotes: '4 HydroNode units calibrated and stress-tested in hydraulic flume.',
    governmentPermission: 'approved',
    governmentNotes: 'Disaster Management Cell approved telemetry integration with Municipal Control Room.',
    infrastructureAvailable: true,
    infrastructureNotes: 'Mounting brackets fabricated for 4 culvert bridges along Main Road.',
    industryRequirements: 'complete',
    industryNotes: 'Schneider Electric cloud gateway live and connected.',
    communityIdentified: true,
    communityNotes: 'Local shopkeepers association notified regarding sensor installations.',
    measurementPlanReady: true,
    measurementNotes: 'Comparison plan against manual flood observation logbooks in place.',
  },
};

export const SEED_IMPACT_OUTCOMES: ImpactOutcomeRecord[] = [
  {
    id: 'impact_01',
    projectId: 'proj_water_filtration_00',
    projectTitle: 'Low-Cost Nano-Clay Arsenic & Heavy Metal Water Filter',
    challengeId: 'rep_water_heavy_metal',
    reportCode: 'REP-1049',
    domain: 'Water Supply & Quality',
    communityLocation: 'Tatisilwai Industrial Cluster, Ranchi',
    district: 'Ranchi',
    pilotDurationMonths: 6,
    benefitedHouseholds: 340,
    beforeMetrics: [
      { metricName: 'Heavy Metal Contamination Index', value: '48.5', unit: 'µg/L' },
      { metricName: 'Clean Potable Water Availability', value: '3.5', unit: 'hrs/day' },
      { metricName: 'Monthly Waterborne Illness Cases', value: '42', unit: 'cases/mo' },
      { metricName: 'ULB Tanker Expenditure', value: '₹1,65,000', unit: '/mo' },
    ],
    afterMetrics: [
      { metricName: 'Heavy Metal Contamination Index', value: '4.2', unit: 'µg/L' },
      { metricName: 'Clean Potable Water Availability', value: '18.0', unit: 'hrs/day' },
      { metricName: 'Monthly Waterborne Illness Cases', value: '6', unit: 'cases/mo' },
      { metricName: 'ULB Tanker Expenditure', value: '₹35,000', unit: '/mo' },
    ],
    percentageImprovement: [
      { label: 'Heavy Metal Contamination Reduction', changePct: -91, isPositiveChange: true },
      { label: 'Clean Water Availability Increase', changePct: 414, isPositiveChange: true },
      { label: 'Waterborne Morbidity Drop', changePct: -85, isPositiveChange: true },
      { label: 'Municipal Tanker Cost Savings', changePct: -78, isPositiveChange: true },
    ],
    citizenVerificationRating: 4.9,
    citizenFeedbackSummary: 'Community water points now supply sweet, odorless drinking water round the clock. 94% of surveyed households verified major quality turnaround.',
    nepCreditsGenerated: 16,
    completedDate: '2026-07-15',
  },
  {
    id: 'impact_02',
    projectId: 'proj_road_patch_00',
    projectTitle: 'Cold-Mix Crumb Rubber Modified Bitumen (CRMB) Pothole Compound',
    challengeId: 'rep_road_crmb',
    reportCode: 'REP-2291',
    domain: 'Roads & Infrastructure',
    communityLocation: 'Bariatu Road Arterial Corridor',
    district: 'Ranchi',
    pilotDurationMonths: 5,
    benefitedHouseholds: 1200,
    beforeMetrics: [
      { metricName: 'Patch Failure Frequency', value: 'Every 22 days', unit: 'mean time to failure' },
      { metricName: 'Monthly Pothole Grievances', value: '76', unit: 'reports/mo' },
      { metricName: 'Average Repair Cost / m²', value: '₹1,450', unit: '/m²' },
    ],
    afterMetrics: [
      { metricName: 'Patch Failure Frequency', value: '0 failures in 150 days', unit: 'zero cracking' },
      { metricName: 'Monthly Pothole Grievances', value: '9', unit: 'reports/mo' },
      { metricName: 'Average Repair Cost / m²', value: '₹680', unit: '/m²' },
    ],
    percentageImprovement: [
      { label: 'Recurrent Pothole Reports Drop', changePct: -88, isPositiveChange: true },
      { label: 'Patch Durability Lifespan', changePct: 580, isPositiveChange: true },
      { label: 'Remediation Cost Reduction', changePct: -53, isPositiveChange: true },
    ],
    citizenVerificationRating: 4.8,
    citizenFeedbackSummary: 'Heavily traversed hospital route stayed completely smooth throughout heavy monsoon downpours with zero pothole reopening.',
    nepCreditsGenerated: 12,
    completedDate: '2026-08-05',
  },
];

/**
 * Calculates Pilot Readiness Status
 */
export function evaluatePilotReadiness(check: PilotReadinessCheck): {
  status: 'READY' | 'BLOCKED';
  score: number;
  blockers: string[];
} {
  const blockers: string[] = [];
  let score = 0;

  if (check.prototypeReady) score += 20;
  else blockers.push('Prototype V1 / V2 fabrication or bench test incomplete');

  if (check.governmentPermission === 'approved') score += 20;
  else blockers.push('Municipal site NOC or road-cut permission pending');

  if (check.infrastructureAvailable) score += 20;
  else blockers.push('Site physical infrastructure / solar / power access pending');

  if (check.industryRequirements === 'complete') score += 20;
  else blockers.push('Industry hardware or cloud component delivery in progress');

  if (check.communityIdentified && check.measurementPlanReady) score += 20;
  else blockers.push('Community stakeholder onboarding or baseline measurement plan missing');

  return {
    status: score >= 80 && blockers.length === 0 ? 'READY' : 'BLOCKED',
    score,
    blockers,
  };
}

export const SEED_EVALUATED_CHALLENGES: EvaluatedChallenge[] = [
  {
    id: 'eval_01',
    challengeId: 'rep_0c92203d19e9bfbb',
    reportCode: 'REP-7429',
    title: 'Multi-Chamber Bioremediation Drainage System for Chronic Low-Lying Waterlogging',
    category: 'Water Supply & Drainage',
    ward: 'Ward 14, Old Hazaribagh Road',
    status: 'TEAM_FORMING',
    nodalDecision: {
      decision: 'ACCEPTED',
      acceptedAt: '2026-08-18T10:30:00Z',
      assignedDepartment: 'Civil & Environmental Engineering',
      assignedFaculty: SEED_FACULTY[0],
    },
    facultyEvaluation: {
      feasibility: 'FEASIBLE',
      technicalNotes: 'Hydrodynamic simulation confirms that subterranean permeable bio-retention cells will relieve gravity drain backflow pressure.',
      evaluatedAt: '2026-08-20T14:15:00Z',
      requiredResources: ['Civil Flume Testing Rig', 'LoRa Sensor Kits', 'Concrete Aggregates'],
    },
    teamFormation: {
      teamStatus: 'Active',
      facultyLead: SEED_FACULTY[0],
      studentMembers: [SEED_STUDENT_RESEARCHERS[0], SEED_STUDENT_RESEARCHERS[1]],
    },
    created_at: '2026-08-18T09:00:00Z',
    updated_at: '2026-08-22T16:00:00Z',
  },
  {
    id: 'eval_02',
    challengeId: 'rep_agri_blight_02',
    reportCode: 'REP-9104',
    title: 'Microbial Halotolerant Bio-Consortium for Rapid Soil Desalination & Blight Suppression',
    category: 'Agriculture & Soil Health',
    ward: 'Namkum Peri-Urban Farming Cluster',
    status: 'FACULTY_EVALUATION',
    nodalDecision: {
      decision: 'ACCEPTED',
      acceptedAt: '2026-08-26T11:00:00Z',
      assignedDepartment: 'Bio-Technology & Pharmaceutical',
      assignedFaculty: SEED_FACULTY[3],
    },
    facultyEvaluation: {
      feasibility: 'FEASIBLE',
      technicalNotes: 'Laboratory culture trials on sampled soil demonstrate 38% electrical conductivity reduction after microbial inoculation.',
      evaluatedAt: '2026-08-28T16:30:00Z',
      requiredResources: ['Fermentation Pilot Chamber', 'Spectrophotometer', 'Soil Testing Assays'],
    },
    teamFormation: {
      teamStatus: 'Forming',
      facultyLead: SEED_FACULTY[3],
      studentMembers: [SEED_STUDENT_RESEARCHERS[3]],
    },
    created_at: '2026-08-26T10:00:00Z',
    updated_at: '2026-08-28T17:00:00Z',
  },
];

/**
 * Calculates an explainable capability match breakdown between a challenge and an HEI profile.
 */
export function getExplainableCapabilityMatch(
  requiredCapabilities: string[],
  institution: HEIProfile = ACTIVE_INSTITUTION
): ExplainableCapabilityMatch {
  const reqCaps = requiredCapabilities && requiredCapabilities.length > 0
    ? requiredCapabilities
    : ['Environmental Engineering', 'IoT Sensor Mesh', 'Hydrodynamic Modeling'];

  const items: CapabilityMatchItem[] = reqCaps.map((req) => {
    const reqLower = req.toLowerCase();
    const isAvailable = institution.capabilities.some((c) =>
      c.toLowerCase().includes(reqLower) || reqLower.includes(c.toLowerCase())
    ) || institution.departments.some((d) =>
      d.toLowerCase().includes(reqLower) || reqLower.includes(d.toLowerCase().split(' ')[0])
    );

    let facilityOrLabName = institution.researchCenters[0];
    if (reqLower.includes('water') || reqLower.includes('drain') || reqLower.includes('hydro')) {
      facilityOrLabName = institution.researchCenters.find((r) => r.toLowerCase().includes('water') || r.toLowerCase().includes('environmental')) || institution.researchCenters[0];
    } else if (reqLower.includes('iot') || reqLower.includes('sensor') || reqLower.includes('grid')) {
      facilityOrLabName = institution.researchCenters.find((r) => r.toLowerCase().includes('sensing') || r.toLowerCase().includes('smart') || r.toLowerCase().includes('prototyping')) || institution.researchCenters[0];
    }

    return {
      requiredCapability: req,
      availableAtHEI: isAvailable,
      facilityOrLabName: isAvailable ? facilityOrLabName : 'Pending Department Expansion',
      notes: isAvailable
        ? `Accredited faculty & laboratory testing facility active at ${institution.shortName}`
        : `External inter-institutional collaboration recommended`,
    };
  });

  const matchingCount = items.filter((i) => i.availableAtHEI).length;
  const total = items.length;
  const scorePct = total > 0 ? Math.round((matchingCount / total) * 100) : 85;

  return {
    overallScorePct: scorePct >= 50 ? scorePct : 75,
    matchingCapabilitiesCount: matchingCount,
    totalRequiredCount: total,
    items,
    matchingDepartment: institution.departments[0],
    recommendedLab: institution.researchCenters[0] || 'Smart Infrastructure Prototyping Facility',
  };
}
