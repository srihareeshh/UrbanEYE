import React from 'react';
import {
  Building2,
  Sparkles,
  Users,
  FileText,
  FolderGit2,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  GraduationCap,
  Layers,
  UserCheck,
} from 'lucide-react';
import type { HEIPerspective } from './heiDataModel';

export type NodalTab =
  | 'overview'
  | 'matched_challenges'
  | 'accepted_assignment'
  | 'proposals'
  | 'projects'
  | 'institution'
  | 'analytics';

export type FacultyTab =
  | 'workbench'
  | 'assigned_challenges'
  | 'feasibility'
  | 'teams'
  | 'proposals'
  | 'my_projects';

export type HEISidebarTab = NodalTab | FacultyTab;

interface HEISidebarProps {
  perspective: HEIPerspective;
  activeTab: HEISidebarTab;
  onTabChange: (tab: HEISidebarTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  counts: {
    matchedChallenges: number;
    unassignedAccepted: number;
    pendingProposals: number;
    institutionProjects: number;
    assignedChallenges: number;
    pendingFeasibility: number;
    facultyProjects: number;
  };
}

export const HEISidebar: React.FC<HEISidebarProps> = ({
  perspective,
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  counts,
}) => {
  // Nodal Navigation Items (7 items strictly)
  const nodalNavItems: Array<{
    id: NodalTab;
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
      description: 'Institutional overview & KPIs',
    },
    {
      id: 'matched_challenges',
      label: 'Matched Challenges',
      icon: Sparkles,
      badge: counts.matchedChallenges > 0 ? counts.matchedChallenges : undefined,
      badgeColor: 'var(--accent-indigo)',
      description: 'Awaiting institutional review',
    },
    {
      id: 'accepted_assignment',
      label: 'Accepted & Faculty Assignment',
      icon: UserCheck,
      badge: counts.unassignedAccepted > 0 ? counts.unassignedAccepted : undefined,
      badgeColor: 'var(--accent-amber)',
      description: 'Department & mentor allocation',
    },
    {
      id: 'proposals',
      label: 'Proposals Board',
      icon: FileText,
      badge: counts.pendingProposals > 0 ? counts.pendingProposals : undefined,
      badgeColor: 'var(--accent-amber)',
      description: 'Review & grant approvals',
    },
    {
      id: 'projects',
      label: 'Active Projects',
      icon: FolderGit2,
      badge: counts.institutionProjects > 0 ? counts.institutionProjects : undefined,
      badgeColor: '#10b981',
      description: 'Institution-wide capstone monitoring',
    },
    {
      id: 'institution',
      label: 'My Institution',
      icon: Layers,
      description: 'Departments, labs & capabilities',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'NEP telemetry & CSR metrics',
    },
  ];

  // Faculty Navigation Items (6 items strictly)
  const facultyNavItems: Array<{
    id: FacultyTab;
    label: string;
    icon: React.FC<{ size?: number; color?: string }>;
    badge?: number | string;
    badgeColor?: string;
    description: string;
  }> = [
    {
      id: 'workbench',
      label: 'My Workbench',
      icon: GraduationCap,
      description: 'Personal operational dashboard',
    },
    {
      id: 'assigned_challenges',
      label: 'Assigned Challenges',
      icon: Sparkles,
      badge: counts.assignedChallenges > 0 ? counts.assignedChallenges : undefined,
      badgeColor: 'var(--accent-amber)',
      description: 'Routed to your profile',
    },
    {
      id: 'feasibility',
      label: 'Feasibility Review',
      icon: FlaskConical,
      badge: counts.pendingFeasibility > 0 ? counts.pendingFeasibility : undefined,
      badgeColor: 'var(--accent-amber)',
      description: 'Technical & lab feasibility',
    },
    {
      id: 'teams',
      label: 'Research Teams',
      icon: Users,
      description: 'Student researchers & APAAR IDs',
    },
    {
      id: 'proposals',
      label: 'Proposals',
      icon: FileText,
      description: 'Draft, edit & submit proposals',
    },
    {
      id: 'my_projects',
      label: 'My Active Projects',
      icon: FolderGit2,
      badge: counts.facultyProjects > 0 ? counts.facultyProjects : undefined,
      badgeColor: '#10b981',
      description: 'Assigned execution workspaces',
    },
  ];

  const currentNavItems = perspective === 'nodal' ? nodalNavItems : facultyNavItems;

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
                backgroundColor: perspective === 'nodal' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: perspective === 'nodal' ? 'var(--accent-indigo)' : 'var(--accent-amber)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {perspective === 'nodal' ? <Building2 size={15} /> : <GraduationCap size={15} />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                {perspective === 'nodal' ? 'Nodal Innovation Cell' : 'Faculty Research Lead'}
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  color: perspective === 'nodal' ? 'var(--accent-indigo)' : 'var(--accent-amber)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {perspective === 'nodal' ? 'Institutional Oversight' : 'Academic Execution'}
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
        {currentNavItems.map((item) => {
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
                backgroundColor: isActive
                  ? perspective === 'nodal'
                    ? 'rgba(99, 102, 241, 0.14)'
                    : 'rgba(245, 158, 11, 0.14)'
                  : 'transparent',
                color: isActive
                  ? perspective === 'nodal'
                    ? 'var(--accent-indigo)'
                    : 'var(--accent-amber)'
                  : 'var(--text-secondary)',
                border: isActive
                  ? `1px solid ${perspective === 'nodal' ? 'rgba(99, 102, 241, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`
                  : '1px solid transparent',
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
                  <Icon
                    size={17}
                    color={
                      isActive
                        ? perspective === 'nodal'
                          ? 'var(--accent-indigo)'
                          : 'var(--accent-amber)'
                        : 'currentColor'
                    }
                  />
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
