import React, { useState } from 'react';
import {
  Sparkles,
  Users,
  FilePlus,
  Plus,
} from 'lucide-react';
import type { EvaluatedChallenge, StudentResearcher, FeasibilityDecision } from '../heiDataModel';
import { SEED_STUDENT_RESEARCHERS } from '../heiDataModel';

interface HEIEvaluationTabProps {
  evaluatedChallenges: EvaluatedChallenge[];
  onUpdateFeasibility: (challengeId: string, decision: FeasibilityDecision, notes: string) => void;
  onAddStudentToTeam: (challengeId: string, student: StudentResearcher) => void;
  onDraftProposal: (challenge: EvaluatedChallenge) => void;
}

export const HEIEvaluationTab: React.FC<HEIEvaluationTabProps> = ({
  evaluatedChallenges,
  onUpdateFeasibility,
  onAddStudentToTeam,
  onDraftProposal,
}) => {
  const [editingFeasibilityId, setEditingFeasibilityId] = useState<string | null>(null);
  const [feasibilityChoice, setFeasibilityChoice] = useState<FeasibilityDecision>('FEASIBLE');
  const [feasibilityNotes, setFeasibilityNotes] = useState('');

  const [addingStudentChallengeId, setAddingStudentChallengeId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(SEED_STUDENT_RESEARCHERS[2].id);

  const handleStartFeasibilityEdit = (ec: EvaluatedChallenge) => {
    setEditingFeasibilityId(ec.id);
    setFeasibilityChoice(ec.facultyEvaluation?.feasibility || 'FEASIBLE');
    setFeasibilityNotes(ec.facultyEvaluation?.technicalNotes || '');
  };

  const handleSaveFeasibility = (id: string) => {
    onUpdateFeasibility(id, feasibilityChoice, feasibilityNotes);
    setEditingFeasibilityId(null);
  };

  const handleAddStudent = (challengeId: string) => {
    const student = SEED_STUDENT_RESEARCHERS.find((s) => s.id === selectedStudentId);
    if (student) {
      onAddStudentToTeam(challengeId, student);
    }
    setAddingStudentChallengeId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Header */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} color="var(--accent-indigo)" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Under Faculty Evaluation & Team Formation
          </h2>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0 }}>
          Challenges accepted by the HEI Nodal Officer and routed to assigned faculty leads for technical feasibility assessment and student research team assembly.
        </p>
      </div>

      {/* 2. Evaluated Challenges List */}
      {evaluatedChallenges.length === 0 ? (
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '3rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <Users size={32} style={{ margin: '0 auto 0.75rem auto', color: 'var(--accent-indigo)', opacity: 0.7 }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            No Challenges Currently Under Faculty Evaluation
          </h3>
          <p style={{ fontSize: '0.8125rem', maxWidth: '460px', margin: '0 auto', lineHeight: 1.5 }}>
            Go to <strong>Matched Challenges</strong> and select "Accept for Evaluation" to route a civic problem to an assigned faculty lead.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {evaluatedChallenges.map((ec) => {
            const faculty = ec.nodalDecision.assignedFaculty;
            const evalData = ec.facultyEvaluation;
            const team = ec.teamFormation;
            const isEditing = editingFeasibilityId === ec.id;

            return (
              <div
                key={ec.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.4rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.1rem',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                }}
              >
                {/* Challenge Header & Stage Badges */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--accent-indigo)' }}>
                        {ec.reportCode}
                      </span>
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
                        {ec.category}
                      </span>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor:
                            ec.status === 'TEAM_FORMING'
                              ? 'rgba(56, 189, 248, 0.15)'
                              : ec.status === 'FACULTY_EVALUATION'
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(16, 185, 129, 0.15)',
                          color:
                            ec.status === 'TEAM_FORMING'
                              ? '#38bdf8'
                              : ec.status === 'FACULTY_EVALUATION'
                              ? 'var(--accent-amber)'
                              : '#10b981',
                        }}
                      >
                        ● {ec.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.35rem', marginBottom: '0.15rem' }}>
                      {ec.title}
                    </h3>
                    <div style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}>
                      Location: <strong>{ec.ward}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDraftProposal(ec)}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78125rem' }}
                  >
                    <FilePlus size={14} />
                    <span>Proceed to Proposal Draft</span>
                  </button>
                </div>

                {/* 2 COLUMNS: Institutional Routing & Faculty Feasibility */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                  {/* LEVEL 1: Institutional Decision Summary */}
                  <div
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Level 1: Institutional Decision (Nodal Officer)
                      </span>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#10b981' }}>
                        ✓ Accepted for Evaluation
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8125rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Assigned Department: </span>
                      <strong style={{ color: 'var(--text-primary)' }}>{ec.nodalDecision.assignedDepartment}</strong>
                    </div>

                    <div style={{ fontSize: '0.8125rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Assigned Faculty Lead: </span>
                      <strong style={{ color: 'var(--accent-indigo)' }}>{faculty.name}</strong>
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Specialization: {faculty.specialization.join(', ')} • {faculty.email}
                    </div>
                  </div>

                  {/* LEVEL 2: Faculty Feasibility Assessment */}
                  <div
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Level 2: Faculty Research Assessment
                      </span>
                      {evalData && (
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 800,
                            color: evalData.feasibility === 'FEASIBLE' ? '#10b981' : 'var(--accent-amber)',
                          }}
                        >
                          ● {evalData.feasibility.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>

                    {!isEditing ? (
                      <>
                        <p style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                          {evalData?.technicalNotes || 'Faculty evaluation in progress. Assessing hydrodynamic modeling limits and prototyping feasibility.'}
                        </p>

                        {evalData?.requiredResources && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.3rem' }}>
                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 700 }}>Required Lab Tools:</span>
                            {evalData.requiredResources.map((res, i) => (
                              <span
                                key={i}
                                style={{
                                  fontSize: '0.6875rem',
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: 'var(--radius-full)',
                                  backgroundColor: 'rgba(99, 102, 241, 0.12)',
                                  color: 'var(--accent-indigo)',
                                }}
                              >
                                {res}
                              </span>
                            ))}
                          </div>
                        )}

                        <div style={{ marginTop: 'auto', paddingTop: '0.4rem' }}>
                          <button
                            type="button"
                            onClick={() => handleStartFeasibilityEdit(ec)}
                            className="btn btn-secondary btn-xs"
                            style={{ fontSize: '0.72rem' }}
                          >
                            Update Feasibility Evaluation
                          </button>
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <select
                          className="input"
                          value={feasibilityChoice}
                          onChange={(e) => setFeasibilityChoice(e.target.value as any)}
                          style={{ height: '30px', fontSize: '0.75rem' }}
                        >
                          <option value="FEASIBLE">Feasible (Proceed to Team & Proposal)</option>
                          <option value="NEEDS_INVESTIGATION">Needs More Investigation / Lab Test</option>
                          <option value="NEEDS_EXTERNAL_COLLAB">Needs External Industry / Lab Collab</option>
                          <option value="NOT_FEASIBLE">Not Technically Feasible</option>
                        </select>
                        <textarea
                          className="input"
                          rows={2}
                          placeholder="Enter technical feasibility notes and required equipment..."
                          value={feasibilityNotes}
                          onChange={(e) => setFeasibilityNotes(e.target.value)}
                          style={{ fontSize: '0.75rem', padding: '0.4rem' }}
                        />
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => setEditingFeasibilityId(null)}
                            className="btn btn-ghost btn-xs"
                            style={{ fontSize: '0.72rem' }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveFeasibility(ec.id)}
                            className="btn btn-primary btn-xs"
                            style={{ fontSize: '0.72rem' }}
                          >
                            Save Assessment
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* LEVEL 3: Research Team Assembly Section */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Users size={16} color="var(--accent-indigo)" />
                      <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Research Team Assembly ({team?.studentMembers.length || 0} Student Researchers Assembled)
                      </span>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.45rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'rgba(56, 189, 248, 0.15)',
                          color: '#38bdf8',
                        }}
                      >
                        Team Status: {team?.teamStatus || 'Forming'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAddingStudentChallengeId(ec.id)}
                      className="btn btn-secondary btn-xs"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem' }}
                    >
                      <Plus size={12} />
                      <span>Add Student Researcher</span>
                    </button>
                  </div>

                  {/* Student Members List */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.6rem' }}>
                    {(team?.studentMembers || []).map((stu) => (
                      <div
                        key={stu.id}
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.65rem 0.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.2rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.78125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {stu.name}
                          </span>
                          <span className="mono" style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>
                            {stu.apaarId}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {stu.role} • {stu.department}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Student Inline Form */}
                  {addingStudentChallengeId === ec.id && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        padding: '0.75rem',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--accent-indigo)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Select Verified Student (with APAAR ID):
                      </span>
                      <select
                        className="input"
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        style={{ height: '30px', fontSize: '0.75rem', flex: 1, minWidth: '220px' }}
                      >
                        {SEED_STUDENT_RESEARCHERS.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.apaarId}) — {s.role} ({s.department})
                          </option>
                        ))}
                      </select>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          type="button"
                          onClick={() => setAddingStudentChallengeId(null)}
                          className="btn btn-ghost btn-xs"
                          style={{ fontSize: '0.72rem' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddStudent(ec.id)}
                          className="btn btn-primary btn-xs"
                          style={{ fontSize: '0.72rem' }}
                        >
                          Confirm Addition
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
