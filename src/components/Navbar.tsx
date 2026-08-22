<<<<<<< HEAD
import React from 'react';
import { ShieldAlert, ListFilter, PlusCircle, Sun, Moon, MapPin, Sparkles } from 'lucide-react';

=======
import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldAlert,
  ListFilter,
  PlusCircle,
  Sun,
  Moon,
  MapPin,
  Sparkles,
  ChevronDown,
  Building2,
  GraduationCap,
  Briefcase,
  Users,
  Check,
} from 'lucide-react';
import type { StakeholderRole } from '../types';

import { useGlobalStore } from '../store/globalStore';

>>>>>>> 24fe15c (added municipality,institution,government dashboards)
export type View = 'report' | 'community' | 'tracker' | 'map' | 'detail';

interface NavbarProps {
  currentView: View;
<<<<<<< HEAD
  onNavigate: (view: 'report' | 'community' | 'tracker' | 'map') => void;
=======
  onNavigate?: (view: 'report' | 'community' | 'tracker' | 'map' | 'detail') => void;
  onChangeView?: (view: 'report' | 'community' | 'tracker' | 'map' | 'detail') => void;
>>>>>>> 24fe15c (added municipality,institution,government dashboards)
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  reportCount?: number;
  unreadCount?: number;
<<<<<<< HEAD
=======
  unreadNotificationsCount?: number;
  currentRole?: StakeholderRole;
  onRoleChange?: (role: StakeholderRole) => void;
>>>>>>> 24fe15c (added municipality,institution,government dashboards)
}

