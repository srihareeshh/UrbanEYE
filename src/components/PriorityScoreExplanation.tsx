import React from 'react';
import {
  Sparkles,
  Clock,
  TrendingUp,
} from 'lucide-react';
import type { PriorityBreakdown } from '../types';

interface PriorityScoreExplanationProps {
  priority: PriorityBreakdown;
  aiStatus?: string;
  category?: string;
}

export const PriorityScoreExplanation: React.FC<PriorityScoreExplanationProps> = ({
  priority,
}) => {
  const {
    score,
    bucket,
    response_target,
    escalation,
    radius,
    structured_explanations = [],
    explanations = [],
    policy_version,
  } = priority;

  const isCritical = bucket === 'CRITICAL';
  const isHigh = bucket === 'HIGH';
  const isMedium = bucket === 'MEDIUM';

  const bucketColor = isCritical ? '#f43f5e' : isHigh ? '#f59e0b' : isMedium ? '#38bdf8' : '#94a3b8';
  const bucketBg = isCritical
    ? 'rgba(244, 63, 94, 0.15)'
    : isHigh
    ? 'rgba(245, 158, 11, 0.15)'
    : isMedium
    ? 'rgba(56, 189, 248, 0.15)'
    : 'rgba(148, 163, 184, 0.15)';

  const hasEscalation = escalation && escalation.applied && escalation.points_added > 0;

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-medium)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.15rem',
      }}
    >
      {/* Top Banner: Score Dial + Bucket Badge + Response Target */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.85rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--bg-elevated)',
              border: `2px solid ${bucketColor}`,
              borderRadius: 'var(--radius-md)',
              padding: '0.6rem 1rem',
              minWidth: '100px',
            }}
          >
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Priority Score
            </span>
            <span className="mono" style={{ fontSize: '2rem', fontWeight: 900, color: bucketColor, lineHeight: 1.1 }}>
              {score}
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>out of 100</span>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 900,
                  padding: '0.25rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: bucketBg,
                  color: bucketColor,
                  border: `1px solid ${bucketColor}40`,
                  letterSpacing: '0.05em',
                }}
              >
                {bucket} PRIORITY
              </span>

              {radius?.effective_radius_m && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(99, 102, 241, 0.12)',
                    color: 'var(--accent-indigo)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                  }}
                >
                  Impact Radius: {radius.effective_radius_m}m
                </span>
              )}
            </div>

            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={13} color="var(--accent-amber)" />
              <span>Target Response: <strong style={{ color: 'var(--text-primary)' }}>{response_target || '24–72 hours'}</strong></span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <div>Policy Version: {policy_version || 'v1.1'}</div>
          <div>Authoritative Server Computation</div>
        </div>
      </div>

      {/* Base Score vs Escalation Audit Box (Shows if safety floor/override escalated score) */}
      {hasEscalation && (
        <div
          style={{
            backgroundColor: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.8125rem', color: '#f43f5e', marginBottom: '0.35rem' }}>
            <TrendingUp size={15} />
            <span>Hazard Escalation Audit: Emergency Floor Applied</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.8125rem', marginTop: '0.4rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Base Weighted Score: </span>
              <strong className="mono" style={{ color: 'var(--text-primary)' }}>{escalation.base_score}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Escalation Adjustment: </span>
              <strong className="mono" style={{ color: '#f43f5e' }}>+{escalation.points_added} pts</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Final Priority: </span>
              <strong className="mono" style={{ color: bucketColor }}>{escalation.final_score} / 100</strong>
            </div>
          </div>

          {escalation.reason && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem', fontStyle: 'italic' }}>
              Reason: {escalation.reason}
            </div>
          )}
        </div>
      )}

      {/* "Why this priority?" Section */}
      <div>
        <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={16} color="var(--accent-amber)" />
          <span>Why this priority?</span>
        </div>

        {structured_explanations.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {structured_explanations.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  backgroundColor: 'var(--bg-elevated)',
                  padding: '0.75rem 0.9rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                      {item.title}
                    </span>
                    {item.tag && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(245, 158, 11, 0.1)',
                          color: 'var(--accent-amber)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {item.tag}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.45 }}>
                    {item.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {explanations.map((exp, idx) => (
              <li key={idx} style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {exp}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
