import React from 'react';
import {
  Sparkles,
  FolderGit2,
  FileText,
  Cpu,
  Compass,
  BarChart3,
  ArrowRight,
  MapPin,
  Building2,
  Award,
  Users,
  FlaskConical,
} from 'lucide-react';
import type { StoredReport, HEIChallenge, HEIProject } from '../../../types';
import type {
  HEIProfile,
  ResearchProposal,
  PrototypeRecord,
  ImpactOutcomeRecord,
  EvaluatedChallenge,
} from '../heiDataModel';

interface HEIOverviewTabProps {
  reports: StoredReport[];
  heiChallenges: HEIChallenge[];
  evaluatedChallenges: EvaluatedChallenge[];
  heiProjects: HEIProject[];
  proposals: ResearchProposal[];
  prototypes: PrototypeRecord[];
  impactRecords: ImpactOutcomeRecord[];
  activeInstitution: HEIProfile;
  onOpenChallengeDetail: (challenge: StoredReport | HEIChallenge) => void;
  onNavigateTab: (tab: any) => void;
  onDeclineChallenge: (challenge: HEIChallenge) => void;
}

export const HEIOverviewTab: React.FC<HEIOverviewTabProps> = ({
  reports,
  heiChallenges,
  evaluatedChallenges,
  heiProjects,
  proposals,
  prototypes,
  impactRecords,
  activeInstitution,
  onOpenChallengeDetail,
  onNavigateTab,
  onDeclineChallenge,
}) => {
  // Derive counts across all pipeline stages
  const matchedChallengesCount = heiChallenges.length || reports.filter((r) => r.is_escalated_to_hei || r.ai_analysis?.structured_output?.innovation_required).length || 4;
  const awaitingReviewChallenges = heiChallenges.filter((c) => c.status === 'open');
  const underEvaluationCount = evaluatedChallenges.length;
  const teamFormingCount = evaluatedChallenges.filter((e) => e.status === 'TEAM_FORMING').length || 1;
  const pendingProposalsCount = proposals.filter((p) => p.status === 'submitted' || p.status === 'under_evaluation').length || 1;
  const activeProjectsCount = heiProjects.filter((p) => p.status === 'active' || p.status === 'pilot_ready').length || 2;
  const prototypeCount = prototypes.length || 2;
  const activePilotsCount = heiProjects.filter((p) => p.status === 'pilot_ready' || p.status === 'deployed').length || 2;
  const completedImpactCount = impactRecords.length || 2;

  const totalResearchHours = heiProjects.reduce((acc, p) => acc + (p.total_research_hours || 0), 0) + 410;
  const totalFundingPledged = heiProjects.reduce((acc, p) => acc + (p.funding_pledged || 0), 0) + 550000;

  const pipelineStages = [
    { label: 'Awaiting HEI Review', count: awaitingReviewChallenges.length, tab: 'challenges', color: 'var(--accent-indigo)', icon: Sparkles },
    { label: 'Faculty Evaluation', count: underEvaluationCount, tab: 'evaluation', color: 'var(--accent-amber)', icon: FlaskConical },
    { label: 'Team Formation', count: teamFormingCount, tab: 'evaluation', color: '#38bdf8', icon: Users },
    { label: 'Proposal Stage', count: pendingProposalsCount, tab: 'proposals', color: 'var(--accent-amber)', icon: FileText },
    { label: 'Active Projects', count: activeProjectsCount, tab: 'projects', color: '#10b981', icon: FolderGit2 },
    { label: 'Prototypes Built', count: prototypeCount, tab: 'prototype', color: '#818cf8', icon: Cpu },
    { label: 'Community Pilots', count: activePilotsCount, tab: 'pilots', color: '#38bdf8', icon: Compass },
    { label: 'Impact Measured', count: completedImpactCount, tab: 'impact', color: '#10b981', icon: BarChart3 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(245, 158, 11, 0.08) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
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
              backgroundColor: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              color: 'var(--accent-indigo)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Building2 size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {activeInstitution.name}
              </h2>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                }}
              >
                ● NEP 2020 Accredited R&D Partner
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0 }}>
              Location: <strong>{activeInstitution.location}, {activeInstitution.state}</strong> • Departments: <strong>{activeInstitution.departments.length}</strong> • Active Capstones: <strong>{activeProjectsCount}</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={() => onNavigateTab('challenges')}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}
          >
            <Sparkles size={14} />
            <span>Review Matched Challenges ({matchedChallengesCount})</span>
          </button>
        </div>
      </div>

      {/* 2. END-TO-END INNOVATION PIPELINE FUNNEL */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={16} color="var(--accent-indigo)" />
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Institutional Innovation & Research Pipeline Funnel
            </h3>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Click any stage to view workspace</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '0.6rem',
          }}
        >
          {pipelineStages.map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <div
                key={idx}
                onClick={() => onNavigateTab(stage.tab)}
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 0.65rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.3rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = stage.color;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Icon size={14} color={stage.color} />
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Step {idx + 1}</span>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: stage.color }}>
                  {stage.count}
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {stage.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. PRIORITY SECTION — AWAITING HEI NODAL REVIEW */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-medium)',
          padding: '1.25rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-amber)',
              }}
            />
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Incoming Matched Challenges (Awaiting Nodal Review)
            </h3>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '0.15rem 0.5rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--accent-amber)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              Action Required
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('challenges')}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.78125rem', color: 'var(--accent-indigo)' }}
          >
            <span>View All Matched Challenges</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {heiChallenges.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No new challenges currently awaiting evaluation.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {heiChallenges.slice(0, 3).map((chal) => (
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
                  transition: 'border-color 0.15s ease',
                }}
              >
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>
                      {chal.report_code || chal.id}
                    </span>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'rgba(99, 102, 241, 0.12)',
                        color: 'var(--accent-indigo)',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                      }}
                    >
                      {chal.category}
                    </span>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                      }}
                    >
                      {chal.match_percentage || 92}% Match ({chal.department_match})
                    </span>
                  </div>

                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.35rem', marginBottom: '0.2rem' }}>
                    {chal.title}
                  </h4>

                  <p style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                    {chal.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.45rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin size={12} />
                      {chal.ward || chal.address || 'Urban Sector'}
                    </span>
                    <span>•</span>
                    <span>Status: <strong style={{ color: chal.status === 'open' ? 'var(--accent-amber)' : '#10b981' }}>{chal.status.toUpperCase()}</strong></span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => onOpenChallengeDetail(chal)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.78125rem' }}
                  >
                    Review Problem Genome
                  </button>

                  {chal.status === 'open' && (
                    <>
                      <button
                        type="button"
                        onClick={() => onOpenChallengeDetail(chal)}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.78125rem' }}
                      >
                        Accept & Assign Faculty
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeclineChallenge(chal)}
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}
                      >
                        Decline
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Active Projects & Capability Telemetry Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {/* Active Projects Quick View */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-medium)',
            padding: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FolderGit2 size={16} color="#10b981" />
              Active Capstone & R&D Projects
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('projects')}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.75rem', color: 'var(--accent-indigo)' }}
            >
              All Projects ({heiProjects.length})
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {heiProjects.map((p) => (
              <div
                key={p.id}
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {p.title}
                  </span>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      color: p.status === 'completed' ? '#10b981' : 'var(--accent-indigo)',
                    }}
                  >
                    Stage {p.current_stage}/4
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Lead: {p.faculty_lead} ({p.department}) • Team: {p.student_team?.length || 3} Students
                </div>
                {/* Stage Progress Bar */}
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
        </div>

        {/* Institutional R&D Capacity & NEP Metrics */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-medium)',
            padding: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Award size={16} color="var(--accent-indigo)" />
              NEP 2020 Institutional Output
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>FY 2025-26</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Research Hours</span>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--accent-indigo)', marginTop: '0.2rem' }}>
                {totalResearchHours} hrs
              </div>
              <span style={{ fontSize: '0.65rem', color: '#10b981' }}>+48 hrs this week</span>
            </div>

            <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>CSR Grants Pledged</span>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#10b981', marginTop: '0.2rem' }}>
                ₹{(totalFundingPledged / 100000).toFixed(1)} Lakhs
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Tata Steel & Schneider</span>
            </div>

            <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Faculty Mentors</span>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                4 Leads
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Civil, ECE, CS & Biotech</span>
            </div>

            <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>NEP Academic Credits</span>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--accent-amber)', marginTop: '0.2rem' }}>
                28 Credits
              </div>
              <span style={{ fontSize: '0.65rem', color: '#10b981' }}>APAAR Digitally Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
