import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Building2,
  GraduationCap,
} from 'lucide-react';
import { useGlobalStore } from '../../store/globalStore';
import type { StoredReport, HEIChallenge, HEIProject, ProjectMilestone, NEPCreditRecord } from '../../types';
import { HEISidebar, type HEITab } from './HEISidebar';
import { HEIOverviewTab } from './tabs/HEIOverviewTab';
import { HEIChallengesTab } from './tabs/HEIChallengesTab';
import { HEIEvaluationTab } from './tabs/HEIEvaluationTab';
import { HEICapabilitiesTab } from './tabs/HEICapabilitiesTab';
import { HEIFacultyTeamsTab } from './tabs/HEIFacultyTeamsTab';
import { HEIProposalsTab } from './tabs/HEIProposalsTab';
import { HEIActiveProjectsTab } from './tabs/HEIActiveProjectsTab';
import { HEIMilestonesTab } from './tabs/HEIMilestonesTab';
import { HEIPrototypeTab } from './tabs/HEIPrototypeTab';
import { HEIIndustryTab } from './tabs/HEIIndustryTab';
import { HEIPilotsTab } from './tabs/HEIPilotsTab';
import { HEIImpactTab } from './tabs/HEIImpactTab';
import { HEIChallengeDetailModal } from './HEIChallengeDetailModal';
import { HEIProposalModal } from './HEIProposalModal';
import { ClaimChallengeModal } from './ClaimChallengeModal';
import { MilestoneUpdateModal } from './MilestoneUpdateModal';
import { NEPCertificateModal } from './NEPCertificateModal';
import {
  ACTIVE_INSTITUTION,
  SEED_FACULTY,
  SEED_STUDENT_RESEARCHERS,
  SEED_EVALUATED_CHALLENGES,
  SEED_PROPOSALS,
  SEED_PROTOTYPES,
  SEED_INDUSTRY_COLLABS,
  SEED_IMPACT_OUTCOMES,
  type ResearchProposal,
  type PrototypeRecord,
  type ImpactOutcomeRecord,
  type EvaluatedChallenge,
  type FacultyMember,
  type StudentResearcher,
  type FeasibilityDecision,
} from './heiDataModel';

export type HEIPerspective = 'nodal' | 'faculty';

