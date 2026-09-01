import React from 'react';
import { AlertTriangle, ShieldAlert, Info } from 'lucide-react';

interface SeverityExplanationProps {
  severity: string;
  category?: string;
  reasons?: string[];
  isAiAssessed?: boolean;
}

export const SeverityExplanation: React.FC<SeverityExplanationProps> = ({
  severity,
  category = 'General',
  reasons = [],
  isAiAssessed = false,
}) => {
  const sevUpper = String(severity || 'MODERATE').toUpperCase();

  const isCritical = sevUpper === 'CRITICAL' || sevUpper === 'DANGEROUS';
  const isHigh = sevUpper === 'HIGH' || sevUpper === 'SERIOUS';
  const isMedium = sevUpper === 'MEDIUM' || sevUpper === 'MODERATE';

  const badgeColor = isCritical ? '#f43f5e' : isHigh ? '#f97316' : isMedium ? '#f59e0b' : '#10b981';
  const badgeBg = isCritical
    ? 'rgba(244, 63, 94, 0.15)'
    : isHigh
    ? 'rgba(249, 115, 22, 0.15)'
    : isMedium
    ? 'rgba(245, 158, 11, 0.15)'
    : 'rgba(16, 185, 129, 0.15)';
  const borderColor = isCritical
    ? 'rgba(244, 63, 94, 0.35)'
    : isHigh
    ? 'rgba(249, 115, 22, 0.35)'
    : isMedium
    ? 'rgba(245, 158, 11, 0.35)'
    : 'rgba(16, 185, 129, 0.35)';

  const displayReasons =
    reasons && reasons.length > 0
      ? reasons
      : [
          `Incident condition exhibits ${sevUpper.toLowerCase()} structural or environmental impact.`,
          `Classification assigned based on reported ${category.toLowerCase()} hazard characteristics.`,
        ];

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${borderColor}`,
        padding: '1.1rem',
        marginTop: '0.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isCritical ? (
            <ShieldAlert size={18} color={badgeColor} />
          ) : isHigh ? (
            <AlertTriangle size={18} color={badgeColor} />
          ) : (
            <Info size={18} color={badgeColor} />
          )}
          <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
            Severity Assessment:
          </span>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '0.2rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: badgeBg,
              color: badgeColor,
              border: `1px solid ${borderColor}`,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {severity}
          </span>
        </div>

        {isAiAssessed && (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            ✓ Verified by Civic Intelligence Engine
          </span>
        )}
      </div>

      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
        Why was this severity assigned?
      </div>

      <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {displayReasons.map((reason, idx) => (
          <li
            key={idx}
            style={{
              fontSize: '0.8125rem',
              color: 'var(--text-primary)',
              lineHeight: 1.5,
            }}
          >
            {reason}
          </li>
        ))}
      </ul>
    </div>
  );
};
