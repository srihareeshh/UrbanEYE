import React, { useState } from 'react';
import {
  Search,
  Layers,
} from 'lucide-react';
import type { StoredReport, HEIChallenge, HEIProject } from '../../types';
import { getRecommendedHEIsForChallenge } from './governmentPrototypeData';

interface GovernmentInnovationChallengesProps {
  reports: StoredReport[];
  heiChallenges?: HEIChallenge[];
  heiProjects?: HEIProject[];
  onSelectChallenge: (report: StoredReport) => void;
  onNavigateTab: (tabId: string) => void;
}

export const GovernmentInnovationChallenges: React.FC<GovernmentInnovationChallengesProps> = ({
  reports,
  onSelectChallenge,
  onNavigateTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDomain, setFilterDomain] = useState('all');

  // Filter innovation candidates & active HEI challenges
  const innovationReports = reports.filter((r) => {
    const isEscalated = !!r.is_escalated_to_hei || !!r.hei_challenge;
    const isRecurring = r.recurrence === 'Frequently' || r.recurrence === 'Almost always';
    if (!isEscalated && !isRecurring) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = (r.report_code || '').toLowerCase().includes(q);
      const matchDesc = (r.description || '').toLowerCase().includes(q);
      if (!matchCode && !matchDesc) return false;
    }

    if (filterDomain !== 'all' && r.category !== filterDomain) return false;

    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          padding: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Higher Education Innovation Challenges
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              Complex civic challenges qualifying for multi-disciplinary university R&D capstones, NEP 2020 student credits & CSR co-funding.
            </p>
          </div>

          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--accent-indigo)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
            }}
          >
            {innovationReports.length} Innovation Track Challenges
          </span>
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search innovation challenges..."
              className="input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '32px', height: '36px', fontSize: '0.8125rem', width: '100%' }}
            />
          </div>

          <select
            className="input"
            value={filterDomain}
            onChange={(e) => setFilterDomain(e.target.value)}
            style={{ height: '36px', fontSize: '0.8125rem' }}
          >
            <option value="all">All Innovation Domains</option>
            <option value="Water">Water Infrastructure & Purification</option>
            <option value="Roads">Road Surface & Polymer Bitumen</option>
            <option value="Electricity">Smart Grid & Outage Faults</option>
            <option value="Sanitation">Solid Waste & Bio-reactors</option>
            <option value="Agriculture">Soil & Check-dam Hydrodynamics</option>
          </select>
        </div>
      </div>

      {/* Grid of Innovation Challenges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '1rem' }}>
        {innovationReports.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
            No innovation challenges found.
          </div>
        ) : (
          innovationReports.map((r) => {
            const isEscalated = !!r.is_escalated_to_hei || !!r.hei_challenge;
            const recommended = getRecommendedHEIsForChallenge(r.category, r.description);
            const topHEI = recommended[0];

            return (
              <div
                key={r.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: isEscalated ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid var(--border-subtle)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                }}
              >
                <div>
                  {/* Top Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                    <span className="mono" style={{ fontWeight: 800, color: 'var(--accent-amber)', fontSize: '0.875rem' }}>
                      {r.report_code}
                    </span>

                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: isEscalated ? 'rgba(99, 102, 241, 0.18)' : 'rgba(245, 158, 11, 0.15)',
                        color: isEscalated ? 'var(--accent-indigo)' : 'var(--accent-amber)',
                      }}
                    >
                      {isEscalated ? '✓ Active HEI Project' : 'Innovation Candidate'}
                    </span>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    {r.category}: {r.description}
                  </div>

                  {/* Problem Details */}
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    📍 {r.city || r.address || 'Municipal Ward'} • Recurrence: <strong>{r.recurrence}</strong>
                  </div>

                  {/* Top Recommended HEI Capability Match */}
                  {topHEI && (
                    <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Recommended HEI Partner
                        </span>
                        <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>
                          {topHEI.matchPercentage}% Match
                        </span>
                      </div>

                      <div style={{ fontWeight: 800, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                        {topHEI.hei.name}
                      </div>

                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        Specialization: {topHEI.matchingCapabilities[0] || 'Infrastructure Innovation'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    type="button"
                    onClick={() => onSelectChallenge(r)}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, fontSize: '0.75rem' }}
                  >
                    View Details
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateTab('projects')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--accent-indigo)' }}
                  >
                    <Layers size={13} />
                    <span>Projects</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
