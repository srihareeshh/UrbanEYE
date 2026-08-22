import React from 'react';
import {
  Clock,
  Building,
  User,
  Activity,
} from 'lucide-react';
import type { TimelineEvent } from '../types';

interface ActivityTimelineProps {
  timeline: TimelineEvent[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ timeline }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="card" style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        No activity updates recorded yet.
      </div>
    );
  }

  const getActorBadge = (actorType: string, actorName: string) => {
    switch (actorType) {
      case 'system':
        return (
          <span
            className="badge"
            style={{
              backgroundColor: 'var(--accent-indigo-glow)',
              color: 'var(--accent-indigo)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              fontSize: '0.68rem',
            }}
          >
            <Activity size={11} /> {actorName}
          </span>
        );
      case 'authority':
        return (
          <span
            className="badge"
            style={{
              backgroundColor: 'var(--accent-amber-glow)',
              color: 'var(--accent-amber)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              fontSize: '0.68rem',
            }}
          >
            <Building size={11} /> {actorName}
          </span>
        );
      case 'citizen':
        return (
          <span
            className="badge"
            style={{
              backgroundColor: 'var(--accent-emerald-glow)',
              color: 'var(--accent-emerald)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontSize: '0.68rem',
            }}
          >
            <User size={11} /> {actorName}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Clock size={18} color="var(--accent-amber)" />
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Activity & Audit Timeline</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {timeline.map((event, index) => {
          const dateObj = new Date(event.created_at);
          const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

          return (
            <div
              key={event.id || index}
              style={{
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
              }}
            >
              {/* Header: Time, Actor, Title */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.4rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {event.title}
                  </span>
                  {getActorBadge(event.actor_type, event.actor_name)}
                </div>

                <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {dateStr} • {timeStr}
                </div>
              </div>

              {/* Description */}
              {event.description && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {event.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
