import React from 'react';
import {
  Building2,
  Sparkles,
  Layers,
  Users,
  FileText,
  FolderGit2,
  CheckCircle2,
  Cpu,
  Handshake,
  Compass,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
} from 'lucide-react';

export type HEITab =
  | 'overview'
  | 'challenges'
  | 'evaluation'
  | 'capabilities'
  | 'faculty_teams'
  | 'proposals'
  | 'projects'
  | 'milestones'
  | 'prototype'
  | 'industry'
  | 'pilots'
  | 'impact';

interface HEISidebarProps {
  activeTab: HEITab;
  onTabChange: (tab: HEITab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  counts: {
    matchedChallenges: number;
    underEvaluation: number;
    activeProjects: number;
    pendingProposals: number;
    activePilots: number;
    completedImpact: number;
  };
}

export const HEISidebar: React.FC<HEISidebarProps> = ({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  counts,
}) => {
  const navItems: Array<{
    id: HEITab;
    label: string;
    icon: React.FC<{ size?: number; color?: string }>;
    badge?: number | string;
    badgeColor?: string;
    description: string;
  }> = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Building2,
      description: 'Institutional pipeline & triage queue',
    },
    {
      id: 'challenges',
      label: 'Matched Challenges',
      icon: Sparkles,
      badge: counts.matchedChallenges > 0 ? counts.matchedChallenges : undefined,
      badgeColor: 'var(--accent-indigo)',
      description: 'Awaiting HEI Nodal review',
    },
    {
      id: 'evaluation',
      label: 'Under Evaluation',
      icon: FlaskConical,
      badge: counts.underEvaluation > 0 ? counts.underEvaluation : undefined,
      badgeColor: 'var(--accent-amber)',
      description: 'Faculty feasibility & team formation',
    },
    {
      id: 'faculty_teams',
      label: 'Faculty & Teams',
      icon: Users,
      description: 'Mentors, students & APAAR IDs',
    },
    {
      id: 'proposals',
      label: 'Proposals',
      icon: FileText,
      badge: counts.pendingProposals > 0 ? counts.pendingProposals : undefined,
      badgeColor: 'var(--accent-amber)',
      description: 'Draft, submitted & approved R&D',
    },
    {
      id: 'projects',
      label: 'Active Projects',
      icon: FolderGit2,
      badge: counts.activeProjects > 0 ? counts.activeProjects : undefined,
      badgeColor: '#10b981',
      description: 'Multi-stage project monitoring',
    },
    {
      id: 'milestones',
      label: 'Milestones',
      icon: CheckCircle2,
      description: 'Deliverables & NEP research hours',
    },
    {
      id: 'prototype',
      label: 'Prototype & Testing',
      icon: Cpu,
      description: 'Hardware, models & bench telemetry',
    },
    {
      id: 'industry',
      label: 'Industry Collaboration',
      icon: Handshake,
      description: 'CSR grants & corporate mentorship',
    },
    {
      id: 'pilots',
      label: 'Community Pilots',
      icon: Compass,
      badge: counts.activePilots > 0 ? counts.activePilots : undefined,
      badgeColor: '#38bdf8',
      description: 'Real-world testing & readiness engine',
    },
    {
      id: 'impact',
      label: 'Impact & Outcomes',
      icon: BarChart3,
      badge: counts.completedImpact > 0 ? counts.completedImpact : undefined,
      badgeColor: '#10b981',
      description: 'Before/after metrics & NEP credits',
    },
    {
      id: 'capabilities',
      label: 'My Institution / Capabilities',
      icon: Layers,
      description: 'Labs, depts & accredited strengths',
    },
  ];

  return (
    <aside
      style={{
        width: isCollapsed ? '72px' : '280px',
        minWidth: isCollapsed ? '72px' : '280px',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-lg)',
        padding: isCollapsed ? '0.75rem 0.4rem' : '1.1rem 0.85rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        position: 'sticky',
        top: '1.25rem',
        maxHeight: 'calc(100vh - 100px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 50,
      }}
    >
      {/* Sidebar Header with Collapse Toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          paddingBottom: '0.75rem',
          marginBottom: '0.35rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {!isCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-indigo)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={15} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                HEI R&D Workspace
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--accent-indigo)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                NEP 2020 Exchange
              </span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onToggleCollapse}
          className="btn btn-ghost btn-sm"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            padding: '0.35rem',
            height: '28px',
            width: '28px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
          }}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              title={isCollapsed ? `${item.label} — ${item.description}` : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'space-between',
                padding: isCollapsed ? '0.65rem' : '0.6rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'rgba(99, 102, 241, 0.14)' : 'transparent',
                color: isActive ? 'var(--accent-indigo)' : 'var(--text-secondary)',
                border: isActive ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                width: '100%',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, overflow: 'hidden' }}>
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} color={isActive ? 'var(--accent-indigo)' : 'currentColor'} />
                </div>
                {!isCollapsed && (
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                    <span
                      style={{
                        fontSize: '0.78125rem',
                        fontWeight: isActive ? 800 : 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: isActive ? 'var(--text-primary)' : 'inherit',
                      }}
                    >
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.description}
                    </span>
                  </div>
                )}
              </div>

              {/* Badge Counter */}
              {item.badge !== undefined && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: isCollapsed ? '0.1rem 0.3rem' : '0.15rem 0.45rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: item.badgeColor ? `${item.badgeColor}22` : 'rgba(255, 255, 255, 0.1)',
                    color: item.badgeColor || 'var(--text-primary)',
                    border: `1px solid ${item.badgeColor ? `${item.badgeColor}44` : 'var(--border-subtle)'}`,
                    marginLeft: isCollapsed ? 0 : '0.4rem',
                    flexShrink: 0,
                    ...(isCollapsed
                      ? {
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          padding: '0.1rem 0.25rem',
                          fontSize: '0.58rem',
                        }
                      : {}),
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Institution Identity */}
      {!isCollapsed && (
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(99, 102, 241, 0.18)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-indigo)',
              fontWeight: 900,
              fontSize: '0.75rem',
            }}
          >
            BIT
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              BIT Mesra, Ranchi
            </span>
            <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>
              ● NEP Accredited R&D Hub
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
