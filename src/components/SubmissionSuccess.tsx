import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle,
  Copy,
  Check,
  PlusCircle,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import type { StoredReport } from '../types';

interface SubmissionSuccessProps {
  report: StoredReport;
  onReset: () => void;
  onViewTracker: () => void;
}

export const SubmissionSuccess: React.FC<SubmissionSuccessProps> = ({
  report,
  onReset,
  onViewTracker,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fire celebratory confetti on mount
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#6366f1'],
      });
    } catch (e) {}
  }, []);

  const copyReportCode = () => {
    navigator.clipboard.writeText(report.report_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
      {/* Success Badge Banner */}
      <div
        className="card"
        style={{
          textAlign: 'center',
          padding: '2.5rem 1.5rem',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          backgroundColor: 'var(--bg-card)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-emerald-glow)',
            border: '2px solid var(--accent-emerald)',
            color: 'var(--accent-emerald)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto',
            boxShadow: '0 0 24px rgba(16, 185, 129, 0.4)',
          }}
        >
          <CheckCircle size={32} />
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.35rem' }}>
          Incident Successfully Submitted
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto' }}>
          Your civic report has been securely registered in the Alcheminds database and queued for verification.
        </p>

        {/* Unique Tracking Card */}
        <div
          style={{
            marginTop: '1.75rem',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Unique Incident Reference ID
            </div>
            <div
              className="mono"
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--accent-amber)',
                letterSpacing: '0.04em',
                marginTop: '0.15rem',
              }}
            >
              {report.report_code}
            </div>
          </div>

          <button
            type="button"
            onClick={copyReportCode}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem' }}
          >
            {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy ID'}</span>
          </button>
        </div>
      </div>

      {/* Report Receipt Summary */}
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.85rem' }}>
          Incident Snapshot
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.8125rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Status:</span>
            <span className="badge badge-emerald">
              <ShieldCheck size={12} /> {report.status}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Category:</span>
            <span style={{ fontWeight: 600 }}>{report.category}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Calculated Priority:</span>
            <span className="mono" style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>
              {report.civic_priority_score} / 100
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Location:</span>
            <span style={{ fontWeight: 500, maxWidth: '280px', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {report.address || `${report.latitude?.toFixed(4)}, ${report.longitude?.toFixed(4)}`}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Submission Time:</span>
            <span className="mono">{new Date(report.created_at || Date.now()).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button
          type="button"
          onClick={onViewTracker}
          className="btn btn-secondary"
          style={{ flex: 1 }}
        >
          <Layers size={15} />
          <span>View in Tracker</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="btn btn-primary"
          style={{ flex: 1 }}
        >
          <PlusCircle size={15} />
          <span>Report Another Issue</span>
        </button>
      </div>
    </div>
  );
};