export const InstitutionDashboard: React.FC = () => {
  const {
    reports,
    heiChallenges,
    heiProjects,
    nepCredits,
    claimChallenge,
    updateMilestone,
    generateNEPCertificate,
    refreshAll,
    isLoading,
  } = useGlobalStore();

  const [activeTab, setActiveTab] = useState<HEITab>('overview');
  const [activePerspective, setActivePerspective] = useState<HEIPerspective>('nodal');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Prototype state lists
  const [evaluatedChallenges, setEvaluatedChallenges] = useState<EvaluatedChallenge[]>(SEED_EVALUATED_CHALLENGES);
  const [proposals, setProposals] = useState<ResearchProposal[]>(SEED_PROPOSALS);
  const [prototypes] = useState<PrototypeRecord[]>(SEED_PROTOTYPES);
  const [impactRecords] = useState<ImpactOutcomeRecord[]>(SEED_IMPACT_OUTCOMES);

  // Modals state
  const [selectedChallengeForDetail, setSelectedChallengeForDetail] = useState<StoredReport | HEIChallenge | null>(null);
  const [claimTargetChallenge, setClaimTargetChallenge] = useState<HEIChallenge | null>(null);
  const [proposalTargetChallenge, setProposalTargetChallenge] = useState<HEIChallenge | null>(null);
  const [isNewProposalModalOpen, setIsNewProposalModalOpen] = useState(false);
  const [milestoneTarget, setMilestoneTarget] = useState<{ project: HEIProject; milestone: ProjectMilestone } | null>(null);
  const [viewCertificate, setViewCertificate] = useState<NEPCreditRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handlers for Nodal & Faculty Workflows
  const handleAcceptEvaluation = (
    challenge: HEIChallenge,
    assignedDept: string = 'Civil & Environmental Engineering',
    faculty: FacultyMember = SEED_FACULTY[0]
  ) => {
    const newEvaluated: EvaluatedChallenge = {
      id: `eval_${Date.now().toString(36)}`,
      challengeId: challenge.id,
      reportCode: challenge.report_code || challenge.id,
      title: challenge.title,
      category: challenge.category,
      ward: challenge.ward,
      status: 'FACULTY_EVALUATION',
      nodalDecision: {
        decision: 'ACCEPTED',
        acceptedAt: new Date().toISOString(),
        assignedDepartment: assignedDept,
        assignedFaculty: faculty,
      },
      facultyEvaluation: {
        feasibility: 'FEASIBLE',
        technicalNotes: `Routed by Nodal Officer to ${faculty.name} (${assignedDept}). Initial feasibility evaluation in progress.`,
        evaluatedAt: new Date().toISOString(),
        requiredResources: ['Prototyping Facility', 'Sensor Mesh Test Kit'],
      },
      teamFormation: {
        teamStatus: 'Forming',
        facultyLead: faculty,
        studentMembers: [SEED_STUDENT_RESEARCHERS[0]],
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setEvaluatedChallenges([newEvaluated, ...evaluatedChallenges]);
    showToast(`Challenge ${challenge.report_code || challenge.id} accepted by Nodal Officer and routed to ${faculty.name}.`);
    setActiveTab('evaluation');
  };

  const handleDeclineChallenge = (challenge: HEIChallenge, reason?: string) => {
    showToast(`Challenge ${challenge.report_code || challenge.id} declined: ${reason || 'Capacity constraint recorded.'}`);
  };

  const handleUpdateFeasibility = (challengeId: string, decision: FeasibilityDecision, notes: string) => {
    setEvaluatedChallenges(
      evaluatedChallenges.map((ec) =>
        ec.id === challengeId
          ? {
              ...ec,
              status: decision === 'FEASIBLE' ? 'TEAM_FORMING' : ec.status,
              facultyEvaluation: {
                feasibility: decision,
                technicalNotes: notes,
                evaluatedAt: new Date().toISOString(),
                requiredResources: ec.facultyEvaluation?.requiredResources || [],
              },
            }
          : ec
      )
    );
    showToast(`Faculty feasibility updated: ${decision.replace(/_/g, ' ')}`);
  };

  const handleAddStudentToTeam = (challengeId: string, student: StudentResearcher) => {
    setEvaluatedChallenges(
      evaluatedChallenges.map((ec) => {
        if (ec.id !== challengeId) return ec;
        const currentMembers = ec.teamFormation?.studentMembers || [];
        if (currentMembers.some((s) => s.id === student.id)) {
          return ec;
        }
        return {
          ...ec,
          teamFormation: {
            teamStatus: 'Active',
            facultyLead: ec.nodalDecision.assignedFaculty,
            studentMembers: [...currentMembers, student],
          },
        };
      })
    );
    showToast(`Student researcher ${student.name} (${student.apaarId}) added to research team.`);
  };

  const handleDraftProposal = (challenge: HEIChallenge | EvaluatedChallenge) => {
    const heiChal: HEIChallenge = 'report_id' in challenge ? (challenge as HEIChallenge) : {
      id: challenge.id,
      report_id: challenge.challengeId,
      report_code: challenge.reportCode,
      title: challenge.title,
      description: '',
      category: challenge.category,
      severity: 'high',
      ward: challenge.ward,
      department_match: (challenge as EvaluatedChallenge).nodalDecision?.assignedDepartment || 'Civil Engineering',
      match_percentage: 92,
      status: 'open',
      escalated_by: 'Nodal Officer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setProposalTargetChallenge(heiChal);
    setIsNewProposalModalOpen(true);
  };

  const handleProposalSubmit = (newProposal: ResearchProposal) => {
    setProposals([newProposal, ...proposals]);
    showToast(`Research Proposal "${newProposal.title}" submitted to Faculty Board.`);
    setActiveTab('proposals');
  };

  const handleIssueNEPCertificate = async (project: HEIProject) => {
    const student = project.student_team?.[0] || {
      name: 'Rohit Kumar Murmu',
      studentId: 'BTECH/CE/2022/045',
      apaarId: 'APAAR-JH-9920-4412',
    };

    const cert = await generateNEPCertificate({
      studentName: student.name,
      studentId: student.studentId,
      apaarId: student.apaarId,
      institutionName: project.institution_name || 'BIT Mesra',
      projectId: project.id,
      researchHours: 40,
      fieldHours: 15,
    });

    if (cert) {
      setViewCertificate(cert);
      showToast(`NEP 2020 Credit Certificate generated for ${student.name}.`);
    } else {
      const fallbackCert: NEPCreditRecord = {
        id: `nep_${Date.now()}`,
        student_name: student.name,
        student_id: student.studentId,
        apaar_id: student.apaarId,
        institution_name: project.institution_name || 'BIT Mesra',
        project_id: project.id,
        project_title: project.title,
        research_hours: 45,
        field_hours: 20,
        credits_awarded: 4,
        verification_hash: '0x8f9c12b7a4d3e892c551029487b1c3e5',
        certificate_issued_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      setViewCertificate(fallbackCert);
      showToast(`NEP 2020 Credit Certificate generated for ${student.name}.`);
    }
  };

  const counts = {
    matchedChallenges: heiChallenges.length,
    underEvaluation: evaluatedChallenges.length,
    activeProjects: heiProjects.length,
    pendingProposals: proposals.filter((p) => p.status === 'submitted' || p.status === 'under_evaluation').length,
    activePilots: 2,
    completedImpact: impactRecords.length,
  };

  return (
    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', position: 'relative', width: '100%' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 2000,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--accent-indigo)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.4rem',
            fontSize: '0.875rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            animation: 'slideUp 0.2s ease-out',
          }}
        >
          <Sparkles size={17} color="var(--accent-indigo)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Left Sidebar Navigation */}
      <HEISidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        counts={counts}
      />

      {/* 2. Main Content Area */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Top Perspective Switcher & Sync Status Bar */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.85rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          {/* Active Perspective Toggle (Nodal Officer vs Faculty Lead) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Active Perspective:
            </span>
            <div
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                padding: '0.2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <button
                type="button"
                onClick={() => setActivePerspective('nodal')}
                style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: activePerspective === 'nodal' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  color: activePerspective === 'nodal' ? 'var(--accent-indigo)' : 'var(--text-secondary)',
                  border: activePerspective === 'nodal' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Building2 size={13} />
                <span>Nodal Officer / Innovation Cell</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePerspective('faculty')}
                style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: activePerspective === 'faculty' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                  color: activePerspective === 'faculty' ? 'var(--accent-amber)' : 'var(--text-secondary)',
                  border: activePerspective === 'faculty' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <GraduationCap size={13} />
                <span>Faculty / Research Lead</span>
              </button>
            </div>
          </div>

          {/* Sync Button */}
          <button
            type="button"
            onClick={() => refreshAll()}
            className="btn btn-secondary btn-sm"
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78125rem' }}
          >
            <RefreshCw size={13} className={isLoading ? 'spin' : ''} />
            <span>Sync R&D State</span>
          </button>
        </div>

        {/* Perspective Banner Hint */}
        <div
          style={{
            padding: '0.6rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: activePerspective === 'nodal' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(245, 158, 11, 0.08)',
            border: `1px solid ${activePerspective === 'nodal' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>
            {activePerspective === 'nodal' ? (
              <>
                <strong style={{ color: 'var(--accent-indigo)' }}>[Nodal Officer Mode]: </strong>
                Reviewing incoming matched challenges, checking institutional capabilities, accepting/declining evaluations, and routing to departments.
              </>
            ) : (
              <>
                <strong style={{ color: 'var(--accent-amber)' }}>[Faculty & Research Lead Mode]: </strong>
                Evaluating technical feasibility, assembling student research teams (with APAAR IDs), preparing proposals, and updating project deliverables.
              </>
            )}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>BIT Mesra Node</span>
        </div>

        {/* Render Tab Content */}
        {activeTab === 'overview' && (
          <HEIOverviewTab
            reports={reports}
            heiChallenges={heiChallenges}
            evaluatedChallenges={evaluatedChallenges}
            heiProjects={heiProjects}
            proposals={proposals}
            prototypes={prototypes}
            impactRecords={impactRecords}
            activeInstitution={ACTIVE_INSTITUTION}
            onOpenChallengeDetail={setSelectedChallengeForDetail}
            onNavigateTab={setActiveTab}
            onDeclineChallenge={handleDeclineChallenge}
          />
        )}

        {activeTab === 'challenges' && (
          <HEIChallengesTab
            challenges={heiChallenges}
            reports={reports}
            onOpenChallengeDetail={setSelectedChallengeForDetail}
            onAcceptEvaluation={handleAcceptEvaluation}
            onDeclineChallenge={handleDeclineChallenge}
            onDraftProposal={handleDraftProposal}
          />
        )}

        {activeTab === 'evaluation' && (
          <HEIEvaluationTab
            evaluatedChallenges={evaluatedChallenges}
            onUpdateFeasibility={handleUpdateFeasibility}
            onAddStudentToTeam={handleAddStudentToTeam}
            onDraftProposal={handleDraftProposal}
          />
        )}

        {activeTab === 'capabilities' && (
          <HEICapabilitiesTab activeInstitution={ACTIVE_INSTITUTION} />
        )}

        {activeTab === 'faculty_teams' && (
          <HEIFacultyTeamsTab
            facultyList={SEED_FACULTY}
            studentList={SEED_STUDENT_RESEARCHERS}
          />
        )}

        {activeTab === 'proposals' && (
          <HEIProposalsTab
            proposals={proposals}
            onOpenNewProposalModal={() => {
              setProposalTargetChallenge(null);
              setIsNewProposalModalOpen(true);
            }}
          />
        )}

        {activeTab === 'projects' && (
          <HEIActiveProjectsTab
            projects={heiProjects}
            onOpenMilestoneModal={(project, milestone) => setMilestoneTarget({ project, milestone })}
            onOpenNEPCertificateModal={handleIssueNEPCertificate}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'milestones' && (
          <HEIMilestonesTab
            projects={heiProjects}
            onOpenMilestoneModal={(project, milestone) => setMilestoneTarget({ project, milestone })}
          />
        )}

        {activeTab === 'prototype' && (
          <HEIPrototypeTab prototypes={prototypes} />
        )}

        {activeTab === 'industry' && (
          <HEIIndustryTab industryCollabs={SEED_INDUSTRY_COLLABS} />
        )}

        {activeTab === 'pilots' && (
          <HEIPilotsTab pilots={SEED_IMPACT_OUTCOMES.map((o) => ({
            id: `pilot_${o.id}`,
            title: o.projectTitle,
            domain: o.domain,
            district: o.district,
            community: o.communityLocation,
            leadInstitution: 'BIT Mesra',
            durationMonths: o.pilotDurationMonths,
            currentMonth: o.pilotDurationMonths,
            devicesDeployed: 4,
            householdsBenefited: o.benefitedHouseholds,
            status: 'active',
            technicalPerformance: 94,
            problemReductionPct: Math.abs(o.percentageImprovement[0]?.changePct || 85),
            communitySatisfactionPct: Math.round(o.citizenVerificationRating * 20),
            keyMetricName: o.beforeMetrics[0]?.metricName || 'Primary Problem Index',
            keyMetricValue: o.afterMetrics[0]?.value || '4.2',
            keyMetricBaseline: o.beforeMetrics[0]?.value || '48.5',
            notes: o.citizenFeedbackSummary,
            deploymentDate: o.completedDate,
          }))} />
        )}

        {activeTab === 'impact' && (
          <HEIImpactTab
            impactRecords={impactRecords}
            nepCredits={nepCredits}
          />
        )}
      </main>

      {/* 3. Modals */}
      {selectedChallengeForDetail && (
        <HEIChallengeDetailModal
          challenge={selectedChallengeForDetail}
          activeInstitution={ACTIVE_INSTITUTION}
          onClose={() => setSelectedChallengeForDetail(null)}
          onAcceptEvaluation={handleAcceptEvaluation}
          onDeclineChallenge={handleDeclineChallenge}
          onDraftProposal={handleDraftProposal}
        />
      )}

      {claimTargetChallenge && (
        <ClaimChallengeModal
          challenge={claimTargetChallenge}
          onClose={() => setClaimTargetChallenge(null)}
          onClaim={claimChallenge}
          onShowToast={showToast}
        />
      )}

      {isNewProposalModalOpen && (
        <HEIProposalModal
          challenge={proposalTargetChallenge}
          onClose={() => {
            setIsNewProposalModalOpen(false);
            setProposalTargetChallenge(null);
          }}
          onSubmitProposal={handleProposalSubmit}
        />
      )}

      {milestoneTarget && (
        <MilestoneUpdateModal
          project={milestoneTarget.project}
          milestone={milestoneTarget.milestone}
          onClose={() => setMilestoneTarget(null)}
          onUpdateMilestone={updateMilestone}
          onShowToast={showToast}
        />
      )}

      {viewCertificate && (
        <NEPCertificateModal
          credit={viewCertificate}
          onClose={() => setViewCertificate(null)}
        />
      )}
    </div>
  );
};
