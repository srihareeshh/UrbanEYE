import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Layers,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { LifecycleStepper } from './LifecycleStepper';
import { ActivityTimeline } from './ActivityTimeline';
import { AssignmentCard } from './AssignmentCard';
import { BeforeAfterViewer } from './BeforeAfterViewer';
import { CitizenVerification } from './CitizenVerification';
import { AuthoritySimulator } from './AuthoritySimulator';
import type { StoredReport, VerificationInfo } from '../types';
import { formatBytes } from '../utils/exifHelper';

interface ReportDetailViewProps {
  reportId: string;
  onBack: () => void;
}

export const ReportDetailView: React.FC<ReportDetailViewProps> = ({ reportId, onBack }) => {
  const [report, setReport] = useState<StoredReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Fetch complete lifecycle report
  const fetchReportDetails = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}`);
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
            <span>Back to Tracker</span>
          </button>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
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
            </div>
            <div style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Reported on {new Date(report.created_at).toLocaleString()} by Citizen Reporter
            </div>
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

      {/* 3. Citizen Verification Loop Banner (Active when Resolved) */}
      {report.status === 'Resolved' && (
        <CitizenVerification
          reportId={report.id}
          reportCode={report.report_code}
          onVerificationSubmitted={handleVerificationSubmitted}
          existingVerifications={report.verifications}
        />
      )}

      {/* 4. Before / After Resolution Photo Comparison (If Resolution Evidence Present) */}
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

      {/* 7. Activity & Audit Timeline */}
      <ActivityTimeline timeline={report.timeline || []} />
    </div>
  );
};
