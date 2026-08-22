import React from 'react';
import { Building, UserCheck, Calendar, Clock } from 'lucide-react';
import type { AssignmentInfo } from '../types';

interface AssignmentCardProps {
  assignment: AssignmentInfo | null;
  category: string;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({ assignment, category }) => {
  if (!assignment) {
    return (
      <div
        className="card"
        style={{
          padding: '1.25rem',
          backgroundColor: 'var(--bg-input)',
          border: '1px dashed var(--border-medium)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <Clock size={20} color="var(--text-muted)" />
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Awaiting Department Assignment</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            This {category} incident is currently queued for triage and officer dispatch.
          </div>
        </div>
      </div>
    );
  }

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
        <Building size={18} color="var(--accent-amber)" />
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Authority Assignment & Dispatch</h3>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.85rem',
        }}
      >
        {/* Department */}
        <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Designated Department</div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
            {assignment.department_name}
          </div>
        </div>

        {/* Lead Officer */}
        <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Officer In Charge</div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--accent-amber)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <UserCheck size={14} /> {assignment.officer_name}
          </div>
        </div>

        {/* Scheduled Date */}
        {assignment.scheduled_date && (
          <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Inspection / Target Time</div>
            <div className="mono" style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={13} /> {assignment.scheduled_date}
            </div>
          </div>
        )}
      </div>

      {assignment.notes && (
        <div
          style={{
            marginTop: '0.85rem',
            backgroundColor: 'var(--bg-input)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Dispatch Directive: </span>
          {assignment.notes}
        </div>
      )}
    </div>
  );
};
