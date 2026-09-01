import React, { useState } from 'react';
import {
  Building2,
  Wrench,
  GraduationCap,
  Sparkles,
  RefreshCw,
  Compass,
  Layers,
  BarChart3,
  MapPin,
  ListFilter,
} from 'lucide-react';
import { useGlobalStore } from '../../store/globalStore';
import type { StoredReport } from '../../types';
import { GovernmentOverview } from './GovernmentOverview';
import { GovernmentChallengeReview } from './GovernmentChallengeReview';
import { GovernmentChallengeDetail } from './GovernmentChallengeDetail';
import { GovernmentActions } from './GovernmentActions';
import { GovernmentInnovationChallenges } from './GovernmentInnovationChallenges';
import { GovernmentHEIRouting } from './GovernmentHEIRouting';
import { GovernmentProjects } from './GovernmentProjects';
import { GovernmentPilots } from './GovernmentPilots';
import { GovernmentAnalytics } from './GovernmentAnalytics';
import { GovernmentMap } from './GovernmentMap';

export type GovernmentTab =
  | 'overview'
  | 'review'
  | 'actions'
  | 'innovation'
  | 'hei_routing'
  | 'projects'
  | 'pilots'
  | 'analytics'
  | 'map';

export const GovernmentDashboard: React.FC = () => {
  const {
    reports,
    heiChallenges,
    heiProjects,
    csrGrants,
    refreshAll,
    isLoading,
  } = useGlobalStore();

  const [activeTab, setActiveTab] = useState<GovernmentTab>('overview');
  const [selectedReport, setSelectedReport] = useState<StoredReport | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const navTabs: Array<{
    id: GovernmentTab;
    label: string;
    icon: React.FC<{ size?: number; color?: string }>;
    badge?: number | string;
  }> = [
    { id: 'overview', label: 'Executive Overview', icon: Building2 },
    { id: 'review', label: 'Challenge Review Queue', icon: ListFilter, badge: reports.length },
    {
      id: 'actions',
      label: 'Gov Work Orders',
      icon: Wrench,
      badge: reports.filter((r) => ['Assigned', 'Action Scheduled', 'In Progress'].includes(r.status)).length,
    },
    {
      id: 'innovation',
      label: 'Innovation Challenges',
      icon: GraduationCap,
      badge: reports.filter((r) => r.recurrence === 'Frequently' || !!r.is_escalated_to_hei).length,
    },
    { id: 'hei_routing', label: 'HEI Capability Routing', icon: Sparkles },
    { id: 'projects', label: 'Project Monitoring', icon: Layers, badge: heiProjects.length || 3 },
    { id: 'pilots', label: 'Community Pilots', icon: Compass, badge: 3 },
    { id: 'analytics', label: 'Operations Analytics', icon: BarChart3 },
    { id: 'map', label: 'GIS Hotspots Map', icon: MapPin },
  ];

  return (
    <div style={{ paddingBottom: '3.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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

      {/* Top Header & Authority Context */}
      <div>
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
                Government Authority & ULB Nodal Command
              </span>
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  display: 'inline-block',
                }}
              />
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Live Sync Active</span>
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', marginTop: '0.2rem' }}>
              Government Operations & Innovation Oversight Dashboard
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Citizen problem triage, immediate municipal work orders, AI advisory matching & university innovation tracking.
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

      {/* Navigation Sub-bar Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          overflowX: 'auto',
          paddingBottom: '0.25rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {navTabs.map((tab) => {
          const isTabActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                fontWeight: isTabActive ? 800 : 600,
                backgroundColor: isTabActive ? 'var(--bg-elevated)' : 'transparent',
                color: isTabActive ? 'var(--accent-amber)' : 'var(--text-secondary)',
                border: isTabActive ? '1px solid var(--accent-amber)' : '1px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={14} color={isTabActive ? 'var(--accent-amber)' : 'currentColor'} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge !== 0 && (
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '0.1rem 0.45rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: isTabActive ? 'var(--accent-amber)' : 'var(--bg-card)',
                    color: isTabActive ? '#000000' : 'var(--text-muted)',
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ACTIVE VIEW CONTENT */}
      <div>
        {activeTab === 'overview' && (
          <GovernmentOverview
            reports={reports}
            heiProjects={heiProjects}
            onSelectChallenge={(rep) => setSelectedReport(rep)}
            onNavigateTab={(tabId) => setActiveTab(tabId as GovernmentTab)}
          />
        )}

        {activeTab === 'review' && (
          <GovernmentChallengeReview
            reports={reports}
            onSelectChallenge={(rep) => setSelectedReport(rep)}
            onRefresh={refreshAll}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'actions' && (
          <GovernmentActions
            reports={reports}
            onSelectChallenge={(rep) => setSelectedReport(rep)}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'innovation' && (
          <GovernmentInnovationChallenges
            reports={reports}
            heiChallenges={heiChallenges}
            heiProjects={heiProjects}
            onSelectChallenge={(rep) => setSelectedReport(rep)}
            onNavigateTab={(tabId) => setActiveTab(tabId as GovernmentTab)}
          />
        )}

        {activeTab === 'hei_routing' && (
          <GovernmentHEIRouting
            reports={reports}
            onSelectChallenge={(rep) => setSelectedReport(rep)}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'projects' && (
          <GovernmentProjects
            heiProjects={heiProjects}
            reports={reports}
            onSelectChallenge={(rep) => setSelectedReport(rep)}
          />
        )}

        {activeTab === 'pilots' && <GovernmentPilots />}

        {activeTab === 'analytics' && (
          <GovernmentAnalytics
            reports={reports}
            heiProjects={heiProjects}
            csrGrants={csrGrants}
          />
        )}

        {activeTab === 'map' && (
          <GovernmentMap
            reports={reports}
            onSelectChallenge={(rep) => setSelectedReport(rep)}
          />
        )}
      </div>

      {/* Selected Challenge Review Modal */}
      {selectedReport && (
        <GovernmentChallengeDetail
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onShowToast={showToast}
        />
      )}
    </div>
  );
};
