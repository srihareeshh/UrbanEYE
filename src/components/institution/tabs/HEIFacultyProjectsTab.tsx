import React from 'react';
import {
  FolderGit2,
  ChevronRight,
} from 'lucide-react';
import type { HEIProject } from '../../../types';
import type { FacultyMember } from '../heiDataModel';

interface HEIFacultyProjectsTabProps {
  activeFaculty: FacultyMember;
  facultyProjects: HEIProject[];
  onOpenProjectDetail: (project: HEIProject) => void;
  onNavigateTab: (tab: any) => void;
}

export const HEIFacultyProjectsTab: React.FC<HEIFacultyProjectsTabProps> = ({
  activeFaculty,
  facultyProjects,
  onOpenProjectDetail,
  onNavigateTab,
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
          <FolderGit2 size={18} color="#10b981" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            My Active Capstone & Research Projects ({facultyProjects.length})
          </h2>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0 }}>
          Live university capstones and research initiatives led by <strong>{activeFaculty.name}</strong> ({activeFaculty.department}). Click any project to open the complete multi-stage execution workspace.
        </p>
      </div>

      {/* Projects List */}
      {facultyProjects.length === 0 ? (
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
          <FolderGit2 size={32} style={{ margin: '0 auto 0.75rem auto', color: 'var(--accent-amber)', opacity: 0.7 }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            No Projects Are Currently Assigned to You
          </h3>
          <p style={{ fontSize: '0.8125rem', maxWidth: '420px', margin: '0 auto 1rem auto', lineHeight: 1.5 }}>
            Review your assigned challenges in <strong>Assigned Challenges</strong>, conduct a feasibility review, and submit a research proposal to activate a project.
          </p>
          <button
            type="button"
            onClick={() => onNavigateTab('assigned_challenges')}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.78125rem' }}
          >
            Go to Assigned Challenges
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {facultyProjects.map((p) => (
            <div
              key={p.id}
              onClick={() => onOpenProjectDetail(p)}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.35rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-indigo)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-medium)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="mono" style={{ fontSize: '0.8125rem', fontWeight: 900, color: 'var(--accent-indigo)' }}>
                    {p.id}
                  </span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-indigo)' }}>
                    Stage {p.current_stage}/4: {['Feasibility & Specs', 'Simulation & CAD', 'Working Prototype', 'Municipal Pilot'][(p.current_stage || 1) - 1] || 'Capstone Execution'}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.55rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: p.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                      color: p.status === 'completed' ? '#10b981' : '#38bdf8',
                    }}
                  >
                    ● {p.status.toUpperCase()}
                  </span>
                </div>

                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-indigo)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  Open Research Workspace <ChevronRight size={14} />
                </span>
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {p.title}
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.78125rem', color: 'var(--text-muted)' }}>
                <span>Faculty Supervisor: <strong style={{ color: 'var(--accent-indigo)' }}>{p.faculty_lead}</strong></span>
                <span>•</span>
                <span>Team: <strong>{p.student_team?.length || 3} Student Researchers</strong></span>
                <span>•</span>
                <span>Funding: <strong style={{ color: '#10b981' }}>₹{((p.funding_pledged || 275000) / 1000).toLocaleString('en-IN')} K</strong></span>
                <span>•</span>
                <span>Hours: <strong style={{ color: 'var(--accent-amber)' }}>{p.total_research_hours || 185} hrs</strong></span>
              </div>

              {/* Stage Progress bar */}
              <div style={{ width: '100%', height: '7px', backgroundColor: 'var(--bg-elevated)', borderRadius: '4px', overflow: 'hidden', marginTop: '0.25rem' }}>
                <div
                  style={{
                    width: `${(p.current_stage / 4) * 100}%`,
                    height: '100%',
                    backgroundColor: p.current_stage >= 4 ? '#10b981' : 'var(--accent-indigo)',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
