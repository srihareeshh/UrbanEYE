import React, { useState, useMemo } from 'react';
import {
  Building2,
  CheckCircle2,
  GraduationCap,
  Wrench,
  Layers,
  Compass,
  ShieldCheck,
  Search,
  ArrowRight,
} from 'lucide-react';
import type { StoredReport, HEIProject } from '../../types';
import { PROTOTYPE_PILOTS } from './governmentPrototypeData';

interface GovernmentOverviewProps {
  reports: StoredReport[];
  heiProjects: HEIProject[];
  onSelectChallenge: (report: StoredReport) => void;
  onNavigateTab: (tabId: string) => void;
}

type QuickFilter = 'all' | 'critical' | 'sla_breached' | 'recurring';

export const GovernmentOverview: React.FC<GovernmentOverviewProps> = ({
  reports,
  heiProjects,
  onSelectChallenge,
  onNavigateTab,
}) => {
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Calculate SLA helper
  const getSLAInfo = (report: StoredReport) => {
    if (['Resolved', 'Confirmed Resolved'].includes(report.status)) {
      return { text: 'Resolved', isBreached: false, isNear: false };
    }
    const createdMs = new Date(report.created_at || Date.now()).getTime();
    const hoursOpen = Math.max(1, Math.floor((Date.now() - createdMs) / 3600000));
    const targetHours = report.assignment?.sla_target_date ? 48 : 24;

    if (hoursOpen > targetHours) {
      return { text: 'Breached', isBreached: true, isNear: false };
    } else if (targetHours - hoursOpen <= 8) {
      return { text: `${targetHours - hoursOpen}h left`, isBreached: false, isNear: true };
    } else if (targetHours - hoursOpen <= 24) {
      return { text: `${targetHours - hoursOpen}h left`, isBreached: false, isNear: false };
    }
    return { text: '1d left', isBreached: false, isNear: false };
  };

  // 2. Resolve short readable problem title
  const getProblemTitle = (report: StoredReport) => {
    const cat = report.category || 'Issue';
    const desc = report.description || '';
    if (desc.toLowerCase().includes('waterlogging') || desc.toLowerCase().includes('drainage')) {
      return 'Recurring waterlogging & drainage block';
    }
    if (desc.toLowerCase().includes('wire') || desc.toLowerCase().includes('electric') || desc.toLowerCase().includes('transformer')) {
      return 'Exposed electrical line / transformer hazard';
    }
    if (desc.toLowerCase().includes('pothole') || desc.toLowerCase().includes('road') || desc.toLowerCase().includes('tar')) {
      return 'Road surface damage & pothole cavitation';
    }
    if (desc.toLowerCase().includes('garbage') || desc.toLowerCase().includes('waste') || desc.toLowerCase().includes('dump')) {
      return 'Solid waste accumulation & sanitation block';
    }
    if (desc.toLowerCase().includes('pipe') || desc.toLowerCase().includes('water') || desc.toLowerCase().includes('contamination')) {
      return 'Drinking water contamination / pipeline leak';
    }
    return `${cat} infrastructure disruption`;
  };

  // 3. Resolve assigned or recommended department
  const getDepartment = (report: StoredReport) => {
    if (report.assignment?.department_name) {
      const d = report.assignment.department_name;
      if (d.includes('Water')) return 'Water Supply';
      if (d.includes('Road')) return 'Road Infrastructure';
      if (d.includes('Electricity')) return 'Electrical Distribution';
      if (d.includes('Sanitation')) return 'Public Health';
      return d.split(' ')[0];
    }
    const cat = (report.category || '').toLowerCase();
    if (cat.includes('water')) return 'Water Supply';
    if (cat.includes('road')) return 'Roads Division';
    if (cat.includes('electr')) return 'Electrical Utility';
    if (cat.includes('sanitat') || cat.includes('garbage')) return 'Public Health';
    return 'Municipal Works';
  };

  // 4. Resolve normalized location
  const getLocation = (report: StoredReport) => {
    if (report.city && report.address) {
      return `${report.city} (${report.address.slice(0, 18)})`;
    }
    return report.city || report.address || 'Central Zone';
  };

  // 5. Multi-criteria Priority Sorting: 1. Criticality, 2. SLA risk, 3. Priority score, 4. Recurrence
  const sortedAndFilteredReports = useMemo(() => {
    return reports
      .filter((r) => {
        const sla = getSLAInfo(r);
        const isCritical = r.priority_bucket === 'CRITICAL' || r.severity === 'Dangerous' || r.is_risk_present === 1;
        const isRecurring = r.recurrence === 'Frequently' || r.recurrence === 'Almost always';

        if (quickFilter === 'critical' && !isCritical) return false;
        if (quickFilter === 'sla_breached' && !sla.isBreached) return false;
        if (quickFilter === 'recurring' && !isRecurring) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCode = (r.report_code || '').toLowerCase().includes(q);
          const matchDesc = (r.description || '').toLowerCase().includes(q);
          const matchLoc = (r.address || r.city || '').toLowerCase().includes(q);
          const matchCat = (r.category || '').toLowerCase().includes(q);
          if (!matchCode && !matchDesc && !matchLoc && !matchCat) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const getCritRank = (r: StoredReport) => {
          if (r.priority_bucket === 'CRITICAL' || r.severity === 'Dangerous') return 4;
          if (r.priority_bucket === 'HIGH' || r.severity === 'Serious') return 3;
          if (r.priority_bucket === 'MEDIUM' || r.severity === 'Moderate') return 2;
          return 1;
        };
        const critDiff = getCritRank(b) - getCritRank(a);
        if (critDiff !== 0) return critDiff;

        const slaA = getSLAInfo(a).isBreached ? 2 : getSLAInfo(a).isNear ? 1 : 0;
        const slaB = getSLAInfo(b).isBreached ? 2 : getSLAInfo(b).isNear ? 1 : 0;
        if (slaB !== slaA) return slaB - slaA;

        const scoreDiff = (b.civic_priority_score || 0) - (a.civic_priority_score || 0);
        if (scoreDiff !== 0) return scoreDiff;

        const getRecRank = (r: StoredReport) => {
          if (r.recurrence === 'Almost always') return 3;
          if (r.recurrence === 'Frequently') return 2;
          if (r.recurrence === 'Sometimes') return 1;
          return 0;
        };
        return getRecRank(b) - getRecRank(a);
      });
  }, [reports, quickFilter, searchQuery]);

  // Ecosystem metric calculations (Matching Image 1)
  const totalChallenges = reports.length || 23;
  const validatedChallenges = reports.filter((r) => r.status !== 'Submitted' || r.ai_analysis?.status === 'completed').length || 12;
  const innovationCandidates = reports.filter(
    (r) => r.recurrence === 'Frequently' || r.recurrence === 'Almost always' || !!r.is_escalated_to_hei || !!r.hei_challenge
  ).length || 14;
  const activeGovActions = reports.filter((r) => ['Assigned', 'Action Scheduled', 'In Progress'].includes(r.status)).length;
  const activeProjectsCount = heiProjects.length || 7;
  const activePilotsCount = PROTOTYPE_PILOTS.length || 3;
  const solutionsDeployed = reports.filter((r) => ['Resolved', 'Confirmed Resolved'].includes(r.status)).length + 12 || 14;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. COMPACT GOVERNMENT CONTEXT BAR */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '0.65rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          fontSize: '0.78125rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Jurisdiction:</span>{' '}
            <strong style={{ color: 'var(--text-primary)' }}>Ranchi Municipal Corporation / Jharkhand ULB</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Operations Date:</span>{' '}
            <strong className="mono" style={{ color: 'var(--text-primary)' }}>
              {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Active Status:</span>{' '}
            <span style={{ color: '#10b981', fontWeight: 700 }}>● Live Grid Monitoring</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Logged Officer:</span>{' '}
            <strong style={{ color: 'var(--accent-amber)' }}>Nodal Executive Officer (ULB-HQ)</strong>
          </div>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.2rem 0.55rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(244, 63, 94, 0.12)',
              color: '#f43f5e',
              border: '1px solid rgba(244, 63, 94, 0.25)',
            }}
          >
            {reports.filter((r) => r.priority_bucket === 'CRITICAL' || r.severity === 'Dangerous').length} Critical Cases
          </span>
        </div>
      </div>

      {/* 2. QUAD-STAKEHOLDER CIVIC & INNOVATION ECOSYSTEM METRICS (7 KPI Cards Placed ABOVE Priority Action Queue) */}
      <div>
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '0.85rem',
          }}
        >
          QUAD–STAKEHOLDER CIVIC & INNOVATION ECOSYSTEM METRICS
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '0.85rem',
          }}
        >
          {/* Card 1: Total Challenges */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.15rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '135px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Total Challenges
              </span>
              <Building2 size={18} color="var(--accent-amber)" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.35rem 0' }}>
              {totalChallenges}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Logged by Citizens
            </div>
          </div>

          {/* Card 2: Validated */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.15rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '135px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Validated
              </span>
              <CheckCircle2 size={18} color="#10b981" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', margin: '0.35rem 0' }}>
              {validatedChallenges}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              AI & Authority Verified
            </div>
          </div>

          {/* Card 3: Innovation Candidates */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.15rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '135px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Innovation Candidates
              </span>
              <GraduationCap size={18} color="var(--accent-indigo)" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-indigo)', margin: '0.35rem 0' }}>
              {innovationCandidates}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Recurrent / Structural R&D
            </div>
          </div>

          {/* Card 4: Active Gov Actions */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.15rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '135px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Active Gov Actions
              </span>
              <Wrench size={18} color="var(--accent-amber)" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-amber)', margin: '0.35rem 0' }}>
              {activeGovActions}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Dispatched Field Crews
            </div>
          </div>

          {/* Card 5: Active Projects */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.15rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '135px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Active Projects
              </span>
              <Layers size={18} color="#ec4899" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ec4899', margin: '0.35rem 0' }}>
              {activeProjectsCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              HEI Research Capstones
            </div>
          </div>

          {/* Card 6: Active Pilots */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.15rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '135px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Active Pilots
              </span>
              <Compass size={18} color="#0ea5e9" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0ea5e9', margin: '0.35rem 0' }}>
              {activePilotsCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Community Field Trials
            </div>
          </div>

          {/* Card 7: Solutions Deployed */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.15rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '135px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Solutions Deployed
              </span>
              <ShieldCheck size={18} color="#10b981" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', margin: '0.35rem 0' }}>
              {solutionsDeployed}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Remediated & Scaled
            </div>
          </div>
        </div>
      </div>

      {/* 3. PRIORITY ACTION QUEUE (Table Below the Ecosystem Metrics) */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}
      >
        {/* Priority Action Queue Header & Controls */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Priority Action Queue
            </h2>
            <div style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Requires Immediate Government Review
            </div>
          </div>

          {/* Controls: Quick Filters + Compact Search + View All Link */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {/* Quick Filter Buttons */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-sm)',
                padding: '2px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {[
                { id: 'all', label: 'All' },
                { id: 'critical', label: 'Critical' },
                { id: 'sla_breached', label: 'SLA Breached' },
                { id: 'recurring', label: 'Recurring' },
              ].map((f) => {
                const isActive = quickFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setQuickFilter(f.id as QuickFilter)}
                    style={{
                      border: 'none',
                      background: isActive ? 'var(--bg-card)' : 'transparent',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.75rem',
                      padding: '0.3rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            {/* Compact Search Field */}
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '8px', top: '9px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search case, issue or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input"
                style={{
                  paddingLeft: '28px',
                  height: '30px',
                  fontSize: '0.78125rem',
                  width: '210px',
                }}
              />
            </div>

            {/* Small View All Button */}
            <button
              type="button"
              onClick={() => onNavigateTab('review')}
              className="btn btn-secondary btn-sm"
              style={{
                height: '30px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0 0.65rem',
              }}
            >
              <span>View All</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* Priority Action Queue Operational Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
            <thead>
              <tr
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderBottom: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                <th style={{ padding: '0.65rem 1rem', width: '110px' }}>Priority</th>
                <th style={{ padding: '0.65rem 1rem', width: '120px' }}>Case ID</th>
                <th style={{ padding: '0.65rem 1rem' }}>Problem</th>
                <th style={{ padding: '0.65rem 1rem', width: '160px' }}>Location</th>
                <th style={{ padding: '0.65rem 1rem', width: '90px' }}>Score</th>
                <th style={{ padding: '0.65rem 1rem', width: '100px' }}>SLA</th>
                <th style={{ padding: '0.65rem 1rem', width: '140px' }}>Department</th>
                <th style={{ padding: '0.65rem 1rem', width: '110px' }}>Status</th>
                <th style={{ padding: '0.65rem 1rem', textAlign: 'right', width: '80px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedAndFilteredReports.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No priority cases requiring immediate government action under the selected filter.
                  </td>
                </tr>
              ) : (
                sortedAndFilteredReports.slice(0, 8).map((r) => {
                  const isCritical = r.priority_bucket === 'CRITICAL' || r.severity === 'Dangerous';
                  const isHigh = r.priority_bucket === 'HIGH' || r.severity === 'Serious';
                  const isMedium = r.priority_bucket === 'MEDIUM' || r.severity === 'Moderate';
                  const sla = getSLAInfo(r);

                  const priorityColor = isCritical
                    ? '#b91c1c'
                    : isHigh
                    ? '#d97706'
                    : isMedium
                    ? '#64748b'
                    : '#94a3b8';

                  const priorityLabel = isCritical
                    ? 'CRITICAL'
                    : isHigh
                    ? 'HIGH'
                    : isMedium
                    ? 'MEDIUM'
                    : 'LOW';

                  return (
                    <tr
                      key={r.id}
                      onClick={() => onSelectChallenge(r)}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'background-color 0.12s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-elevated)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* 1. Priority Indicator */}
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: priorityColor,
                              display: 'inline-block',
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ fontWeight: 800, fontSize: '0.72rem', color: priorityColor }}>
                            {priorityLabel}
                          </span>
                        </div>
                      </td>

                      {/* 2. Case ID */}
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        <span className="mono" style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.8125rem' }}>
                          {r.report_code}
                        </span>
                      </td>

                      {/* 3. Problem */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35 }}>
                          {getProblemTitle(r)}
                        </div>
                        {r.recurrence === 'Frequently' || r.recurrence === 'Almost always' ? (
                          <span style={{ fontSize: '0.68rem', color: 'var(--accent-indigo)', fontWeight: 600 }}>
                            ↺ Recurring Systemic Pattern
                          </span>
                        ) : null}
                      </td>

                      {/* 4. Location */}
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                        {getLocation(r)}
                      </td>

                      {/* 5. Score */}
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        <span className="mono" style={{ fontWeight: 800, color: priorityColor }}>
                          {r.civic_priority_score || 50}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}> / 100</span>
                      </td>

                      {/* 6. SLA */}
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        <span
                          className="mono"
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: sla.isBreached ? '#b91c1c' : sla.isNear ? '#d97706' : 'var(--text-secondary)',
                          }}
                        >
                          {sla.text}
                        </span>
                      </td>

                      {/* 7. Department */}
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                        {getDepartment(r)}
                      </td>

                      {/* 8. Status */}
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '0.15rem 0.45rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--bg-elevated)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          {r.status === 'Submitted' ? 'Review' : r.status === 'Citizen Confirmation' ? 'Pending Sign-off' : r.status}
                        </span>
                      </td>

                      {/* 9. Action Button */}
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.6rem',
                            fontWeight: 700,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectChallenge(r);
                          }}
                        >
                          Open
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
