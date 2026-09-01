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
  ChevronLeft,
  Menu,
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const navTabs: Array<{
    id: GovernmentTab;
    label: string;
    icon: React.FC<{ size?: number; color?: string }>;
    badge?: number | string;
    description?: string;
  }> = [
    {
      id: 'overview',
      label: 'Executive Overview',
      icon: Building2,
      description: 'Priority queue & ecosystem metrics',
    },
    {
      id: 'review',
      label: 'Challenge Review Queue',
      icon: ListFilter,
      badge: reports.length,
      description: 'Screen incoming citizen challenges',
    },
    {
      id: 'actions',
      label: 'Gov Work Orders',
      icon: Wrench,
      badge: reports.filter((r) => ['Assigned', 'Action Scheduled', 'In Progress'].includes(r.status)).length,
      description: 'Dispatch crews & dual sign-off',
    },
    {
      id: 'innovation',
      label: 'Innovation Challenges',
      icon: GraduationCap,
      badge: reports.filter((r) => r.recurrence === 'Frequently' || !!r.is_escalated_to_hei).length,
      description: 'Systemic R&D problem statements',
    },
    {
      id: 'hei_routing',
      label: 'HEI Capability Routing',
      icon: Sparkles,
      description: 'Match & escalate to universities',
    },
    {
      id: 'projects',
      label: 'Project Monitoring',
      icon: Layers,
      badge: heiProjects.length || 3,
      description: '4-Stage R&D milestone tracking',
    },
    {
      id: 'pilots',
      label: 'Community Pilots',
      icon: Compass,
      badge: 3,
      description: 'Real-world field trials & IoT',
    },
    {
      id: 'analytics',
      label: 'Operations Analytics',
      icon: BarChart3,
      description: 'District & domain performance',
    },
    {
      id: 'map',
      label: 'GIS Hotspots Map',
      icon: MapPin,
      description: 'Spatial clusters & systemic patterns',
    },
  ];

  const currentTabObj = navTabs.find((t) => t.id === activeTab) || navTabs[0];

  return (
    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', minHeight: 'calc(100vh - 120px)' }}>
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

      {/* ========================================================================= */}
      {/* LEFT SIDEBAR (ChatGPT / Gemini style collapsible sidebar) */}
      {/* ========================================================================= */}
      <aside
        style={{
          width: isSidebarCollapsed ? '64px' : '260px',
          minWidth: isSidebarCollapsed ? '64px' : '260px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'sticky',
          top: '80px',
          maxHeight: 'calc(100vh - 100px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          zIndex: 10,
        }}
      >
        {/* Sidebar Header */}
        <div>
          <div
            style={{
              padding: isSidebarCollapsed ? '0.85rem 0.5rem' : '1rem 1rem 0.75rem 1rem',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
              gap: '0.5rem',
            }}
          >
            {!isSidebarCollapsed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Building2 size={15} color="var(--accent-amber)" />
                </div>
                <div style={{ lineHeight: 1.15, overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: '0.78125rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                    }}
                  >
                    Gov Command
                  </div>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      color: 'var(--accent-amber)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Jharkhand ULB
                  </span>
                </div>
              </div>
            )}

            {/* Collapse / Expand Toggle Button */}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-muted)',
                padding: '0.35rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {isSidebarCollapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Sidebar Clickable Navigation Buttons */}
          <nav style={{ padding: '0.65rem 0.4rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {navTabs.map((tab) => {
              const isTabActive = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  title={isSidebarCollapsed ? `${tab.label} (${tab.badge || 0})` : undefined}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: isSidebarCollapsed ? '0.6rem 0.25rem' : '0.6rem 0.75rem',
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    borderLeft: isTabActive ? '3px solid var(--accent-amber)' : '3px solid transparent',
                    backgroundColor: isTabActive ? 'var(--bg-elevated)' : 'transparent',
                    color: isTabActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: isTabActive ? 700 : 500,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!isTabActive) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isTabActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  {/* Icon Container (Always clear and visible) */}
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon
                      size={18}
                      color={isTabActive ? 'var(--accent-amber)' : 'currentColor'}
                    />
                  </div>

                  {!isSidebarCollapsed && (
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div
                        style={{
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          lineHeight: 1.2,
                        }}
                      >
                        {tab.label}
                      </div>
                    </div>
                  )}

                  {/* Badge */}
                  {tab.badge !== undefined && tab.badge !== 0 && (
                    isSidebarCollapsed ? (
                      <span
                        className="mono"
                        style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          minWidth: '14px',
                          height: '14px',
                          borderRadius: '7px',
                          fontSize: '0.58rem',
                          fontWeight: 800,
                          lineHeight: '14px',
                          textAlign: 'center',
                          padding: '0 2px',
                          backgroundColor: 'var(--accent-amber)',
                          color: '#000000',
                          zIndex: 2,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                        }}
                      >
                        {typeof tab.badge === 'number' && tab.badge > 99 ? '99+' : tab.badge}
                      </span>
                    ) : (
                      <span
                        className="mono"
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.08rem 0.45rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: isTabActive ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-elevated)',
                          color: isTabActive ? 'var(--accent-amber)' : 'var(--text-muted)',
                          border: '1px solid var(--border-subtle)',
                          marginLeft: 'auto',
                        }}
                      >
                        {tab.badge}
                      </span>
                    )
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Officer & Sync Status */}
        <div
          style={{
            padding: isSidebarCollapsed ? '0.65rem 0.35rem' : '0.85rem 1rem',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-elevated)',
          }}
        >
          {!isSidebarCollapsed ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: '#10b981',
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Live Sync Active</span>
                </div>

                <button
                  type="button"
                  onClick={() => refreshAll()}
                  disabled={isLoading}
                  title="Refresh Queue"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <RefreshCw size={13} className={isLoading ? 'spin' : ''} />
                </button>
              </div>

              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Nodal Officer</strong> (HQ)
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => refreshAll()}
                disabled={isLoading}
                title="Refresh Live Queue"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================================================= */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Main Content Header */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-amber)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Municipal Authority Operations
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>/</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {currentTabObj.label}
              </span>
            </div>

            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0.15rem 0 0 0' }}>
              {currentTabObj.label}
            </h1>
            <p style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
              {currentTabObj.description || 'Manage urban problems, work orders, university innovation pathways and impact.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => refreshAll()}
              className="btn btn-secondary btn-sm"
              disabled={isLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78125rem', height: '32px' }}
            >
              <RefreshCw size={13} className={isLoading ? 'spin' : ''} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>

        {/* Dynamic Section Views */}
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
      </main>

      {/* Selected Challenge Review Modal / Drawer */}
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
