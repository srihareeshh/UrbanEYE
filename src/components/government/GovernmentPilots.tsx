import React, { useState } from 'react';
import {
  Search,
} from 'lucide-react';
import { PROTOTYPE_PILOTS } from './governmentPrototypeData';

export const GovernmentPilots: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');

  const filteredPilots = PROTOTYPE_PILOTS.filter((pilot) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = pilot.title.toLowerCase().includes(q);
      const matchInst = pilot.leadInstitution.toLowerCase().includes(q);
      const matchComm = pilot.community.toLowerCase().includes(q);
      if (!matchTitle && !matchInst && !matchComm) return false;
    }
    if (districtFilter !== 'all' && pilot.district !== districtFilter) return false;
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
              Real-World Community Pilot Monitoring
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              On-ground municipal field testing, sensor telemetry & citizen impact measurements before state-wide ULB rate contracts.
            </p>
          </div>

          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            {PROTOTYPE_PILOTS.length} Active Field Pilots
          </span>
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search pilot, community, HEI..."
              className="input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '32px', height: '36px', fontSize: '0.8125rem', width: '100%' }}
            />
          </div>

          <select
            className="input"
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            style={{ height: '36px', fontSize: '0.8125rem' }}
          >
            <option value="all">All Pilot Districts</option>
            <option value="Ranchi">Ranchi</option>
            <option value="Dhanbad">Dhanbad</option>
            <option value="East Singhbhum (Jamshedpur)">East Singhbhum (Jamshedpur)</option>
          </select>
        </div>
      </div>

      {/* Pilots List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {filteredPilots.map((pilot) => {
          return (
            <div
              key={pilot.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                padding: '1.35rem',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                      {pilot.reportCode}
                    </span>

                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: pilot.status === 'scaling' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                        color: pilot.status === 'scaling' ? '#10b981' : '#38bdf8',
                      }}
                    >
                      {pilot.status.toUpperCase()} (Month {pilot.currentMonth} of {pilot.durationMonths})
                    </span>

                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Deployed: {pilot.deploymentDate}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {pilot.title}
                  </h3>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Lead University</div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--accent-indigo)' }}>{pilot.leadInstitution}</strong>
                </div>
              </div>

              {/* Location & Partner Banner */}
              <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.78125rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  📍 Community: <strong>{pilot.community}, {pilot.district}</strong>
                </div>
                {pilot.industryPartner && (
                  <div>
                    🏢 CSR Sponsor: <strong style={{ color: '#ec4899' }}>{pilot.industryPartner}</strong>
                  </div>
                )}
                <div>
                  👥 Beneficiaries: <strong>{pilot.householdsBenefited.toLocaleString()} Households</strong> ({pilot.devicesDeployed} Deployed Units)
                </div>
              </div>

              {/* Telemetry & Impact Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                {/* 1. Problem Reduction */}
                <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Problem Reduction
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#10b981', marginTop: '0.2rem' }}>
                    {pilot.problemReductionPct}%
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                    Vs Historical Baseline
                  </div>
                </div>

                {/* 2. Key Sensor Metric */}
                <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {pilot.keyMetricName}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                    {pilot.keyMetricValue}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    Baseline: {pilot.keyMetricBaseline}
                  </div>
                </div>

                {/* 3. Technical Performance */}
                <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Uptime & Reliability
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#38bdf8', marginTop: '0.2rem' }}>
                    {pilot.technicalPerformance}%
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                    IoT Telemetric Health
                  </div>
                </div>

                {/* 4. Community Feedback */}
                <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Citizen Satisfaction
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--accent-amber)', marginTop: '0.2rem' }}>
                    {pilot.communitySatisfactionPct}%
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                    Ward Survey Score
                  </div>
                </div>
              </div>

              {/* Field Observation Notes */}
              <div style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', fontStyle: 'italic', backgroundColor: 'var(--bg-card)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                Field Note: {pilot.notes}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
