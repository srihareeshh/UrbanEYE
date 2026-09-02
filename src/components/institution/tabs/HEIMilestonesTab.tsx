import React from 'react';
import {
  Clock,
  GitBranch,
  FileCode,
  Database,
} from 'lucide-react';
import type { HEIProject, ProjectMilestone } from '../../../types';

interface HEIMilestonesTabProps {
  projects: HEIProject[];
  onOpenMilestoneModal: (project: HEIProject, milestone: ProjectMilestone) => void;
}

export const HEIMilestonesTab: React.FC<HEIMilestonesTabProps> = ({
  projects,
  onOpenMilestoneModal,
}) => {
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
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          Project Milestones & Technical Deliverables
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0 }}>
          Manage stage deliverables, code repositories, physical schematics, sensor telemetry logs, and student research hours.
        </p>
      </div>

      {/* 2. Milestones Grid by Project */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {projects.map((proj) => {
          const milestones = proj.milestones || [
            { id: `ms_${proj.id}_1`, project_id: proj.id, stage_index: 1, title: 'Feasibility & Specs', description: 'Baseline literature review and engineering specifications.', status: 'completed', research_hours: 30, deliverables: { schematicUrl: 'https://cad.onshape.com/specs-01', githubUrl: 'https://github.com/bitmesra/specs-repo' }, created_at: proj.created_at },
            { id: `ms_${proj.id}_2`, project_id: proj.id, stage_index: 2, title: 'Simulation & CAD Testing', description: 'Hydrodynamic model and scale bench test.', status: proj.current_stage >= 2 ? 'completed' : 'in_progress', research_hours: 45, deliverables: { prototypeUrl: 'https://flume.test/sim-data', telemetryUrl: 'https://iot.bitmesra.ac.in/telemetry-01' }, created_at: proj.created_at },
            { id: `ms_${proj.id}_3`, project_id: proj.id, stage_index: 3, title: 'Working Prototype Unit', description: 'Fabricate physical prototype with sensor telemetry.', status: proj.current_stage >= 3 ? 'in_progress' : 'pending', research_hours: 0, created_at: proj.created_at },
            { id: `ms_${proj.id}_4`, project_id: proj.id, stage_index: 4, title: 'Field Deployment & Municipal Pilot', description: 'On-site municipal pilot validation.', status: 'pending', research_hours: 0, created_at: proj.created_at },
          ];

          return (
            <div
              key={proj.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {proj.title}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {proj.institution_name} • {proj.department} • Lead: {proj.faculty_lead}
                  </div>
                </div>

                <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>
                  {proj.id.toUpperCase()}
                </span>
              </div>

              {/* Milestones Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem' }}>
                {milestones.map((m) => {
                  const isDone = m.status === 'completed';
                  const isInProgress = m.status === 'in_progress';
                  const del = m.deliverables || {};

                  return (
                    <div
                      key={m.id}
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        border: isDone ? '1px solid rgba(16, 185, 129, 0.35)' : isInProgress ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.65rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 800,
                            color: isDone ? '#10b981' : isInProgress ? 'var(--accent-indigo)' : 'var(--text-muted)',
                          }}
                        >
                          {isDone ? '✓ COMPLETED' : isInProgress ? '● IN PROGRESS' : 'PENDING'}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Stage {m.stage_index}</span>
                      </div>

                      <div>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          {m.title}
                        </h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.4, margin: 0 }}>
                          {m.description}
                        </p>
                      </div>

                      {/* Deliverables links */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {del.githubUrl && (
                          <a
                            href={del.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '0.6875rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'rgba(255, 255, 255, 0.08)',
                              color: 'var(--text-primary)',
                              textDecoration: 'none',
                            }}
                          >
                            <GitBranch size={11} /> Code Repo
                          </a>
                        )}
                        {del.schematicUrl && (
                          <a
                            href={del.schematicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '0.6875rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'rgba(99, 102, 241, 0.15)',
                              color: 'var(--accent-indigo)',
                              textDecoration: 'none',
                            }}
                          >
                            <FileCode size={11} /> CAD Schematic
                          </a>
                        )}
                        {del.telemetryUrl && (
                          <a
                            href={del.telemetryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '0.6875rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              color: '#10b981',
                              textDecoration: 'none',
                            }}
                          >
                            <Database size={11} /> Telemetry Logs
                          </a>
                        )}
                      </div>

                      {/* Footer update trigger */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '0.5rem',
                          borderTop: '1px solid var(--border-subtle)',
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={12} /> {m.research_hours || 0} hrs
                        </span>

                        <button
                          type="button"
                          onClick={() => onOpenMilestoneModal(proj, m as any)}
                          className="btn btn-secondary btn-xs"
                          style={{ fontSize: '0.7rem' }}
                        >
                          Update Milestone
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
