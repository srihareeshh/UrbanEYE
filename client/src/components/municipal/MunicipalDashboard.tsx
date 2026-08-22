import React, { useState } from 'react';
import {
  Building2,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  Wrench,
  GraduationCap,
  Sparkles,
  Search,
  UserCheck,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { useGlobalStore } from '../../store/globalStore';
import type { StoredReport } from '../../types';
import { MunicipalHotspotMap } from './MunicipalHotspotMap';
import { MunicipalTriageModal } from './MunicipalTriageModal';
import { MunicipalDualSignoffModal } from './MunicipalDualSignoffModal';

export const MunicipalDashboard: React.FC = () => {
  const {
    reports,
    municipalKPIs,
    dispatchWorkOrder,
    escalateToHEI,
    resolveDualSignoff,
    refreshAll,
    isLoading,
  } = useGlobalStore();

  const [activeTab, setActiveTab] = useState<'triage' | 'map' | 'analytics'>('triage');
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Selected Issue for Modals
  const [triageIssue, setTriageIssue] = useState<StoredReport | null>(null);
  const [dualSignoffIssue, setDualSignoffIssue] = useState<StoredReport | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter Issues
  const filteredIssues = reports.filter((issue) => {
    if (selectedWard !== 'all' && issue.address && !issue.address.toLowerCase().includes(selectedWard.toLowerCase())) {
      return false;
    }
    if (selectedCategory !== 'all' && issue.category !== selectedCategory) {
      return false;
    }
    if (statusFilter === 'pending_triage' && !['Submitted', 'Under Review'].includes(issue.status)) {
      return false;
    }
    if (statusFilter === 'in_progress' && !['Assigned', 'Action Scheduled', 'In Progress'].includes(issue.status)) {
      return false;
    }
    if (statusFilter === 'hei_escalated' && !(issue as any).is_escalated_to_hei && !(issue as any).hei_challenge) {
      return false;
    }
    if (statusFilter === 'dual_signoff' && issue.status !== 'Citizen Confirmation') {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = issue.description.toLowerCase().includes(q);
      const matchCode = issue.report_code.toLowerCase().includes(q);
      const matchAddr = (issue.address || '').toLowerCase().includes(q);
      if (!matchDesc && !matchCode && !matchAddr) return false;
    }
    return true;
  });

  const pendingTriageCount = reports.filter((r) => ['Submitted', 'Under Review'].includes(r.status)).length;
  const inProgressCount = reports.filter((r) => ['Assigned', 'Action Scheduled', 'In Progress'].includes(r.status)).length;
  const dualSignoffCount = reports.filter((r) => r.status === 'Citizen Confirmation').length;

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 2000,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--accent-amber)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.4rem',
            fontSize: '0.875rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            animation: 'slideUp 0.2s ease-out',
          }}
        >
          <Sparkles size={17} color="var(--accent-amber)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Sub-Bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: 'var(--accent-amber)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Urban Local Body (ULB) Executive Console
              </span>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  display: 'inline-block',
                }}
              />
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Live Sync</span>
            </div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.03em', marginTop: '0.15rem' }}>
              Municipal Corporation Dashboard
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Ward grievance triage, SLA crew dispatch, GIS hotspot spatial intelligence & HEI innovation exchange.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => refreshAll()}
              className="btn btn-secondary"
              disabled={isLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}
            >
              <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. EXECUTIVE KPI COMMAND BAR */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.85rem',
          marginBottom: '1.75rem',
        }}
      >
        {/* KPI 1: Active Ward Grievances */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.1rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Active Ward Grievances
            </span>
            <Building2 size={16} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.35rem', color: 'var(--text-primary)' }}>
            {municipalKPIs?.activeGrievances || reports.length}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Across 24 Administrative Zones
          </div>
        </div>

        {/* KPI 2: Pending Triage */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.1rem',
            boxShadow: '0 2px 12px rgba(244, 63, 94, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Pending Triage Queue
            </span>
            <AlertTriangle size={16} color="var(--accent-rose)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.35rem', color: 'var(--accent-rose)' }}>
            {pendingTriageCount}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--accent-rose)', fontWeight: 600, marginTop: '0.2rem' }}>
            Requires Municipal Action
          </div>
        </div>

        {/* KPI 3: Escalated to HEI R&D */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Escalated to HEI R&D
            </span>
            <GraduationCap size={16} color="var(--accent-indigo)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.35rem', color: 'var(--accent-indigo)' }}>
            {municipalKPIs?.escalatedToHEI || 3}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            University Capstone Teams
          </div>
        </div>

        {/* KPI 4: Avg Resolution TAT */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Avg Resolution TAT
            </span>
            <Clock size={16} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.35rem', color: 'var(--text-primary)' }}>
            2.8 <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>Days</span>
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--accent-emerald)', fontWeight: 600, marginTop: '0.2rem' }}>
            ↓ 18% Faster vs Last Month
          </div>
        </div>

        {/* KPI 5: SLA Compliance % */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              SLA Compliance
            </span>
            <ShieldCheck size={16} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.35rem', color: 'var(--accent-emerald)' }}>
            {municipalKPIs?.slaCompliancePct || 91.4}%
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Target Benchmark: 90.0%
          </div>
        </div>
      </div>

      {/* Main View Switcher Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {[
            { id: 'triage', label: 'Triage & Kanban Dispatch', icon: Wrench, badge: pendingTriageCount },
            { id: 'map', label: 'GIS Hotspot Intelligence Map', icon: Flame },
            { id: 'analytics', label: 'Ward SLA Analytics & Compliance', icon: TrendingUp },
          ].map(({ id, label, icon: Icon, badge }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 0.9rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8125rem',
                  fontWeight: isActive ? 700 : 500,
                  backgroundColor: isActive ? 'var(--accent-amber)' : 'var(--bg-card)',
                  color: isActive ? '#000' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--accent-amber)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={15} />
                <span>{label}</span>
                {badge !== undefined && badge > 0 && (
                  <span
                    className="mono"
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '0 0.35rem',
                      borderRadius: '10px',
                      backgroundColor: isActive ? '#000' : 'var(--accent-rose)',
                      color: '#fff',
                    }}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Global Ward & Category Selector Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Ward:</span>
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontSize: '0.78125rem',
                fontWeight: 600,
              }}
            >
              <option value="all">All 24 Wards</option>
              <option value="Ward 14 West">Ward 14 West (Bandra/Khar)</option>
              <option value="Ward 08 Central">Ward 08 Central (Dadar)</option>
              <option value="Ward 12 South">Ward 12 South (Fort/Colaba)</option>
              <option value="Ward 19 East">Ward 19 East (Kurla/Chembur)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontSize: '0.78125rem',
                fontWeight: 600,
              }}
            >
              <option value="all">All Categories</option>
              <option value="Water Contamination">Water Contamination</option>
              <option value="Pothole">Pothole / Road Defect</option>
              <option value="Garbage Dump">Garbage / Solid Waste</option>
              <option value="Drainage Overflow">Drainage Overflow</option>
              <option value="Streetlight">Streetlight / Electrical</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIEW 1: TRIAGE & KANBAN DISPATCH */}
      {activeTab === 'triage' && (
        <div>
          {/* Sub-Filters: Status & Search */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.65rem',
              marginBottom: '1rem',
            }}
          >
            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Incidents', count: reports.length },
                { id: 'pending_triage', label: 'Pending Triage', count: pendingTriageCount, color: 'var(--accent-rose)' },
                { id: 'in_progress', label: 'Routine Crew Active', count: inProgressCount, color: 'var(--accent-amber)' },
                { id: 'hei_escalated', label: 'Escalated to HEI R&D', count: 3, color: 'var(--accent-indigo)' },
                { id: 'dual_signoff', label: 'Pending Citizen Sign-off', count: dualSignoffCount, color: 'var(--accent-emerald)' },
              ].map(({ id, label, count, color }) => {
                const isSelected = statusFilter === id;
                return (
                  <button
                    key={id}
                    onClick={() => setStatusFilter(id)}
                    type="button"
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.75rem',
                      fontWeight: isSelected ? 700 : 500,
                      backgroundColor: isSelected ? 'var(--bg-elevated)' : 'transparent',
                      color: isSelected ? (color || 'var(--text-primary)') : 'var(--text-muted)',
                      border: isSelected ? `1px solid ${color || 'var(--border-medium)'}` : '1px solid transparent',
                      cursor: 'pointer',
                    }}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search report code, street..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.4rem 0.75rem 0.4rem 2rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.78125rem',
                }}
              />
            </div>
          </div>

          {/* Grievance Triage Feed Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {filteredIssues.length === 0 ? (
              <div
                style={{
                  padding: '3rem',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px dashed var(--border-medium)',
                }}
              >
                <CheckCircle2 size={36} color="var(--accent-emerald)" style={{ margin: '0 auto 0.75rem auto' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>No Incidents in this Queue</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  All citizen reports matching this criteria have been triaged.
                </p>
              </div>
            ) : (
              filteredIssues.map((issue) => {
                const isHEI = (issue as any).is_escalated_to_hei || (issue as any).hei_challenge;
                const isPendingDualSignoff = issue.status === 'Citizen Confirmation';
                const isCompleted = issue.status === 'Confirmed Resolved';

                return (
                  <div
                    key={issue.id}
                    className="card"
                    style={{
                      padding: '1.1rem 1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      borderLeft: `4px solid ${
                        issue.severity === 'Dangerous'
                          ? 'var(--accent-rose)'
                          : isHEI
                          ? 'var(--accent-indigo)'
                          : isPendingDualSignoff
                          ? 'var(--accent-emerald)'
                          : 'var(--accent-amber)'
                      }`,
                    }}
                  >
                    {/* Card Top Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          className="mono"
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-elevated)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          {issue.report_code}
                        </span>

                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor:
                              issue.severity === 'Dangerous'
                                ? 'rgba(244, 63, 94, 0.15)'
                                : 'rgba(245, 158, 11, 0.15)',
                            color:
                              issue.severity === 'Dangerous'
                                ? 'var(--accent-rose)'
                                : 'var(--accent-amber)',
                          }}
                        >
                          AI Severity: {issue.severity}
                        </span>

                        {isHEI && (
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(99, 102, 241, 0.15)',
                              color: 'var(--accent-indigo)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <GraduationCap size={12} />
                            Academic R&D Challenge
                          </span>
                        )}

                        {isPendingDualSignoff && (
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              color: 'var(--accent-emerald)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <UserCheck size={12} />
                            Pending Citizen Sign-off
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Civic Priority: <strong>{issue.civic_priority_score || 75}/100</strong>
                        </span>
                        <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          👍 {issue.upvote_count || 12} Upvotes
                        </span>
                      </div>
                    </div>

                    {/* Content & Details */}
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                        {issue.category}: {issue.description}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <span>📍 {issue.address || 'Ward 14 West, Mumbai'}</span>
                        <span>⏱ Status: <strong style={{ color: 'var(--accent-amber)' }}>{issue.status}</strong></span>
                        {issue.assignment && (
                          <span>👷 Designated: <strong>{issue.assignment.officer_name}</strong> ({issue.assignment.department_name.split('(')[0]})</span>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: '0.75rem',
                        marginTop: '0.25rem',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Reported {new Date(issue.created_at).toLocaleDateString()}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {/* Two-Path Action Trigger */}
                        {!isCompleted && (
                          <button
                            type="button"
                            onClick={() => setTriageIssue(issue)}
                            className="btn btn-sm"
                            style={{
                              backgroundColor: 'var(--bg-elevated)',
                              border: '1px solid var(--accent-amber)',
                              color: 'var(--accent-amber)',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            <Wrench size={13} />
                            <span>Triage / Escalate</span>
                          </button>
                        )}

                        {/* Dual-Signoff Trigger */}
                        {!isCompleted && issue.status !== 'Citizen Confirmation' && (
                          <button
                            type="button"
                            onClick={() => setDualSignoffIssue(issue)}
                            className="btn btn-sm"
                            style={{
                              backgroundColor: 'var(--bg-elevated)',
                              border: '1px solid var(--accent-emerald)',
                              color: 'var(--accent-emerald)',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            <CheckCircle2 size={13} />
                            <span>Upload Crew Remediation</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: GIS HOTSPOT INTELLIGENCE MAP */}
      {activeTab === 'map' && (
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <MunicipalHotspotMap
              issues={reports}
              selectedWard={selectedWard}
              onSelectIssue={(iss) => setTriageIssue(iss)}
            />
          </div>
        </div>
      )}

      {/* VIEW 3: WARD SLA ANALYTICS & COMPLIANCE */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.35rem' }}>
              Zonal Ward SLA Compliance Performance
            </h3>
            <p style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Real-time turnaround metrics tracked under Public Service Guarantee Standards.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {[
                { ward: 'Ward 14 West (Bandra/Khar)', active: 6, resolved: 14, highSeverity: 4, compliance: 94.2 },
                { ward: 'Ward 08 Central (Dadar)', active: 5, resolved: 11, highSeverity: 3, compliance: 89.0 },
                { ward: 'Ward 12 South (Fort/Colaba)', active: 3, resolved: 9, highSeverity: 1, compliance: 96.5 },
                { ward: 'Ward 19 East (Kurla/Chembur)', active: 8, resolved: 12, highSeverity: 5, compliance: 86.1 },
              ].map((w) => (
                <div
                  key={w.ward}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    {w.ward}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    <span>SLA Compliance Rate:</span>
                    <strong style={{ color: w.compliance >= 90 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                      {w.compliance}%
                    </strong>
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      height: '6px',
                      borderRadius: '3px',
                      backgroundColor: 'var(--bg-card)',
                      overflow: 'hidden',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <div
                      style={{
                        width: `${w.compliance}%`,
                        height: '100%',
                        backgroundColor: w.compliance >= 90 ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>Active: {w.active}</span>
                    <span>Resolved: {w.resolved}</span>
                    <span style={{ color: 'var(--accent-rose)' }}>High Severity: {w.highSeverity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Triage Modal */}
      {triageIssue && (
        <MunicipalTriageModal
          issue={triageIssue}
          onClose={() => setTriageIssue(null)}
          onDispatchWorkOrder={dispatchWorkOrder}
          onEscalateToHEI={escalateToHEI}
          onShowToast={showToast}
        />
      )}

      {/* Dual Signoff Modal */}
      {dualSignoffIssue && (
        <MunicipalDualSignoffModal
          issue={dualSignoffIssue}
          onClose={() => setDualSignoffIssue(null)}
          onSubmitResolution={resolveDualSignoff}
          onShowToast={showToast}
        />
      )}
    </div>
  );
};
