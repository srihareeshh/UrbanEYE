import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Building2,
  GraduationCap,
} from 'lucide-react';
import { useGlobalStore } from '../../store/globalStore';
import type { StoredReport, HEIChallenge, HEIProject, ProjectMilestone, NEPCreditRecord } from '../../types';
import { HEISidebar, type HEISidebarTab } from './HEISidebar';
import { HEIOverviewTab } from './tabs/HEIOverviewTab';
import { HEIChallengesTab } from './tabs/HEIChallengesTab';
import { HEIAcceptedAssignmentTab } from './tabs/HEIAcceptedAssignmentTab';
import { HEIProposalsTab } from './tabs/HEIProposalsTab';
import { HEIActiveProjectsTab } from './tabs/HEIActiveProjectsTab';
import { HEICapabilitiesTab } from './tabs/HEICapabilitiesTab';
import { HEIAnalyticsTab } from './tabs/HEIAnalyticsTab';
import { HEIFacultyWorkbenchTab } from './tabs/HEIFacultyWorkbenchTab';
import { HEIFacultyAssignedChallengesTab } from './tabs/HEIFacultyAssignedChallengesTab';
import { HEIFeasibilityTab } from './tabs/HEIFeasibilityTab';
import { HEIResearchTeamsTab } from './tabs/HEIResearchTeamsTab';
import { HEIFacultyProjectsTab } from './tabs/HEIFacultyProjectsTab';
import { ProjectDetailModal } from './ProjectDetailModal';
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
  SEED_IMPACT_OUTCOMES,
  type ResearchProposal,
  type EvaluatedChallenge,
  type FacultyMember,
  type StudentResearcher,
  type FeasibilityDecision,
  type HEIPerspective,
} from './heiDataModel';

