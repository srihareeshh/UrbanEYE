import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Layers,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  Bell,
  BellOff,
  Navigation,
  Users,
  GraduationCap,
} from 'lucide-react';
import { LifecycleStepper } from './LifecycleStepper';
import { ActivityTimeline } from './ActivityTimeline';
import { AssignmentCard } from './AssignmentCard';
import { BeforeAfterViewer } from './BeforeAfterViewer';
import { CitizenVerification } from './CitizenVerification';
import { AuthoritySimulator } from './AuthoritySimulator';
import { HEIInnovationTrack } from './HEIInnovationTrack';
import type { StoredReport, VerificationInfo } from '../types';
import { formatBytes } from '../utils/exifHelper';
import { apiFetch } from '../utils/userSession';

interface ReportDetailViewProps {
  reportId: string;
  onBack: () => void;
  onViewOnMap?: (report: StoredReport) => void;
  onShowToast?: (msg: string) => void;
}

export const ReportDetailView: React.FC<ReportDetailViewProps> = ({
  reportId,
  onBack,
  onViewOnMap,
  onShowToast,
}) => {
  const [report, setReport] = useState<StoredReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [upvotePop, setUpvotePop] = useState(false);

  // Fetch complete lifecycle report
  const fetchReportDetails = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/reports/${reportId}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
      }
    } catch (err) {
      console.error('Failed to load report lifecycle:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportDetails();
  }, [reportId]);

  const copyCode = () => {
    if (!report) return;
    navigator.clipboard.writeText(report.report_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpvoteToggle = async () => {
    if (!report || isUpvoting) return;

    setIsUpvoting(true);
    const nextIsUpvoted = !report.is_upvoted;
    const currentCount = report.upvote_count || 0;

    if (nextIsUpvoted) {
      setUpvotePop(true);
      setTimeout(() => setUpvotePop(false), 700);
    }

    // Optimistic
    setReport((prev) =>
      prev
        ? {
            ...prev,
            is_upvoted: nextIsUpvoted,
            upvote_count: nextIsUpvoted ? currentCount + 1 : Math.max(0, currentCount - 1),
            is_followed: nextIsUpvoted ? true : prev.is_followed,
          }
        : null
    );

    try {
      const res = await apiFetch(`/api/reports/${report.id}/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        setReport((prev) =>
          prev
            ? {
                ...prev,
                is_upvoted: data.is_upvoted,
                upvote_count: data.upvote_count,
                is_followed: data.is_followed,
                follower_count: data.follower_count,
              }
            : null
        );
        if (onShowToast) {
          onShowToast(data.message || (data.is_upvoted ? 'Support recorded' : 'Support removed'));
        }
      }
    } catch (e) {
      console.error('Upvote error:', e);
      fetchReportDetails();
    } finally {
      setIsUpvoting(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!report || isFollowing) return;

    setIsFollowing(true);
    const nextFollow = !report.is_followed;
    const currentCount = report.follower_count || 0;

    setReport((prev) =>
      prev
        ? {
            ...prev,
            is_followed: nextFollow,
            follower_count: nextFollow ? currentCount + 1 : Math.max(0, currentCount - 1),
          }
        : null
    );

    try {
      const res = await apiFetch(`/api/reports/${report.id}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        setReport((prev) =>
          prev
            ? {
                ...prev,
                is_followed: data.is_followed,
                follower_count: data.follower_count,
              }
            : null
        );
        if (onShowToast) {
          onShowToast(data.message || (data.is_followed ? 'Following issue' : 'Unfollowed issue'));
        }
      }
    } catch (e) {
      console.error('Follow error:', e);
      fetchReportDetails();
    } finally {
      setIsFollowing(false);
    }
  };

  const handleVerificationSubmitted = (_verification: VerificationInfo, _newStatus: string) => {
    fetchReportDetails();
  };

  if (isLoading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        Loading incident lifecycle and timeline...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Report Not Found</div>
        <button type="button" onClick={onBack} className="btn btn-secondary btn-sm">
          Return to Registry
        </button>
      </div>
    );
  }

  // Get primary citizen photo for before/after comparison if available
  const primaryCitizenPhoto = report.media?.find((m) => m.media_type === 'image')?.file_path;
  const resolutionPhoto = report.resolution?.resolution_photo_url;
  const isUpvoted = !!report.is_upvoted;
  const isFollowed = !!report.is_followed;
  const upvoteCount = report.upvote_count || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header Card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <button
            type="button"
            onClick={onBack}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.35rem 0.65rem' }}
          >
            <ArrowLeft size={15} />
            <span>Back</span>
          </button>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {onViewOnMap && (
              <button
                type="button"
                onClick={() => onViewOnMap(report)}
                className="btn btn-secondary btn-sm"
                title="View on Community Map"
              >
                <Navigation size={13} color="var(--accent-amber)" />
                <span>View on Map</span>
              </button>
            )}

            <button
              type="button"
              onClick={fetchReportDetails}
              className="btn btn-secondary btn-sm"
              title="Refresh timeline"
            >
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={copyCode}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              {copied ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Share ID'}</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                {report.report_code}
              </span>
              <span className="badge badge-amber">{report.category}</span>
              <span className="badge badge-indigo">Priority: {report.civic_priority_score}/100</span>
              {(report.is_escalated_to_hei || report.hei_challenge || report.hei_project) && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.55rem',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    color: 'var(--accent-indigo)',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <GraduationCap size={13} />
                  HEI Capstone Track Active
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Reported on {new Date(report.created_at).toLocaleString()} by Citizen Reporter
            </div>
          </div>
        </div>

        {/* Civic Collective Support Action Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '1.15rem',
            paddingTop: '0.9rem',
            borderTop: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {/* Upvote Button */}
            <button
              type="button"
              onClick={handleUpvoteToggle}
              disabled={isUpvoting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.45rem 1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: isUpvoted ? '1px solid var(--accent-amber)' : '1px solid var(--border-medium)',
                backgroundColor: isUpvoted ? 'var(--accent-amber)' : 'var(--bg-elevated)',
                color: isUpvoted ? '#000000' : 'var(--text-primary)',
                transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: upvotePop ? 'scale(1.08)' : 'scale(1)',
                boxShadow: isUpvoted ? '0 2px 12px var(--accent-amber-glow)' : 'none',
              }}
            >
              {isUpvoted ? (
                <Check size={16} strokeWidth={2.6} />
              ) : (
                <Sparkles size={16} color="var(--accent-amber)" />
              )}
              <span>{isUpvoted ? 'Upvoted ✓' : 'Support This Issue'}</span>
              <span
                className="mono"
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  backgroundColor: isUpvoted ? 'rgba(0,0,0,0.18)' : 'var(--bg-card)',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '10px',
                }}
              >
                {upvoteCount}
              </span>
            </button>

            {/* Follow Toggle Button */}
            <button
              type="button"
              onClick={handleFollowToggle}
              disabled={isFollowing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: isFollowed ? '1px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
                backgroundColor: isFollowed ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-elevated)',
                color: isFollowed ? '#10b981' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              {isFollowed ? <Bell size={14} /> : <BellOff size={14} />}
              <span>{isFollowed ? 'Following Updates' : 'Follow for Updates'}</span>
            </button>
          </div>

          {/* Civic Community Context */}
          <div
            style={{
              fontSize: '0.78125rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Users size={14} color="var(--accent-amber)" />
            <span>
              {upvoteCount > 0
                ? `${upvoteCount} people in this community support this report`
                : 'Be the first citizen to support this report'}
            </span>
          </div>
        </div>
      </div>

      {/* 1. Live 7-Stage Lifecycle Stepper */}
      <LifecycleStepper currentStatus={report.status} />

      {/* 2. Authority Action Simulation Toolbar (for testing & demo) */}
      <AuthoritySimulator
        reportId={report.id}
        currentStatus={report.status}
        onStageAdvanced={fetchReportDetails}
      />

      {/* 3. Citizen Verification Loop Banner (Active when Resolved or Pending Citizen Confirmation) */}
      {(report.status === 'Resolved' || report.status === 'Citizen Confirmation') && (
        <CitizenVerification
          reportId={report.id}
          reportCode={report.report_code}
          onVerificationSubmitted={handleVerificationSubmitted}
          existingVerifications={report.verifications}
        />
      )}

      {/* 4. Parallel HEI Innovation & Academic Capstone Track (Side-by-side Dual Lifecycle) */}
      {(report.is_escalated_to_hei || report.hei_challenge || report.hei_project) && (
        <HEIInnovationTrack
          challenge={report.hei_challenge}
          project={report.hei_project}
          reportCode={report.report_code}
        />
      )}

      {/* 5. Before / After Resolution Photo Comparison (If Resolution Evidence Present) */}
      {primaryCitizenPhoto && resolutionPhoto && (
        <BeforeAfterViewer
          beforeUrl={primaryCitizenPhoto}
          afterUrl={resolutionPhoto}
          beforeLabel="Original Citizen Evidence"
          afterLabel="Authority Resolution Proof"
        />
      )}

      {/* 5. Department Assignment Card */}
      <AssignmentCard
        assignment={report.assignment || null}
        category={report.category}
      />

      {/* 6. Problem Summary & Attached Media */}
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Layers size={16} color="var(--accent-amber)" /> Original Incident Report
        </div>

        {report.description && (
          <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1rem', fontSize: '0.875rem', lineHeight: 1.5 }}>
            {report.description}
          </div>
        )}

        {/* Structured Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem', marginBottom: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Location</div>
            <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginTop: '0.15rem' }}>
              {report.address || `${report.latitude?.toFixed(4)}, ${report.longitude?.toFixed(4)}`}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Duration / Recurrence</div>
            <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginTop: '0.15rem' }}>
              {report.duration} • {report.recurrence}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Severity Level</div>
            <div style={{ fontWeight: 700, fontSize: '0.8125rem', marginTop: '0.15rem', color: report.severity === 'Dangerous' ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
              {report.severity}
            </div>
          </div>
        </div>

        {/* Attached Evidence Media */}
        {report.media && report.media.length > 0 && (
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Attached Media ({report.media.length}):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              {report.media.map((med) => (
                <div key={med.id} style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-input)' }}>
                  {med.media_type === 'image' && (
                    <a href={med.file_path} target="_blank" rel="noreferrer">
                      <img src={med.file_path} alt={med.original_name} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                    </a>
                  )}
                  {med.media_type === 'video' && (
                    <video src={med.file_path} controls style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                  )}
                  {med.media_type === 'audio' && (
                    <div style={{ padding: '0.85rem' }}>
                      <audio src={med.file_path} controls style={{ width: '100%' }} />
                    </div>
                  )}
                  <div style={{ padding: '0.4rem 0.6rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {med.original_name} <span className="mono">({formatBytes(med.file_size)})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6.5 AI Civic Intelligence & Deterministic Priority Panel */}
      <div className="card" style={{ border: '1px solid rgba(245, 158, 11, 0.25)', backgroundColor: 'rgba(15, 23, 42, 0.75)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} color="var(--accent-amber)" />
            <span style={{ fontWeight: 800, fontSize: '1rem' }}>Civic Priority & AI Intelligence Engine</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            {report.priority_bucket && (
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '12px',
                  backgroundColor:
                    report.priority_bucket === 'CRITICAL'
                      ? 'rgba(244, 63, 94, 0.2)'
                      : report.priority_bucket === 'HIGH'
                      ? 'rgba(245, 158, 11, 0.2)'
                      : 'rgba(56, 189, 248, 0.2)',
                  color:
                    report.priority_bucket === 'CRITICAL'
                      ? '#f43f5e'
                      : report.priority_bucket === 'HIGH'
                      ? '#f59e0b'
                      : '#38bdf8',
                  border: `1px solid ${
                    report.priority_bucket === 'CRITICAL'
                      ? 'rgba(244, 63, 94, 0.4)'
                      : report.priority_bucket === 'HIGH'
                      ? 'rgba(245, 158, 11, 0.4)'
                      : 'rgba(56, 189, 248, 0.4)'
                  }`,
                }}
              >
                BUCKET: {report.priority_bucket}
              </span>
            )}

            {report.effective_radius_m && (
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                  color: 'var(--accent-indigo)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                }}
              >
                Impact Radius: {report.effective_radius_m}m
              </span>
            )}

            {report.ai_analysis && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '10px',
                  backgroundColor: report.ai_analysis.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                  color: report.ai_analysis.status === 'completed' ? '#10b981' : 'var(--text-muted)',
                }}
              >
                AI: {report.ai_analysis.status.toUpperCase()} ({report.ai_analysis.model_name || 'Gemini'})
              </span>
            )}
          </div>
        </div>

        {/* Priority Score Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Composite Civic Priority</div>
            <div className="mono" style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--accent-amber)', margin: '0.25rem 0' }}>
              {report.civic_priority_score} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 100</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Deterministic Policy: {report.priority_breakdown?.policy_version || 'v1.0'}
            </div>
          </div>

          {/* Key Explanations */}
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Primary Priority Drivers & Policy Explanations:
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.78125rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
              {(report.priority_breakdown?.explanations || ['Routine municipal maintenance priority scheduled']).map((exp, idx) => (
                <li key={idx}>{exp}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* 8-Factor Score Breakdown Progress Bars */}
        {report.priority_breakdown?.factors && (
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              8-Factor Deterministic Priority Breakdown:
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {[
                { label: 'Safety / Hazard Potential', val: report.priority_breakdown.factors.safety, weight: '20%' },
                { label: 'Location Sensitivity', val: report.priority_breakdown.factors.location, weight: '15%' },
                { label: 'Incident Severity', val: report.priority_breakdown.factors.severity, weight: '15%' },
                { label: 'Report Volume / Cluster', val: report.priority_breakdown.factors.report_volume, weight: '10%' },
                { label: 'Vulnerable Population', val: report.priority_breakdown.factors.vulnerable_population, weight: '10%' },
                { label: 'Weather / Seasonality', val: report.priority_breakdown.factors.weather, weight: '10%' },
                { label: 'Time Open / SLA Breach', val: report.priority_breakdown.factors.time_open, weight: '10%' },
                { label: 'Urgency & Evidence', val: report.priority_breakdown.factors.urgency_evidence, weight: '10%' },
              ].map((factor, fIdx) => (
                <div key={fIdx} style={{ fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{factor.label} <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>({factor.weight})</span></span>
                    <span className="mono" style={{ fontWeight: 700, color: factor.val >= 70 ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                      {factor.val}/100
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '5px', backgroundColor: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(0, factor.val))}%`,
                        height: '100%',
                        backgroundColor: factor.val >= 80 ? '#f43f5e' : factor.val >= 50 ? '#f59e0b' : '#38bdf8',
                        borderRadius: '3px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 7. Activity & Audit Timeline */}
      <ActivityTimeline timeline={report.timeline || []} />
    </div>
  );
};
