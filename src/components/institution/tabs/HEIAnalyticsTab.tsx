import React from 'react';
import {
  BarChart3,
} from 'lucide-react';
import type { HEIProfile } from '../heiDataModel';

interface HEIAnalyticsTabProps {
  activeInstitution: HEIProfile;
}

export const HEIAnalyticsTab: React.FC<HEIAnalyticsTabProps> = ({ activeInstitution }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart3 size={18} color="var(--accent-indigo)" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Institutional Innovation Analytics & NEP Output
          </h2>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0 }}>
          Comprehensive telemetry tracking university research engagement, NEP 2020 experiential student credits, corporate CSR utilization, and municipal adoption across {activeInstitution.shortName}.
        </p>
      </div>

      {/* KPI Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total NEP Research Hours</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-indigo)', marginTop: '0.2rem' }}>
            595 Hours
          </div>
          <span style={{ fontSize: '0.6875rem', color: '#10b981' }}>Across 4 Departments</span>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>CSR Grants Mobilized</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10b981', marginTop: '0.2rem' }}>
            ₹8.25 Lakhs
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Tata Steel & Schneider</span>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>NEP Academic Credits Issued</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-amber)', marginTop: '0.2rem' }}>
            28 Credits
          </div>
          <span style={{ fontSize: '0.6875rem', color: '#10b981' }}>SHA-256 APAAR Verified</span>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Field Pilot Adoption Rate</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38bdf8', marginTop: '0.2rem' }}>
            88%
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Municipal Verified</span>
        </div>
      </div>

      {/* Departmental Innovation Output Matrix */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
        }}
      >
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.85rem' }}>
          Departmental Research Pipeline Breakdown
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            { dept: 'Civil & Environmental Engineering', projects: 2, hours: 240, grant: '₹3.5L', status: 'Active Field Pilot' },
            { dept: 'Electrical & Electronics Engineering', projects: 1, hours: 165, grant: '₹2.0L', status: 'Bench Testing V1.2' },
            { dept: 'Computer Science & AI', projects: 1, hours: 210, grant: '₹1.5L', status: 'Model Validation' },
            { dept: 'Bio-Technology & Pharmaceutical', projects: 1, hours: 95, grant: '₹1.8L', status: 'Lab Culture Inoculation' },
          ].map((d, i) => (
            <div
              key={i}
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {d.dept}
                </span>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Active Projects: <strong>{d.projects}</strong> • Research Hours: <strong>{d.hours} hrs</strong> • CSR Grant: <strong>{d.grant}</strong>
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981', padding: '0.15rem 0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.12)', borderRadius: 'var(--radius-full)' }}>
                ● {d.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
