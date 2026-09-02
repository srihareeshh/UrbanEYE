import React, { useState } from 'react';
import {
  Building2,
  UserCheck,
} from 'lucide-react';
import type { EvaluatedChallenge, FacultyMember, HEIProfile } from '../heiDataModel';
import { SEED_FACULTY } from '../heiDataModel';

interface HEIAcceptedAssignmentTabProps {
  evaluatedChallenges: EvaluatedChallenge[];
  activeInstitution: HEIProfile;
  onAssignFaculty: (challengeId: string, assignedDept: string, faculty: FacultyMember) => void;
  onNavigateTab: (tab: any) => void;
}

export const HEIAcceptedAssignmentTab: React.FC<HEIAcceptedAssignmentTabProps> = ({
  evaluatedChallenges,
  activeInstitution,
  onAssignFaculty,
  onNavigateTab,
}) => {
  const [assigningChallengeId, setAssigningChallengeId] = useState<string | null>(null);
  const [targetDept, setTargetDept] = useState<string>(activeInstitution.departments[0]);
  const [targetFacultyId, setTargetFacultyId] = useState<string>(SEED_FACULTY[0].id);

  const unassignedList = evaluatedChallenges.filter(
    (e) => !e.nodalDecision.assignedFaculty || e.status === 'ACCEPTED_FOR_EVALUATION'
  );
  const assignedList = evaluatedChallenges.filter(
    (e) => e.nodalDecision.assignedFaculty && e.status !== 'ACCEPTED_FOR_EVALUATION'
  );

  const handleConfirmAssignment = (challengeId: string) => {
    const faculty = SEED_FACULTY.find((f) => f.id === targetFacultyId) || SEED_FACULTY[0];
    onAssignFaculty(challengeId, targetDept, faculty);
    setAssigningChallengeId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Header Banner */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building2 size={18} color="var(--accent-indigo)" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Accepted Challenges & Faculty Assignment Workspace
          </h2>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0 }}>
          Central institutional routing hub: match accepted civic challenges to accredited departments, review faculty domain expertise & active workloads, and assign faculty research leads.
        </p>
      </div>

      {/* 2. SECTION A: UNASSIGNED ACCEPTED CHALLENGES */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-amber)',
              }}
            />
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Accepted Challenges Awaiting Faculty Assignment ({unassignedList.length})
            </h3>
          </div>
        </div>

        {unassignedList.length === 0 ? (
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.8125rem',
            }}
          >
            ✓ All accepted challenges have been assigned to academic departments and faculty leads.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {unassignedList.map((chal) => {
              const isAssigning = assigningChallengeId === chal.id;
              return (
                <div
                  key={chal.id}
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem 1.15rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>
                        {chal.reportCode}
                      </span>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-indigo)' }}>
                        {chal.category}
                      </span>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}>
                        ● Awaiting Faculty Assignment
                      </span>
                    </div>

                    {!isAssigning ? (
                      <button
                        type="button"
                        onClick={() => setAssigningChallengeId(chal.id)}
                        className="btn btn-primary btn-xs"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}
                      >
                        <UserCheck size={13} />
                        <span>Assign Department & Faculty</span>
                      </button>
                    ) : null}
                  </div>

                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {chal.title}
                  </h4>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Ward / Cluster: {chal.ward}
                  </div>

                  {/* Inline Assignment Drawer */}
                  {isAssigning && (
                    <div
                      style={{
                        marginTop: '0.5rem',
                        padding: '1rem',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--accent-indigo)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Select Department and Review Faculty Candidate:
                      </span>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                            Target Department:
                          </label>
                          <select
                            className="input"
                            value={targetDept}
                            onChange={(e) => setTargetDept(e.target.value)}
                            style={{ height: '32px', fontSize: '0.75rem' }}
                          >
                            {activeInstitution.departments.map((d, i) => (
                              <option key={i} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                            Candidate Faculty Lead:
                          </label>
                          <select
                            className="input"
                            value={targetFacultyId}
                            onChange={(e) => setTargetFacultyId(e.target.value)}
                            style={{ height: '32px', fontSize: '0.75rem' }}
                          >
                            {SEED_FACULTY.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.name} ({f.department}) • Active: {f.activeProjectsCount} Projects
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', marginTop: '0.25rem' }}>
                        <button
                          type="button"
                          onClick={() => setAssigningChallengeId(null)}
                          className="btn btn-ghost btn-xs"
                          style={{ fontSize: '0.72rem' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmAssignment(chal.id)}
                          className="btn btn-primary btn-xs"
                          style={{ fontSize: '0.72rem' }}
                        >
                          Confirm Faculty Assignment
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. SECTION B: ASSIGNED CHALLENGES UNDER FACULTY EVALUATION */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
              }}
            />
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Active Faculty Assignments ({assignedList.length})
            </h3>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {assignedList.map((chal) => {
            const faculty = chal.nodalDecision.assignedFaculty;
            const evalData = chal.facultyEvaluation;
            return (
              <div
                key={chal.id}
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem 1.15rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>
                      {chal.reportCode}
                    </span>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-indigo)' }}>
                      {chal.category}
                    </span>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                      ● {chal.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.35rem', marginBottom: '0.2rem' }}>
                    {chal.title}
                  </h4>

                  <div style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)' }}>
                    Assigned Lead: <strong style={{ color: 'var(--accent-indigo)' }}>{faculty.name}</strong> ({chal.nodalDecision.assignedDepartment})
                  </div>

                  {evalData && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                      Feasibility: <strong style={{ color: evalData.feasibility === 'FEASIBLE' ? '#10b981' : 'var(--accent-amber)' }}>{evalData.feasibility}</strong> • Notes: {evalData.technicalNotes}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('proposals')}
                    className="btn btn-secondary btn-xs"
                    style={{ fontSize: '0.75rem' }}
                  >
                    View Proposals
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. FACULTY DIRECTORY & WORKLOAD MATRIX */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
        }}
      >
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.85rem' }}>
          Institutional Faculty Roster & Active Workloads ({SEED_FACULTY.length} Mentors)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
          {SEED_FACULTY.map((f) => (
            <div
              key={f.id}
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {f.name}
                </span>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--accent-indigo)' }}>
                  h-index: {f.hIndex}
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {f.department}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                Specialization: {f.specialization.slice(0, 2).join(', ')}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#10b981', fontWeight: 700, marginTop: '0.2rem' }}>
                ● Active Projects: {f.activeProjectsCount} • Completed Pilots: {f.completedPilotsCount}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
