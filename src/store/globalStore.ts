import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  StakeholderRole,
  StoredReport,
  MunicipalKPIs,
  HEIChallenge,
  HEIProject,
  NEPCreditRecord,
  CSRGrant,
  CorporateMentor,
  TechTransferAgreement,
} from '../types';
import { apiFetch, getCitizenUserId } from '../utils/userSession';

interface GlobalContextType {
  currentRole: StakeholderRole;
  setRole: (role: StakeholderRole) => void;
  reports: StoredReport[];
  municipalKPIs: MunicipalKPIs | null;
  heiChallenges: HEIChallenge[];
  heiProjects: HEIProject[];
  nepCredits: NEPCreditRecord[];
  csrGrants: CSRGrant[];
  corporateMentors: CorporateMentor[];
  mentors: CorporateMentor[];
  agreements: TechTransferAgreement[];
  isLoading: boolean;
  refreshAll: () => Promise<void>;
  
  // Municipal & AI Actions
  reanalyzeReportWithAI: (reportId: string) => Promise<any>;
  saveGovernmentAIDecision: (reportId: string, decision: {
    status: 'confirmed' | 'overridden';
    action_decision: boolean;
    innovation_decision: boolean;
    override_reason?: string;
    reviewed_by?: string;
  }) => Promise<boolean>;

  dispatchWorkOrder: (params: {
    reportId: string;
    departmentName: string;
    officerName: string;
    targetHours?: number;
    priority?: string;
    notes?: string;
  }) => Promise<boolean>;

  escalateToHEI: (params: {
    reportId: string;
    researchDomain?: string;
    researchBrief: string;
    departmentMatch: string;
    matchPercentage?: number;
  }) => Promise<boolean>;

  resolveDualSignoff: (params: {
    reportId: string;
    resolutionNotes: string;
    resolvedBy: string;
    resolutionPhotoUrl?: string;
    resolutionPhotoName?: string;
    latitude?: number;
    longitude?: number;
  }) => Promise<boolean>;

  // HEI Actions
  claimChallenge: (challengeId: string, params: {
    institutionName: string;
    department: string;
    facultyLead: string;
    facultyEmail?: string;
    studentTeam: Array<{ name: string; studentId: string; apaarId: string; role: string; hours: number }>;
    fundingGoal: number;
    abstract: string;
  }) => Promise<boolean>;

  updateMilestone: (projectId: string, stageIndex: number, params: {
    status: 'completed' | 'in_progress';
    deliverables?: any;
    researchHours?: number;
  }) => Promise<boolean>;

  generateNEPCertificate: (params: {
    studentName: string;
    studentId: string;
    apaarId: string;
    institutionName: string;
    projectId: string;
    researchHours?: number;
    fieldHours?: number;
  }) => Promise<NEPCreditRecord | null>;

  // Industry Actions
  pledgeCSRGrant: (projectId: string, params: {
    corporateName: string;
    cinNumber: string;
    csrRegNumber: string;
    contactEmail: string;
    pledgeAmount: number;
    sdgGoal?: string;
  }) => Promise<boolean>;

  releaseEscrowTranche: (trancheId: string, releaseNotes?: string) => Promise<boolean>;

  registerMentor: (params: {
    name: string;
    company: string;
    designation: string;
    expertise: string[];
    email: string;
    hoursPerWeek: number;
  }) => Promise<boolean>;

  initiateTechTransfer: (params: {
    projectId: string;
    corporatePartner: string;
    municipalPartner: string;
    agreementType: string;
    royaltyPercentage?: number;
    termsSummary: string;
  }) => Promise<boolean>;

  // Citizen Action
  citizenVerifyResolution: (reportId: string, params: {
    verdict: 'fixed' | 'partially_fixed' | 'not_fixed';
    citizenNotes?: string;
    satisfactionRating?: number;
  }) => Promise<boolean>;
}

