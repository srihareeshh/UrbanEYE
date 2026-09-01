import React, { useState } from 'react';
import {
  GraduationCap,
  Search,
} from 'lucide-react';
import { HEI_PROFILES, type HEIProfile } from './governmentPrototypeData';
import type { StoredReport } from '../../types';

interface GovernmentHEIRoutingProps {
  reports?: StoredReport[];
  onSelectChallenge?: (report: StoredReport) => void;
  onShowToast?: (msg: string) => void;
}

export const GovernmentHEIRouting: React.FC<GovernmentHEIRoutingProps> = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHEI, setSelectedHEI] = useState<HEIProfile | null>(HEI_PROFILES[0]);

  // Filter HEIs
  const filteredHEIs = HEI_PROFILES.filter((hei) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = hei.name.toLowerCase().includes(q);
      const matchShort = hei.shortName.toLowerCase().includes(q);
      const matchDept = hei.departments.some((d) => d.toLowerCase().includes(q));
      const matchCap = hei.capabilities.some((c) => c.toLowerCase().includes(q));
      if (!matchName && !matchShort && !matchDept && !matchCap) return false;
    }
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
              Institutional Capability Registry & HEI Routing
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              Verified engineering, environmental & computer science capabilities across Higher Education Institutions (HEIs).
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
            {HEI_PROFILES.length} Accredited Academic Partners
          </span>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search university, department, capability (e.g., 'water purification', 'smart grid', 'bitumen')..."
            className="input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '32px', height: '36px', fontSize: '0.8125rem', width: '100%' }}
          />
        </div>
      </div>

      {/* Main Grid: HEI Cards + Detail Pane */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Left: HEI Profiles List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filteredHEIs.map((hei) => {
            const isSelected = selectedHEI?.id === hei.id;
            return (
              <div
                key={hei.id}
                onClick={() => setSelectedHEI(hei)}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: isSelected ? '1px solid var(--accent-indigo)' : '1px solid var(--border-subtle)',
                  padding: '1.15rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <GraduationCap size={16} color="var(--accent-indigo)" />
                    <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                      {hei.shortName}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {hei.type} • {hei.location}
                  </span>
                </div>

                <div style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
                  {hei.name}
                </div>

                {/* Micro Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', marginBottom: '0.65rem' }}>
                  <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.35rem 0.5rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Projects</div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)' }}>{hei.activeProjectsCount}</div>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.35rem 0.5rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Pilots</div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#10b981' }}>{hei.completedPilotsCount}</div>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.35rem 0.5rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>NEP 2020</div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>✓ Accredited</div>
                  </div>
                </div>

                {/* Capabilities pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                  {hei.capabilities.slice(0, 3).map((cap, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '0.68rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        color: 'var(--accent-indigo)',
                      }}
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Selected HEI Detailed Capability Profile */}
        {selectedHEI && (
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-medium)',
              padding: '1.35rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase' }}>
                    Institutional Profile
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                    {selectedHEI.name}
                  </h3>
                </div>
              </div>

              {/* Research Labs & Centers */}
              <div style={{ marginBottom: '1.15rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Recognized Research Centers & Labs
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {selectedHEI.researchCenters.map((rc, idx) => (
                    <div key={idx} style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.78125rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      🏢 {rc}
                    </div>
                  ))}
                </div>
              </div>

              {/* Participating Departments */}
              <div style={{ marginBottom: '1.15rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Core Engineering & Science Departments
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {selectedHEI.departments.map((dept, idx) => (
                    <div key={idx} style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)' }}>
                      • {dept}
                    </div>
                  ))}
                </div>
              </div>

              {/* Specialized Innovation Capabilities */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Verified Technological Capabilities
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {selectedHEI.capabilities.map((cap, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '0.25rem 0.55rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                        color: 'var(--accent-indigo)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                      }}
                    >
                      ✓ {cap}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Contact: {selectedHEI.contactEmail}</span>
              <span className="mono" style={{ color: '#10b981', fontWeight: 700 }}>NEP 2020 Active</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
