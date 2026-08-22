export type MediaType = 'image' | 'video' | 'audio';

export type LocationSource = 'exif' | 'device' | 'manual';

export interface ExifData {
  make?: string | null;
  model?: string | null;
  dateTimeOriginal?: string | null;
  orientation?: number | null;
  software?: string | null;
  exposureTime?: number | null;
  fNumber?: number | null;
  iso?: number | null;
  latitude?: number;
  longitude?: number;
  altitude?: number | null;
}

export interface EvidenceItem {
  id: string;
  file?: File;
  previewUrl: string;
  mediaType: MediaType;
  originalName: string;
  fileSize: number;
  durationSeconds?: number;
  exif?: ExifData | null;
  deviceInfo?: string | null;
  serverFilePath?: string;
}

export interface LocationState {
  latitude: number;
  longitude: number;
  source: LocationSource;
  accuracy?: number | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
}

export type IssueCategory =
  | 'Roads'
  | 'Water'
  | 'Sanitation'
  | 'Electricity'
  | 'Schools'
  | 'Agriculture'
  | 'Environment'
  | 'Public Services'
  | 'Other';

export type IssueDuration =
  | 'Today'
  | 'A few days'
  | 'A few weeks'
  | 'A few months'
  | 'Longer'
  | 'Not sure';

export type IssueRecurrence =
  | 'First time'
  | 'Sometimes'
  | 'Frequently'
  | 'Almost always'
  | 'Not sure';

export type IssueSeverity = 'Low' | 'Moderate' | 'Serious' | 'Dangerous';

export interface IssueDetailsState {
  category: IssueCategory | '';
  description: string;
  duration: IssueDuration;
  recurrence: IssueRecurrence;
  severity: IssueSeverity;
  isRiskPresent: boolean;
  riskDescription: string;
  smartSuggested: boolean;
}

export type LifecycleStage =
  | 'Submitted'
  | 'Under Review'
  | 'Assigned'
  | 'Action Scheduled'
  | 'In Progress'
  | 'Resolved'
  | 'Citizen Confirmation'
  | 'Confirmed Resolved'
  | 'Follow-up Required';

export interface TimelineEvent {
  id: string;
  report_id: string;
  stage: string;
  actor_type: 'system' | 'authority' | 'citizen';
  actor_name: string;
  title: string;
  description?: string | null;
  created_at: string;
}

