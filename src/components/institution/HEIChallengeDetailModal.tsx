import React, { useState } from 'react';
import {
  X,
  Sparkles,
  MapPin,
  FilePlus,
  Users,
  Building2,
} from 'lucide-react';
import type { StoredReport, HEIChallenge } from '../../types';
import type { HEIProfile, FacultyMember, FeasibilityDecision } from './heiDataModel';
import { SEED_FACULTY, getExplainableCapabilityMatch } from './heiDataModel';

interface HEIChallengeDetailModalProps {
  challenge: StoredReport | HEIChallenge;
  activeInstitution: HEIProfile;
  onClose: () => void;
  onAcceptEvaluation: (challenge: HEIChallenge, assignedDept: string, faculty: FacultyMember) => void;
  onDeclineChallenge: (challenge: HEIChallenge, reason?: string) => void;
  onDraftProposal: (challenge: HEIChallenge) => void;
}

export const HEIChallengeDetailModal: React.FC<HEIChallengeDetailModalProps> = ({
  challenge,
  activeInstitution,
  onClose,
  onAcceptEvaluation,
  onDeclineChallenge,
  onDraftProposal,
}) => {
  const isReport = 'report_code' in challenge && 'ai_analysis' in challenge;
  const report = isReport ? (challenge as StoredReport) : null;
  const structuredAI = report?.ai_analysis?.structured_output;

  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineForm, setShowDeclineForm] = useState(false);

  // Level 1: Nodal assignment state
  const [selectedDept, setSelectedDept] = useState(
    (challenge as any).department_match || activeInstitution.departments[0] || 'Civil & Environmental Engineering'
  );
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>(SEED_FACULTY[0].id);

  // Level 2: Faculty Feasibility state
  const [facultyFeasibility, setFacultyFeasibility] = useState<FeasibilityDecision>('FEASIBLE');
  const [feasibilityNotes, setFeasibilityNotes] = useState(
    'Initial technical scan indicates high research feasibility using modular subterranean bio-drain cells.'
  );

  const title = (challenge as any).title || (report ? `${report.category}: ${report.description.slice(0, 48)}...` : 'Civic Innovation Challenge');
  const code = (challenge as any).report_code || (challenge as any).id;
  const category = (challenge as any).category || 'Infrastructure';
  const ward = (challenge as any).ward || report?.address || 'Urban Sector';

  const capabilities = structuredAI?.required_capabilities || ['Hydraulic Modeling', 'IoT Telemetry Sensors', 'Bio-filtration Media'];
  const underlyingProblem = structuredAI?.underlying_problem || (challenge as any).research_brief || 'Recurrent infrastructure failure indicates conventional localized surface patch repair fails to remediate subsurface structural saturation.';
  const existingAdequacy = structuredAI?.existing_solution_status || 'Conventional gravity drain pipes are inadequate during high-intensity rain events due to low gradient and sediment accumulation.';

  // Explainable capability matching breakdown
  const matchExplanation = getExplainableCapabilityMatch(capabilities, activeInstitution);

  // Convert challenge to HEIChallenge object for callbacks
  const heiChalObject: HEIChallenge = {
    id: (challenge as any).id,
    report_id: (challenge as any).report_id || (challenge as any).id,
    report_code: code,
    title,
    description: (challenge as any).description || '',
    category,
    severity: (challenge as any).severity || 'high',
    ward,
    department_match: selectedDept,
    match_percentage: matchExplanation.overallScorePct,
    status: (challenge as any).status || 'open',
    escalated_by: 'Municipal Authority / Alcheminds AI Engine',
    research_brief: underlyingProblem,
    created_at: (challenge as any).created_at || new Date().toISOString(),
    updated_at: (challenge as any).updated_at || new Date().toISOString(),
  };

  const handleNodalAccept = () => {
    const faculty = SEED_FACULTY.find((f) => f.id === selectedFacultyId) || SEED_FACULTY[0];
    onAcceptEvaluation(heiChalObject, selectedDept, faculty);
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
          maxWidth: '920px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          animation: 'scaleUp 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: '0.8125rem', fontWeight: 900, color: 'var(--accent-indigo)' }}>
              {code}
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '0.15rem 0.55rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-indigo)',
              }}
            >
              {category}
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '0.15rem 0.55rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
              }}
            >
              {matchExplanation.overallScorePct}% Capability Match ({activeInstitution.shortName})
            </span>
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

        {/* Modal Body (Scrollable) */}
        <div
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {/* SECTION A: Real-World Problem Context */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.15rem',
            }}
          >
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Section A: Real-World Problem Context
            </span>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.35rem', marginBottom: '0.4rem' }}>
              {title}
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {(challenge as any).description || 'Persistent civic grievance escalated due to recurring operational failures and systemic environmental challenges.'}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={13} /> {ward}
              </span>
              <span>•</span>
              <span>Recurrence: <strong style={{ color: 'var(--accent-amber)' }}>High (Recurring Hotspot)</strong></span>
            </div>
          </div>

          {/* SECTION B: Citizen Evidence Photos */}
          {report?.media && report.media.length > 0 && (
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.15rem',
              }}
            >
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Section B: Citizen Evidence & Ground Photos
              </span>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.65rem', overflowX: 'auto' }}>
                {report.media.map((med, i) => (
                  <div key={i} style={{ flexShrink: 0, width: '160px', height: '110px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-subtle)', position: 'relative' }}>
                    <img src={med.file_path || (med as any).url || report.photo_url || ''} alt={med.original_name || med.file_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION C: Gemini AI Assessment & Root Cause */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              borderRadius: 'var(--radius-md)',
              padding: '1.15rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={16} color="var(--accent-indigo)" />
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-indigo)', textTransform: 'uppercase' }}>
                  Section C: Stored Gemini AI Assessment & Problem Genome
                </span>
              </div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#10b981' }}>
                ● Innovation Pathway: YES
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Underlying Root Cause:</span>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', marginTop: '0.2rem', lineHeight: 1.45, margin: 0 }}>
                {underlyingProblem}
              </p>
            </div>

            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Why Conventional Municipal Repair Failed:</span>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.45, margin: 0 }}>
                {existingAdequacy}
              </p>
            </div>
          </div>

          {/* SECTION D: EXPLAINABLE CAPABILITY MATCH BREAKDOWN */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.15rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Section D: Why This Challenge Matches Your HEI ({matchExplanation.overallScorePct}% Match)
              </span>
              <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>
                ✓ {matchExplanation.matchingCapabilitiesCount}/{matchExplanation.totalRequiredCount} Capabilities Verified
              </span>
            </div>

            {/* Table of Required vs Available at HEI */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {matchExplanation.items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.6rem 0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: item.availableAtHEI ? '#10b981' : 'var(--accent-amber)', fontWeight: 900 }}>
                      {item.availableAtHEI ? '✓' : '⚠️'}
                    </span>
                    <div>
                      <div style={{ fontSize: '0.78125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {item.requiredCapability}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        {item.notes}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(99, 102, 241, 0.12)',
                      color: 'var(--accent-indigo)',
                    }}
                  >
                    {item.facilityOrLabName}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION E: TWO-LEVEL DECISION WORKFLOW */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
            {/* LEVEL 1: Institutional Decision (Nodal Officer) */}
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '1.15rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Building2 size={16} color="var(--accent-indigo)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                  Level 1: Institutional Decision (HEI Nodal Officer)
                </span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0 }}>
                Accepting agrees to evaluate feasibility and routes the challenge to an assigned department and faculty mentor.
              </p>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Assign Department:
                </label>
                <select
                  className="input"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  style={{ width: '100%', fontSize: '0.78125rem', height: '32px' }}
                >
                  {activeInstitution.departments.map((dept, i) => (
                    <option key={i} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Assign Faculty Lead:
                </label>
                <select
                  className="input"
                  value={selectedFacultyId}
                  onChange={(e) => setSelectedFacultyId(e.target.value)}
                  style={{ width: '100%', fontSize: '0.78125rem', height: '32px' }}
                >
                  {SEED_FACULTY.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.department})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* LEVEL 2: Faculty Feasibility & Research Assessment */}
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '1.15rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={16} color="var(--accent-amber)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                  Level 2: Faculty / Research Decision (Assigned Lead)
                </span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0 }}>
                Faculty evaluates technical feasibility, required equipment, and decides whether to assemble a team.
              </p>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Technical Feasibility Assessment:
                </label>
                <select
                  className="input"
                  value={facultyFeasibility}
                  onChange={(e) => setFacultyFeasibility(e.target.value as any)}
                  style={{ width: '100%', fontSize: '0.78125rem', height: '32px' }}
                >
                  <option value="FEASIBLE">Feasible (Proceed to Team & Proposal)</option>
                  <option value="NEEDS_INVESTIGATION">Needs More Investigation / Lab Test</option>
                  <option value="NEEDS_EXTERNAL_COLLAB">Needs External Industry / Lab Collab</option>
                  <option value="NOT_FEASIBLE">Not Technically Feasible</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Faculty Evaluation Notes:
                </label>
                <textarea
                  className="input"
                  rows={2}
                  value={feasibilityNotes}
                  onChange={(e) => setFeasibilityNotes(e.target.value)}
                  style={{ width: '100%', fontSize: '0.75rem', padding: '0.4rem' }}
                />
              </div>
            </div>
          </div>

          {/* Decline Form if active */}
          {showDeclineForm && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ef4444' }}>
                Decline Reason / Capability Constraint:
              </span>
              <textarea
                className="input"
                rows={2}
                placeholder="Specify why the institution is declining (e.g., capability mismatch, outside institutional scope, insufficient resources, current research capacity unavailable)..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                style={{ fontSize: '0.78125rem', padding: '0.5rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => setShowDeclineForm(false)}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.75rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeclineChallenge(heiChalObject, declineReason);
                    onClose();
                  }}
                  className="btn btn-sm"
                  style={{ backgroundColor: '#ef4444', color: '#fff', fontSize: '0.75rem' }}
                >
                  Confirm Decline
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-medium)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-card)',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Institutional Status: <strong style={{ color: 'var(--accent-indigo)' }}>{((challenge as any).status || 'OPEN').toUpperCase()}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                onDraftProposal(heiChalObject);
                onClose();
              }}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78125rem', color: 'var(--accent-amber)', borderColor: 'rgba(245, 158, 11, 0.4)' }}
            >
              <FilePlus size={13} />
              <span>Draft R&D Proposal</span>
            </button>

            {(challenge as any).status === 'open' && (
              <>
                <button
                  type="button"
                  onClick={handleNodalAccept}
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: '0.78125rem' }}
                >
                  <span>Accept for Evaluation & Assign Faculty</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeclineForm(true)}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}
                >
                  <span>Decline Challenge</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
