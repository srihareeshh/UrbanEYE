import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import type { PilotMonitoringRecord } from '../heiDataModel';
import { SEED_PILOT_READINESS, evaluatePilotReadiness } from '../heiDataModel';

interface HEIPilotsTabProps {
  pilots: PilotMonitoringRecord[];
}

export const HEIPilotsTab: React.FC<HEIPilotsTabProps> = ({
  pilots,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj_bio_drain_01');

  const activeReadiness = SEED_PILOT_READINESS[selectedProjectId] || {
    prototypeReady: true,
    prototypeNotes: 'Bench test passed.',
    governmentPermission: 'approved',
    governmentNotes: 'Municipal permission granted.',
    infrastructureAvailable: true,
    infrastructureNotes: 'Solar and trench access verified.',
    industryRequirements: 'complete',
    industryNotes: 'Supplies delivered.',
    communityIdentified: true,
    communityNotes: 'RWA onboarded.',
    measurementPlanReady: true,
    measurementNotes: 'Time logs baseline established.',
  };

  const evaluation = evaluatePilotReadiness(activeReadiness);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Header */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Community Pilots & Automated Readiness Engine
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0 }}>
            Automated multi-factor readiness evaluation before field deployment and live real-world pilot telemetry.
          </p>
        </div>

        {/* Project Selector for Readiness Engine */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={() => setSelectedProjectId('proj_bio_drain_01')}
            className={`btn btn-sm ${selectedProjectId === 'proj_bio_drain_01' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.75rem' }}
          >
            HydroCell BioDrain
          </button>
          <button
            type="button"
            onClick={() => setSelectedProjectId('proj_sensor_flood_02')}
            className={`btn btn-sm ${selectedProjectId === 'proj_sensor_flood_02' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.75rem' }}
          >
            HydroNode Sentinel
          </button>
        </div>
      </div>

      {/* 2. AUTOMATED PILOT READINESS EVALUATOR */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.4rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="var(--accent-indigo)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Automated 5-Factor Pilot Readiness Engine
              </h3>
            </div>
            <p style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', marginTop: '0.15rem', margin: 0 }}>
              Evaluates whether prototype, municipal NOCs, site infrastructure, and community sensors meet launch thresholds.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span
              style={{
                fontSize: '0.8125rem',
                fontWeight: 900,
                padding: '0.3rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: evaluation.status === 'READY' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: evaluation.status === 'READY' ? '#10b981' : '#ef4444',
                border: `1px solid ${evaluation.status === 'READY' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              {evaluation.status === 'READY' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
              PILOT STATUS: {evaluation.status} ({evaluation.score}/100)
            </span>
          </div>
        </div>

        {/* Readiness Checklist Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
          {/* Factor 1 */}
          <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>1. Prototype Readiness</span>
              <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800 }}>✓ READY</span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0 }}>
              {activeReadiness.prototypeNotes}
            </p>
          </div>

          {/* Factor 2 */}
          <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>2. Municipal Government NOC</span>
              <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800 }}>✓ APPROVED</span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0 }}>
              {activeReadiness.governmentNotes}
            </p>
          </div>

          {/* Factor 3 */}
          <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>3. Site Infrastructure</span>
              <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800 }}>✓ AVAILABLE</span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0 }}>
              {activeReadiness.infrastructureNotes}
            </p>
          </div>

          {/* Factor 4 */}
          <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>4. Industry Hardware Delivery</span>
              <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800 }}>✓ COMPLETE</span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0 }}>
              {activeReadiness.industryNotes}
            </p>
          </div>

          {/* Factor 5 */}
          <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>5. Community & Measurement Plan</span>
              <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800 }}>✓ ONBOARDED</span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0 }}>
              {activeReadiness.communityNotes} • {activeReadiness.measurementNotes}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Live Community Pilots */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          Active Field Pilots ({pilots.length})
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
          {pilots.map((pilot) => (
            <div
              key={pilot.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                <div>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                    }}
                  >
                    {pilot.domain}
                  </span>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.35rem', marginBottom: '0.15rem' }}>
                    {pilot.title}
                  </h4>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <MapPin size={12} style={{ display: 'inline', marginRight: '3px' }} />
                    {pilot.community}, {pilot.district}
                  </div>
                </div>

                <div
                  style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                  }}
                >
                  Month {pilot.currentMonth}/{pilot.durationMonths}
                </div>
              </div>

              {/* Telemetry Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.65rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Problem Reduction</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#10b981', marginTop: '0.1rem' }}>
                    -{pilot.problemReductionPct}%
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.65rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Community Satisfaction</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--accent-indigo)', marginTop: '0.1rem' }}>
                    {pilot.communitySatisfactionPct}%
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                <strong>Key Metric:</strong> {pilot.keyMetricName} improved from <span style={{ color: 'var(--text-muted)' }}>{pilot.keyMetricBaseline}</span> to <strong style={{ color: '#10b981' }}>{pilot.keyMetricValue}</strong>.
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.45rem',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span>Lead: {pilot.leadInstitution}</span>
                <span>Benefited: <strong style={{ color: 'var(--text-primary)' }}>{pilot.householdsBenefited} households</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
