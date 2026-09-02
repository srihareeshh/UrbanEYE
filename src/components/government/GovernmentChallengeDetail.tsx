import React, { useState } from 'react';
import {
  X,
  GraduationCap,
  Wrench,
  Clock,
  Camera,
  Sparkles,
  ShieldCheck,
  Send,
  Upload,
} from 'lucide-react';
import type { StoredReport, GovernmentAIDecision } from '../../types';
import { formatBytes } from '../../utils/exifHelper';
import { formatISTDateTime } from '../../utils/dateHelper';
import { GovernmentAIAssessment } from './GovernmentAIAssessment';
import { getRecommendedHEIsForChallenge } from './governmentPrototypeData';
import { useGlobalStore } from '../../store/globalStore';
import { PriorityScoreExplanation } from '../PriorityScoreExplanation';
import { PriorityFactorList } from '../PriorityFactorList';
import { SeverityExplanation } from '../SeverityExplanation';

interface GovernmentChallengeDetailProps {
  report: StoredReport;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

const DEPARTMENTS = [
  'Road Infrastructure & Highways Division',
  'Water Supply & Sewerage Board',
  'Electricity Distribution Utility (JBVNL / State Power)',
  'Public Health, Sanitation & Solid Waste Wing',
  'Urban Drainage & Flood Management Wing',
  'Public Works Department (PWD)',
  'District Collectorate / Emergency Services',
];

const MUNICIPAL_OFFICERS: Record<string, string[]> = {
  'Road Infrastructure & Highways Division': ['Eng. Rajiv Sharma (AE-Roads)', 'Eng. Suresh Soren (JE-Paving)'],
  'Water Supply & Sewerage Board': ['Eng. R. K. Shinde (Executive Engineer)', 'Officer Priya Verma (Water Triage)'],
  'Electricity Distribution Utility (JBVNL / State Power)': ['Lineman In-charge D. Mahato', 'Eng. Anita Murmu (Electrical AE)'],
  'Public Health, Sanitation & Solid Waste Wing': ['Health Inspector Alok Das', 'Officer Sunita Hembrom'],
  'Urban Drainage & Flood Management Wing': ['Eng. R. K. Shinde (Executive Engineer)', 'Specialist Dr. B. N. Roy'],
  'Public Works Department (PWD)': ['Assistant Engineer V. K. Singh', 'Superintendent M. Ansari'],
  'District Collectorate / Emergency Services': ['Nodal Disaster Officer P. K. Jha'],
};

export const GovernmentChallengeDetail: React.FC<GovernmentChallengeDetailProps> = ({
  report,
  onClose,
  onShowToast,
}) => {
  const { dispatchWorkOrder, escalateToHEI, resolveDualSignoff, refreshAll } = useGlobalStore();

  const [activeTab, setActiveTab] = useState<'decision' | 'evidence' | 'timeline'>('decision');

  // Work Order State
  const [selectedDept, setSelectedDept] = useState(
    report.assignment?.department_name || DEPARTMENTS[0]
  );
  const [selectedOfficer, setSelectedOfficer] = useState(
    report.assignment?.officer_name || MUNICIPAL_OFFICERS[DEPARTMENTS[0]][0]
  );
  const [targetHours, setTargetHours] = useState<number>(48);
  const [actionNotes, setActionNotes] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);

