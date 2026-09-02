import React, { useState } from 'react';
import {
  FlaskConical,
  Save,
  ArrowRight,
} from 'lucide-react';
import type { EvaluatedChallenge, FacultyMember, FeasibilityDecision } from '../heiDataModel';

interface HEIFeasibilityTabProps {
  activeFaculty: FacultyMember;
  assignedChallenges: EvaluatedChallenge[];
  onUpdateFeasibility: (challengeId: string, decision: FeasibilityDecision, notes: string) => void;
  onNavigateTab: (tab: any) => void;
}

export const HEIFeasibilityTab: React.FC<HEIFeasibilityTabProps> = ({
  activeFaculty,
  assignedChallenges,
  onUpdateFeasibility,
  onNavigateTab,
}) => {
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>(
    assignedChallenges[0]?.id || ''
  );
  const selectedChallenge = assignedChallenges.find((c) => c.id === selectedChallengeId) || assignedChallenges[0];

  const [decision, setDecision] = useState<FeasibilityDecision>(
    selectedChallenge?.facultyEvaluation?.feasibility || 'FEASIBLE'
  );
  const [notes, setNotes] = useState<string>(
    selectedChallenge?.facultyEvaluation?.technicalNotes ||
      'Initial hydrodynamic and soil composition review indicates high feasibility for permeable bio-retention cellular system.'
  );

  const handleSave = () => {
    if (selectedChallenge) {
      onUpdateFeasibility(selectedChallenge.id, decision, notes);
    }
  };

  if (!selectedChallenge) {
    return (
      <div
        style={{
          padding: '3rem 2rem',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}
      >
        <FlaskConical size={32} style={{ margin: '0 auto 0.75rem auto', color: 'var(--accent-amber)', opacity: 0.7 }} />
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
          No Challenges Assigned for Feasibility Review
        </h3>
        <p style={{ fontSize: '0.8125rem', maxWidth: '420px', margin: '0 auto', lineHeight: 1.5 }}>
          When the Nodal Officer assigns a challenge to {activeFaculty.name}, it will appear here for academic and technical evaluation.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FlaskConical size={18} color="var(--accent-amber)" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Academic & Technical Feasibility Evaluation
          </h2>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0 }}>
          Evaluate whether the assigned civic challenge presents a viable university research, prototyping, and community pilot opportunity.
        </p>
      </div>

      {/* Challenge Selector if multiple */}
      {assignedChallenges.length > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
          {assignedChallenges.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setSelectedChallengeId(c.id);
                setDecision(c.facultyEvaluation?.feasibility || 'FEASIBLE');
                setNotes(c.facultyEvaluation?.technicalNotes || '');
              }}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: selectedChallengeId === c.id ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-card)',
                color: selectedChallengeId === c.id ? 'var(--accent-amber)' : 'var(--text-secondary)',
                border: selectedChallengeId === c.id ? '1px solid var(--accent-amber)' : '1px solid var(--border-medium)',
                fontSize: '0.78125rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {c.reportCode}: {c.title.slice(0, 30)}...
            </button>
          ))}
        </div>
      )}

      {/* Main Feasibility Review Container */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.4rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* Selected Challenge Context */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="mono" style={{ fontSize: '0.8125rem', fontWeight: 900, color: 'var(--accent-indigo)' }}>
              {selectedChallenge.reportCode}
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-indigo)' }}>
              {selectedChallenge.category}
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}>
              ● Assigned to {activeFaculty.name}
            </span>
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.2rem 0' }}>
            {selectedChallenge.title}
          </h3>
          <div style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}>
            Location: {selectedChallenge.ward}
          </div>
        </div>

        {/* 2-Column Technical Evaluation Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          {/* Real-World Context & Research Gap */}
          <div
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
            }}
          >
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Civic Context & Problem Genome
            </span>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
              Conventional municipal patch repairs continually collapse due to persistent subgrade saturation and low hydraulic gradient.
            </p>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-indigo)', fontWeight: 700 }}>
              Required Capabilities: Hydraulic Modeling, Permeable Concrete Testing, LoRa Sensor Mesh
            </div>
          </div>

          {/* Infrastructure & Lab Requirements */}
          <div
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
            }}
          >
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Available University Facilities (BIT Mesra)
            </span>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              ✓ Environmental Fluid Mechanics Laboratory Flume<br />
              ✓ Smart Infrastructure LoRa Prototyping Workshop<br />
              ✓ Geopolymer Materials & Compressive Stress Testing Rig
            </div>
          </div>
        </div>

        {/* Feasibility Decision Controls */}
        <div
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
            Faculty Feasibility Decision & Technical Rationale:
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                Feasibility Outcome:
              </label>
              <select
                className="input"
                value={decision}
                onChange={(e) => setDecision(e.target.value as any)}
                style={{ width: '100%', height: '36px', fontSize: '0.78125rem' }}
              >
                <option value="FEASIBLE">Feasible (Proceed to Team Formation)</option>
                <option value="NEEDS_INVESTIGATION">Needs More Investigation / Lab Test</option>
                <option value="NEEDS_EXTERNAL_COLLAB">Needs External Industry / Lab Collab</option>
                <option value="NOT_FEASIBLE">Not Technically Feasible</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                Technical Notes & Experimental Equipment Required:
              </label>
              <textarea
                className="input"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ width: '100%', fontSize: '0.78125rem', padding: '0.5rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleSave}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78125rem', backgroundColor: 'var(--accent-amber)', color: '#000', border: 'none', fontWeight: 800 }}
            >
              <Save size={14} />
              <span>Save Feasibility Evaluation</span>
            </button>

            {decision === 'FEASIBLE' && (
              <button
                type="button"
                onClick={() => {
                  handleSave();
                  onNavigateTab('teams');
                }}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78125rem', color: 'var(--accent-indigo)' }}
              >
                <span>Proceed to Research Team Assembly</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
