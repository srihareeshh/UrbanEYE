import React from 'react';
import {
  CheckCircle2,
  Award,
} from 'lucide-react';
import type { HEIProject, ProjectMilestone } from '../../../types';

interface HEIActiveProjectsTabProps {
  projects: HEIProject[];
  onOpenMilestoneModal: (project: HEIProject, milestone: ProjectMilestone) => void;
  onOpenNEPCertificateModal: (project: HEIProject) => void;
  onNavigateTab: (tab: any) => void;
}

export const HEIActiveProjectsTab: React.FC<HEIActiveProjectsTabProps> = ({
  projects,
  onOpenMilestoneModal,
  onOpenNEPCertificateModal,
  onNavigateTab,
}) => {
  const stageLabels = [
    'Stage 1: Feasibility & Specs',
    'Stage 2: Simulation & CAD',
    'Stage 3: Physical Prototype',
    'Stage 4: Municipal Pilot',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Header */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Active Capstone & Research Projects
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0 }}>
            End-to-end multi-stage monitoring from laboratory simulation to physical prototyping, field pilots & NEP student accreditation.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('milestones')}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}
        >
          <CheckCircle2 size={14} color="#10b981" />
          <span>View All Milestones</span>
        </button>
      </div>

      {/* 2. Projects Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {projects.map((proj) => {
          const milestones = proj.milestones || [
            { id: `ms_${proj.id}_1`, project_id: proj.id, stage_index: 1, title: 'Feasibility & Specs', description: 'Baseline literature review and hydrodynamic parameters.', status: 'completed', research_hours: 30, created_at: proj.created_at },
            { id: `ms_${proj.id}_2`, project_id: proj.id, stage_index: 2, title: 'Simulation & CAD', description: 'Computational finite element model and scale test.', status: proj.current_stage >= 2 ? 'completed' : 'in_progress', research_hours: 45, created_at: proj.created_at },
            { id: `ms_${proj.id}_3`, project_id: proj.id, stage_index: 3, title: 'Working Prototype', description: 'Physical prototype fabrication with sensor telemetry.', status: proj.current_stage >= 3 ? 'in_progress' : 'pending', research_hours: 0, created_at: proj.created_at },
            { id: `ms_${proj.id}_4`, project_id: proj.id, stage_index: 4, title: 'Municipal Pilot', description: 'Field deployment and municipal impact verification.', status: 'pending', research_hours: 0, created_at: proj.created_at },
          ];

          return (
            <div
              key={proj.id}
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
              {/* Project Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>
                      {proj.id.toUpperCase()}
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
                      {proj.department}
                    </span>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: proj.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                        color: proj.status === 'completed' ? '#10b981' : '#38bdf8',
                      }}
                    >
                      ● {proj.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.35rem', marginBottom: '0.2rem' }}>
                    {proj.title}
                  </h3>

                  <div style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}>
                    Faculty Lead: <strong style={{ color: 'var(--text-primary)' }}>{proj.faculty_lead}</strong> • Student Team: <strong>{proj.student_team?.length || 3} Members</strong>
                  </div>
                </div>

                {/* Financials & Hours Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Hours</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                      {(proj.total_research_hours || 75) + (proj.total_field_hours || 20)} hrs
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Funding Pledged</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#10b981' }}>
                      ₹{((proj.funding_pledged || 300000) / 100000).toFixed(1)}L / ₹{((proj.funding_goal || 300000) / 100000).toFixed(1)}L
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi-Stage Stepper Track */}
              <div
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                {[1, 2, 3, 4].map((stageNum) => {
                  const isDone = (proj.current_stage || 1) > stageNum;
                  const isCurrent = (proj.current_stage || 1) === stageNum;
                  const milestoneForStage = milestones.find((m: any) => m.stage_index === stageNum);

                  return (
                    <div
                      key={stageNum}
                      style={{
                        padding: '0.65rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isCurrent ? 'rgba(99, 102, 241, 0.12)' : isDone ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                        border: isCurrent ? '1px solid var(--accent-indigo)' : isDone ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: isDone ? '#10b981' : isCurrent ? 'var(--accent-indigo)' : 'var(--text-muted)' }}>
                          {isDone ? '✓ Completed' : isCurrent ? '● In Progress' : 'Pending'}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Stage {stageNum}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {stageLabels[stageNum - 1]}
                      </div>
                      {milestoneForStage && (
                        <button
                          type="button"
                          onClick={() => onOpenMilestoneModal(proj, milestoneForStage as any)}
                          className="btn btn-ghost btn-xs"
                          style={{
                            fontSize: '0.6875rem',
                            color: 'var(--accent-indigo)',
                            padding: '0.15rem 0.3rem',
                            justifyContent: 'flex-start',
                            marginTop: '0.2rem',
                          }}
                        >
                          Update Deliverables →
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Student Team & Certificate Trigger Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>Student Researchers:</span>
                  {(proj.student_team || []).map((stu, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {stu.name} ({stu.apaarId || stu.studentId})
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => onOpenNEPCertificateModal(proj)}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78125rem', color: 'var(--accent-amber)', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                >
                  <Award size={14} />
                  <span>Issue NEP Credit Certificate</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
