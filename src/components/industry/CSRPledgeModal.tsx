import React, { useState } from 'react';
import {
  X,
  Coins,
  Lock,
} from 'lucide-react';
import type { HEIProject } from '../../types';

interface CSRPledgeModalProps {
  project: HEIProject | null;
  onClose: () => void;
  onPledge: (projectId: string, params: {
    corporateName: string;
    cinNumber: string;
    csrRegNumber: string;
    contactEmail: string;
    pledgeAmount: number;
    sdgGoal: string;
  }) => Promise<boolean>;
  onShowToast: (msg: string) => void;
}

export const CSRPledgeModal: React.FC<CSRPledgeModalProps> = ({
  project,
  onClose,
  onPledge,
  onShowToast,
}) => {
  if (!project) return null;

  const remainingGoal = Math.max(0, project.funding_goal - project.funding_pledged);

  const [corporateName, setCorporateName] = useState('Tata Steel Foundation');
  const [cinNumber, setCinNumber] = useState('L27100MH1907PLC000260');
  const [csrRegNumber, setCsrRegNumber] = useState('CSR00004921');
  const [contactEmail, setContactEmail] = useState('csr.grants@tatasteel.com');
  const [pledgeAmount, setPledgeAmount] = useState<number>(remainingGoal || 200000);
  const [sdgGoal, setSdgGoal] = useState<string>(project.sdg_goals[0] || 'SDG 6: Clean Water & Sanitation');
  const [submitting, setSubmitting] = useState(false);

  const tranche1Amount = Math.round(pledgeAmount * 0.3);
  const tranche2Amount = Math.round(pledgeAmount * 0.7);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const success = await onPledge(project.id, {
      corporateName,
      cinNumber,
      csrRegNumber,
      contactEmail,
      pledgeAmount,
      sdgGoal,
    });
    setSubmitting(false);

    if (success) {
      onShowToast(`✓ ₹${pledgeAmount.toLocaleString('en-IN')} CSR Grant pledged into Milestone Escrow!`);
      onClose();
    } else {
      onShowToast('Failed to commit CSR pledge.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-elevated)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(236, 72, 153, 0.15)',
                color: '#ec4899',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Coins size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Pledge CSR Grant via Smart Escrow</h3>
                <span
                  className="mono"
                  style={{
                    fontSize: '0.6875rem',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-card)',
                    color: '#ec4899',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  Schedule VII
                </span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Section 135 Companies Act 2013 compliant · Milestone-based disbursement lock.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '0.4rem', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '1.25rem 1.5rem',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.1rem',
          }}
        >
          {/* Target Project Summary */}
          <div
            style={{
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {project.title}
                </span>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {project.institution_name} · Lead: {project.faculty_lead}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                  Goal: ₹{project.funding_goal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Corporate Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Corporate Entity / Foundation Name
              </label>
              <input
                type="text"
                required
                value={corporateName}
                onChange={(e) => setCorporateName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Corporate CIN Number
              </label>
              <input
                type="text"
                required
                value={cinNumber}
                onChange={(e) => setCinNumber(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                MCA CSR-1 Reg No
              </label>
              <input
                type="text"
                required
                value={csrRegNumber}
                onChange={(e) => setCsrRegNumber(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                CSR Official Email
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Target SDG Goal
              </label>
              <input
                type="text"
                required
                value={sdgGoal}
                onChange={(e) => setSdgGoal(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
                }}
              />
            </div>
          </div>

          {/* Pledge Amount & Escrow Tranche Preview */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Total CSR Pledge Amount (INR ₹)
            </label>
            <input
              type="number"
              required
              min={10000}
              value={pledgeAmount}
              onChange={(e) => setPledgeAmount(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                fontWeight: 800,
              }}
            />
          </div>

          {/* Smart Escrow Tranche Breakdown */}
          <div
            style={{
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid rgba(236, 72, 153, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <Lock size={15} color="#ec4899" />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Milestone-Locked Escrow Schedule
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', fontSize: '0.75rem' }}>
              <div style={{ padding: '0.6rem', borderRadius: '4px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>Tranche 1 (30% Disbursement)</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ec4899', margin: '0.15rem 0' }}>
                  ₹{tranche1Amount.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                  Condition: Stage 3 Working Prototype & CAD Verification
                </div>
              </div>

              <div style={{ padding: '0.6rem', borderRadius: '4px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>Tranche 2 (70% Disbursement)</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ec4899', margin: '0.15rem 0' }}>
                  ₹{tranche2Amount.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                  Condition: Stage 4 Field Deployment & Municipal Sign-off
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary btn-lg"
            style={{
              backgroundColor: '#ec4899',
              color: '#fff',
              fontWeight: 800,
              marginTop: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <Coins size={18} />
            <span>{submitting ? 'Locking Escrow Funds...' : `Commit ₹${pledgeAmount.toLocaleString('en-IN')} to Escrow`}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
