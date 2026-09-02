import React, { useState } from 'react';
import {
  X,
  FilePlus,
  CheckCircle2,
} from 'lucide-react';
import type { HEIChallenge } from '../../types';
import type { ResearchProposal } from './heiDataModel';
import { SEED_FACULTY, SEED_STUDENT_RESEARCHERS } from './heiDataModel';

interface HEIProposalModalProps {
  challenge?: HEIChallenge | null;
  onClose: () => void;
  onSubmitProposal: (proposal: ResearchProposal) => void;
}

export const HEIProposalModal: React.FC<HEIProposalModalProps> = ({
  challenge,
  onClose,
  onSubmitProposal,
}) => {
  const [title, setTitle] = useState(
    challenge ? `Applied Capstone: ${challenge.title}` : 'Engineering R&D Remediation Proposal'
  );
  const [domain, setDomain] = useState(challenge?.category || 'Water Supply & Drainage');
  const [department, setDepartment] = useState(challenge?.department_match || 'Civil & Environmental Engineering');
  const [selectedFacultyId, setSelectedFacultyId] = useState(SEED_FACULTY[0].id);
  const [problemStatement, setProblemStatement] = useState(
    challenge?.description || challenge?.research_brief || 'Recurrent infrastructure failure due to structural saturation.'
  );
  const [hypothesis, setHypothesis] = useState(
    'Integrating automated modular sensor-driven remediation reduces recurring operational failures by over 60%.'
  );
  const [methodology, setMethodology] = useState(
    'Phase 1: Lab simulation. Phase 2: Fabrication of modular hardware prototype. Phase 3: Field deployment and municipal impact study.'
  );
  const [budget, setBudget] = useState(250000);
  const [duration, setDuration] = useState(4);
  const [deliverables, setDeliverables] = useState(
    'CAD Blueprints, Sensor Firmware Repository, Prototype Hardware Unit, Municipal Impact Report'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const faculty = SEED_FACULTY.find((f) => f.id === selectedFacultyId) || SEED_FACULTY[0];
    const newProposal: ResearchProposal = {
      id: `prop_${Date.now().toString(36)}`,
      challengeId: challenge?.id || 'chal_custom',
      reportCode: challenge?.report_code || 'REP-GEN',
      title,
      domain,
      institutionName: 'BIT Mesra',
      department,
      facultyLead: faculty,
      studentTeam: [SEED_STUDENT_RESEARCHERS[0], SEED_STUDENT_RESEARCHERS[1]],
      problemStatement,
      hypothesis,
      methodology,
      budgetRequested: Number(budget),
      estimatedDurationMonths: Number(duration),
      deliverables: deliverables.split(',').map((s) => s.trim()).filter(Boolean),
      prototypePlan: 'Fabricate physical prototype unit in university maker space facility.',
      pilotPlan: 'Execute 90-day community validation in affected municipal cluster.',
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      reviewerNotes: 'Submitted for Academic Faculty Board & Municipal Review.',
    };

    onSubmitProposal(newProposal);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          animation: 'scaleUp 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-medium)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FilePlus size={18} color="var(--accent-indigo)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Draft Research & Capstone Proposal
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.35rem', color: 'var(--text-secondary)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div
            style={{
              padding: '1.5rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                Proposal Title
              </label>
              <input
                type="text"
                className="input"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: '100%', fontSize: '0.8125rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Problem Domain
                </label>
                <input
                  type="text"
                  className="input"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  style={{ width: '100%', fontSize: '0.8125rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Target Department
                </label>
                <input
                  type="text"
                  className="input"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  style={{ width: '100%', fontSize: '0.8125rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                Faculty Lead Supervisor
              </label>
              <select
                className="input"
                value={selectedFacultyId}
                onChange={(e) => setSelectedFacultyId(e.target.value)}
                style={{ width: '100%', fontSize: '0.8125rem' }}
              >
                {SEED_FACULTY.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                Problem Statement & Civic Background
              </label>
              <textarea
                className="input"
                rows={2}
                required
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                style={{ width: '100%', fontSize: '0.8125rem', padding: '0.5rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                Research Hypothesis
              </label>
              <textarea
                className="input"
                rows={2}
                required
                value={hypothesis}
                onChange={(e) => setHypothesis(e.target.value)}
                style={{ width: '100%', fontSize: '0.8125rem', padding: '0.5rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                Engineering & Testing Methodology
              </label>
              <textarea
                className="input"
                rows={2}
                required
                value={methodology}
                onChange={(e) => setMethodology(e.target.value)}
                style={{ width: '100%', fontSize: '0.8125rem', padding: '0.5rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Budget Requested (₹ INR)
                </label>
                <input
                  type="number"
                  className="input"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  style={{ width: '100%', fontSize: '0.8125rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Duration (Months)
                </label>
                <input
                  type="number"
                  className="input"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  style={{ width: '100%', fontSize: '0.8125rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                Expected Deliverables (Comma-separated)
              </label>
              <input
                type="text"
                className="input"
                value={deliverables}
                onChange={(e) => setDeliverables(e.target.value)}
                style={{ width: '100%', fontSize: '0.8125rem' }}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-medium)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.5rem',
              backgroundColor: 'var(--bg-card)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.8125rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}
            >
              <CheckCircle2 size={14} />
              <span>Submit Proposal to Faculty Board</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