const ROLES: Array<{
  id: StakeholderRole;
  label: string;
  shortLabel: string;
  badge: string;
  icon: React.FC<{ size?: number; color?: string; className?: string }>;
  color: string;
  glow: string;
  description: string;
}> = [
  {
    id: 'citizen',
    label: 'Citizen Portal',
    shortLabel: 'Citizen',
    badge: 'Civic View',
    icon: Users,
    color: 'var(--accent-emerald)',
    glow: 'rgba(16, 185, 129, 0.15)',
    description: 'Report issues, upvote community concerns, and track remediation lifecycles',
  },
  {
    id: 'municipal',
    label: 'Municipal Corporation',
    shortLabel: 'Municipal ULB',
    badge: 'Govt / ULB',
    icon: Building2,
    color: 'var(--accent-amber)',
    glow: 'rgba(245, 158, 11, 0.15)',
    description: 'Triage, SLA dispatching, GIS hotspots, HEI escalation & dual-signoff',
  },
  {
    id: 'institution',
    label: 'Higher Education (HEI)',
    shortLabel: 'University HEI',
    badge: 'R&D / NEP',
    icon: GraduationCap,
    color: 'var(--accent-indigo)',
    glow: 'rgba(99, 102, 241, 0.15)',
    description: 'Academic R&D capstones, 4-stage milestones & NEP 2020 credit registry',
  },
  {
    id: 'industry',
    label: 'Industry & CSR Partner',
    shortLabel: 'Industry CSR',
    badge: 'CSR Escrow',
    icon: Briefcase,
    color: '#ec4899',
    glow: 'rgba(236, 72, 153, 0.15)',
    description: 'Societal innovation marketplace, 30/70 escrow releases & CSR audit reports',
  },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onChangeView,
  theme,
  onToggleTheme,
  reportCount = 0,
  unreadCount = 0,
<<<<<<< HEAD
}) => {
  const navItems: { id: 'report' | 'community' | 'tracker' | 'map'; label: string; Icon: React.FC<{ size?: number }>; badge?: number }[] = [
    { id: 'report', label: 'Report', Icon: PlusCircle },
    { id: 'community', label: 'Community', Icon: Sparkles },
    { id: 'tracker', label: 'My Activity', Icon: ListFilter, badge: unreadCount > 0 ? unreadCount : (reportCount > 0 ? reportCount : undefined) },
=======
  unreadNotificationsCount = 0,
  currentRole: propRole,
  onRoleChange: propRoleChange,
}) => {
  const store = useGlobalStore();
  const currentRole = propRole || store.currentRole;
  const onRoleChange = propRoleChange || store.setRole;
  const handleNav = (v: any) => {
    if (onChangeView) onChangeView(v);
    else if (onNavigate) onNavigate(v);
  };

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const effectiveUnread = unreadCount || unreadNotificationsCount || 0;
  const activeRoleConfig = ROLES.find((r) => r.id === currentRole) || ROLES[0];
  const ActiveRoleIcon = activeRoleConfig.icon;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setRoleMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems: { id: 'report' | 'community' | 'tracker' | 'map'; label: string; Icon: React.FC<{ size?: number }>; badge?: number }[] = [
    { id: 'report', label: 'Report', Icon: PlusCircle },
    { id: 'community', label: 'Community', Icon: Sparkles },
    { id: 'tracker', label: 'My Activity', Icon: ListFilter, badge: effectiveUnread > 0 ? effectiveUnread : (reportCount > 0 ? reportCount : undefined) },
>>>>>>> 24fe15c (added municipality,institution,government dashboards)
    { id: 'map', label: 'Map', Icon: MapPin },
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'var(--bg-card)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0.75rem 1.25rem',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Left: Brand Logo & Title */}
        <div
          onClick={() => {
            if (currentRole === 'citizen') {
              handleNav('report');
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-elevated)',
              border: `1px solid ${activeRoleConfig.color}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: activeRoleConfig.color,
              boxShadow: `0 2px 10px ${activeRoleConfig.glow}`,
              transition: 'all 0.3s ease',
            }}
          >
            <ShieldAlert size={19} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                }}
              >
                ALCHEMINDS
              </span>
              <span
                className="mono"
                style={{
                  fontSize: '0.65rem',
                  padding: '0.12rem 0.45rem',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-elevated)',
                  border: `1px solid ${activeRoleConfig.color}30`,
                  color: activeRoleConfig.color,
                  fontWeight: 700,
                }}
              >
<<<<<<< HEAD
                CIVIC PLATFORM
=======
                QUAD-STAKEHOLDER
>>>>>>> 24fe15c (added municipality,institution,government dashboards)
              </span>
            </div>
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontWeight: 500,
              }}
            >
<<<<<<< HEAD
              Community Issues · Upvotes · Lifecycle Tracking
=======
              Citizen · Municipal ULB · HEI Universities · CSR Industry
>>>>>>> 24fe15c (added municipality,institution,government dashboards)
            </div>
          </div>
        </div>

        {/* Center / Right: Role Switcher & Nav Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* Global Role Switcher Dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              type="button"
              className="btn"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: `1px solid ${activeRoleConfig.color}60`,
                borderRadius: 'var(--radius-full)',
                padding: '0.4rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: `0 2px 12px ${activeRoleConfig.glow}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: `${activeRoleConfig.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: activeRoleConfig.color,
                }}
              >
                <ActiveRoleIcon size={13} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  {activeRoleConfig.shortLabel}
                </div>
                <div style={{ fontSize: '0.625rem', color: activeRoleConfig.color, fontWeight: 600 }}>
                  {activeRoleConfig.badge}
                </div>
              </div>
              <ChevronDown
                size={14}
                style={{
                  color: 'var(--text-muted)',
                  transform: roleMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              />
            </button>

            {/* Dropdown Menu */}
            {roleMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '320px',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '0.5rem',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                  zIndex: 100,
                  animation: 'slideUp 0.18s ease-out',
                }}
              >
                <div
                  style={{
                    padding: '0.45rem 0.65rem',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Switch Stakeholder View
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {ROLES.map((r) => {
                    const RoleIcon = r.icon;
                    const isSelected = r.id === currentRole;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          onRoleChange(r.id);
                          setRoleMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.65rem',
                          padding: '0.6rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: isSelected ? 'var(--bg-card)' : 'transparent',
                          border: isSelected ? `1px solid ${r.color}60` : '1px solid transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            backgroundColor: `${r.color}20`,
                            color: r.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '2px',
                          }}
                        >
                          <RoleIcon size={16} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {r.label}
                            </span>
                            {isSelected && <Check size={14} color={r.color} />}
                          </div>
                          <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.15rem', lineHeight: 1.3 }}>
                            {r.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Citizen-only Sub-Navigation Pills */}
          {currentRole === 'citizen' && (
            <div
              style={{
                display: 'flex',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                padding: '0.2rem',
                gap: '0.2rem',
              }}
            >
              {navItems.map(({ id, label, Icon, badge }) => {
                const isActive = currentView === id || (currentView === 'detail' && id === 'tracker');
                return (
                  <button
                    key={id}
                    onClick={() => handleNav(id)}
                    className="btn btn-sm"
                    style={{
                      backgroundColor: isActive ? 'var(--bg-card)' : 'transparent',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      border: isActive ? '1px solid var(--border-subtle)' : '1px solid transparent',
                      borderRadius: 'var(--radius-full)',
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.8125rem',
                      position: 'relative',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Icon size={14} />
                    <span>{label}</span>
                    {badge && badge > 0 ? (
                      <span
                        className="mono"
                        style={{
                          backgroundColor: 'var(--accent-amber)',
                          color: '#000',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '0 0.35rem',
                          borderRadius: '10px',
                          marginLeft: '0.2rem',
                        }}
                      >
                        {badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}

          {/* Stakeholder Role Badge indicator when not in Citizen view */}
          {currentRole !== 'citizen' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                padding: '0.35rem 0.85rem',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: activeRoleConfig.color,
                  boxShadow: `0 0 8px ${activeRoleConfig.color}`,
                }}
              />
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {currentRole === 'municipal'
                  ? 'ULB Command & Dispatch'
                  : currentRole === 'institution'
                  ? 'University R&D Portal'
                  : 'CSR Escrow & Grants Hub'}
              </span>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="btn btn-ghost"
            title="Toggle theme"
            style={{
              width: '36px',
              height: '36px',
              padding: 0,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {theme === 'dark' ? <Sun size={17} color="var(--accent-amber)" /> : <Moon size={17} />}
          </button>
        </div>
      </div>
    </header>
  );
};
