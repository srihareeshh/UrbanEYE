import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  MapPin,
  FilePlus,
} from 'lucide-react';
import type { StoredReport, HEIChallenge } from '../../../types';

interface HEIChallengesTabProps {
  challenges: HEIChallenge[];
  reports: StoredReport[];
  onOpenChallengeDetail: (challenge: StoredReport | HEIChallenge) => void;
  onAcceptEvaluation: (challenge: HEIChallenge) => void;
  onDeclineChallenge: (challenge: HEIChallenge) => void;
  onDraftProposal: (challenge: HEIChallenge) => void;
}

export const HEIChallengesTab: React.FC<HEIChallengesTabProps> = ({
  challenges,
  reports,
  onOpenChallengeDetail,
  onAcceptEvaluation,
  onDeclineChallenge,
  onDraftProposal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'match' | 'severity' | 'newest'>('match');

  // Domains
  const domains = ['All', 'Water Supply', 'Roads & Infrastructure', 'Drainage', 'Electrical & Power', 'Agriculture & Soil'];

  const filteredChallenges = challenges.filter((c) => {
    if (domainFilter !== 'All' && !c.category.toLowerCase().includes(domainFilter.toLowerCase()) && !c.department_match.toLowerCase().includes(domainFilter.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'All' && c.status !== statusFilter.toLowerCase()) {
      return false;
    }
    if (statusFilter !== 'All' && c.status !== statusFilter.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchDesc = c.description.toLowerCase().includes(q);
      const matchWard = (c.ward || '').toLowerCase().includes(q);
      const matchBrief = (c.research_brief || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchWard && !matchBrief) return false;
    }
    return true;
  });

  // Sorting
  const sortedChallenges = [...filteredChallenges].sort((a, b) => {
    if (sortBy === 'match') return (b.match_percentage || 0) - (a.match_percentage || 0);
    if (sortBy === 'severity') return (b.civic_priority_score || 0) - (a.civic_priority_score || 0);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Header & Controls */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Structured Innovation Challenges
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0 }}>
              Escalated civic problem genomes requiring academic investigation, university R&D, and engineering capstone prototypes.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sort by:</span>
            <select
              className="input"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{ height: '34px', fontSize: '0.78125rem', borderRadius: 'var(--radius-sm)' }}
            >
              <option value="match">HEI Match % (Highest)</option>
              <option value="severity">Priority Severity (Highest)</option>
              <option value="newest">Most Recent</option>
            </select>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input"
              placeholder="Search challenges, keywords, problem domains, wards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '32px', height: '36px', fontSize: '0.8125rem', width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ height: '32px', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)' }}
            >
              <option value="All">All Statuses</option>
              <option value="open">Open (Unclaimed)</option>
              <option value="claimed">Claimed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            {domains.map((dom) => (
              <button
                key={dom}
                type="button"
                onClick={() => setDomainFilter(dom)}
                className={`btn btn-sm ${domainFilter === dom ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
              >
                {dom}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Challenges List */}
      {sortedChallenges.length === 0 ? (
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '3rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <Sparkles size={32} style={{ margin: '0 auto 0.75rem auto', color: 'var(--accent-indigo)', opacity: 0.7 }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            No Innovation Challenges Match Filter Criteria
          </h3>
          <p style={{ fontSize: '0.8125rem', maxWidth: '460px', margin: '0 auto', lineHeight: 1.5 }}>
            Try clearing search filters or changing department selection to view all matched civic challenges.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sortedChallenges.map((chal) => {
            // Find underlying report if available
            const linkedReport = reports.find((r) => r.id === chal.report_id || r.report_code === chal.report_code);
            const structuredAI = linkedReport?.ai_analysis?.structured_output;
            const capabilities = structuredAI?.required_capabilities || ['Environmental Engineering', 'IoT Sensors', 'Hydrodynamic Modeling'];

            return (
              <div
                key={chal.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                }}
              >
                {/* Challenge Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <span className="mono" style={{ fontSize: '0.8125rem', fontWeight: 900, color: 'var(--accent-indigo)' }}>
                      {chal.report_code || chal.id}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.55rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'rgba(99, 102, 241, 0.12)',
                        color: 'var(--accent-indigo)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                      }}
                    >
                      {chal.category}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.55rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                      }}
                    >
                      {chal.match_percentage || 92}% Institutional Match
                    </span>
                    {chal.status !== 'open' && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.55rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: chal.status === 'claimed' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                          color: chal.status === 'claimed' ? 'var(--accent-amber)' : '#38bdf8',
                        }}
                      >
                        {chal.status === 'claimed' ? 'Claimed / In Evaluation' : chal.status.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin size={13} />
                      {chal.ward || chal.address || 'Urban District'}
                    </span>
                    <span>•</span>
                    <span>Priority Score: <strong style={{ color: 'var(--accent-amber)' }}>{chal.civic_priority_score || linkedReport?.civic_priority_score || 85}/100</strong></span>
                  </div>
                </div>

                {/* Title & Problem Brief */}
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    {chal.title}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                    {chal.description}
                  </p>
                </div>

                {/* AI Research Rationale & Problem Genome */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 0.9rem',
                    fontSize: '0.78125rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    <span>AI Innovation Assessment & Underlying Problem</span>
                    <span style={{ color: '#10b981' }}>● Root Cause Grounded</span>
                  </div>
                  <div style={{ color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {structuredAI?.underlying_problem || chal.research_brief || 'Persistent recurrence indicates conventional localized patch repairs fail to remediate underlying structural drainage defects.'}
                  </div>

                  {/* Required Capability Tags */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 700 }}>Required Capabilities:</span>
                    {capabilities.map((cap, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'rgba(99, 102, 241, 0.1)',
                          color: 'var(--accent-indigo)',
                          border: '1px solid rgba(99, 102, 241, 0.25)',
                        }}
                      >
                        • {cap}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.35rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Department Match: <strong style={{ color: 'var(--text-primary)' }}>{chal.department_match}</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => onOpenChallengeDetail(linkedReport || chal)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.78125rem' }}
                    >
                      <span>Review Problem Genome</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDraftProposal(chal)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.78125rem', borderColor: 'rgba(245, 158, 11, 0.4)', color: 'var(--accent-amber)' }}
                    >
                      <FilePlus size={13} />
                      <span>Draft R&D Proposal</span>
                    </button>

                    {chal.status === 'open' && (
                      <>
                        <button
                          type="button"
                          onClick={() => onAcceptEvaluation(chal)}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.78125rem' }}
                        >
                          <span>Accept for Evaluation</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeclineChallenge(chal)}
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}
                        >
                          <span>Decline</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