export interface AssignmentInfo {
  id: string;
  report_id: string;
  department_name: string;
  officer_name: string;
  scheduled_date?: string | null;
  sla_target_date?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface ResolutionInfo {
  id: string;
  report_id: string;
  resolution_notes: string;
  resolved_by: string;
  resolution_photo_url?: string | null;
  resolution_photo_name?: string | null;
  resolution_timestamp?: string;
  created_at: string;
}

export interface VerificationInfo {
  id: string;
  report_id: string;
  verdict: 'fixed' | 'partially_fixed' | 'not_fixed';
  citizen_notes?: string | null;
  satisfaction_rating?: number | null;
  followUpMedia?: Array<EvidenceItem>;
  verified_at: string;
}

export interface UserNotification {
  id: string;
  user_id: string;
  report_id: string;
  report_code?: string;
  category?: string;
  status?: string;
  event_type: string;
  title: string;
  message: string;
  is_read: number;
  created_at: string;
}

export type CommunitySortOption = 'nearby' | 'supported' | 'recent' | 'serious';

export interface StoredReport {
  id: string;
  report_code: string;
  user_id?: string;
  category: IssueCategory;
  description: string;
  duration: string;
  recurrence: string;
  severity: string;
  is_risk_present: number;
  risk_description?: string | null;
  status: LifecycleStage | string;
  civic_priority_score: number;
  created_at: string;
  updated_at: string;
  latitude: number;
  longitude: number;
  location_source: LocationSource;
  accuracy?: number | null;
  address?: string | null;
  city?: string | null;
  photo_url?: string | null;
  media_count?: number;
  upvote_count?: number;
  follower_count?: number;
  is_upvoted?: boolean;
  is_followed?: boolean;
  distance_km?: number | null;
  approx_location?: string;
  media?: Array<{
    id: string;
    media_type: MediaType;
    original_name: string;
    file_name: string;
    file_path: string;
    file_size: number;
    duration_seconds?: number;
  }>;
  metadata?: Array<{
    id: string;
    exif?: ExifData | null;
    deviceInfo?: string | null;
  }>;
  timeline?: TimelineEvent[];
  assignment?: AssignmentInfo | null;
  resolution?: ResolutionInfo | null;
  verifications?: VerificationInfo[];
}

export interface UserActivityData {
  myReports: StoredReport[];
  followingReports: StoredReport[];
  upvotedReports: StoredReport[];
  notifications: UserNotification[];
  unreadCount: number;
}

<<<<<<< HEAD
=======
// ==========================================
// MULTI-STAKEHOLDER DATA MODELS
// ==========================================

export type StakeholderRole = 'citizen' | 'municipal' | 'institution' | 'industry';

export interface WardMetric {
  ward: string;
  active: number;
  resolved: number;
  highSeverity: number;
  compliance: number;
}

export interface MunicipalKPIs {
  totalReports: number;
  activeGrievances: number;
  pendingTriage: number;
  escalatedToHEI: number;
  resolvedCount: number;
  slaCompliancePct: number;
  avgTATDays: number;
  wards: WardMetric[];
}

export interface HEIChallenge {
  id: string;
  report_id: string;
  report_code?: string;
  title: string;
  description: string;
  category: IssueCategory | string;
  severity: IssueSeverity | string;
  ward: string;
  department_match: string;
  match_percentage: number;
  status: 'open' | 'claimed' | 'in_progress' | 'completed';
  escalated_by: string;
  research_brief?: string;
  civic_priority_score?: number;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface StudentTeamMember {
  name: string;
  studentId: string;
  apaarId: string;
  role: string;
  hours: number;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  stage_index: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  deliverables?: {
    schematicUrl?: string;
    videoUrl?: string;
    githubUrl?: string;
    prototypeUrl?: string;
    telemetryUrl?: string;
    testDataNotes?: string;
    deploymentTarget?: string;
    expectedCompletion?: string;
  } | null;
  research_hours: number;
  completed_at?: string | null;
  created_at: string;
}

export interface EscrowTranche {
  id: string;
  grant_id: string;
  tranche_number: number;
  percentage: number;
  amount: number;
  trigger_condition?: string;
  condition_milestone?: string;
  status: 'escrow_locked' | 'approved' | 'disbursed' | 'released';
  disbursed_at?: string | null;
  release_notes?: string | null;
  created_at: string;
}

export interface CSRGrant {
  id: string;
  project_id: string;
  project_title?: string;
  corporate_name: string;
  cin: string;
  cin_number?: string;
  csr_reg_no: string;
  csr_reg_number?: string;
  contact_person?: string;
  contact_email?: string;
  pledge_amount: number;
  total_pledge_amount?: number;
  disbursed_amount: number;
  sdg_goal?: string;
  status: 'pledged' | 'partially_disbursed' | 'fully_disbursed' | string;
  tranches?: EscrowTranche[];
  created_at: string;
  updated_at: string;
}

export interface HEIProject {
  id: string;
  challenge_id?: string;
  report_id: string;
  report_code?: string;
  report_category?: string;
  title: string;
  institution_name: string;
  department: string;
  faculty_lead: string;
  faculty_email?: string;
  student_team: StudentTeamMember[];
  current_stage: number; // 1: Feasibility, 2: Simulation, 3: Prototype, 4: Field Deployment
  total_research_hours: number;
  total_field_hours: number;
  funding_goal: number;
  funding_pledged: number;
  sdg_goals: string[];
  abstract?: string;
  status: 'active' | 'pilot_ready' | 'deployed' | 'completed';
  milestones?: ProjectMilestone[];
  grants?: CSRGrant[];
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface NEPCreditRecord {
  id: string;
  student_name: string;
  student_id: string;
  apaar_id: string;
  institution_name: string;
  project_id: string;
  project_title?: string;
  research_hours: number;
  field_hours: number;
  credits_awarded: number;
  verification_hash: string;
  certificate_issued_at: string;
  created_at: string;
}

export interface CorporateMentor {
  id: string;
  name: string;
  company: string;
  designation: string;
  expertise_domain: string;
  expertise?: string[];
  email: string;
  office_hours_slot: string;
  hours_per_week?: number;
  status: string;
  created_at: string;
}

export interface TechTransferAgreement {
  id: string;
  project_id: string;
  project_title?: string;
  institution_name?: string;
  corporate_partner: string;
  municipal_partner: string;
  agreement_type: string;
  royalty_percentage: number;
  status: 'drafted' | 'in_review' | 'signed';
  terms_summary?: string;
  signed_at?: string | null;
  created_at: string;
}

>>>>>>> 24fe15c (added municipality,institution,government dashboards)
