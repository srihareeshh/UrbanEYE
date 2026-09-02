import React, { useState } from 'react';
import {
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { ResearchProposal } from '../heiDataModel';

interface HEIProposalsTabProps {
  proposals: ResearchProposal[];
  onOpenNewProposalModal: () => void;
}

export const HEIProposalsTab: React.FC<HEIProposalsTabProps> = ({
  proposals,
  onOpenNewProposalModal,
}) => {
  const [expandedProposalId, setExpandedProposalId] = useState<string | null>(proposals[0]?.id || null);

  const toggleExpand = (id: string) => {
    setExpandedProposalId(expandedProposalId === id ? null : id);
  };

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
            R&D & Capstone Research Proposals
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0 }}>
            Structured engineering proposals submitted for academic evaluation, municipal pilot funding, and CSR sponsorship.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewProposalModal}
          className="btn btn-primary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}
        >
          <Plus size={14} />
          <span>Draft New Research Proposal</span>
        </button>
      </div>

      {/* 2. Proposals List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {proposals.map((prop) => {
          const isExpanded = expandedProposalId === prop.id;

          return (
            <div
              key={prop.id}
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
              {/* Proposal Summary Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  cursor: 'pointer',
                }}
                onClick={() => toggleExpand(prop.id)}
              >
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>
                      {prop.id.toUpperCase()}
                    </span>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'rgba(99, 102, 241, 0.12)',
                        color: 'var(--accent-indigo)',
                      }}
                    >
                      {prop.domain}
                    </span>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor:
                          prop.status === 'approved'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : prop.status === 'under_evaluation'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(255, 255, 255, 0.1)',
                        color:
                          prop.status === 'approved'
                            ? '#10b981'
                            : prop.status === 'under_evaluation'
                            ? 'var(--accent-amber)'
                            : 'var(--text-secondary)',
                      }}
                    >
                      ● {prop.status.toUpperCase().replace('_', ' ')}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.35rem', marginBottom: '0.15rem' }}>
                    {prop.title}
                  </h3>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Faculty Lead: <strong style={{ color: 'var(--text-primary)' }}>{prop.facultyLead.name}</strong> ({prop.department}) • Team: <strong>{prop.studentTeam.length} Student Researchers</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--accent-indigo)' }}>
                      ₹{prop.budgetRequested.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      Est. {prop.estimatedDurationMonths} Months
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                </div>
              </div>

              {/* Expanded Proposal Details */}
              {isExpanded && (
                <div
                  style={{
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    animation: 'fadeIn 0.2s ease',
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.75rem' }}>
                    <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Problem Statement & Root Cause</span>
                      <p style={{ fontSize: '0.78125rem', color: 'var(--text-primary)', marginTop: '0.25rem', lineHeight: 1.45, margin: 0 }}>
                        {prop.problemStatement}
                      </p>
                    </div>

                    <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Research Hypothesis</span>
                      <p style={{ fontSize: '0.78125rem', color: 'var(--text-primary)', marginTop: '0.25rem', lineHeight: 1.45, margin: 0 }}>
                        {prop.hypothesis}
                      </p>
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Engineering & Research Methodology</span>
                    <p style={{ fontSize: '0.78125rem', color: 'var(--text-primary)', marginTop: '0.25rem', lineHeight: 1.45, margin: 0 }}>
                      {prop.methodology}
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                    <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Prototype Fabrication Plan</span>
                      <p style={{ fontSize: '0.78125rem', color: 'var(--text-primary)', marginTop: '0.25rem', lineHeight: 1.4, margin: 0 }}>
                        {prop.prototypePlan}
                      </p>
                    </div>

                    <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Community Field Pilot Strategy</span>
                      <p style={{ fontSize: '0.78125rem', color: 'var(--text-primary)', marginTop: '0.25rem', lineHeight: 1.4, margin: 0 }}>
                        {prop.pilotPlan}
                      </p>
                    </div>
                  </div>

                  {/* Deliverables tags */}
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Expected Deliverables:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.3rem' }}>
                      {prop.deliverables.map((del, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.55rem',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'rgba(99, 102, 241, 0.12)',
                            color: 'var(--accent-indigo)',
                            border: '1px solid rgba(99, 102, 241, 0.25)',
                          }}
                        >
                          • {del}
                        </span>
                      ))}
                    </div>
                  </div>

                  {prop.reviewerNotes && (
                    <div
                      style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.65rem 0.85rem',
                        fontSize: '0.75rem',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <strong style={{ color: '#10b981' }}>Review Committee Note:</strong> {prop.reviewerNotes}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
