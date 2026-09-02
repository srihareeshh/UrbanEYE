import React from 'react';
import {
  Sparkles,
  FolderGit2,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import type { HEIProject } from '../../../types';
import type {
  FacultyMember,
  EvaluatedChallenge,
  ResearchProposal,
  StudentResearcher,
} from '../heiDataModel';

interface HEIFacultyWorkbenchTabProps {
  activeFaculty: FacultyMember;
  assignedChallenges: EvaluatedChallenge[];
  facultyProposals: ResearchProposal[];
  facultyProjects: HEIProject[];
  studentResearchers?: StudentResearcher[];
  onNavigateTab: (tab: any) => void;
  onOpenProjectDetail: (project: HEIProject) => void;
  onStartFeasibility: (challenge: EvaluatedChallenge) => void;
}

export const HEIFacultyWorkbenchTab: React.FC<HEIFacultyWorkbenchTabProps> = ({
  activeFaculty,
  assignedChallenges,
  facultyProposals,
  facultyProjects,
  onNavigateTab,
  onOpenProjectDetail,
  onStartFeasibility,
}) => {
  const pendingFeasibilityCount = assignedChallenges.filter(
    (c) => c.status === 'FACULTY_EVALUATION' || !c.facultyEvaluation
  ).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Faculty Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(99, 102, 241, 0.08) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.4rem 1.6rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: 'var(--accent-amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <GraduationCap size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {activeFaculty.name}
              </h2>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  color: 'var(--accent-amber)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                }}
              >
                ● Faculty Research Lead
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0 }}>
              {activeFaculty.designation} • <strong>{activeFaculty.department}</strong> (BIT Mesra) • h-index: <strong>{activeFaculty.hIndex}</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('assigned_challenges')}
          className="btn btn-primary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', backgroundColor: 'var(--accent-amber)', color: '#000', border: 'none', fontWeight: 800 }}
        >
          <Sparkles size={14} />
          <span>View Assigned Challenges ({assignedChallenges.length})</span>
        </button>
      </div>

      {/* 2. Personal Operational KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
        <div
          onClick={() => onNavigateTab('assigned_challenges')}
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '0.85rem', cursor: 'pointer' }}
        >
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Assigned Challenges</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-indigo)', marginTop: '0.15rem' }}>
            {assignedChallenges.length}
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Routed by Nodal Officer</span>
        </div>

        <div
          onClick={() => onNavigateTab('feasibility')}
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '0.85rem', cursor: 'pointer' }}
        >
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Feasibility Reviews</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-amber)', marginTop: '0.15rem' }}>
            {pendingFeasibilityCount} Pending
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--accent-amber)' }}>● Action Required</span>
        </div>

        <div
          onClick={() => onNavigateTab('proposals')}
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '0.85rem', cursor: 'pointer' }}
        >
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>R&D Proposals</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38bdf8', marginTop: '0.15rem' }}>
            {facultyProposals.length}
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Draft & Submitted</span>
        </div>

        <div
          onClick={() => onNavigateTab('my_projects')}
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '0.85rem', cursor: 'pointer' }}
        >
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>My Active Capstones</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10b981', marginTop: '0.15rem' }}>
            {facultyProjects.length}
          </div>
          <span style={{ fontSize: '0.6875rem', color: '#10b981' }}>Under Execution</span>
        </div>
      </div>

      {/* 3. Priority Action: Assigned Challenges Needing Feasibility Review */}
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
              Challenges Assigned to You Awaiting Feasibility Review
            </h3>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('feasibility')}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.78125rem', color: 'var(--accent-indigo)' }}
          >
            <span>Open Feasibility Workspace</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {assignedChallenges.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            No challenges currently assigned to your profile.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {assignedChallenges.map((chal) => (
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
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}>
                      ● {chal.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.35rem', marginBottom: '0.2rem' }}>
                    {chal.title}
                  </h4>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Ward: {chal.ward} • Assigned to: <strong style={{ color: 'var(--accent-indigo)' }}>{activeFaculty.name}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => onStartFeasibility(chal)}
                    className="btn btn-primary btn-xs"
                    style={{ fontSize: '0.75rem' }}
                  >
                    Conduct Feasibility Assessment
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Active Research Projects Grid */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FolderGit2 size={16} color="#10b981" />
            Your Active Research Capstones ({facultyProjects.length})
          </h3>

          <button
            type="button"
            onClick={() => onNavigateTab('my_projects')}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.78125rem', color: 'var(--accent-indigo)' }}
          >
            <span>View All My Projects</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {facultyProjects.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            No active research projects currently assigned to you.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.85rem' }}>
            {facultyProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => onOpenProjectDetail(p)}
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-indigo)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {p.title}
                  </span>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>
                    Stage {p.current_stage}/4
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  Team: {p.student_team?.length || 2} Student Researchers • {p.total_research_hours || 140} Hours Logged
                </div>
                {/* Progress bar */}
                <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-card)', borderRadius: '3px', marginTop: '0.5rem', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${(p.current_stage / 4) * 100}%`,
                      height: '100%',
                      backgroundColor: p.current_stage >= 4 ? '#10b981' : 'var(--accent-indigo)',
                      borderRadius: '3px',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
