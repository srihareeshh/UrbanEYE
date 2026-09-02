import React, { useState } from 'react';
import {
  Users,
  Plus,
  FilePlus,
} from 'lucide-react';
import type { EvaluatedChallenge, FacultyMember, StudentResearcher } from '../heiDataModel';
import { SEED_STUDENT_RESEARCHERS } from '../heiDataModel';

interface HEIResearchTeamsTabProps {
  activeFaculty: FacultyMember;
  assignedChallenges: EvaluatedChallenge[];
  onAddStudentToTeam: (challengeId: string, student: StudentResearcher) => void;
  onDraftProposal: (challenge: EvaluatedChallenge) => void;
}

export const HEIResearchTeamsTab: React.FC<HEIResearchTeamsTabProps> = ({
  activeFaculty,
  assignedChallenges,
  onAddStudentToTeam,
  onDraftProposal,
}) => {
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>(assignedChallenges[0]?.id || '');
  const activeChallenge = assignedChallenges.find((c) => c.id === selectedChallengeId) || assignedChallenges[0];

  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(SEED_STUDENT_RESEARCHERS[0].id);

  const teamMembers = activeChallenge?.teamFormation?.studentMembers || [SEED_STUDENT_RESEARCHERS[0], SEED_STUDENT_RESEARCHERS[1]];

  const handleAdd = () => {
    const stu = SEED_STUDENT_RESEARCHERS.find((s) => s.id === selectedStudentId);
    if (stu && activeChallenge) {
      onAddStudentToTeam(activeChallenge.id, stu);
    }
    setIsAddingStudent(false);
  };

  if (!activeChallenge) {
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
        <Users size={32} style={{ margin: '0 auto 0.75rem auto', color: 'var(--accent-indigo)', opacity: 0.7 }} />
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
          No Active Research Teams
        </h3>
        <p style={{ fontSize: '0.8125rem', maxWidth: '420px', margin: '0 auto', lineHeight: 1.5 }}>
          Once you complete a feasibility review for an assigned challenge, you can assemble verified student researchers and draft an R&D proposal.
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
          <Users size={18} color="var(--accent-indigo)" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Research Team Assembly & Student Mentorship
          </h2>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0 }}>
          Form and manage interdisciplinary research teams of postgraduate and undergraduate student researchers linked to official <strong>APAAR IDs</strong> and NEP 2020 experiential learning credits.
        </p>
      </div>

      {/* Main Container */}
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
        {/* Project Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="mono" style={{ fontSize: '0.8125rem', fontWeight: 900, color: 'var(--accent-indigo)' }}>
                {activeChallenge.reportCode}
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                Team Status: {activeChallenge.teamFormation?.teamStatus || 'Active'}
              </span>
              {assignedChallenges.length > 1 && (
                <select
                  className="input"
                  value={selectedChallengeId}
                  onChange={(e) => setSelectedChallengeId(e.target.value)}
                  style={{ height: '26px', fontSize: '0.7rem', padding: '0 0.4rem' }}
                >
                  {assignedChallenges.map((c) => (
                    <option key={c.id} value={c.id}>
                      Switch to: {c.reportCode}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
              {activeChallenge.title}
            </h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Principal Faculty Supervisor: <strong style={{ color: 'var(--accent-indigo)' }}>{activeFaculty.name}</strong> ({activeFaculty.department})
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setIsAddingStudent(true)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78125rem' }}
            >
              <Plus size={14} />
              <span>Add Student Researcher</span>
            </button>

            <button
              type="button"
              onClick={() => onDraftProposal(activeChallenge)}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78125rem' }}
            >
              <FilePlus size={14} />
              <span>Draft R&D Proposal with Team</span>
            </button>
          </div>
        </div>

        {/* Inline Add Student Form */}
        {isAddingStudent && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--accent-indigo)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <span style={{ fontSize: '0.78125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Select Verified Student Candidate (with APAAR ID):
            </span>
            <select
              className="input"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              style={{ height: '34px', fontSize: '0.78125rem', flex: 1, minWidth: '240px' }}
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
                onClick={() => setIsAddingStudent(false)}
                className="btn btn-ghost btn-xs"
                style={{ fontSize: '0.75rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdd}
                className="btn btn-primary btn-xs"
                style={{ fontSize: '0.75rem' }}
              >
                Confirm Addition
              </button>
            </div>
          </div>
        )}

        {/* Assembled Student Researchers Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
          {teamMembers.map((stu) => (
            <div
              key={stu.id}
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {stu.name}
                </span>
                <span className="mono" style={{ fontSize: '0.6875rem', color: '#10b981', fontWeight: 700, padding: '0.1rem 0.4rem', backgroundColor: 'rgba(16, 185, 129, 0.12)', borderRadius: 'var(--radius-full)' }}>
                  {stu.apaarId}
                </span>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {stu.role} • {stu.department} ({stu.year})
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.2rem' }}>
                {stu.skills.map((sk, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.6875rem',
                      padding: '0.1rem 0.4rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(99, 102, 241, 0.12)',
                      color: 'var(--accent-indigo)',
                    }}
                  >
                    {sk}
                  </span>
                ))}
              </div>

              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>Logged Hours: <strong>{stu.researchHours} hrs</strong></span>
                <span style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>NEP Credits: {stu.nepCreditsEarned}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