export const InstitutionDashboard: React.FC = () => {
  const {
    reports,
    heiChallenges,
    heiProjects,
    claimChallenge,
    updateMilestone,
    generateNEPCertificate,
    refreshAll,
    isLoading,
  } = useGlobalStore();

  // Perspective & Navigation State
  const [perspective, setPerspective] = useState<HEIPerspective>('nodal');
  const [activeFacultyId, setActiveFacultyId] = useState<string>(SEED_FACULTY[0].id);
  const [activeTab, setActiveTab] = useState<HEISidebarTab>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Prototype Data Lists
  const [evaluatedChallenges, setEvaluatedChallenges] = useState<EvaluatedChallenge[]>(SEED_EVALUATED_CHALLENGES);
  const [proposals, setProposals] = useState<ResearchProposal[]>(SEED_PROPOSALS);

  // Modals State
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<HEIProject | null>(null);
  const [selectedChallengeForDetail, setSelectedChallengeForDetail] = useState<StoredReport | HEIChallenge | null>(null);
  const [claimTargetChallenge, setClaimTargetChallenge] = useState<HEIChallenge | null>(null);
  const [proposalTargetChallenge, setProposalTargetChallenge] = useState<HEIChallenge | null>(null);
  const [isNewProposalModalOpen, setIsNewProposalModalOpen] = useState(false);
  const [milestoneTarget, setMilestoneTarget] = useState<{ project: HEIProject; milestone: ProjectMilestone } | null>(null);
  const [viewCertificate, setViewCertificate] = useState<NEPCreditRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeFaculty = SEED_FACULTY.find((f) => f.id === activeFacultyId) || SEED_FACULTY[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Role Switcher Handler
  const handlePerspectiveChange = (newPerspective: HEIPerspective) => {
    setPerspective(newPerspective);
    if (newPerspective === 'nodal') {
      setActiveTab('overview');
    } else {
      setActiveTab('workbench');
    }
    showToast(`Switched to ${newPerspective === 'nodal' ? 'HEI Nodal Officer (Institution-Wide)' : 'Faculty Research Lead'} Perspective`);
  };

  // Nodal Handlers
  const handleAcceptEvaluation = (
    challenge: HEIChallenge,
    assignedDept: string = ACTIVE_INSTITUTION.departments[0],
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
        technicalNotes: `Accepted by Nodal Officer and routed to ${faculty.name} (${assignedDept}).`,
        evaluatedAt: new Date().toISOString(),
        requiredResources: ['Prototyping Workshop', 'Sensor Mesh Test Kit'],
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
    if (perspective === 'nodal') {
      setActiveTab('accepted_assignment');
    }
  };

  const handleDeclineChallenge = (challenge: HEIChallenge, reason?: string) => {
    showToast(`Challenge ${challenge.report_code || challenge.id} declined: ${reason || 'Capacity constraint recorded.'}`);
  };

  const handleAssignFaculty = (challengeId: string, assignedDept: string, faculty: FacultyMember) => {
    setEvaluatedChallenges(
      evaluatedChallenges.map((ec) =>
        ec.id === challengeId
          ? {
              ...ec,
              status: 'FACULTY_EVALUATION',
              nodalDecision: {
                ...ec.nodalDecision,
                assignedDepartment: assignedDept,
                assignedFaculty: faculty,
              },
            }
          : ec
      )
    );
    showToast(`Assigned ${faculty.name} (${assignedDept}) as Faculty Lead.`);
  };

  const handleApproveProposal = (proposalId: string) => {
    setProposals(
      proposals.map((p) =>
        p.id === proposalId
          ? {
              ...p,
              status: 'approved',
              approvedAt: new Date().toISOString(),
              reviewerNotes: 'Approved by Nodal Innovation Board for Capstone Project Activation.',
            }
          : p
      )
    );
    showToast(`Proposal approved! Active project initiated.`);
  };

  const handleRequestRevision = (proposalId: string, notes: string) => {
    setProposals(
      proposals.map((p) =>
        p.id === proposalId
          ? {
              ...p,
              status: 'under_evaluation',
              reviewerNotes: `Revision requested: ${notes}`,
            }
          : p
      )
    );
    showToast(`Revision request sent to faculty lead.`);
  };

  // Faculty Handlers
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
    showToast(`Feasibility saved: ${decision.replace(/_/g, ' ')}`);
  };

  const handleAddStudentToTeam = (challengeId: string, student: StudentResearcher) => {
    setEvaluatedChallenges(
      evaluatedChallenges.map((ec) => {
        if (ec.id !== challengeId) return ec;
        const currentMembers = ec.teamFormation?.studentMembers || [];
        if (currentMembers.some((s) => s.id === student.id)) return ec;
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
    showToast(`Student ${student.name} (${student.apaarId}) added to research team.`);
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
    showToast(`Proposal "${newProposal.title}" submitted to Nodal Board.`);
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

  // Filtered Datasets by Active Role Perspective
  const assignedChallengesForFaculty = evaluatedChallenges.filter(
    (e) => e.nodalDecision.assignedFaculty.id === activeFacultyId
  );
  const proposalsForFaculty = proposals.filter(
    (p) => p.facultyLead.id === activeFacultyId
  );
  const projectsForFaculty = heiProjects.filter((p) => {
    const leadLower = (p.faculty_lead || '').toLowerCase();
    const facNameLower = activeFaculty.name.toLowerCase();
    return leadLower === facNameLower || leadLower.includes(facNameLower.split(' ')[1]);
  });

  const counts = {
    matchedChallenges: heiChallenges.length,
    unassignedAccepted: evaluatedChallenges.filter((e) => e.status === 'ACCEPTED_FOR_EVALUATION').length,
    pendingProposals: proposals.filter((p) => p.status === 'submitted' || p.status === 'under_evaluation').length,
    institutionProjects: heiProjects.length,
    assignedChallenges: assignedChallengesForFaculty.length,
    pendingFeasibility: assignedChallengesForFaculty.filter((c) => c.status === 'FACULTY_EVALUATION').length,
    facultyProjects: projectsForFaculty.length,
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
            border: `1px solid ${perspective === 'nodal' ? 'var(--accent-indigo)' : 'var(--accent-amber)'}`,
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
          <Sparkles size={17} color={perspective === 'nodal' ? 'var(--accent-indigo)' : 'var(--accent-amber)'} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Left Sidebar Navigation (Role-Aware) */}
      <HEISidebar
        perspective={perspective}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        counts={counts}
      />

      {/* 2. Main Content Area */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Top Perspective Switcher Bar */}
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
          {/* Prototype Role Perspective Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Prototype Perspective:
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
                onClick={() => handlePerspectiveChange('nodal')}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: perspective === 'nodal' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                  color: perspective === 'nodal' ? 'var(--accent-indigo)' : 'var(--text-secondary)',
                  border: perspective === 'nodal' ? '1px solid rgba(99, 102, 241, 0.45)' : '1px solid transparent',
                  fontSize: '0.78125rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <Building2 size={14} />
                <span>HEI Nodal Officer</span>
              </button>

              <button
                type="button"
                onClick={() => handlePerspectiveChange('faculty')}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: perspective === 'faculty' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                  color: perspective === 'faculty' ? 'var(--accent-amber)' : 'var(--text-secondary)',
                  border: perspective === 'faculty' ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid transparent',
                  fontSize: '0.78125rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <GraduationCap size={14} />
                <span>Faculty / Research Lead</span>
              </button>
            </div>

            {/* If Faculty perspective is active, show selectable faculty identity */}
            {perspective === 'faculty' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>Logged as:</span>
                <select
                  className="input"
                  value={activeFacultyId}
                  onChange={(e) => setActiveFacultyId(e.target.value)}
                  style={{ height: '30px', fontSize: '0.75rem', padding: '0 0.5rem' }}
                >
                  {SEED_FACULTY.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.department.split(' ')[0]})
                    </option>
                  ))}
                </select>
              </div>
            )}
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

        {/* Perspective Banner Description */}
        <div
          style={{
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: perspective === 'nodal' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(245, 158, 11, 0.08)',
            border: `1px solid ${perspective === 'nodal' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span>
            {perspective === 'nodal' ? (
              <>
                <strong style={{ color: 'var(--accent-indigo)' }}>[HEI Nodal Officer Perspective]: </strong>
                SELECT → ACCEPT → ALLOCATE → OVERSEE. Institutional oversight of matched innovation challenges, department & faculty allocation, and university capstone pipeline.
              </>
            ) : (
              <>
                <strong style={{ color: 'var(--accent-amber)' }}>[Faculty / Research Lead Perspective ({activeFaculty.name})]: </strong>
                EVALUATE → RESEARCH → BUILD → TEST → PROVE. Feasibility analysis, research team assembly, proposal drafting, and project execution.
              </>
            )}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>BIT Mesra Institutional Node</span>
        </div>

        {/* NODAL TABS */}
        {perspective === 'nodal' && (
          <>
            {activeTab === 'overview' && (
              <HEIOverviewTab
                reports={reports}
                heiChallenges={heiChallenges}
                evaluatedChallenges={evaluatedChallenges}
                heiProjects={heiProjects}
                proposals={proposals}
                prototypes={SEED_PROTOTYPES}
                impactRecords={SEED_IMPACT_OUTCOMES}
                activeInstitution={ACTIVE_INSTITUTION}
                onOpenChallengeDetail={setSelectedChallengeForDetail}
                onNavigateTab={setActiveTab}
                onDeclineChallenge={handleDeclineChallenge}
              />
            )}

            {activeTab === 'matched_challenges' && (
              <HEIChallengesTab
                challenges={heiChallenges}
                reports={reports}
                onOpenChallengeDetail={setSelectedChallengeForDetail}
                onAcceptEvaluation={handleAcceptEvaluation}
                onDeclineChallenge={handleDeclineChallenge}
                onDraftProposal={handleDraftProposal}
              />
            )}

            {activeTab === 'accepted_assignment' && (
              <HEIAcceptedAssignmentTab
                evaluatedChallenges={evaluatedChallenges}
                activeInstitution={ACTIVE_INSTITUTION}
                onAssignFaculty={handleAssignFaculty}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'proposals' && (
              <HEIProposalsTab
                proposals={proposals}
                perspective="nodal"
                onOpenNewProposalModal={() => {
                  setProposalTargetChallenge(null);
                  setIsNewProposalModalOpen(true);
                }}
                onApproveProposal={handleApproveProposal}
                onRequestRevision={handleRequestRevision}
              />
            )}

            {activeTab === 'projects' && (
              <HEIActiveProjectsTab
                projects={heiProjects}
                onOpenProjectDetail={(p) => setSelectedProjectForDetail(p)}
                onOpenMilestoneModal={(project, milestone) => setMilestoneTarget({ project, milestone })}
                onOpenNEPCertificateModal={handleIssueNEPCertificate}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'institution' && (
              <HEICapabilitiesTab activeInstitution={ACTIVE_INSTITUTION} />
            )}

            {activeTab === 'analytics' && (
              <HEIAnalyticsTab activeInstitution={ACTIVE_INSTITUTION} />
            )}
          </>
        )}

        {/* FACULTY TABS */}
        {perspective === 'faculty' && (
          <>
            {activeTab === 'workbench' && (
              <HEIFacultyWorkbenchTab
                activeFaculty={activeFaculty}
                assignedChallenges={assignedChallengesForFaculty}
                facultyProposals={proposalsForFaculty}
                facultyProjects={projectsForFaculty}
                onNavigateTab={setActiveTab}
                onOpenProjectDetail={(p) => setSelectedProjectForDetail(p)}
                onStartFeasibility={() => {
                  setActiveTab('feasibility');
                }}
              />
            )}

            {activeTab === 'assigned_challenges' && (
              <HEIFacultyAssignedChallengesTab
                activeFaculty={activeFaculty}
                assignedChallenges={assignedChallengesForFaculty}
                onOpenChallengeDetail={setSelectedChallengeForDetail}
                onStartFeasibility={() => {
                  setActiveTab('feasibility');
                }}
              />
            )}

            {activeTab === 'feasibility' && (
              <HEIFeasibilityTab
                activeFaculty={activeFaculty}
                assignedChallenges={assignedChallengesForFaculty}
                onUpdateFeasibility={handleUpdateFeasibility}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'teams' && (
              <HEIResearchTeamsTab
                activeFaculty={activeFaculty}
                assignedChallenges={assignedChallengesForFaculty}
                onAddStudentToTeam={handleAddStudentToTeam}
                onDraftProposal={handleDraftProposal}
              />
            )}

            {activeTab === 'proposals' && (
              <HEIProposalsTab
                proposals={proposalsForFaculty}
                perspective="faculty"
                onOpenNewProposalModal={() => {
                  setProposalTargetChallenge(null);
                  setIsNewProposalModalOpen(true);
                }}
              />
            )}

            {activeTab === 'my_projects' && (
              <HEIFacultyProjectsTab
                activeFaculty={activeFaculty}
                facultyProjects={projectsForFaculty}
                onOpenProjectDetail={(p) => setSelectedProjectForDetail(p)}
                onNavigateTab={setActiveTab}
              />
            )}
          </>
        )}
      </main>

      {/* 3. MODALS */}
      {/* Project Detail Modal (Unified 9-section workspace) */}
      {selectedProjectForDetail && (
        <ProjectDetailModal
          project={selectedProjectForDetail}
          perspective={perspective}
          onClose={() => setSelectedProjectForDetail(null)}
          onUpdateMilestone={(project, milestone) => setMilestoneTarget({ project, milestone })}
          onIssueNEPCertificate={handleIssueNEPCertificate}
        />
      )}

      {/* Challenge Detail Modal */}
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

      {/* Claim Challenge Modal */}
      {claimTargetChallenge && (
        <ClaimChallengeModal
          challenge={claimTargetChallenge}
          onClose={() => setClaimTargetChallenge(null)}
          onClaim={claimChallenge}
          onShowToast={showToast}
        />
      )}

      {/* Proposal Draft Modal */}
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

      {/* Milestone Update Modal */}
      {milestoneTarget && (
        <MilestoneUpdateModal
          project={milestoneTarget.project}
          milestone={milestoneTarget.milestone}
          onClose={() => setMilestoneTarget(null)}
          onUpdateMilestone={updateMilestone}
          onShowToast={showToast}
        />
      )}

      {/* NEP Certificate Modal */}
      {viewCertificate && (
        <NEPCertificateModal
          credit={viewCertificate}
          onClose={() => setViewCertificate(null)}
        />
      )}
    </div>
  );
};
