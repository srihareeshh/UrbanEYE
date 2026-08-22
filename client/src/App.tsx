import { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Camera,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Navbar, type View } from './components/Navbar';
import { MediaDropzone } from './components/MediaDropzone';
import { AudioRecorder } from './components/AudioRecorder';
import { LocationPicker } from './components/LocationPicker';
import { IssueDetailsForm } from './components/IssueDetailsForm';
import { ReportReview } from './components/ReportReview';
import { SubmissionSuccess } from './components/SubmissionSuccess';
import { ReportsTracker } from './components/ReportsTracker';
import { ReportDetailView } from './components/ReportDetailView';
import { CommunityIssuesFeed } from './components/CommunityIssuesFeed';
import { CommunityMap } from './components/CommunityMap';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GlobalProvider, useGlobalStore } from './store/globalStore';
import { MunicipalDashboard } from './components/municipal/MunicipalDashboard';
import { InstitutionDashboard } from './components/institution/InstitutionDashboard';
import { IndustryDashboard } from './components/industry/IndustryDashboard';
import type {
  EvidenceItem,
  LocationState,
  IssueDetailsState,
  StoredReport,
} from './types';
import { apiFetch, getCitizenUserId } from './utils/userSession';

function AppContent() {
  const { currentRole, setRole } = useGlobalStore();

  const [currentView, setCurrentView] = useState<View>('community');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [mapFocusReportId, setMapFocusReportId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [step, setStep] = useState<number>(1);

  // State: Evidence Items
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);

  // State: Location
  const [location, setLocation] = useState<LocationState>({
    latitude: 19.0760,
    longitude: 72.8777,
    source: 'manual',
    accuracy: null,
    address: 'Mumbai, Maharashtra, India',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
  });

  // State: Issue Details
  const [details, setDetails] = useState<IssueDetailsState>({
    category: '',
    description: '',
    duration: 'Today',
    recurrence: 'First time',
    severity: 'Moderate',
    isRiskPresent: false,
    riskDescription: '',
    smartSuggested: false,
  });

  // State: Submission & Result
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgressText, setSubmitProgressText] = useState('');
  const [submittedReport, setSubmittedReport] = useState<StoredReport | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [reportCount, setReportCount] = useState<number>(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);

  // URL route sync on load
  useEffect(() => {
    const pathname = window.location.pathname.toLowerCase();
    if (pathname.includes('/municipal')) {
      setRole('municipal');
    } else if (pathname.includes('/institution')) {
      setRole('institution');
    } else if (pathname.includes('/industry')) {
      setRole('industry');
    }
  }, [setRole]);

  // Initialize citizen user ID, theme & load counts
  useEffect(() => {
    getCitizenUserId(); // Ensure citizen identity initialized

    const savedTheme = (localStorage.getItem('alcheminds-theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const savedDraft = localStorage.getItem('alcheminds-draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.details) setDetails(draft.details);
        if (draft.location) {
          const lat = Number(draft.location.latitude);
          const lng = Number(draft.location.longitude);
          setLocation((prev) => ({
            ...prev,
            ...draft.location,
            latitude: !isNaN(lat) && lat !== 0 ? lat : 19.0760,
            longitude: !isNaN(lng) && lng !== 0 ? lng : 72.8777,
          }));
        }
      } catch (e) {}
    }

    const loadMetrics = async () => {
      try {
        const [repRes, actRes] = await Promise.all([
          apiFetch('/api/reports'),
          apiFetch('/api/user/activity'),
        ]);

        if (repRes.ok) {
          const data = await repRes.json();
          if (data && data.reports) setReportCount(data.reports.length);
        }

        if (actRes.ok) {
          const actData = await actRes.json();
          setUnreadNotificationsCount(actData.unreadCount || 0);
        }
      } catch (e) {}
    };

    loadMetrics();
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('alcheminds-theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Evidence handlers
  const handleAddEvidence = (items: EvidenceItem[]) => {
    setEvidenceList((prev) => [...prev, ...items]);
  };

  const handleRemoveEvidence = (id: string) => {
    setEvidenceList((prev) => prev.filter((e) => e.id !== id));
  };

  const handleExifLocationFound = (loc: LocationState) => {
    if (!loc || isNaN(loc.latitude) || isNaN(loc.longitude) || loc.latitude === 0 || loc.longitude === 0) return;
    setLocation(loc);
    showToast('✓ Auto-extracted GPS coordinates from photo EXIF metadata');
  };

  const handleAudioReady = (audioItem: EvidenceItem, transcript?: string) => {
    setEvidenceList((prev) => [...prev.filter((e) => e.mediaType !== 'audio'), audioItem]);
    if (transcript && transcript.trim()) {
      setDetails((prev) => ({
        ...prev,
        description: prev.description ? `${prev.description}\n[Audio Note]: ${transcript}` : transcript,
      }));
      showToast('✓ Audio note & transcription added to evidence.');
    } else {
      showToast('✓ Voice note recorded and attached.');
    }
  };

  // Validation
  const validateStep1 = (): boolean => {
    if (evidenceList.length === 0) {
      showToast('Please attach at least one photo, video, or voice recording.');
      return false;
    }
    if (location.latitude === null || location.longitude === null) {
      showToast('Please specify the location on the map.');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!details.category) {
      showToast('Please select a category for this issue.');
      return false;
    }
    if (!details.description || details.description.trim().length < 10) {
      showToast('Please provide a description of at least 10 characters.');
      return false;
    }
    return true;
  };

  // Draft saving
  const handleSaveDraft = () => {
    const draft = {
      details,
      location,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('alcheminds-draft', JSON.stringify(draft));
    showToast('Draft saved to local storage.');
  };

  // Submission handler
  const handleSubmitReport = async () => {
    setIsSubmitting(true);
    setSubmitProgressText('Analyzing evidence & preparing submission...');

    try {
      const formData = new FormData();
      evidenceList.forEach((ev) => {
        if (ev.file) {
          formData.append('media', ev.file, ev.originalName);
        }
      });

      formData.append('category', details.category);
      formData.append('description', details.description);
      formData.append('duration', details.duration);
      formData.append('recurrence', details.recurrence);
      formData.append('severity', details.severity);
      formData.append('is_risk_present', details.isRiskPresent ? 'true' : 'false');
      formData.append('risk_description', details.riskDescription || '');
      formData.append('latitude', location.latitude?.toString() || '');
      formData.append('longitude', location.longitude?.toString() || '');
      formData.append('location_source', location.source);
      formData.append('location_accuracy', location.accuracy?.toString() || '');
      formData.append('address', location.address || '');
      formData.append('city', location.city || '');
      formData.append('state', location.state || '');
      formData.append('postal_code', location.postalCode || '');

      setSubmitProgressText('Calculating civic priority & submitting to municipal triage queue...');

      const response = await apiFetch('/api/reports', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Submission failed.');
      }

      const result = await response.json();
      setSubmittedReport(result.report);
      localStorage.removeItem('alcheminds-draft');
      setStep(4);
      setReportCount((prev) => prev + 1);
    } catch (err: any) {
      console.error('Submission error:', err);
      showToast(err.message || 'Failed to submit report. Please retry.');
    } finally {
      setIsSubmitting(false);
      setSubmitProgressText('');
    }
  };

  const handleResetForm = () => {
    setEvidenceList([]);
    setDetails({
      category: '',
      description: '',
      duration: 'Today',
      recurrence: 'First time',
      severity: 'Moderate',
      isRiskPresent: false,
      riskDescription: '',
      smartSuggested: false,
    });
    setSubmittedReport(null);
    setStep(1);
    setCurrentView('report');
  };

  const handleSelectReport = (reportOrId: StoredReport | string) => {
    const id = typeof reportOrId === 'string' ? reportOrId : reportOrId.id;
    setSelectedReportId(id);
    setCurrentView('detail');
  };

  const handleViewOnMap = (report: StoredReport) => {
    if (report.latitude && report.longitude) {
      setMapCenter([report.latitude, report.longitude]);
      setMapFocusReportId(report.id);
      setCurrentView('map');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        position: 'relative',
      }}
    >
      {/* Universal Navigation Header with Quad-Stakeholder Role Switcher */}
      <Navbar
        currentView={currentView}
        onChangeView={(v) => {
          setCurrentView(v);
          if (v === 'report' && step === 4) {
            handleResetForm();
          }
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        reportCount={reportCount}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {/* RENDER STAKEHOLDER VIEWS */}
      {currentRole === 'municipal' ? (
        <main className="container" style={{ marginTop: '1.5rem', flex: 1, paddingBottom: '2.5rem', overflowY: 'auto' }}>
          <MunicipalDashboard />
        </main>
      ) : currentRole === 'institution' ? (
        <main className="container" style={{ marginTop: '1.5rem', flex: 1, paddingBottom: '2.5rem', overflowY: 'auto' }}>
          <InstitutionDashboard />
        </main>
      ) : currentRole === 'industry' ? (
        <main className="container" style={{ marginTop: '1.5rem', flex: 1, paddingBottom: '2.5rem', overflowY: 'auto' }}>
          <IndustryDashboard />
        </main>
      ) : (
        /* CITIZEN VIEWS */
        <>
          {/* Full Screen Interactive Map View */}
          {currentView === 'map' && (
            <div style={{ flex: 1, height: 'calc(100vh - 64px)', position: 'relative', overflow: 'hidden' }}>
              <ErrorBoundary fallbackTitle="Map failed to load. Please refresh.">
                <CommunityMap
                  initialSelectedReportId={mapFocusReportId}
                  initialCenter={mapCenter}
                  onViewReport={(id) => {
                    setSelectedReportId(id);
                    setCurrentView('detail');
                  }}
                />
              </ErrorBoundary>
            </div>
          )}

          {/* Main Container — report / community / tracker / detail views */}
          <main
            className="container"
            style={{
              marginTop: '1.5rem',
              flex: 1,
              display: currentView === 'map' ? 'none' : 'block',
              paddingBottom: '2.5rem',
              overflowY: 'auto',
            }}
          >
            {/* Toast Notification */}
            {toastMessage && (
              <div
                style={{
                  position: 'fixed',
                  bottom: '24px',
                  right: '24px',
                  zIndex: 2000,
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--accent-amber)',
                  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.45)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.8rem 1.35rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  animation: 'slideUp 0.2s ease-out',
                }}
              >
                <Sparkles size={16} color="var(--accent-amber)" />
                <span>{toastMessage}</span>
              </div>
            )}

            {/* View 1: Report Detail Lifecycle View */}
            {currentView === 'detail' && selectedReportId ? (
              <ReportDetailView
                reportId={selectedReportId}
                onBack={() => {
                  setSelectedReportId(null);
                  setCurrentView('community');
                }}
                onViewOnMap={handleViewOnMap}
                onShowToast={showToast}
              />
            ) : currentView === 'community' ? (
              /* View 2: Community Issues Feed & Upvotes */
              <CommunityIssuesFeed
                onSelectIssue={handleSelectReport}
                onViewOnMap={handleViewOnMap}
                onShowToast={showToast}
              />
            ) : currentView === 'tracker' ? (
              /* View 3: Registry / My Activity & Updates View */
              <ReportsTracker
                onNewReport={handleResetForm}
                onSelectReport={handleSelectReport}
                onViewOnMap={handleViewOnMap}
              />
            ) : (
              /* View 4: Issue Reporting Flow (Steps 1 to 4) */
              <div>
                {/* Step Wizard Progress Bar (Steps 1 to 3) */}
                {step < 4 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1.75rem',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-full)',
                      padding: '0.4rem 0.6rem',
                    }}
                  >
                    {[
                      { num: 1, label: 'Evidence & Location', icon: <Camera size={13} /> },
                      { num: 2, label: 'Issue Details', icon: <FileText size={13} /> },
                      { num: 3, label: 'Review & Submit', icon: <ShieldAlert size={13} /> },
                    ].map((s) => {
                      const isActive = step === s.num;
                      const isCompleted = step > s.num;

                      return (
                        <button
                          key={s.num}
                          type="button"
                          onClick={() => {
                            if (s.num === 1) setStep(1);
                            if (s.num === 2 && validateStep1()) setStep(2);
                            if (s.num === 3 && validateStep1() && validateStep2()) setStep(3);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.45rem 0.9rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.78125rem',
                            fontWeight: isActive ? 700 : 500,
                            backgroundColor: isActive
                              ? 'var(--accent-amber)'
                              : isCompleted
                              ? 'var(--bg-elevated)'
                              : 'transparent',
                            color: isActive
                              ? '#000000'
                              : isCompleted
                              ? 'var(--text-primary)'
                              : 'var(--text-muted)',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {isCompleted ? <CheckCircle2 size={13} color="var(--accent-emerald)" /> : s.icon}
                          <span className="mono">{s.num}.</span>
                          <span>{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* STEP 1: Evidence & Location */}
                {step === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="card">
                      <div style={{ marginBottom: '1rem' }}>
                        <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Report a Civic Issue</h1>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Provide any evidence you have (photo, video, audio note, or text). Location is automatically extracted from photo EXIF metadata.
                        </p>
                      </div>

                      <MediaDropzone
                        evidenceList={evidenceList}
                        onAddEvidence={handleAddEvidence}
                        onRemoveEvidence={handleRemoveEvidence}
                        onExifLocationFound={handleExifLocationFound}
                      />

                      <AudioRecorder
                        onAudioReady={handleAudioReady}
                        existingAudio={evidenceList.find((e) => e.mediaType === 'audio')}
                        onRemoveAudio={() => {
                          setEvidenceList((prev) => prev.filter((e) => e.mediaType !== 'audio'));
                        }}
                      />
                    </div>

                    <LocationPicker
                      location={location}
                      onChangeLocation={(newLoc) => setLocation(newLoc)}
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (validateStep1()) setStep(2);
                        }}
                        className="btn btn-primary btn-lg"
                      >
                        <span>Proceed to Issue Details</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Issue Details & Smart Assistance */}
                {step === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="card">
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Problem Details & Urgency</h2>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Structure the incident to help calculate the Civic Priority Score.
                      </p>
                    </div>

                    <IssueDetailsForm
                      details={details}
                      onChangeDetails={(newDetails) => setDetails(newDetails)}
                      mediaNames={evidenceList.map((e) => e.originalName)}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="btn btn-secondary"
                      >
                        <ArrowLeft size={16} />
                        <span>Back to Evidence</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (validateStep2()) setStep(3);
                        }}
                        className="btn btn-primary btn-lg"
                      >
                        <span>Review Report</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Review & Submit */}
                {step === 3 && (
                  <ReportReview
                    evidenceList={evidenceList}
                    location={location}
                    details={details}
                    onEditStep={(targetStep) => setStep(targetStep)}
                    onSubmit={handleSubmitReport}
                    onSaveDraft={handleSaveDraft}
                    isSubmitting={isSubmitting}
                    submitProgressText={submitProgressText}
                  />
                )}

                {/* STEP 4: Success Confirmation */}
                {step === 4 && submittedReport && (
                  <SubmissionSuccess
                    report={submittedReport}
                    onReset={handleResetForm}
                    onViewTracker={() => {
                      setSelectedReportId(submittedReport.id);
                      setCurrentView('detail');
                    }}
                  />
                )}
              </div>
            )}
          </main>
        </>
      )}

      {/* Minimal Footer */}
      {currentView !== 'map' && (
        <footer
          style={{
            borderTop: '1px solid var(--border-subtle)',
            padding: '1.25rem',
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Alcheminds Ecosystem</span> — Quad-Stakeholder Civic & Academic Innovation Platform
            </div>
            <div className="mono">
              Citizens · Municipal ULB · Universities (NEP 2020) · Industry (CSR Escrow)
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export function App() {
  return (
    <GlobalProvider>
      <AppContent />
    </GlobalProvider>
  );
}

export default App;