  // Dual Sign-off Remediation Proof State
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolvedBy, setResolvedBy] = useState(selectedOfficer || 'Municipal Field Crew');
  const [isResolving, setIsResolving] = useState(false);

  // HEI Routing State
  const [selectedHEIIndex, setSelectedHEIIndex] = useState(0);
  const [isEscalatingHEI, setIsEscalatingHEI] = useState(false);
  const [showManualOverride, setShowManualOverride] = useState(false);

  const recommendedHEIs = getRecommendedHEIsForChallenge(report.category, report.description);
  const isAlreadyEscalated = !!report.is_escalated_to_hei || !!report.hei_challenge;
  const isAssigned = !!report.assignment || ['Assigned', 'Action Scheduled', 'In Progress', 'Resolved', 'Citizen Confirmation', 'Confirmed Resolved'].includes(report.status);
  const isResolvedOrPendingCitizen = ['Resolved', 'Citizen Confirmation', 'Confirmed Resolved'].includes(report.status);

  // Local state for immediate reactive UI updates upon override / confirmation
  const [localGovDecision, setLocalGovDecision] = useState<GovernmentAIDecision | null>(
    report.ai_analysis?.government_decision || null
  );

  React.useEffect(() => {
    setLocalGovDecision(report.ai_analysis?.government_decision || null);
  }, [report.ai_analysis?.government_decision]);

  // Derive decision pathways from live AI analysis & official government decision
  const aiStructured = report.ai_analysis?.structured_output;
  const govDecision = localGovDecision || report.ai_analysis?.government_decision;
  const isOverridden = govDecision?.status === 'overridden';

  const rawActionYes = aiStructured?.immediate_action_decision
    ? (aiStructured.immediate_action_decision === 'YES')
    : (aiStructured ? Boolean(aiStructured.immediate_action_required) : true);

  const rawInnovationYes = aiStructured?.innovation_decision
    ? (aiStructured.innovation_decision === 'YES')
    : Boolean(aiStructured?.innovation_required);

  // Effective decisions factoring in official government override
  const isActionYes = isOverridden
    ? Boolean(govDecision.action_decision)
    : rawActionYes;

  const isInnovationYes = isOverridden
    ? Boolean(govDecision.innovation_decision)
    : rawInnovationYes;

  // Visibility:
  // - If Immediate Government Action is YES -> Branch 1 is visible
  // - If Immediate Government Action is NO -> Branch 1 is NOT visible
  // - If Innovation / Research Pathway is YES -> Branch 2 is visible
  // - If Innovation / Research Pathway is NO -> Branch 2 is NOT visible
  // - If showManualOverride is toggled -> force both branches to show
  const showBranch1 = isActionYes || showManualOverride;
  const showBranch2 = isInnovationYes || showManualOverride;

  const handleDeptChange = (dept: string) => {
    setSelectedDept(dept);
    const officers = MUNICIPAL_OFFICERS[dept] || ['Duty Field Officer'];
    setSelectedOfficer(officers[0]);
  };

  const handleDispatchWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDispatching(true);
    try {
      const ok = await dispatchWorkOrder({
        reportId: report.id,
        departmentName: selectedDept,
        officerName: selectedOfficer,
        targetHours,
        priority: report.priority_bucket || 'High',
        notes: actionNotes || `Dispatched to ${selectedOfficer} for immediate on-site inspection.`,
      });

      if (ok) {
        if (onShowToast) onShowToast(`✓ Work order issued to ${selectedOfficer} (${selectedDept})`);
        await refreshAll();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDispatching(false);
    }
  };

  const handleDualSignoffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResolving(true);
    try {
      const ok = await resolveDualSignoff({
        reportId: report.id,
        resolutionNotes: resolutionNotes || 'Field remediation completed. Photographed evidence recorded on-site.',
        resolvedBy,
        resolutionPhotoUrl: '/samples/flooded_road_mumbai.jpg',
        resolutionPhotoName: 'repair_completion_proof.jpg',
        latitude: report.latitude,
        longitude: report.longitude,
      });

      if (ok) {
        if (onShowToast) onShowToast('✓ Remediation proof uploaded. Citizen verification sign-off requested.');
        await refreshAll();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsResolving(false);
    }
  };

  const handleRouteToHEI = async () => {
    const targetHEI = recommendedHEIs[selectedHEIIndex];
    if (!targetHEI) return;

    setIsEscalatingHEI(true);
    try {
      const ok = await escalateToHEI({
        reportId: report.id,
        researchDomain: `${report.category} - ${targetHEI.matchingCapabilities[0] || 'Infrastructure Innovation'}`,
        researchBrief: `Academic Capstone R&D Escalation: Novel ${report.category.toLowerCase()} structural solution for ${report.address || 'District Sector'} addressing recurrent failure.`,
        departmentMatch: targetHEI.relevantDepartment,
        matchPercentage: targetHEI.matchPercentage,
      });

      if (ok) {
        if (onShowToast) onShowToast(`✓ Challenge routed to ${targetHEI.hei.shortName} (${targetHEI.matchPercentage}% match)`);
        await refreshAll();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsEscalatingHEI(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1050px',
          maxHeight: '92vh',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Top Modal Header */}
        <div
          style={{
            padding: '1.15rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--accent-amber)' }}>
              {report.report_code}
            </span>

            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.2rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--accent-amber)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              {report.category}
            </span>

            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.2rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor:
                  report.priority_bucket === 'CRITICAL'
                    ? 'rgba(244, 63, 94, 0.18)'
                    : report.priority_bucket === 'HIGH'
                    ? 'rgba(249, 115, 22, 0.18)'
                    : 'rgba(56, 189, 248, 0.18)',
                color:
                  report.priority_bucket === 'CRITICAL'
                    ? '#f43f5e'
                    : report.priority_bucket === 'HIGH'
                    ? '#f97316'
                    : '#38bdf8',
                border: `1px solid ${
                  report.priority_bucket === 'CRITICAL'
                    ? '#f43f5e40'
                    : report.priority_bucket === 'HIGH'
                    ? '#f9731640'
                    : '#38bdf840'
                }`,
              }}
            >
              PRIORITY: {report.civic_priority_score || 50}/100 ({report.priority_bucket || 'HIGH'})
            </span>

            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.2rem 0.55rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              Status: {report.status}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', padding: '0 1.5rem' }}>
          {[
            { id: 'decision', label: 'Government Decisions & AI Assessment', icon: Sparkles },
            { id: 'evidence', label: `Citizen Evidence (${report.media?.length || 0})`, icon: Camera },
            { id: 'timeline', label: 'Audit Timeline', icon: Clock },
          ].map((tab) => {
            const isTabActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.85rem 1.15rem',
                  fontSize: '0.8125rem',
                  fontWeight: isTabActive ? 800 : 600,
                  color: isTabActive ? 'var(--accent-amber)' : 'var(--text-secondary)',
                  borderBottom: isTabActive ? '2px solid var(--accent-amber)' : '2px solid transparent',
                  background: 'none',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer',
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
          {/* Section A: Problem Summary Card (Always Visible on Top) */}
          <div style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '1.15rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.65rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Citizen Grievance Description
                </div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  "{report.description}"
                </div>
              </div>

              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Reported: <strong>{formatISTDateTime(report.created_at)}</strong>
              </div>
            </div>

            {/* Micro Metadata Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem', marginTop: '0.75rem' }}>
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>District / Ward</span>
                <div style={{ fontSize: '0.78125rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
                  {report.city || report.address || 'Municipal Zone'}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Duration / Recurrence</span>
                <div style={{ fontSize: '0.78125rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
                  {report.duration} • {report.recurrence}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Reported Severity</span>
                <div style={{ fontSize: '0.78125rem', fontWeight: 700, color: report.severity === 'Dangerous' ? '#f43f5e' : 'var(--text-primary)', marginTop: '0.1rem' }}>
                  {report.severity} {report.is_risk_present ? '⚠️ Hazard' : ''}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>GIS Coordinates</span>
                <div className="mono" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
                  {report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)}
                </div>
              </div>
            </div>
          </div>

          {/* TAB 1: DECISIONS & AI ASSESSMENT */}
          {activeTab === 'decision' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
              {/* 1. AI Advisory Assessment Panel */}
              <GovernmentAIAssessment
                report={report}
                onShowToast={onShowToast}
                onDecisionSaved={(decision) => setLocalGovDecision(decision)}
              />

              {/* 1B. Explainable Priority & Factor Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <SeverityExplanation
                  severity={report.priority_breakdown?.severity_level || report.ai_analysis?.structured_output?.severity || report.severity}
                  category={report.category}
                  reasons={report.priority_breakdown?.severity_explanation || report.ai_analysis?.structured_output?.severity_explanation || []}
                  reasonSummary={report.ai_analysis?.structured_output?.severity_reason}
                  isAiAssessed={report.ai_analysis?.status === 'completed'}
                />
                {report.priority_breakdown && (
                  <>
                    <PriorityScoreExplanation priority={report.priority_breakdown} category={report.category} />
                    <PriorityFactorList
                      factors={report.priority_breakdown.factors}
                      contributingFactors={report.priority_breakdown.contributing_factors}
                      weights={report.priority_breakdown.weights}
                      baseScore={report.priority_breakdown.base_score}
                    />
                  </>
                )}
              </div>

              {/* 2. DUAL DECISION MATRIX: Branch 1 (Gov Action) + Branch 2 (Innovation Routing) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Operational Action Pathways
                  </div>

                  {(!isOverridden && (showBranch1 !== showBranch2 || (!showBranch1 && !showBranch2))) && (
                    <button
                      type="button"
                      onClick={() => setShowManualOverride(!showManualOverride)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        fontSize: '0.72rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.2rem 0.6rem',
                      }}
                    >
                      <Wrench size={12} />
                      <span>{showManualOverride ? 'Revert to AI Recommended Pathways' : 'Enable Decision Override (Show All Branches)'}</span>
                    </button>
                  )}
                </div>

                {(!showBranch1 && !showBranch2) ? (
                  <div
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.5rem',
                      border: '1px solid var(--border-medium)',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <p style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem', margin: 0 }}>
                      Standard Routine Municipal Maintenance
                    </p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', maxWidth: '560px', margin: 0, lineHeight: 1.5 }}>
                      AI Assessment indicates neither emergency field intervention nor university R&D is required for this standard grievance. It is scheduled in the standard municipal operational backlog.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowManualOverride(true)}
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: '0.25rem' }}
                    >
                      Override & Open Action Dispatch
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: (showBranch1 && showBranch2) ? 'repeat(auto-fit, minmax(340px, 1fr))' : '1fr', gap: '1.25rem' }}>
                    {/* BRANCH 1: IMMEDIATE GOVERNMENT ACTION */}
                    {showBranch1 && (
                      <div
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          border: `1px solid ${isOverridden ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-medium)'}`,
                          borderRadius: 'var(--radius-lg)',
                          padding: '1.25rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Wrench size={18} color="var(--accent-amber)" />
                              <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                                Branch 1: Immediate Government Action
                              </span>
                            </div>

                            {isOverridden && (
                              <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(245, 158, 11, 0.18)', color: 'var(--accent-amber)', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                                Authority Override Active
                              </span>
                            )}
                          </div>

                          {isResolvedOrPendingCitizen ? (
                            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontWeight: 700, fontSize: '0.8125rem' }}>
                                <ShieldCheck size={16} />
                                <span>Remediation Completed by Authority</span>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                                Assigned Dept: {report.assignment?.department_name || 'Municipal Works'}<br />
                                Resolved by: {report.resolution?.resolved_by || 'Field Supervisor'}<br />
                                Notes: {report.resolution?.resolution_notes || 'Action completed on site.'}
                              </div>
                            </div>
                          ) : (
                            <form onSubmit={handleDispatchWorkOrder} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              <div>
                                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                  Designate Department
                                </label>
                                <select
                                  className="input"
                                  style={{ width: '100%', height: '40px', fontSize: '0.8125rem', marginTop: '0.2rem', borderRadius: 'var(--radius-md)' }}
                                  value={selectedDept}
                                  onChange={(e) => handleDeptChange(e.target.value)}
                                >
                                  {DEPARTMENTS.map((d) => (
                                    <option key={d} value={d}>
                                      {d}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                                <div>
                                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Assign Duty Officer
                                  </label>
                                  <input
                                    type="text"
                                    className="input"
                                    style={{ width: '100%', height: '40px', fontSize: '0.8125rem', marginTop: '0.2rem', borderRadius: 'var(--radius-md)' }}
                                    value={selectedOfficer}
                                    onChange={(e) => setSelectedOfficer(e.target.value)}
                                  />
                                </div>

                                <div>
                                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    SLA Target (Hours)
                                  </label>
                                  <select
                                    className="input"
                                    style={{ width: '100%', height: '40px', fontSize: '0.8125rem', marginTop: '0.2rem', borderRadius: 'var(--radius-md)' }}
                                    value={targetHours}
                                    onChange={(e) => setTargetHours(Number(e.target.value))}
                                  >
                                    <option value={12}>12 Hours (Emergency Critical)</option>
                                    <option value={24}>24 Hours (High Priority)</option>
                                    <option value={48}>48 Hours (Standard ULB SLA)</option>
                                    <option value={72}>72 Hours (Routine Maintenance)</option>
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                  Dispatch Instructions & Work Order Scope
                                </label>
                                <textarea
                                  className="input"
                                  rows={2}
                                  style={{ width: '100%', fontSize: '0.8125rem', marginTop: '0.2rem' }}
                                  placeholder="Specific instructions for field crew..."
                                  value={actionNotes}
                                  onChange={(e) => setActionNotes(e.target.value)}
                                />
                              </div>

                              <button
                                type="submit"
                                disabled={isDispatching}
                                className="btn btn-primary"
                                style={{ width: '100%', marginTop: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                              >
                                <Send size={14} />
                                <span>{isDispatching ? 'Issuing Work Order...' : isAssigned ? 'Update Work Order' : 'Dispatch Field Work Order'}</span>
                              </button>
                            </form>
                          )}
                        </div>

                        {/* Dual Signoff Resolution Upload (when In Progress) */}
                        {isAssigned && !isResolvedOrPendingCitizen && (
                          <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px dashed var(--border-medium)' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Upload size={14} />
                              <span>Complete Remediation & Trigger Citizen Verification</span>
                            </div>
                            <form onSubmit={handleDualSignoffSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <input
                                type="text"
                                className="input"
                                style={{ width: '100%', height: '34px', fontSize: '0.78125rem' }}
                                placeholder="Remediation resolution summary..."
                                value={resolutionNotes}
                                onChange={(e) => setResolutionNotes(e.target.value)}
                              />
                              <input
                                type="text"
                                className="input"
                                style={{ width: '100%', height: '40px', fontSize: '0.78125rem', borderRadius: 'var(--radius-md)' }}
                                placeholder="Resolved by (e.g., Duty Field Crew)..."
                                value={resolvedBy}
                                onChange={(e) => setResolvedBy(e.target.value)}
                              />
                              <button
                                type="submit"
                                disabled={isResolving}
                                className="btn btn-secondary btn-sm"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                              >
                                <ShieldCheck size={14} color="#10b981" />
                                <span>{isResolving ? 'Submitting Proof...' : 'Upload Repair Proof & Await Citizen Sign-off'}</span>
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    )}

                    {/* BRANCH 2: HEI INNOVATION PATHWAY */}
                    {showBranch2 && (
                      <div
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          border: `1px solid ${isOverridden ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-medium)'}`,
                          borderRadius: 'var(--radius-lg)',
                          padding: '1.25rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <GraduationCap size={18} color="var(--accent-indigo)" />
                              <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                                Branch 2: HEI Innovation Pathway
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              {isOverridden && (
                                <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(245, 158, 11, 0.18)', color: 'var(--accent-amber)', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                                  Authority Override Active
                                </span>
                              )}
                              {isAlreadyEscalated && (
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: 'var(--radius-full)',
                                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                                    color: 'var(--accent-indigo)',
                                  }}
                                >
                                  ✓ R&D Track Active
                                </span>
                              )}
                            </div>
                          </div>

                          <p style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', marginBottom: '0.85rem', lineHeight: 1.45 }}>
                            Ranked academic institutions with verified engineering/scientific capabilities matched to this challenge.
                          </p>

                          {/* Ranked Recommendations List */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginBottom: '0.85rem' }}>
                            {recommendedHEIs.slice(0, 3).map((rec, idx) => {
                              const isSelected = selectedHEIIndex === idx;
                              return (
                                <div
                                  key={rec.hei.id}
                                  onClick={() => setSelectedHEIIndex(idx)}
                                  style={{
                                    padding: '0.65rem 0.8rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: isSelected ? '1px solid var(--accent-indigo)' : '1px solid var(--border-subtle)',
                                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-elevated)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                      <span className="mono" style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>
                                        #{idx + 1}
                                      </span>
                                      <strong style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                                        {rec.hei.shortName}
                                      </strong>
                                    </div>
                                    <span
                                      className="mono"
                                      style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 800,
                                        color: rec.matchPercentage >= 90 ? '#10b981' : 'var(--accent-indigo)',
                                      }}
                                    >
                                      {rec.matchPercentage}% Match
                                    </span>
                                  </div>

                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                    Dept: {rec.relevantDepartment}
                                  </div>
                                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                    {rec.reason}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          {isAlreadyEscalated ? (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                              This challenge has been routed to the Higher Education Innovation Exchange.
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handleRouteToHEI}
                              disabled={isEscalatingHEI}
                              className="btn btn-secondary"
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem',
                                backgroundColor: 'rgba(99, 102, 241, 0.12)',
                                color: 'var(--accent-indigo)',
                                border: '1px solid rgba(99, 102, 241, 0.35)',
                              }}
                            >
                              <GraduationCap size={15} />
                              <span>
                                {isEscalatingHEI
                                  ? 'Routing to University...'
                                  : `Route Challenge to ${recommendedHEIs[selectedHEIIndex]?.hei.shortName || 'University'}`}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CITIZEN EVIDENCE MEDIA */}
          {activeTab === 'evidence' && (
            <div>
              {report.media && report.media.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  {report.media.map((med) => (
                    <div
                      key={med.id}
                      style={{
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        border: '1px solid var(--border-medium)',
                        backgroundColor: 'var(--bg-elevated)',
                      }}
                    >
                      {med.media_type === 'image' && (
                        <a href={med.file_path} target="_blank" rel="noreferrer">
                          <img
                            src={med.file_path}
                            alt={med.original_name}
                            style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                          />
                        </a>
                      )}
                      {med.media_type === 'video' && (
                        <video src={med.file_path} controls style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                      )}
                      {med.media_type === 'audio' && (
                        <div style={{ padding: '1.25rem' }}>
                          <audio src={med.file_path} controls style={{ width: '100%' }} />
                        </div>
                      )}
                      <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <div>{med.original_name}</div>
                        <div className="mono" style={{ fontSize: '0.68rem', marginTop: '0.1rem' }}>
                          Size: {formatBytes(med.file_size)} • Type: {med.media_type.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No uploaded media evidence attached to this report.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TIMELINE */}
          {activeTab === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(report.timeline || []).map((t, idx) => (
                <div
                  key={t.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.85rem',
                    backgroundColor: 'var(--bg-elevated)',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: t.actor_type === 'authority' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: t.actor_type === 'authority' ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontWeight: 800,
                      fontSize: '0.72rem',
                    }}
                  >
                    {idx + 1}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.35rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        {t.title}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {formatISTDateTime(t.created_at)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', fontWeight: 600, marginTop: '0.15rem' }}>
                      Actor: {t.actor_name} ({t.actor_type})
                    </div>
                    {t.description && (
                      <div style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.45 }}>
                        {t.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-elevated)', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
            Close Review
          </button>
        </div>
      </div>
    </div>
  );
};
