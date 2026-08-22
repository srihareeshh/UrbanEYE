import React from 'react';
import { ShieldAlert, ListFilter, PlusCircle, Sun, Moon, MapPin, Sparkles } from 'lucide-react';

export type View = 'report' | 'community' | 'tracker' | 'map' | 'detail';

interface NavbarProps {
  currentView: View;
  onNavigate: (view: 'report' | 'community' | 'tracker' | 'map') => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  reportCount?: number;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  theme,
  onToggleTheme,
  reportCount = 0,
  unreadCount = 0,
}) => {
  const navItems: { id: 'report' | 'community' | 'tracker' | 'map'; label: string; Icon: React.FC<{ size?: number }>; badge?: number }[] = [
    { id: 'report', label: 'Report', Icon: PlusCircle },
    { id: 'community', label: 'Community', Icon: Sparkles },
    { id: 'tracker', label: 'My Activity', Icon: ListFilter, badge: unreadCount > 0 ? unreadCount : (reportCount > 0 ? reportCount : undefined) },
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
        padding: '0.875rem 1.25rem',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        style={{
          maxWidth: '820px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand Logo & Title */}
        <div
          onClick={() => onNavigate('report')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-medium)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-amber)',
              boxShadow: '0 2px 8px var(--accent-amber-glow)',
            }}
          >
            <ShieldAlert size={18} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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
                  padding: '0.15rem 0.45rem',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--accent-amber)',
                  fontWeight: 600,
                }}
              >
                CIVIC PLATFORM
              </span>
            </div>
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontWeight: 500,
              }}
            >
              Community Issues · Upvotes · Lifecycle Tracking
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Navigation Pill Switcher */}
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
                  onClick={() => onNavigate(id)}
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
                  {/* Community map active pulse dot */}
                  {id === 'community' && isActive && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#10b981',
                        boxShadow: '0 0 0 2px rgba(16,185,129,0.3)',
                        animation: 'pulse 1.5s ease-in-out infinite',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

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
