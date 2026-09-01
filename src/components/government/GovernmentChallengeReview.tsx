import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  Wrench,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import type { StoredReport } from '../../types';
import { formatISTDateTime } from '../../utils/dateHelper';
import { JHARKHAND_DISTRICTS } from './governmentPrototypeData';

interface GovernmentChallengeReviewProps {
  reports: StoredReport[];
  onSelectChallenge: (report: StoredReport) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const GovernmentChallengeReview: React.FC<GovernmentChallengeReviewProps> = ({
  reports,
  onSelectChallenge,
  onRefresh,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('All Districts');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [govActionFilter, setGovActionFilter] = useState('all');
  const [innovationFilter, setInnovationFilter] = useState('all');

  // Filter Reports
  const filteredReports = reports.filter((r) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = (r.report_code || '').toLowerCase().includes(q);
      const matchDesc = (r.description || '').toLowerCase().includes(q);
      const matchAddr = (r.address || '').toLowerCase().includes(q);
      const matchCity = (r.city || '').toLowerCase().includes(q);
      if (!matchCode && !matchDesc && !matchAddr && !matchCity) return false;
    }

    // 2. Status Filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending' && !['Submitted', 'Under Review'].includes(r.status)) return false;
      if (statusFilter === 'in_progress' && !['Assigned', 'Action Scheduled', 'In Progress'].includes(r.status)) return false;
      if (statusFilter === 'signoff' && r.status !== 'Citizen Confirmation') return false;
      if (statusFilter === 'resolved' && !['Resolved', 'Confirmed Resolved'].includes(r.status)) return false;
    }

    // 3. Domain Filter
    if (domainFilter !== 'all' && r.category !== domainFilter) return false;

    // 4. District Filter
    if (districtFilter !== 'All Districts') {
      const addr = (r.address || r.city || '').toLowerCase();
      if (!addr.includes(districtFilter.toLowerCase())) return false;
    }

    // 5. Severity Filter
    if (severityFilter !== 'all') {
      const sev = (r.priority_breakdown?.severity_level || r.severity || '').toLowerCase();
      if (severityFilter === 'critical' && !['critical', 'dangerous'].includes(sev)) return false;
      if (severityFilter === 'high' && !['high', 'serious'].includes(sev)) return false;
      if (severityFilter === 'medium' && !['medium', 'moderate'].includes(sev)) return false;
      if (severityFilter === 'low' && sev !== 'low') return false;
    }

    // 6. Urgency Filter
    if (urgencyFilter === 'immediate') {
      const score = r.civic_priority_score || 0;
      if (score < 70 && r.severity !== 'Dangerous' && r.is_risk_present !== 1) return false;
    }

    // 7. Gov Action Filter
    if (govActionFilter === 'action_needed' && ['Resolved', 'Confirmed Resolved', 'Citizen Confirmation'].includes(r.status)) return false;
    if (govActionFilter === 'dispatched' && !['Assigned', 'Action Scheduled', 'In Progress'].includes(r.status)) return false;
    if (govActionFilter === 'resolved' && !['Resolved', 'Citizen Confirmation', 'Confirmed Resolved'].includes(r.status)) return false;

    // 8. Innovation Needed
    const isEscalated = !!r.is_escalated_to_hei || !!r.hei_challenge;
    const isRecurring = r.recurrence === 'Frequently' || r.recurrence === 'Almost always';
    if (innovationFilter === 'candidate' && !isRecurring && !isEscalated) return false;
    if (innovationFilter === 'routed' && !isEscalated) return false;

    return true;
  });

  const domains = ['Roads', 'Water', 'Sanitation', 'Electricity', 'Schools', 'Agriculture', 'Environment', 'Other'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Controls & Search Bar */}
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
              Civic Challenge Review Queue
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              Multi-criteria screening, AI advisory assessment, immediate work orders & university routing.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <RefreshCw size={13} className={isLoading ? 'spin' : ''} />
                <span>Refresh Queue</span>
              </button>
            )}
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.3rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              Showing {filteredReports.length} of {reports.length} Challenges
            </span>
          </div>
        </div>

        {/* Multi-Dimensional Filter Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem' }}>
          {/* 1. Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search code, keyword, area..."
              className="input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '32px', height: '36px', fontSize: '0.8125rem', width: '100%' }}
            />
          </div>

          {/* 2. District Filter */}
          <select
            className="input"
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            style={{ height: '36px', fontSize: '0.8125rem' }}
          >
            {JHARKHAND_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* 3. Domain Filter */}
          <select
            className="input"
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            style={{ height: '36px', fontSize: '0.8125rem' }}
          >
            <option value="all">All Domains (Categories)</option>
            {domains.map((dom) => (
              <option key={dom} value={dom}>
                {dom}
              </option>
            ))}
          </select>

          {/* 4. Status Filter */}
          <select
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ height: '36px', fontSize: '0.8125rem' }}
          >
            <option value="all">All Lifecycle Statuses</option>
            <option value="pending">Pending Triage / Under Review</option>
            <option value="in_progress">Dispatched / In Progress</option>
            <option value="signoff">Pending Citizen Sign-off</option>
            <option value="resolved">Confirmed Resolved</option>
          </select>

          {/* 5. Severity Filter */}
          <select
            className="input"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            style={{ height: '36px', fontSize: '0.8125rem' }}
          >
            <option value="all">All Severity Levels</option>
            <option value="critical">Critical / Dangerous</option>
            <option value="high">High / Serious</option>
            <option value="medium">Medium / Moderate</option>
            <option value="low">Low</option>
          </select>

          {/* 6. Gov Action Filter */}
          <select
            className="input"
            value={govActionFilter}
            onChange={(e) => setGovActionFilter(e.target.value)}
            style={{ height: '36px', fontSize: '0.8125rem' }}
          >
            <option value="all">All Gov Action Stages</option>
            <option value="action_needed">Action Required</option>
            <option value="dispatched">Dispatched / In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          {/* 7. Urgency Filter */}
          <select
            className="input"
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            style={{ height: '36px', fontSize: '0.8125rem' }}
          >
            <option value="all">All Urgency Levels</option>
            <option value="immediate">Immediate Attention Needed</option>
          </select>

          {/* 8. Innovation Filter */}
          <select
            className="input"
            value={innovationFilter}
            onChange={(e) => setInnovationFilter(e.target.value)}
            style={{ height: '36px', fontSize: '0.8125rem' }}
          >
            <option value="all">All Innovation Pathways</option>
            <option value="candidate">Innovation Candidates (Recurrent/Structural)</option>
            <option value="routed">Active University HEI Track</option>
          </select>
        </div>
      </div>

      {/* Challenges Data Table */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Code & Domain</th>
                <th style={{ padding: '0.75rem 1rem' }}>Grievance Summary</th>
                <th style={{ padding: '0.75rem 1rem' }}>Location (District/Ward)</th>
                <th style={{ padding: '0.75rem 1rem' }}>Submission Time (IST)</th>
                <th style={{ padding: '0.75rem 1rem' }}>Severity & Risk</th>
                <th style={{ padding: '0.75rem 1rem' }}>Priority Score</th>
                <th style={{ padding: '0.75rem 1rem' }}>Gov Action Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Innovation Track</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Review</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                    No challenges match the active filter criteria.
                  </td>
                </tr>
              ) : (
                filteredReports.map((r) => {
                  const isCritical = r.priority_bucket === 'CRITICAL' || r.severity === 'Dangerous';
                  const isHigh = r.priority_bucket === 'HIGH' || r.severity === 'Serious';
                  const isEscalated = !!r.is_escalated_to_hei || !!r.hei_challenge;
                  const isAssigned = !!r.assignment || ['Assigned', 'Action Scheduled', 'In Progress'].includes(r.status);
                  const isDualSignoff = r.status === 'Citizen Confirmation';
                  const isResolved = ['Resolved', 'Confirmed Resolved'].includes(r.status);

                  return (
                    <tr
                      key={r.id}
                      onClick={() => onSelectChallenge(r)}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-elevated)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* 1. Code & Domain */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div className="mono" style={{ fontWeight: 800, color: 'var(--accent-amber)', fontSize: '0.875rem' }}>
                          {r.report_code}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                          {r.category}
                        </div>
                      </td>

                      {/* 2. Grievance Summary */}
                      <td style={{ padding: '0.85rem 1rem', maxWidth: '280px' }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={r.description}
                        >
                          {r.description}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          Recurrence: {r.recurrence} • Duration: {r.duration}
                        </div>
                      </td>

                      {/* 3. Location */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {r.city || 'Central Zone'}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.address || 'Municipal Ward'}
                        </div>
                      </td>

                      {/* 4. Submission IST */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {formatISTDateTime(r.created_at)}
                      </td>

                      {/* 5. Severity & Risk */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.5rem',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: isCritical
                              ? 'rgba(244, 63, 94, 0.15)'
                              : isHigh
                              ? 'rgba(249, 115, 22, 0.15)'
                              : 'rgba(56, 189, 248, 0.15)',
                            color: isCritical ? '#f43f5e' : isHigh ? '#f97316' : '#38bdf8',
                          }}
                        >
                          {r.severity}
                        </span>
                        {r.is_risk_present === 1 && (
                          <div style={{ fontSize: '0.68rem', color: '#f43f5e', fontWeight: 600, marginTop: '0.2rem' }}>
                            ⚠️ Immediate Risk
                          </div>
                        )}
                      </td>

                      {/* 6. Priority Score */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div className="mono" style={{ fontSize: '0.9375rem', fontWeight: 900, color: isCritical ? '#f43f5e' : isHigh ? '#f97316' : 'var(--accent-amber)' }}>
                          {r.civic_priority_score || 50}/100
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {r.priority_bucket || 'HIGH'}
                        </div>
                      </td>

                      {/* 7. Gov Action Status */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        {isResolved ? (
                          <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <CheckCircle2 size={13} />
                            <span>Resolved</span>
                          </span>
                        ) : isDualSignoff ? (
                          <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Clock size={13} />
                            <span>Awaiting Sign-off</span>
                          </span>
                        ) : isAssigned ? (
                          <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Wrench size={13} />
                            <span>In Progress</span>
                          </span>
                        ) : (
                          <span style={{ color: '#f43f5e', fontWeight: 700, fontSize: '0.75rem' }}>
                            Action Required
                          </span>
                        )}
                        {r.assignment && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            {r.assignment.officer_name}
                          </div>
                        )}
                      </td>

                      {/* 8. Innovation Track */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        {isEscalated ? (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '0.2rem 0.5rem',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: 'rgba(99, 102, 241, 0.15)',
                              color: 'var(--accent-indigo)',
                            }}
                          >
                            ✓ HEI R&D Track
                          </span>
                        ) : r.recurrence === 'Frequently' || r.recurrence === 'Almost always' ? (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: 'var(--accent-indigo)',
                            }}
                          >
                            Candidate
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Standard
                          </span>
                        )}
                      </td>

                      {/* 9. Action Button */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectChallenge(r);
                          }}
                        >
                          <span>Review & Triage</span>
                          <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
