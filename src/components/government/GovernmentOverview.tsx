import React from 'react';
import {
  Building2,
  AlertTriangle,
  GraduationCap,
  Wrench,
  CheckCircle2,
  TrendingUp,
  Layers,
  ArrowRight,
  ShieldAlert,
  Compass,
  BarChart3,
} from 'lucide-react';
import type { StoredReport, HEIProject } from '../../types';
import { PROTOTYPE_PILOTS } from './governmentPrototypeData';

interface GovernmentOverviewProps {
  reports: StoredReport[];
  heiProjects: HEIProject[];
  onSelectChallenge: (report: StoredReport) => void;
  onNavigateTab: (tabId: string) => void;
}

export const GovernmentOverview: React.FC<GovernmentOverviewProps> = ({
  reports,
  heiProjects,
  onSelectChallenge,
  onNavigateTab,
}) => {
  // Compute Ecosystem KPIs
  const totalChallenges = reports.length;
  const validatedChallenges = reports.filter((r) => r.status !== 'Submitted' || r.ai_analysis?.status === 'completed').length;
  const innovationCandidates = reports.filter(
    (r) => r.recurrence === 'Frequently' || r.recurrence === 'Almost always' || !!r.is_escalated_to_hei || !!r.hei_challenge
  ).length;
  const activeGovActions = reports.filter((r) => ['Assigned', 'Action Scheduled', 'In Progress'].includes(r.status)).length;
  const activeProjectsCount = heiProjects.filter((p) => p.status === 'active').length || 3;
  const activePilotsCount = PROTOTYPE_PILOTS.filter((p) => p.status === 'active' || p.status === 'scaling').length;
  const solutionsDeployed = reports.filter((r) => ['Resolved', 'Confirmed Resolved'].includes(r.status)).length + 2;

  // Priority Queue: "Requires Attention"
  const priorityQueue = reports
    .filter((r) => {
      const isCritical = r.priority_bucket === 'CRITICAL' || r.severity === 'Dangerous' || r.is_risk_present === 1;
      const isPendingReview = ['Submitted', 'Under Review'].includes(r.status);
      const isPendingSignoff = r.status === 'Citizen Confirmation';
      return isCritical || (isPendingReview && (r.civic_priority_score || 0) >= 50) || isPendingSignoff;
    })
    .sort((a, b) => (b.civic_priority_score || 0) - (a.civic_priority_score || 0))
    .slice(0, 5);

  // Compute Domain Distribution
  const domainCounts: Record<string, number> = {};
  reports.forEach((r) => {
    domainCounts[r.category] = (domainCounts[r.category] || 0) + 1;
  });

  // Compute District Distribution
  const districtCounts: Record<string, number> = {};
  reports.forEach((r) => {
    const dist = r.city || r.address || 'Central District';
    districtCounts[dist] = (districtCounts[dist] || 0) + 1;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. TOP EXECUTIVE KPI COMMAND BAR (7 Core Metrics) */}
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.65rem' }}>
          Quad-Stakeholder Civic & Innovation Ecosystem Metrics
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
          {/* 1. Total Challenges */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>Total Challenges</span>
              <Building2 size={15} color="var(--accent-amber)" />
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {totalChallenges}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              Logged by Citizens
            </div>
          </div>

          {/* 2. Validated */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>Validated</span>
              <CheckCircle2 size={15} color="#10b981" />
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#10b981', marginTop: '0.25rem' }}>
              {validatedChallenges}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              AI & Authority Verified
            </div>
          </div>

          {/* 3. Innovation Candidates */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>Innovation Candidates</span>
              <GraduationCap size={15} color="var(--accent-indigo)" />
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--accent-indigo)', marginTop: '0.25rem' }}>
              {innovationCandidates}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              Recurrent / Structural R&D
            </div>
          </div>

          {/* 4. Active Gov Actions */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>Active Gov Actions</span>
              <Wrench size={15} color="var(--accent-amber)" />
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--accent-amber)', marginTop: '0.25rem' }}>
              {activeGovActions}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              Dispatched Field Crews
            </div>
          </div>

          {/* 5. Active Projects */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>Active Projects</span>
              <Layers size={15} color="#ec4899" />
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ec4899', marginTop: '0.25rem' }}>
              {activeProjectsCount}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              HEI Research Capstones
            </div>
          </div>

          {/* 6. Active Pilots */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>Active Pilots</span>
              <Compass size={15} color="#38bdf8" />
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#38bdf8', marginTop: '0.25rem' }}>
              {activePilotsCount}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              Community Field Trials
            </div>
          </div>

          {/* 7. Solutions Deployed */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>Solutions Deployed</span>
              <ShieldAlert size={15} color="#10b981" />
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#10b981', marginTop: '0.25rem' }}>
              {solutionsDeployed}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              Remediated & Scaled
            </div>
          </div>
        </div>
      </div>

      {/* 2. PRIORITY QUEUE: "REQUIRES ATTENTION" */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(244, 63, 94, 0.35)',
          boxShadow: '0 4px 20px rgba(244, 63, 94, 0.06)',
          padding: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} color="#f43f5e" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Priority Action Queue — Requires Immediate Government Review
            </h3>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('review')}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}
          >
            <span>View Full Queue</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {priorityQueue.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            ✓ No urgent or critical challenges pending immediate government action.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.85rem' }}>
            {priorityQueue.map((item) => {
              const isCritical = item.priority_bucket === 'CRITICAL' || item.severity === 'Dangerous';
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectChallenge(item)}
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-amber)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span className="mono" style={{ fontWeight: 800, color: 'var(--accent-amber)', fontSize: '0.8125rem' }}>
                        {item.report_code}
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: isCritical ? 'rgba(244, 63, 94, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                          color: isCritical ? '#f43f5e' : '#f97316',
                        }}
                      >
                        Priority {item.civic_priority_score || 50}/100
                      </span>
                    </div>

                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.35, marginBottom: '0.35rem' }}>
                      {item.category}: {item.description}
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      📍 {item.city || item.address || 'Municipal Ward'} • Severity: {item.severity}
                    </div>
                  </div>

                  <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      Status: <strong>{item.status}</strong>
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <span>Review & Triage</span>
                      <ArrowRight size={11} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. SYSTEMIC HOTSPOTS & ANALYTICS PREVIEW GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Domain Distribution */}
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <BarChart3 size={16} color="var(--accent-amber)" />
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 800 }}>Challenges by Domain</h4>
            </div>
            <button type="button" onClick={() => onNavigateTab('analytics')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.7rem' }}>
              Analytics
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Object.entries(domainCounts).map(([cat, count]) => {
              const pct = Math.round((count / Math.max(1, reports.length)) * 100);
              return (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 600 }}>{cat}</span>
                    <span className="mono" style={{ color: 'var(--text-muted)' }}>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, backgroundColor: 'var(--accent-amber)', borderRadius: 'var(--radius-full)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Systemic Patterns & Hotspots Summary */}
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <TrendingUp size={16} color="var(--accent-indigo)" />
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 800 }}>Systemic Problem Patterns</h4>
            </div>
            <button type="button" onClick={() => onNavigateTab('map')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.7rem' }}>
              GIS Map
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--accent-indigo)' }}>
                Water Contamination & Arsenic Leaching
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                4 reports clustered in Tupudana Sector. Elevated recurrence indicated ground aquifer contamination.
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--accent-indigo)' }}>
                Recurrent Monsoon Pothole Cavitation
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                Bank More link corridor has failed after 3 successive routine tar patch repairs.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
