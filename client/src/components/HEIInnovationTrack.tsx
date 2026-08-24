import React from 'react';
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Clock,
  Award,
  Layers,
  Users,
  Building2,
} from 'lucide-react';
import type { HEIChallenge, HEIProject, ProjectMilestone } from '../types';

interface HEIInnovationTrackProps {
  challenge?: HEIChallenge | null;
  project?: HEIProject | null;
  reportCode: string;
}

const DEFAULT_STAGES: Array<{
  stageIndex: number;
  title: string;
  desc: string;
  status: 'completed' | 'in_progress' | 'pending';
  hours: number;
}> = [
  {
    stageIndex: 1,
    title: 'Stage 1: Ward Geo-Sensing & Catchment Telemetry',
    desc: 'Geospatial survey, LiDAR mapping and hydraulic baseline telemetry calibrated on site.',
    status: 'completed',
    hours: 35,
  },
  {
    stageIndex: 2,
    title: 'Stage 2: Lab Simulation & Rapid Prototyping',
    desc: 'Material formulation, stress flow modeling, and working prototype fabrication in university labs.',
    status: 'in_progress',
    hours: 40,
  },
  {
    stageIndex: 3,
    title: 'Stage 3: Field Pilot Testing in Ward',
    desc: 'On-site installation and 30-day live municipal telemetry stress testing under real civic load.',
    status: 'pending',
    hours: 25,
  },
  {
    stageIndex: 4,
    title: 'Stage 4: Tech Transfer & Municipal Rate Contract',
    desc: 'Full certification, NEP credit transcript release, and municipal rate contract licensing.',
    status: 'pending',
    hours: 15,
  },
];

export const HEIInnovationTrack: React.FC<HEIInnovationTrackProps> = ({
  challenge,
  project,
  reportCode,
}) => {
  if (!challenge && !project) return null;

  const milestones: ProjectMilestone[] = (project?.milestones && project.milestones.length > 0)
    ? project.milestones
    : DEFAULT_STAGES.map((s, idx) => ({
        id: `ms_def_${idx}`,
        project_id: project?.id || 'proj_active',
        stage_index: s.stageIndex,
        title: s.title,
        description: s.desc,
        status: s.status,
        research_hours: s.hours,
        created_at: new Date().toISOString(),
      }));

  const studentTeam = project?.student_team || [
    { name: 'Aarav Sharma', studentId: 'IITB-CE-2024-041', apaarId: '9844-2201-8842', role: 'Lead Design & Hydro Dynamics', hours: 42 },
    { name: 'Pooja Iyer', studentId: 'IITB-EE-2024-118', apaarId: '9844-2201-9931', role: 'Edge Telemetry & Sensing', hours: 38 },
    { name: 'Vikram Seth', studentId: 'IITB-ME-2024-082', apaarId: '9844-2201-4412', role: 'Fabrication & Prototype Testing', hours: 35 },
  ];

  const currentStage = project?.current_stage || 2;
  const totalHours = project?.total_research_hours || 115;
  const institutionName = project?.institution_name || 'Indian Institute of Technology (IIT) / National Institute of Technology (NIT)';
  const facultyLead = project?.faculty_lead || 'Prof. Dr. A. V. Deshmukh';
  const departmentName = project?.department || challenge?.department_match || 'Environmental & Civil Engineering Dept';

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.4rem',
        boxShadow: '0 8px 30px rgba(99, 102, 241, 0.08)',
        marginTop: '1.25rem',
      }}
    >
      {/* Top Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(99, 102, 241, 0.18)',
              color: 'var(--accent-indigo)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(99, 102, 241, 0.25)',
            }}
          >
            <GraduationCap size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Academic R&D & NEP Capstone Track
              </h3>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.55rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(99, 102, 241, 0.2)',
                  color: 'var(--accent-indigo)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                }}
              >
                Parallel Innovation Active
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Created independently from routine field repair to develop a permanent, scalable engineering solution for {reportCode}.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span
            className="mono"
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: 'var(--bg-elevated)',
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            Total Research: <strong style={{ color: 'var(--accent-indigo)' }}>{totalHours} hrs</strong>
          </span>
        </div>
      </div>

      {/* Institution & Faculty Lead Header Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '0.75rem',
          backgroundColor: 'var(--bg-elevated)',
          padding: '0.9rem 1.1rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '1.25rem',
        }}
      >
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Building2 size={12} /> University / Institution
          </div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
            {institutionName}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--accent-indigo)', marginTop: '0.1rem' }}>
            {departmentName}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Award size={12} /> Faculty Research Mentor
          </div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
            {facultyLead}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
            NEP 2020 Experiential Learning Coordinator
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Sparkles size={12} /> R&D Challenge Brief
          </div>
          <div style={{ fontSize: '0.78125rem', color: 'var(--text-primary)', marginTop: '0.15rem', lineHeight: 1.35 }}>
            {challenge?.research_brief || 'Multidisciplinary engineering capstone focused on sustainable civic infrastructure.'}
          </div>
        </div>
      </div>

      {/* 4-Stage Progressive Innovation Milestones */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Layers size={15} color="var(--accent-indigo)" />
          <span>Capstone Milestone Progression (Stages 1 to 4)</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {milestones.map((ms, idx) => {
            const isCompleted = ms.status === 'completed' || idx + 1 < currentStage;
            const isCurrent = ms.status === 'in_progress' || idx + 1 === currentStage;

            return (
              <div
                key={ms.id || idx}
                style={{
                  padding: '0.9rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isCurrent
                    ? 'rgba(99, 102, 241, 0.09)'
                    : isCompleted
                    ? 'rgba(16, 185, 129, 0.06)'
                    : 'var(--bg-elevated)',
                  border: isCurrent
                    ? '1.5px solid var(--accent-indigo)'
                    : isCompleted
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    className="mono"
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      backgroundColor: isCompleted
                        ? 'var(--accent-emerald)'
                        : isCurrent
                        ? 'var(--accent-indigo)'
                        : 'var(--bg-card)',
                      color: isCompleted || isCurrent ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    Stage {idx + 1}
                  </span>

                  {isCompleted ? (
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <CheckCircle2 size={12} /> Verified
                    </span>
                  ) : isCurrent ? (
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--accent-indigo)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Clock size={12} /> In Progress
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Pending</span>
                  )}
                </div>

                <div style={{ fontSize: '0.78125rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  {ms.title}
                </div>

                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.35, margin: 0 }}>
                  {ms.description}
                </p>

                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 'auto', paddingTop: '0.35rem', borderTop: '1px solid var(--border-subtle)' }}>
                  ⏱ Research Effort: <strong style={{ color: 'var(--text-primary)' }}>{ms.research_hours} hrs</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Student Capstone Research Team (APAAR ID & NEP Credits) */}
      <div
        style={{
          backgroundColor: 'var(--bg-elevated)',
          padding: '1rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Users size={16} color="var(--accent-indigo)" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Assigned Student Capstone Team & APAAR Digital Transcript
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--accent-indigo)', fontWeight: 600 }}>
            Automated Credit Ledger via National Credit Framework (NCrF)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.65rem' }}>
          {studentTeam.map((member, i) => (
            <div
              key={i}
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {member.name}
                </span>
                <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--accent-indigo)', fontWeight: 700 }}>
                  {member.hours} hrs
                </span>
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                {member.role}
              </div>
              <div className="mono" style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                APAAR: {member.apaarId} • {member.studentId}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
