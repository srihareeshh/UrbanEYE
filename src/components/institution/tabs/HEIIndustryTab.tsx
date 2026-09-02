import React from 'react';
import {
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import type { IndustryPartnerCollab } from '../heiDataModel';

interface HEIIndustryTabProps {
  industryCollabs: IndustryPartnerCollab[];
}

export const HEIIndustryTab: React.FC<HEIIndustryTabProps> = ({
  industryCollabs,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
          Industry R&D Collaboration & CSR Escrow Grants
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0 }}>
          Corporate CSR funding, smart hardware sponsors, and industry engineering mentors co-guiding student capstone innovations.
        </p>
      </div>

      {/* 2. Industry Collaborations Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {industryCollabs.map((collab) => (
          <div
            key={collab.id}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.35rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  {collab.partnerType}
                </span>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.35rem', marginBottom: '0.1rem' }}>
                  {collab.corporateName}
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {collab.industryDomain} • CIN: <span className="mono">{collab.cin}</span>
                </div>
              </div>

              {collab.pledgeAmount && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#10b981' }}>
                    ₹{collab.pledgeAmount.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    CSR Pledge
                  </div>
                </div>
              )}
            </div>

            {/* Linked Project */}
            <div
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                fontSize: '0.75rem',
              }}
            >
              <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase' }}>
                Co-Funded Capstone Project:
              </div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 700, marginTop: '0.15rem' }}>
                {collab.linkedProjectTitle}
              </div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                {collab.contributionSummary}
              </div>
            </div>

            {/* Mentor & Escrow Status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
              }}
            >
              {collab.mentorName ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <UserCheck size={13} color="var(--accent-indigo)" />
                  Mentor: <strong style={{ color: 'var(--text-primary)' }}>{collab.mentorName}</strong>
                </span>
              ) : (
                <span>Escrow Secured</span>
              )}

              <span
                style={{
                  color: collab.escrowStatus === 'fully_disbursed' ? '#10b981' : 'var(--accent-amber)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <ShieldCheck size={13} />
                {collab.escrowStatus.toUpperCase().replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
