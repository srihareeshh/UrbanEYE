import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sliders, Shield, MapPin, AlertTriangle, Layers, Users, CloudRain, Clock, CheckCircle } from 'lucide-react';
import type { ContributingFactor, PriorityFactors } from '../types';

interface PriorityFactorListProps {
  factors: PriorityFactors;
  contributingFactors?: ContributingFactor[];
  weights?: Record<string, number>;
  baseScore?: number;
}

const FACTOR_ICONS: Record<string, React.FC<{ size?: number; color?: string }>> = {
  safety: Shield,
  location: MapPin,
  severity: AlertTriangle,
  report_volume: Layers,
  vulnerable_population: Users,
  weather: CloudRain,
  time_open: Clock,
  urgency_evidence: CheckCircle,
};

export const PriorityFactorList: React.FC<PriorityFactorListProps> = ({
  factors,
  contributingFactors = [],
  weights = {},
  baseScore,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  // Fallback generation if contributingFactors array not populated
  const displayFactors: ContributingFactor[] =
    contributingFactors.length > 0
      ? contributingFactors
      : Object.entries(factors).map(([key, val]) => {
          const w = weights[key] || 0.125;
          const weightedPts = Math.round(val * w * 10) / 10;
          return {
            key,
            label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            score: val,
            weight: w,
            weight_percent: Math.round(w * 100),
            weighted_points: weightedPts,
            status: val >= 75 ? 'critical' : val >= 50 ? 'elevated' : 'normal',
          };
        });

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-medium)',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.9rem 1.15rem',
          backgroundColor: 'var(--bg-elevated)',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          fontSize: '0.875rem',
          fontWeight: 700,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sliders size={16} color="var(--accent-indigo)" />
          <span>Contributing Factor Breakdown</span>
          {baseScore !== undefined && (
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              (Base Weighted Sum: {baseScore} pts)
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
      </button>

      {isOpen && (
        <div style={{ padding: '1rem 1.15rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {displayFactors.map((f) => {
            const IconComponent = FACTOR_ICONS[f.key] || Shield;
            const barColor =
              f.score >= 80 ? '#f43f5e' : f.score >= 60 ? '#f59e0b' : f.score >= 35 ? '#38bdf8' : '#94a3b8';

            return (
              <div
                key={f.key}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.3rem',
                  padding: '0.65rem 0.8rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <IconComponent size={14} color={barColor} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {f.label}
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        backgroundColor: 'var(--bg-elevated)',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                      }}
                    >
                      Weight: {f.weight_percent}%
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}>
                      Raw: <strong className="mono" style={{ color: 'var(--text-primary)' }}>{f.score}</strong>/100
                    </span>
                    <span
                      className="mono"
                      style={{
                        fontSize: '0.78125rem',
                        fontWeight: 800,
                        color: barColor,
                        backgroundColor: `${barColor}15`,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        border: `1px solid ${barColor}30`,
                      }}
                    >
                      +{f.weighted_points} pts
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div
                  style={{
                    height: '4px',
                    width: '100%',
                    backgroundColor: 'var(--border-subtle)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.max(0, f.score))}%`,
                      backgroundColor: barColor,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>

                {f.detail && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    {f.detail}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
