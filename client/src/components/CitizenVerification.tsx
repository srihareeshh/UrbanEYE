import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertOctagon,
  HelpCircle,
  Star,
  Send,
  ShieldCheck,
} from 'lucide-react';
import type { VerificationInfo } from '../types';
import { apiFetch } from '../utils/userSession';

interface CitizenVerificationProps {
  reportId: string;
  reportCode?: string;
  onVerificationSubmitted: (verification: VerificationInfo, newStatus: string) => void;
  existingVerifications?: VerificationInfo[];
}

export const CitizenVerification: React.FC<CitizenVerificationProps> = ({
  reportId,
  onVerificationSubmitted,
  existingVerifications = [],
}) => {
  const [selectedVerdict, setSelectedVerdict] = useState<'fixed' | 'partially_fixed' | 'not_fixed' | null>(null);
  const [citizenNotes, setCitizenNotes] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedVerdict) {
      setErrorMsg('Please select a verification option.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await apiFetch(`/api/reports/${reportId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verdict: selectedVerdict,
          citizenNotes,
          satisfactionRating: selectedVerdict === 'fixed' ? rating : null,
          followUpMedia: [],
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to record citizen verification.');
      }

      const data = await res.json();
      const updatedReport = data.report;
      const latestVerification = updatedReport.verifications?.[0] || {
        id: `ver_${Date.now()}`,
        report_id: reportId,
        verdict: selectedVerdict,
        citizen_notes: citizenNotes,
        satisfaction_rating: rating,
        verified_at: new Date().toISOString(),
      };

      onVerificationSubmitted(latestVerification, updatedReport.status);
    } catch (err: any) {
      console.error('Verification submit error:', err);
      setErrorMsg(err.message || 'Failed to submit verification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        boxShadow: '0 0 20px rgba(245, 158, 11, 0.08)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Banner Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={20} color="var(--accent-amber)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Citizen Verification</h3>
        </div>
        <span className="badge badge-amber">Action Required</span>
      </div>

      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.45 }}>
        The municipal authority has marked this report as <strong>Resolved</strong>. As the citizen reporter, your confirmation is required to verify whether the on-ground issue has truly been solved.
      </p>

      {/* The Core Question */}
      <div style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
        Is the problem actually fixed?
      </div>

      {/* 3 Choice Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        {/* Option 1: Yes, Fixed */}
        <button
          type="button"
          onClick={() => setSelectedVerdict('fixed')}
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: selectedVerdict === 'fixed' ? 'var(--accent-emerald-glow)' : 'var(--bg-input)',
            border: selectedVerdict === 'fixed' ? '2px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--accent-emerald)' }}>
              Yes, It's Fixed
            </span>
            <CheckCircle2 size={16} color="var(--accent-emerald)" />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Work is complete and problem is fully resolved.
          </span>
        </button>

        {/* Option 2: Partially Fixed */}
        <button
          type="button"
          onClick={() => setSelectedVerdict('partially_fixed')}
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: selectedVerdict === 'partially_fixed' ? 'var(--accent-amber-glow)' : 'var(--bg-input)',
            border: selectedVerdict === 'partially_fixed' ? '2px solid var(--accent-amber)' : '1px solid var(--border-subtle)',
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--accent-amber)' }}>
              Partially Fixed
            </span>
            <HelpCircle size={16} color="var(--accent-amber)" />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Some work done, but issues or remnants remain.
          </span>
        </button>

        {/* Option 3: No, Remains */}
        <button
          type="button"
          onClick={() => setSelectedVerdict('not_fixed')}
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: selectedVerdict === 'not_fixed' ? 'var(--accent-rose-glow)' : 'var(--bg-input)',
            border: selectedVerdict === 'not_fixed' ? '2px solid var(--accent-rose)' : '1px solid var(--border-subtle)',
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--accent-rose)' }}>
              No, Problem Remains
            </span>
            <AlertOctagon size={16} color="var(--accent-rose)" />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Hazard/blockage persists. Escalate back to department.
          </span>
        </button>
      </div>

      {/* Details Box depending on verdict */}
      {selectedVerdict && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
          {selectedVerdict === 'fixed' ? (
            /* Star rating for positive resolution */
            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Rate Municipal Resolution Quality:
              </div>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: star <= rating ? 'var(--accent-amber)' : 'var(--text-muted)',
                    }}
                  >
                    <Star size={20} fill={star <= rating ? 'var(--accent-amber)' : 'none'} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Warning prompt for negative / partial resolution */
            <div
              style={{
                backgroundColor: 'var(--accent-rose-glow)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                fontSize: '0.8125rem',
                color: 'var(--text-primary)',
              }}
            >
              <strong>Reopening Escalation:</strong> Submitting this response will automatically change the report status to <strong>Follow-up Required</strong> and notify the supervisory municipal engineer.
            </div>
          )}

          {/* Feedback Notes */}
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
              {selectedVerdict === 'fixed' ? 'Optional Citizen Remarks:' : 'Describe what remains unresolved:'}
            </label>
            <textarea
              className="textarea"
              rows={2}
              placeholder={
                selectedVerdict === 'fixed'
                  ? 'e.g. Drainage is flowing smoothly now, area cleaned up well.'
                  : 'e.g. Drains were partially cleared but water is still stagnant at the corner...'
              }
              value={citizenNotes}
              onChange={(e) => setCitizenNotes(e.target.value)}
            />
          </div>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            fontSize: '0.8125rem',
            color: 'var(--accent-rose)',
            backgroundColor: 'var(--accent-rose-glow)',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '0.85rem',
            border: '1px solid rgba(244, 63, 94, 0.2)',
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || !selectedVerdict}
        className="btn btn-primary"
        style={{ width: '100%', padding: '0.85rem' }}
      >
        <Send size={15} />
        <span>{isSubmitting ? 'Recording Verification...' : 'Submit Citizen Verification'}</span>
      </button>

      {/* Past Verifications History */}
      {existingVerifications.length > 0 && (
        <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Previous Citizen Verifications:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {existingVerifications.map((v) => (
              <div
                key={v.id}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.4rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-input)',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>Verdict: <strong>{v.verdict}</strong> {v.citizen_notes && `— "${v.citizen_notes}"`}</span>
                <span className="mono" style={{ color: 'var(--text-muted)' }}>{new Date(v.verified_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
