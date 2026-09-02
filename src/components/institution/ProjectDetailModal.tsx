import React, { useState } from 'react';
import {
  X,
  FolderGit2,
  Users,
  CheckCircle2,
  Cpu,
  Handshake,
  Compass,
  BarChart3,
  Award,
  Sparkles,
  FileText,
} from 'lucide-react';
import type { HEIProject, ProjectMilestone } from '../../types';
import type {
  HEIPerspective,
} from './heiDataModel';
import {
  SEED_PROTOTYPES,
  SEED_INDUSTRY_COLLABS,
  SEED_IMPACT_OUTCOMES,
  evaluatePilotReadiness,
} from './heiDataModel';

interface ProjectDetailModalProps {
  project: HEIProject;
  perspective: HEIPerspective;
  onClose: () => void;
  onUpdateMilestone?: (project: HEIProject, milestone: ProjectMilestone) => void;
  onIssueNEPCertificate?: (project: HEIProject) => void;
}

type ProjectDetailSection =
  | 'overview'
  | 'problem'
  | 'team'
  | 'research'
  | 'milestones'
  | 'prototype'
  | 'industry'
  | 'pilot'
  | 'impact';

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  perspective,
  onClose,
  onUpdateMilestone,
  onIssueNEPCertificate,
}) => {
  const [activeSection, setActiveSection] = useState<ProjectDetailSection>('overview');

  // Match corresponding prototype data
  const matchedPrototype = SEED_PROTOTYPES.find((p) => p.projectId === project.id) || SEED_PROTOTYPES[0];
  const matchedIndustry = SEED_INDUSTRY_COLLABS.find((c) => c.linkedProject === project.id) || SEED_INDUSTRY_COLLABS[0];
  const matchedImpact = SEED_IMPACT_OUTCOMES.find((i) => i.projectId === project.id) || SEED_IMPACT_OUTCOMES[0];
  const stageNames = [
    'Feasibility & Problem Analysis',
    'Computational Simulation & Modeling',
    'Hardware Prototyping & Bench Testing',
    'Community Municipal Field Pilot',
  ];
  const stageName = stageNames[(project.current_stage || 1) - 1] || 'Capstone Execution';

  // Pilot readiness check
  const pilotCheck = {
    prototypeReady: project.current_stage >= 3,
    prototypeNotes: 'Modular unit fabricated and bench tested in university hydraulics flume.',
    governmentPermission: (project.current_stage >= 4 ? 'approved' : 'pending') as 'approved' | 'pending',
    governmentNotes: 'Municipal Road NOC and ward councilor site permission granted.',
    infrastructureAvailable: true,
    infrastructureNotes: 'Solar mounting pole and street power drop verified.',
    industryRequirements: 'complete' as const,
    industryNotes: 'LoRa gateway and cellular SIM card delivered by industry mentor.',
    communityIdentified: true,
    communityNotes: 'Ward 14 residents committee onboarded for telemetry validation.',
    measurementPlanReady: true,
    measurementNotes: 'Continuous pressure logging at 5-minute intervals.',
  };
  const readinessResult = evaluatePilotReadiness(pilotCheck);

  const sections: Array<{ id: ProjectDetailSection; label: string; icon: React.FC<{ size?: number; color?: string }> }> = [
    { id: 'overview', label: '1. Overview', icon: FolderGit2 },
    { id: 'problem', label: '2. Problem & Objective', icon: Sparkles },
    { id: 'team', label: '3. Team', icon: Users },
    { id: 'research', label: '4. Research & Methodology', icon: FileText },
    { id: 'milestones', label: '5. Progress & Milestones', icon: CheckCircle2 },
    { id: 'prototype', label: '6. Prototype & Testing', icon: Cpu },
    { id: 'industry', label: '7. Industry Collaboration', icon: Handshake },
    { id: 'pilot', label: '8. Pilot & Readiness', icon: Compass },
    { id: 'impact', label: '9. Impact & Outcomes', icon: BarChart3 },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 1100,
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
          maxWidth: '1080px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.65)',
          overflow: 'hidden',
          animation: 'scaleUp 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: '0.8125rem', fontWeight: 900, color: 'var(--accent-indigo)' }}>
              {project.id}
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
              Stage {project.current_stage}/4: {stageName}
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '0.15rem 0.55rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: perspective === 'nodal' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: perspective === 'nodal' ? 'var(--accent-indigo)' : 'var(--accent-amber)',
              }}
            >
              Viewing as: {perspective === 'nodal' ? 'HEI Nodal Officer' : 'Faculty Research Lead'}
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '0.15rem 0.55rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: project.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                color: project.status === 'completed' ? '#10b981' : '#38bdf8',
              }}
            >
              ● {project.status.toUpperCase()}
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

        {/* Section Navigation Pills */}
        <div
          style={{
            padding: '0.6rem 1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            overflowX: 'auto',
          }}
        >
          {sections.map((sec) => {
            const isActive = activeSection === sec.id;
            const Icon = sec.icon;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                style={{
                  padding: '0.35rem 0.7rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isActive ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                  color: isActive ? 'var(--accent-indigo)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid transparent',
                  fontSize: '0.75rem',
                  fontWeight: isActive ? 800 : 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={13} />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {/* SECTION 1: OVERVIEW */}
          {activeSection === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                }}
              >
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Project Executive Summary
                </span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.35rem', marginBottom: '0.5rem' }}>
                  {project.title}
                </h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {project.abstract || 'Structured university capstone research project tackling real-world civic challenges through engineering prototyping, laboratory validation, and field pilots.'}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                  <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Faculty Supervisor</span>
                    <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--accent-indigo)', marginTop: '0.2rem' }}>
                      {project.faculty_lead}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{project.department}</span>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Student Team</span>
                    <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                      {project.student_team?.length || 3} Verified Researchers
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#10b981' }}>APAAR Digitally Linked</span>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>CSR Funding Pledged</span>
                    <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#10b981', marginTop: '0.2rem' }}>
                      ₹{((project.funding_pledged || 275000) / 1000).toLocaleString('en-IN')} K
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Corporate Grant</span>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Logged Research Hours</span>
                    <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '0.2rem' }}>
                      {project.total_research_hours || 185} Hours
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#10b981' }}>NEP Experiential Credits</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.78125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Project Stage Progress
                  </span>
                  <span style={{ fontSize: '0.78125rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>
                    Stage {project.current_stage}/4 ({stageName})
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${(project.current_stage / 4) * 100}%`,
                      height: '100%',
                      backgroundColor: project.current_stage >= 4 ? '#10b981' : 'var(--accent-indigo)',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: PROBLEM & OBJECTIVE */}
          {activeSection === 'problem' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.2rem' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Civic Origin & Real-World Problem Statement
                </span>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.5, marginTop: '0.4rem' }}>
                  Persistent urban waterlogging and asphalt erosion along Old Hazaribagh Road. Conventional municipal localized patching failed because sub-surface clay compaction prevented vertical percolation, creating hydraulic uplift during cloudbursts.
                </p>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  Report Code: <strong>REP-7429</strong> • Ward: <strong>Ward 14, Old Hazaribagh Road</strong> • Priority: <strong>CRITICAL (88/100)</strong>
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: 'var(--radius-md)', padding: '1.2rem' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--accent-indigo)', textTransform: 'uppercase' }}>
                  Engineering Research Objective
                </span>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '0.4rem' }}>
                  Develop a modular subterranean bio-retention chamber using porous geopolymer concrete embedded with automated solar LoRa siphon valves to relieve localized hydrostatic head pressure within 30 minutes of peak rainfall.
                </p>
              </div>
            </div>
          )}

          {/* SECTION 3: TEAM */}
          {activeSection === 'team' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.2rem' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Faculty Research Supervisor
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      {project.faculty_lead}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      {project.department} • BIT Mesra
                    </div>
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10b981', padding: '0.15rem 0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.12)', borderRadius: 'var(--radius-full)' }}>
                    Principal Investigator
                  </span>
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.2rem' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Verified Student Research Team
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
                  {(project.student_team || []).map((stu, i) => (
                    <div
                      key={i}
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.85rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {stu.name}
                        </span>
                        <span className="mono" style={{ fontSize: '0.6875rem', color: '#10b981', fontWeight: 700 }}>
                          {stu.apaarId || 'APAAR-JH-9920-4412'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        ID: {stu.studentId || 'BTECH/CE/2022/045'} • Lead Researcher
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: RESEARCH & METHODOLOGY */}
          {activeSection === 'research' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.2rem' }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Hypothesis & Technical Approach
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Integrating modular permeable sub-base with solar-powered siphon drains accelerates stormwater dissipation rate by over 60%, preventing pavement subgrade liquefaction.
                </p>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.2rem' }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Experimental Phases
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <div>• <strong>Phase 1 (Feasibility):</strong> 3D hydrodynamic modeling and soil core laboratory extraction.</div>
                  <div>• <strong>Phase 2 (Simulation):</strong> Computational fluid dynamics (CFD) flume validation at 40 L/min flow rate.</div>
                  <div>• <strong>Phase 3 (Prototype):</strong> Fabrication of 1:1 scale permeable geopolymer test chamber with LoRa pressure beacon.</div>
                  <div>• <strong>Phase 4 (Pilot):</strong> 120-meter live arterial deployment in Ward 14 during monsoon season.</div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: PROGRESS & MILESTONES */}
          {activeSection === 'milestones' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(project.milestones || []).map((ms) => (
                <div
                  key={ms.id}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor:
                            ms.status === 'completed'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : ms.status === 'in_progress'
                              ? 'rgba(56, 189, 248, 0.15)'
                              : 'rgba(255, 255, 255, 0.08)',
                          color:
                            ms.status === 'completed'
                              ? '#10b981'
                              : ms.status === 'in_progress'
                              ? '#38bdf8'
                              : 'var(--text-muted)',
                        }}
                      >
                        ● {ms.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {ms.title}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0 }}>
                      {ms.description}
                    </p>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      Stage: {ms.stage_index}/4 • Logged Hours: <strong>{ms.research_hours || 40} hrs</strong>
                    </div>
                  </div>

                  {onUpdateMilestone && (
                    <button
                      type="button"
                      onClick={() => onUpdateMilestone(project, ms)}
                      className="btn btn-secondary btn-xs"
                      style={{ fontSize: '0.75rem' }}
                    >
                      Update Deliverable
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* SECTION 6: PROTOTYPE & TESTING */}
          {activeSection === 'prototype' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {matchedPrototype.prototypeName} ({matchedPrototype.version})
                  </h3>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10b981', padding: '0.15rem 0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.12)', borderRadius: 'var(--radius-full)' }}>
                    Bench Tested & Validated
                  </span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.35rem', margin: 0 }}>
                  {matchedPrototype.description}
                </p>
              </div>

              {/* Bench Test Matrix */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.2rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Bench Testing Results & Thresholds
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.65rem' }}>
                  {matchedPrototype.testResults.map((t, idx) => (
                    <div key={idx} style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78125rem' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{t.metric}</span>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Target: {t.target}</span>
                        <span style={{ color: '#10b981', fontWeight: 800 }}>Achieved: {t.achieved} ✓</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: INDUSTRY COLLABORATION */}
          {activeSection === 'industry' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.2rem' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Corporate CSR Partner
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.35rem', marginBottom: '0.2rem' }}>
                  {matchedIndustry.corporateName}
                </h3>
                <div style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)' }}>
                  CSR Grant: <strong style={{ color: '#10b981' }}>₹{(matchedIndustry.pledgeAmount || 350000).toLocaleString('en-IN')}</strong> • Escrow Status: <strong style={{ color: 'var(--accent-indigo)' }}>{matchedIndustry.escrowStatus.toUpperCase()}</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Industry Mentors: {matchedIndustry.mentorName || 'Lead Technologist'} ({matchedIndustry.mentorTitle || 'Senior Director'})
                </div>
              </div>
            </div>
          )}

          {/* SECTION 8: PILOT / PILOT READINESS */}
          {activeSection === 'pilot' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  backgroundColor: readinessResult.status === 'READY' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                  border: `1px solid ${readinessResult.status === 'READY' ? '#10b981' : 'var(--accent-amber)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Automated 5-Factor Pilot Readiness Evaluation
                  </span>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: readinessResult.status === 'READY' ? '#10b981' : 'var(--accent-amber)', marginTop: '0.2rem' }}>
                    Status: {readinessResult.status} ({readinessResult.score}/100)
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '0.3rem 0.8rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: readinessResult.status === 'READY' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: readinessResult.status === 'READY' ? '#10b981' : 'var(--accent-amber)',
                  }}
                >
                  {readinessResult.status === 'READY' ? '✓ All NOCs & Hardware Verified' : '⚠️ Field Permissions Pending'}
                </span>
              </div>
            </div>
          )}

          {/* SECTION 9: IMPACT & OUTCOMES */}
          {activeSection === 'impact' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.2rem' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Empirical Before-and-After Civic Measurement
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
                  {matchedImpact.percentageImprovement.map((pct: { label: string; changePct: number }, idx: number) => (
                    <div key={idx} style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{pct.label}</span>
                      <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#10b981', marginTop: '0.15rem' }}>
                        {pct.changePct > 0 ? `+${pct.changePct}%` : `${pct.changePct}%`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {onIssueNEPCertificate && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => onIssueNEPCertificate(project)}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}
                  >
                    <Award size={14} />
                    <span>Issue NEP 2020 Student Experiential Certificate</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
