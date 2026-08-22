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
import { Navbar } from './components/Navbar';
import { MediaDropzone } from './components/MediaDropzone';
import { AudioRecorder } from './components/AudioRecorder';
import { LocationPicker } from './components/LocationPicker';
import { IssueDetailsForm } from './components/IssueDetailsForm';
import { ReportReview } from './components/ReportReview';
import { SubmissionSuccess } from './components/SubmissionSuccess';
import { ReportsTracker } from './components/ReportsTracker';
import { ReportDetailView } from './components/ReportDetailView';
import { CommunityMap } from './components/CommunityMap';
import type {
  EvidenceItem,
  LocationState,
  IssueDetailsState,
  StoredReport,
} from './types';

export function App() {
  const [currentView, setCurrentView] = useState<'report' | 'tracker' | 'community' | 'detail'>('report');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
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

  // Initialize theme & load report counts
  useEffect(() => {
    const savedTheme = (localStorage.getItem('alcheminds-theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const savedDraft = localStorage.getItem('alcheminds-draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.details) setDetails(draft.details);
        if (draft.location) setLocation(draft.location);
      } catch (e) {}
    }

    fetch('/api/reports')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.reports) setReportCount(data.reports.length);
      })
      .catch(() => {});
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('alcheminds-theme', nextTheme);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddEvidence = (items: EvidenceItem[]) => {
    setEvidenceList((prev) => [...prev, ...items]);
    showToast(`Added ${items.length} evidence item(s)`);
  };

  const handleRemoveEvidence = (id: string) => {
    setEvidenceList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleExifLocationFound = (newLoc: LocationState) => {
    setLocation(newLoc);
    showToast('📍 Exact location detected from photo EXIF metadata!');
  };

  const handleAudioReady = (audioItem: EvidenceItem, transcript?: string) => {
    setEvidenceList((prev) => {
      const filtered = prev.filter((item) => item.mediaType !== 'audio');
      return [...filtered, audioItem];
    });

    if (transcript && !details.description) {
      setDetails((prev) => ({
        ...prev,
        description: transcript,
      }));
      showToast('Transcribed voice note to description');
    } else {
      showToast('Voice note attached to report');
    }
  };

  const handleSaveDraft = () => {
    const draftData = {
      details,
      location,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('alcheminds-draft', JSON.stringify(draftData));
    showToast('✓ Report draft saved locally');
  };

  const validateStep1 = () => {
    if (evidenceList.length === 0 && !details.description.trim()) {
      showToast('Please add at least one photo/audio/video or enter a description.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!details.category) {
      showToast('Please choose an issue category.');
      return false;
    }
    return true;
  };

  const handleSubmitReport = async () => {
    setIsSubmitting(true);
    setSubmitProgressText('Uploading evidence media...');

    try {
      let uploadedMedia: any[] = [];

      if (evidenceList.length > 0) {
        const formData = new FormData();
        for (const item of evidenceList) {
          if (item.file) {
            formData.append('files', item.file);
          }
        }

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error('Failed to upload media files.');
        }

        const uploadData = await uploadRes.json();
        uploadedMedia = uploadData.files || [];
      }

      setSubmitProgressText('Registering report & initiating lifecycle audit...');

      const payload = {
        category: details.category,
        description: details.description,
        duration: details.duration,
        recurrence: details.recurrence,
        severity: details.severity,
        isRiskPresent: details.isRiskPresent,
        riskDescription: details.riskDescription,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          source: location.source,
          accuracy: location.accuracy,
          address: location.address,
          city: location.city,
          state: location.state,
          postalCode: location.postalCode,
        },
        media: uploadedMedia.map((m) => ({
          mediaId: m.mediaId,
          mediaType: m.mediaType,
          originalName: m.originalName,
          fileName: m.fileName,
          filePath: m.filePath,
          mimeType: m.mimeType,
          fileSize: m.fileSize,
          exif: m.exif,
        })),
        smartSuggested: details.smartSuggested,
      };

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to persist civic report.');
      }

      const resData = await res.json();
      setSubmittedReport(resData.report);
      setReportCount((prev) => prev + 1);

      localStorage.removeItem('alcheminds-draft');
      setStep(4);
    } catch (err: any) {
      console.error('Submission error:', err);
      showToast(err.message || 'An error occurred during submission.');
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

  const handleSelectReport = (reportId: string) => {
    setSelectedReportId(reportId);
    setCurrentView('detail');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Top Bar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          setSelectedReportId(null);
          if (view === 'report' && step === 4) handleResetForm();
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
        reportCount={reportCount}
      />

      {/* Community Map — full-bleed, no container padding */}
      {currentView === 'community' && (
        <CommunityMap
          onViewReport={(id) => {
            setSelectedReportId(id);
            setCurrentView('detail');
          }}
        />
      )}

      {/* Main Container — report / tracker / detail views */}
      <main className="container" style={{ marginTop: currentView === 'community' ? 0 : '1.5rem', flex: 1, display: currentView === 'community' ? 'none' : undefined }}>
        {/* Toast Notification */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 1000,
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--accent-amber)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Sparkles size={16} color="var(--accent-amber)" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* View: Report Detail Lifecycle View */}
        {currentView === 'detail' && selectedReportId ? (
          <ReportDetailView
            reportId={selectedReportId}
            onBack={() => {
              setSelectedReportId(null);
              setCurrentView('tracker');
            }}
          />
        ) : currentView === 'tracker' ? (
          /* View: Registry / Tracker View */
          <ReportsTracker
            onNewReport={handleResetForm}
            onSelectReport={handleSelectReport}
          />
        ) : currentView === 'community' ? null : (
          /* View 3: Issue Reporting Flow (Steps 1 to 4) */
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

      {/* Minimal Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '1.25rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Alcheminds</span> — Phase 1, 2 & 3: Reporting · Lifecycle · Community Map
          </div>
          <div className="mono">
            7-Stage Lifecycle • Clustering • Civic Hotspots • Pattern Detection
          </div>
        </div>
      </footer>
    </div>
  );
}
export default App;
