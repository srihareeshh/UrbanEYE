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