const GlobalContext = createContext<GlobalContextType | null>(null);

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRoleState] = useState<StakeholderRole>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/municipal')) return 'municipal';
    if (path.startsWith('/institution')) return 'institution';
    if (path.startsWith('/industry')) return 'industry';
    return (localStorage.getItem('alcheminds-active-role') as StakeholderRole) || 'citizen';
  });

  const [reports, setReports] = useState<StoredReport[]>([]);
  const [municipalKPIs, setMunicipalKPIs] = useState<MunicipalKPIs | null>(null);
  const [heiChallenges, setHeiChallenges] = useState<HEIChallenge[]>([]);
  const [heiProjects, setHeiProjects] = useState<HEIProject[]>([]);
  const [nepCredits, setNepCredits] = useState<NEPCreditRecord[]>([]);
  const [csrGrants, setCsrGrants] = useState<CSRGrant[]>([]);
  const [corporateMentors, setCorporateMentors] = useState<CorporateMentor[]>([]);
  const [agreements, setAgreements] = useState<TechTransferAgreement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const setRole = (role: StakeholderRole) => {
    setCurrentRoleState(role);
    localStorage.setItem('alcheminds-active-role', role);

    let targetPath = '/';
    if (role === 'municipal') targetPath = '/municipal/dashboard';
    else if (role === 'institution') targetPath = '/institution/dashboard';
    else if (role === 'industry') targetPath = '/industry/dashboard';
    else targetPath = '/';

    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [repRes, kpiRes, chalRes, projRes, nepRes, indRes, hubRes] = await Promise.all([
        apiFetch('/api/reports'),
        apiFetch('/api/municipal/overview'),
        apiFetch('/api/institution/challenges'),
        apiFetch('/api/institution/projects'),
        apiFetch('/api/institution/nep-registry'),
        apiFetch('/api/industry/marketplace'),
        apiFetch('/api/industry/mentorship-hub'),
      ]);

      if (repRes.ok) {
        const data = await repRes.json();
        if (data.reports) setReports(data.reports);
      }

      if (kpiRes.ok) {
        const data = await kpiRes.json();
        if (data.metrics) setMunicipalKPIs(data.metrics);
      }

      if (chalRes.ok) {
        const data = await chalRes.json();
        if (data.challenges) setHeiChallenges(data.challenges);
      }

      if (projRes.ok) {
        const data = await projRes.json();
        if (data.projects) setHeiProjects(data.projects);
      }

      if (nepRes.ok) {
        const data = await nepRes.json();
        if (data.credits) setNepCredits(data.credits);
      }

      if (indRes.ok) {
        const data = await indRes.json();
        if (data.grants) setCsrGrants(data.grants);
      }

      if (hubRes.ok) {
        const data = await hubRes.json();
        if (data.mentors) setCorporateMentors(data.mentors);
        if (data.agreements) setAgreements(data.agreements);
      }
    } catch (e) {
      console.warn('Global fetch error, using fallback state:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // AI Analysis Actions
  const reanalyzeReportWithAI = async (reportId: string): Promise<any> => {
    try {
      const res = await apiFetch(`/api/reports/${reportId}/analyze`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        await refreshAll();
        return data.analysis || null;
      }
      return null;
    } catch (e) {
      console.error('reanalyzeReportWithAI error:', e);
      return null;
    }
  };

  const saveGovernmentAIDecision = async (
    reportId: string,
    decision: {
      status: 'confirmed' | 'overridden';
      action_decision: boolean;
      innovation_decision: boolean;
      override_reason?: string;
      reviewed_by?: string;
    }
  ): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/reports/${reportId}/ai-decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(decision),
      });
      if (res.ok) {
        await refreshAll();
        return true;
      }
      return false;
    } catch (e) {
      console.error('saveGovernmentAIDecision error:', e);
      return false;
    }
  };

  // Municipal Actions
  const dispatchWorkOrder = async (params: {
    reportId: string;
    departmentName: string;
    officerName: string;
    targetHours?: number;
    priority?: string;
    notes?: string;
  }) => {
    try {
      const res = await apiFetch('/api/municipal/work-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        await refreshAll();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const escalateToHEI = async (params: {
    reportId: string;
    researchDomain?: string;
    researchBrief: string;
    departmentMatch: string;
    matchPercentage?: number;
  }) => {
    try {
      const res = await apiFetch('/api/municipal/escalate-hei', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        await refreshAll();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const resolveDualSignoff = async (params: {
    reportId: string;
    resolutionNotes: string;
    resolvedBy: string;
    resolutionPhotoUrl?: string;
    resolutionPhotoName?: string;
    latitude?: number;
    longitude?: number;
  }) => {
    try {
      const res = await apiFetch('/api/municipal/resolve-dual-signoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        await refreshAll();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // HEI Actions
  const claimChallenge = async (
    challengeId: string,
    params: {
      institutionName: string;
      department: string;
      facultyLead: string;
      facultyEmail?: string;
      studentTeam: Array<{ name: string; studentId: string; apaarId: string; role: string; hours: number }>;
      fundingGoal: number;
      abstract: string;
    }
  ) => {
    try {
      const res = await apiFetch(`/api/institution/challenges/${challengeId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        await refreshAll();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const updateMilestone = async (
    projectId: string,
    stageIndex: number,
    params: {
      status: 'completed' | 'in_progress';
      deliverables?: any;
      researchHours?: number;
    }
  ) => {
    try {
      const res = await apiFetch(`/api/institution/projects/${projectId}/milestones/${stageIndex}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        await refreshAll();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const generateNEPCertificate = async (params: {
    studentName: string;
    studentId: string;
    apaarId: string;
    institutionName: string;
    projectId: string;
    researchHours?: number;
    fieldHours?: number;
  }): Promise<NEPCreditRecord | null> => {
    try {
      const res = await apiFetch('/api/institution/nep-registry/generate-certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const data = await res.json();
        await refreshAll();
        return data.certificate || null;
      }
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  // Industry Actions
  const pledgeCSRGrant = async (
    projectId: string,
    params: {
      corporateName: string;
      cinNumber: string;
      csrRegNumber: string;
      contactEmail: string;
      pledgeAmount: number;
      sdgGoal?: string;
    }
  ) => {
    try {
      const res = await apiFetch('/api/industry/pledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          corporateName: params.corporateName,
          cin: params.cinNumber,
          csrRegNo: params.csrRegNumber,
          contactEmail: params.contactEmail,
          amount: params.pledgeAmount,
          sdgGoal: params.sdgGoal,
        }),
      });
      if (res.ok) {
        await refreshAll();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const releaseEscrowTranche = async (trancheId: string, releaseNotes?: string) => {
    try {
      const res = await apiFetch('/api/industry/escrow/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trancheId, releaseNotes }),
      });
      if (res.ok) {
        await refreshAll();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const registerMentor = async (params: {
    name: string;
    company: string;
    designation: string;
    expertise: string[];
    email: string;
    hoursPerWeek: number;
  }) => {
    try {
      const res = await apiFetch('/api/industry/mentorship/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: params.name,
          company: params.company,
          designation: params.designation,
          expertiseDomain: params.expertise.join(', '),
          email: params.email,
          officeHoursSlot: `${params.hoursPerWeek}h / week`,
        }),
      });
      if (res.ok) {
        await refreshAll();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const initiateTechTransfer = async (params: {
    projectId: string;
    corporatePartner: string;
    municipalPartner: string;
    agreementType: string;
    royaltyPercentage?: number;
    termsSummary: string;
  }) => {
    try {
      const res = await apiFetch('/api/industry/tech-transfer/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        await refreshAll();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const citizenVerifyResolution = async (reportId: string, params: {
    verdict: 'fixed' | 'partially_fixed' | 'not_fixed';
    citizenNotes?: string;
    satisfactionRating?: number;
  }) => {
    try {
      const res = await apiFetch(`/api/reports/${reportId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: getCitizenUserId(),
          ...params,
        }),
      });
      if (res.ok) {
        await refreshAll();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  return React.createElement(
    GlobalContext.Provider,
    {
      value: {
        currentRole,
        setRole,
        reports,
        municipalKPIs,
        heiChallenges,
        heiProjects,
        nepCredits,
        csrGrants,
        corporateMentors,
        mentors: corporateMentors,
        agreements,
        isLoading,
        refreshAll,
        reanalyzeReportWithAI,
        saveGovernmentAIDecision,
        dispatchWorkOrder,
        escalateToHEI,
        resolveDualSignoff,
        claimChallenge,
        updateMilestone,
        generateNEPCertificate,
        pledgeCSRGrant,
        releaseEscrowTranche,
        registerMentor,
        initiateTechTransfer,
        citizenVerifyResolution,
      },
    },
    children
  );
};

export function useGlobalStore(): GlobalContextType {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobalStore must be used within a GlobalProvider');
  }
  return context;
}
