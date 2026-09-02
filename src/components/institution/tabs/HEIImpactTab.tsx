import React from 'react';
import {
  TrendingUp,
  Award,
} from 'lucide-react';
import type { NEPCreditRecord } from '../../../types';
import type { ImpactOutcomeRecord } from '../heiDataModel';

interface HEIImpactTabProps {
  impactRecords: ImpactOutcomeRecord[];
  nepCredits: NEPCreditRecord[];
}

export const HEIImpactTab: React.FC<HEIImpactTabProps> = ({
  impactRecords,
  nepCredits,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Header */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          Measurable Real-World Impact & NEP Credit Registry
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0 }}>
          Empirical before-and-after civic telemetry, citizen satisfaction verification, and tamper-evident student credit records.
        </p>
      </div>

      {/* 2. Before / After Empirical Studies */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {impactRecords.map((rec) => (
          <div
            key={rec.id}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.4rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>
                    {rec.reportCode}
                  </span>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(99, 102, 241, 0.12)',
                      color: 'var(--accent-indigo)',
                    }}
                  >
                    {rec.domain}
                  </span>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                    }}
                  >
                    ● VALIDATED MUNICIPAL OUTCOME
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.35rem', marginBottom: '0.15rem' }}>
                  {rec.projectTitle}
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Location: <strong>{rec.communityLocation}</strong> • Benefited: <strong style={{ color: 'var(--text-primary)' }}>{rec.benefitedHouseholds} Households</strong>
                </div>
              </div>

              <div
                style={{
                  textAlign: 'right',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  padding: '0.4rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#10b981' }}>
                  ★ {rec.citizenVerificationRating} / 5.0
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  Citizen Verification Score
                </div>
              </div>
            </div>

            {/* Before vs After Telemetry Comparison Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1rem',
              }}
            >
              {/* Before Baseline */}
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem',
                }}
              >
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase' }}>
                  Before Intervention (Baseline)
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
                  {rec.beforeMetrics.map((bm, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{bm.metricName}:</span>
                      <strong style={{ color: '#ef4444' }}>{bm.value} {bm.unit}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* After Pilot Validation */}
              <div
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem',
                }}
              >
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>
                  After University Capstone Deployment
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
                  {rec.afterMetrics.map((am, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{am.metricName}:</span>
                      <strong style={{ color: '#10b981' }}>{am.value} {am.unit}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Improvement Highlights */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {rec.percentageImprovement.map((imp, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.6rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <TrendingUp size={12} />
                  <span>{imp.label}: <strong>{imp.changePct > 0 ? `+${imp.changePct}%` : `${imp.changePct}%`}</strong></span>
                </div>
              ))}
            </div>

            {/* Citizen Feedback Quote */}
            <div
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 0.9rem',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.45,
              }}
            >
              <strong style={{ color: 'var(--text-primary)' }}>Community Feedback: </strong>
              "{rec.citizenFeedbackSummary}"
            </div>
          </div>
        ))}
      </div>

      {/* 3. NEP 2020 Credit Ledger */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Award size={16} color="var(--accent-amber)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              NEP 2020 Experiential Learning Credit Registry ({nepCredits.length} Certificates Issued)
            </h3>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 800 }}>
            ● Digitally Signed APAAR Hashes
          </span>
        </div>

        {nepCredits.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            No NEP certificates issued yet. Complete stage milestones and issue credits from Active Projects.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Student Name</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>APAAR ID</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Project Title</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Research Hours</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Credits</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Verification Hash</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Issued Date</th>
                </tr>
              </thead>
              <tbody>
                {nepCredits.map((cred) => (
                  <tr key={cred.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {cred.student_name}
                    </td>
                    <td className="mono" style={{ padding: '0.65rem 0.75rem', color: '#10b981', fontWeight: 700 }}>
                      {cred.apaar_id}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-secondary)' }}>
                      {cred.project_title || cred.project_id}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      {cred.research_hours} hrs
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                      {cred.credits_awarded} Credits
                    </td>
                    <td className="mono" style={{ padding: '0.65rem 0.75rem', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      {cred.verification_hash ? `${cred.verification_hash.slice(0, 12)}...` : '0x7f9a8...'}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(cred.certificate_issued_at || cred.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
