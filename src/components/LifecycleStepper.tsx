import React from 'react';
import {
  CheckCircle2,
  Clock,
  UserCheck,
  Calendar,
  Wrench,
  CheckCheck,
  AlertOctagon,
  ShieldCheck,
} from 'lucide-react';
import type { LifecycleStage } from '../types';

interface LifecycleStepperProps {
  currentStatus: LifecycleStage | string;
}

interface StepMeta {
  key: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
}

const LIFECYCLE_STEPS: StepMeta[] = [
  {
    key: 'Submitted',
    label: 'Report Submitted',
    desc: 'Incident received & logged',
    icon: <CheckCircle2 size={15} />,
  },
  {
    key: 'Under Review',
    label: 'Under Review',
    desc: 'Automated triage & geo-validation',
    icon: <Clock size={15} />,
  },
  {
    key: 'Assigned',
    label: 'Assigned',
    desc: 'Department & officer designated',
    icon: <UserCheck size={15} />,
  },
  {
    key: 'Action Scheduled',
    label: 'Action Scheduled',
    desc: 'Field inspection booked',
    icon: <Calendar size={15} />,
  },
  {
    key: 'In Progress',
    label: 'In Progress',
    desc: 'Remediation crew on site',
    icon: <Wrench size={15} />,
  },
  {
    key: 'Resolved',
    label: 'Resolved',
    desc: 'Remediation evidence submitted',
    icon: <CheckCheck size={15} />,
  },
  {
    key: 'Citizen Confirmation',
    label: 'Citizen Verification',
    desc: 'Citizen confirms real fix',
    icon: <ShieldCheck size={15} />,
  },
];

export const LifecycleStepper: React.FC<LifecycleStepperProps> = ({ currentStatus }) => {
  const getStageIndex = (status: string): number => {
    switch (status) {
      case 'Submitted':
        return 0;
      case 'Under Review':
        return 1;
      case 'Assigned':
        return 2;
      case 'Action Scheduled':
        return 3;
      case 'In Progress':
        return 4;
      case 'Resolved':
        return 5;
      case 'Citizen Confirmation':
      case 'Confirmed Resolved':
      case 'Follow-up Required':
        return 6;
      default:
        return 0;
    }
  };

  const currentIndex = getStageIndex(currentStatus);
  const isConfirmed = currentStatus === 'Confirmed Resolved';
  const isFollowUp = currentStatus === 'Follow-up Required';

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Live Lifecycle Tracker</h3>
          <p style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}>
            Transparent end-to-end audit trail of your civic incident
          </p>
        </div>

        {/* Current Status Pill */}
        <div>
          {isConfirmed ? (
            <span className="badge badge-emerald" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
              <ShieldCheck size={14} /> Confirmed Resolved
            </span>
          ) : isFollowUp ? (
            <span className="badge badge-rose" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', backgroundColor: 'var(--accent-rose-glow)', color: 'var(--accent-rose)', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
              <AlertOctagon size={14} /> Follow-up Required
            </span>
          ) : (
            <span className="badge badge-amber" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-amber)', display: 'inline-block' }} />
              {currentStatus}
            </span>
          )}
        </div>
      </div>

      {/* Stepper Timeline Container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          position: 'relative',
        }}
      >
        {LIFECYCLE_STEPS.map((step, idx) => {
          const isPast = idx < currentIndex || (idx === 6 && isConfirmed);
          const isCurrent = idx === currentIndex && !isConfirmed && !isFollowUp;
          const isFuture = idx > currentIndex;

          return (
            <div
              key={step.key}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.85rem',
                position: 'relative',
                opacity: isFuture ? 0.45 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              {/* Left Column: Milestone Node & Connecting Line */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '28px',
                }}
              >
                {/* Node Icon Circle */}
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isPast
                      ? 'var(--accent-emerald-glow)'
                      : isCurrent
                      ? 'var(--accent-amber)'
                      : idx === 6 && isFollowUp
                      ? 'var(--accent-rose-glow)'
                      : 'var(--bg-input)',
                    color: isPast
                      ? 'var(--accent-emerald)'
                      : isCurrent
                      ? '#000000'
                      : idx === 6 && isFollowUp
                      ? 'var(--accent-rose)'
                      : 'var(--text-muted)',
                    border: isPast
                      ? '1px solid var(--accent-emerald)'
                      : isCurrent
                      ? '2px solid #ffffff'
                      : idx === 6 && isFollowUp
                      ? '1px solid var(--accent-rose)'
                      : '1px solid var(--border-subtle)',
                    boxShadow: isCurrent ? '0 0 14px rgba(245, 158, 11, 0.5)' : undefined,
                    zIndex: 2,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  {isPast ? <CheckCircle2 size={14} /> : isCurrent ? step.icon : idx === 6 && isFollowUp ? <AlertOctagon size={14} /> : <span className="mono">{idx + 1}</span>}
                </div>

                {/* Connecting Line (except last item) */}
                {idx < LIFECYCLE_STEPS.length - 1 && (
                  <div
                    style={{
                      width: '2px',
                      height: '24px',
                      backgroundColor: isPast
                        ? 'var(--accent-emerald)'
                        : 'var(--border-subtle)',
                      margin: '2px 0',
                    }}
                  />
                )}
              </div>

              {/* Right Column: Step Label & Description */}
              <div style={{ paddingBottom: idx < LIFECYCLE_STEPS.length - 1 ? '0.75rem' : '0' }}>
                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: isCurrent || isPast ? 700 : 500,
                    color: isCurrent
                      ? 'var(--accent-amber)'
                      : isPast
                      ? 'var(--text-primary)'
                      : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <span>{step.label}</span>
                  {isCurrent && (
                    <span
                      className="mono"
                      style={{
                        fontSize: '0.65rem',
                        backgroundColor: 'var(--accent-amber-glow)',
                        color: 'var(--accent-amber)',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                      }}
                    >
                      CURRENT STAGE
                    </span>
                  )}
                  {idx === 6 && isFollowUp && (
                    <span
                      className="mono"
                      style={{
                        fontSize: '0.65rem',
                        backgroundColor: 'var(--accent-rose-glow)',
                        color: 'var(--accent-rose)',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(244, 63, 94, 0.3)',
                      }}
                    >
                      NEEDS FOLLOW-UP
                    </span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    marginTop: '0.1rem',
                  }}
                >
                  {step.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
