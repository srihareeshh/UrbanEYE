import React from 'react';
import {
  Sparkles,
  MapPin,
} from 'lucide-react';
import type { EvaluatedChallenge, FacultyMember } from '../heiDataModel';

interface HEIFacultyAssignedChallengesTabProps {
  activeFaculty: FacultyMember;
  assignedChallenges: EvaluatedChallenge[];
  onOpenChallengeDetail: (challenge: any) => void;
  onStartFeasibility: (challenge: EvaluatedChallenge) => void;
}

export const HEIFacultyAssignedChallengesTab: React.FC<HEIFacultyAssignedChallengesTabProps> = ({
  activeFaculty,
  assignedChallenges,
  onOpenChallengeDetail,
  onStartFeasibility,
}) => {
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
          <Sparkles size={18} color="var(--accent-amber)" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Challenges Assigned to You ({assignedChallenges.length})
          </h2>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0 }}>
          Civic innovation challenges accepted by the HEI Nodal Officer and specifically allocated to <strong>{activeFaculty.name}</strong> ({activeFaculty.department}) for technical and academic evaluation.
        </p>
      </div>

      {/* Assigned Challenges List */}
      {assignedChallenges.length === 0 ? (
        <div
          style={{
            padding: '3.5rem 2rem',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <Sparkles size={32} style={{ margin: '0 auto 0.75rem auto', color: 'var(--accent-amber)', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            No Challenges Currently Assigned to You
          </h3>
          <p style={{ fontSize: '0.8125rem', maxWidth: '420px', margin: '0 auto', lineHeight: 1.5 }}>
            When the HEI Nodal Officer routes a matched civic challenge to your department and profile, it will appear here for feasibility review.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {assignedChallenges.map((chal) => {
            const evalData = chal.facultyEvaluation;
            return (
              <div
                key={chal.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.35rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="mono" style={{ fontSize: '0.8125rem', fontWeight: 900, color: 'var(--accent-indigo)' }}>
                      {chal.reportCode}
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-indigo)' }}>
                      {chal.category}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.55rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor:
                          chal.status === 'TEAM_FORMING'
                            ? 'rgba(56, 189, 248, 0.15)'
                            : chal.status === 'FACULTY_EVALUATION'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(16, 185, 129, 0.15)',
                        color:
                          chal.status === 'TEAM_FORMING'
                            ? '#38bdf8'
                            : chal.status === 'FACULTY_EVALUATION'
                            ? 'var(--accent-amber)'
                            : '#10b981',
                      }}
                    >
                      ● {chal.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => onOpenChallengeDetail(chal)}
                      className="btn btn-secondary btn-xs"
                      style={{ fontSize: '0.75rem' }}
                    >
                      Review Problem Genome
                    </button>
                    <button
                      type="button"
                      onClick={() => onStartFeasibility(chal)}
                      className="btn btn-primary btn-xs"
                      style={{ fontSize: '0.75rem', backgroundColor: 'var(--accent-amber)', color: '#000', border: 'none', fontWeight: 800 }}
                    >
                      Conduct Feasibility
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {chal.title}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78125rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MapPin size={13} /> {chal.ward}
                  </span>
                  <span>•</span>
                  <span>Routed By: <strong>Nodal Officer (Central IIC)</strong></span>
                </div>

                {evalData && (
                  <div
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem 0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)' }}>
                      Feasibility Assessment: <strong style={{ color: evalData.feasibility === 'FEASIBLE' ? '#10b981' : 'var(--accent-amber)' }}>{evalData.feasibility.replace(/_/g, ' ')}</strong>
                      <span style={{ color: 'var(--text-muted)', marginLeft: '0.4rem' }}>— {evalData.technicalNotes}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
