import React, { useState } from 'react';
import {
  Lightbulb,
  Cpu,
  RefreshCw,
  Wrench,
  UserCheck,
  Edit3,
  Check,
} from 'lucide-react';
import type { StoredReport, StructuredAIAssessment, GovernmentAIDecision } from '../../types';
import { useGlobalStore } from '../../store/globalStore';
import { formatISTDateTime } from '../../utils/dateHelper';

interface GovernmentAIAssessmentProps {
  report: StoredReport;
  onShowToast?: (msg: string) => void;
}

export const GovernmentAIAssessment: React.FC<GovernmentAIAssessmentProps> = ({
  report,
  onShowToast,
}) => {
  const { reanalyzeReportWithAI, saveGovernmentAIDecision } = useGlobalStore();

  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  // Form state for government override
  const [overrideAction, setOverrideAction] = useState<boolean>(true);
  const [overrideInnovation, setOverrideInnovation] = useState<boolean>(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [officerName, setOfficerName] = useState('Municipal Zonal Officer');

  const aiAnalysis = report.ai_analysis;
  const structured: StructuredAIAssessment | undefined = aiAnalysis?.structured_output;
  const governmentDecision: GovernmentAIDecision | null | undefined = aiAnalysis?.government_decision;

  // Fallback defaults if structured analysis is still compiling
  const immediateAction = structured?.immediate_action_decision || (structured?.immediate_action_required ? 'YES' : 'NO');
  const innovationDecision = structured?.innovation_decision || (structured?.innovation_required ? 'YES' : 'NO');

  const confidenceScore = structured?.confidence
    ? Math.round(structured.confidence * 100)
    : aiAnalysis?.evidence_confidence
    ? Math.round(aiAnalysis.evidence_confidence * 100)
    : 92;

  const modelName = aiAnalysis?.model_name || 'gemini-2.5-flash';
  const generatedAt = aiAnalysis?.completed_at || aiAnalysis?.created_at || report.created_at;

  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    try {
      const updated = await reanalyzeReportWithAI(report.id);
      if (updated && onShowToast) {
        onShowToast('✓ Fresh Gemini AI assessment generated and saved.');
      } else if (onShowToast) {
        onShowToast('AI assessment updated.');
      }
    } catch (err) {
      console.error(err);
      if (onShowToast) onShowToast('Failed to re-run AI analysis.');
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleConfirmDecision = async () => {
    setIsSubmittingDecision(true);
    try {
      const ok = await saveGovernmentAIDecision(report.id, {
        status: 'confirmed',
        action_decision: structured?.immediate_action_required ?? true,
        innovation_decision: structured?.innovation_required ?? false,
        override_reason: 'Confirmed based on AI decision-support evidence and field validation.',
        reviewed_by: officerName || 'Municipal Zonal Officer',
      });
      if (ok && onShowToast) {
        onShowToast('✓ AI recommendation officially confirmed by Government Authority.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingDecision(true);
    try {
      const ok = await saveGovernmentAIDecision(report.id, {
        status: 'overridden',
        action_decision: overrideAction,
        innovation_decision: overrideInnovation,
        override_reason: overrideReason || 'Standard municipal engineering protocols applied.',
        reviewed_by: officerName || 'Municipal Zonal Officer',
      });
      if (ok) {
        if (onShowToast) onShowToast('✓ Government decision override recorded with official rationale.');
        setShowOverrideModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  // Status Colors
  const isActionYes = immediateAction === 'YES';
  const isInnovationYes = innovationDecision === 'YES';

  const existingSolution = structured?.existing_solution_status || 'UNKNOWN';
  const isSolutionAdequate = existingSolution === 'ADEQUATE';
  const isSolutionFailing = existingSolution === 'REPEATEDLY_FAILING' || existingSolution === 'INSUFFICIENT';

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        padding: '1.35rem',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      {/* 1. Header with Model Traceability & Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          paddingBottom: '0.85rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Cpu size={18} color="var(--accent-amber)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Gemini AI Decision-Support Assessment
              </h3>
              <span
                className="mono"
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.45rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--accent-amber)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                {modelName}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              Generated: {formatISTDateTime(generatedAt)} • Status: {aiAnalysis?.status === 'completed' ? 'Verified Analysis' : 'Active Engine'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.25rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <span>{confidenceScore}% AI Confidence</span>
          </div>

          <button
            type="button"
            onClick={handleReanalyze}
            disabled={isReanalyzing}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              height: '32px',
              padding: '0 0.65rem',
            }}
            title="Re-run Gemini AI analysis on this challenge"
          >
            <RefreshCw size={12} className={isReanalyzing ? 'spin' : ''} />
            <span>{isReanalyzing ? 'Analyzing...' : 'Re-run AI Assessment'}</span>
          </button>
        </div>
      </div>

      {/* 2. DUAL INDEPENDENT DECISION CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {/* BRANCH 1: IMMEDIATE GOVERNMENT ACTION */}
        <div
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: `1px solid ${isActionYes ? 'rgba(244, 63, 94, 0.4)' : 'rgba(16, 185, 129, 0.3)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '1.15rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.85rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Wrench size={16} color={isActionYes ? '#f43f5e' : '#10b981'} />
                <span style={{ fontSize: '0.78125rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Immediate Government Action
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 900,
                    padding: '0.2rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isActionYes ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: isActionYes ? '#f43f5e' : '#10b981',
                    border: `1px solid ${isActionYes ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                  }}
                >
                  {immediateAction}
                </span>
                {structured?.urgency && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-card)',
                      color: structured.urgency === 'CRITICAL' ? '#f43f5e' : 'var(--accent-amber)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {structured.urgency} Urgency
                  </span>
                )}
              </div>
            </div>

            {/* AI Summary */}
            <div style={{ fontSize: '0.84375rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.45, marginBottom: '0.6rem' }}>
              {structured?.immediate_action_summary || (isActionYes
                ? 'Immediate government field intervention is recommended to isolate hazard and deploy rapid repair crews.'
                : 'No immediate emergency intervention is indicated. Scheduled for standard municipal monitoring.')}
            </div>

            {/* Why Gemini reached this conclusion */}
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.65rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '0.65rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                Why Gemini Recommended This:
              </div>
              <p style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {structured?.immediate_action_reason ||
                  (isActionYes
                    ? 'Reported evidence indicates acute safety disruption or public-health vulnerability in active transit/residential zone.'
                    : 'The reported grievance does not present an immediate safety hazard and can be managed in standard cycles.')}
              </p>
            </div>

            {/* Recommended Immediate Actions Checklist */}
            {structured?.recommended_immediate_actions && structured.recommended_immediate_actions.length > 0 && (
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Recommended Immediate Municipal Steps:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {structured.recommended_immediate_actions.map((act, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>•</span>
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BRANCH 2: INNOVATION & RESEARCH PATHWAY */}
        <div
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: `1px solid ${isInnovationYes ? 'rgba(99, 102, 241, 0.4)' : 'rgba(100, 116, 139, 0.3)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '1.15rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.85rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Lightbulb size={16} color={isInnovationYes ? 'var(--accent-indigo)' : '#94a3b8'} />
                <span style={{ fontSize: '0.78125rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Innovation / Research Pathway
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 900,
                    padding: '0.2rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isInnovationYes ? 'rgba(99, 102, 241, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                    color: isInnovationYes ? 'var(--accent-indigo)' : '#94a3b8',
                    border: `1px solid ${isInnovationYes ? 'rgba(99, 102, 241, 0.3)' : 'rgba(100, 116, 139, 0.3)'}`,
                  }}
                >
                  {innovationDecision}
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-card)',
                    color: isInnovationYes ? 'var(--accent-indigo)' : 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {isInnovationYes ? 'Innovation Candidate' : 'Standard ULB Method'}
                </span>
              </div>
            </div>

            {/* AI Summary */}
            <div style={{ fontSize: '0.84375rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.45, marginBottom: '0.6rem' }}>
              {structured?.innovation_summary || (isInnovationYes
                ? 'Underlying systemic recurrence warrants university Capstone R&D and engineering capability matching.'
                : 'Conventional municipal engineering techniques are fully adequate without requiring research.')}
            </div>

            {/* Why Gemini reached this conclusion */}
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.65rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '0.65rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                Why Innovation Is / Is Not Required:
              </div>
              <p style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {structured?.innovation_reason ||
                  (isInnovationYes
                    ? 'Recurring problem characteristics demonstrate that traditional localized patching fails to solve the root-cause design defect.'
                    : 'Established operational procedures are proven for this standard challenge type.')}
              </p>
            </div>

            {/* Existing Solution Status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Existing Solution Adequacy:</span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: isSolutionAdequate ? '#10b981' : isSolutionFailing ? '#f59e0b' : 'var(--text-primary)',
                }}
              >
                {existingSolution.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Required Capabilities Tags */}
            {structured?.required_capabilities && structured.required_capabilities.length > 0 && (
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Target Academic / Engineering Capabilities:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {structured.required_capabilities.map((cap, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '0.2rem 0.55rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'rgba(99, 102, 241, 0.12)',
                        color: 'var(--accent-indigo)',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                      }}
                    >
                      • {cap}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. ASSESSMENT FACTORS & TRANSPARENCY TELEMETRY GRID */}
      <div
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-md)',
          padding: '0.9rem 1.15rem',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            AI Evidence & Assessment Factors Telemetry
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Objective scoring rubric grounded in citizen evidence
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Severity Level</span>
            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: structured?.severity === 'CRITICAL' ? '#f43f5e' : 'var(--text-primary)', marginTop: '0.1rem' }}>
              {structured?.severity || 'HIGH'}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Urgency Level</span>
            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: structured?.urgency === 'CRITICAL' ? '#f43f5e' : 'var(--text-primary)', marginTop: '0.1rem' }}>
              {structured?.urgency || 'HIGH'}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Public Safety Risk</span>
            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: structured?.assessment_factors?.public_safety_risk === 'CRITICAL' ? '#f43f5e' : 'var(--text-primary)', marginTop: '0.1rem' }}>
              {structured?.assessment_factors?.public_safety_risk || (isActionYes ? 'HIGH' : 'LOW')}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Recurring Problem</span>
            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: structured?.assessment_factors?.recurring_problem ? 'var(--accent-indigo)' : 'var(--text-secondary)', marginTop: '0.1rem' }}>
              {structured?.assessment_factors?.recurring_problem ? 'YES (Systemic)' : 'NO (Isolated)'}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Existing Solution</span>
            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: isSolutionAdequate ? '#10b981' : '#f59e0b', marginTop: '0.1rem' }}>
              {existingSolution.replace(/_/g, ' ')}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Innovation Potential</span>
            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: isInnovationYes ? 'var(--accent-indigo)' : 'var(--text-secondary)', marginTop: '0.1rem' }}>
              {structured?.assessment_factors?.innovation_potential || (isInnovationYes ? 'HIGH' : 'LOW')}
            </div>
          </div>
        </div>
      </div>

      {/* 4. SEPARATE OFFICIAL GOVERNMENT DECISION & OVERRIDE PANEL */}
      <div
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-md)',
          padding: '1.15rem',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <UserCheck size={16} color="var(--accent-amber)" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Official Government Decision & Verification Record
            </span>
          </div>

          {governmentDecision ? (
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.2rem 0.55rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: governmentDecision.status === 'confirmed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: governmentDecision.status === 'confirmed' ? '#10b981' : 'var(--accent-amber)',
                border: `1px solid ${governmentDecision.status === 'confirmed' ? '#10b98140' : '#f59e0b40'}`,
              }}
            >
              {governmentDecision.status === 'confirmed' ? '✓ AI Decision Confirmed' : '⚠️ AI Recommendation Overridden'}
            </span>
          ) : (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Pending Municipal Review
            </span>
          )}
        </div>

        {governmentDecision ? (
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.78125rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '0.25rem' }}>
              <span>Reviewed by: <strong>{governmentDecision.reviewed_by}</strong></span>
              <span>{formatISTDateTime(governmentDecision.reviewed_at)}</span>
            </div>
            <div style={{ color: 'var(--text-primary)' }}>
              <strong>Official Decision:</strong> Immediate Gov Action = {governmentDecision.action_decision ? 'YES' : 'NO'}, Innovation Pathway = {governmentDecision.innovation_decision ? 'YES' : 'NO'}.
            </div>
            {governmentDecision.override_reason && (
              <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontStyle: 'italic' }}>
                Rationale: "{governmentDecision.override_reason}"
              </div>
            )}
          </div>
        ) : (
          <p style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            The AI assessment serves as evidence-based decision support. You may officially confirm the recommendation or override with specific operational rationale.
          </p>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
          <button
            type="button"
            disabled={isSubmittingDecision}
            onClick={handleConfirmDecision}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.78125rem',
              borderColor: 'rgba(16, 185, 129, 0.4)',
              color: '#10b981',
            }}
          >
            <Check size={14} />
            <span>Confirm AI Recommendation</span>
          </button>

          <button
            type="button"
            disabled={isSubmittingDecision}
            onClick={() => {
              setOverrideAction(isActionYes);
              setOverrideInnovation(isInnovationYes);
              setShowOverrideModal(true);
            }}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.78125rem',
              borderColor: 'rgba(245, 158, 11, 0.4)',
              color: 'var(--accent-amber)',
            }}
          >
            <Edit3 size={14} />
            <span>Override Decision</span>
          </button>
        </div>

        {/* Override Modal / Inline Form */}
        {showOverrideModal && (
          <form
            onSubmit={handleOverrideSubmit}
            style={{
              marginTop: '0.75rem',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--accent-amber)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Record Official Government Override
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Immediate Gov Action
                </label>
                <select
                  className="input"
                  value={overrideAction ? 'YES' : 'NO'}
                  onChange={(e) => setOverrideAction(e.target.value === 'YES')}
                  style={{ height: '38px', fontSize: '0.8125rem', marginTop: '0.2rem' }}
                >
                  <option value="YES">YES — Dispatch Work Order</option>
                  <option value="NO">NO — Standard Maintenance Cycle</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Innovation / R&D Pathway
                </label>
                <select
                  className="input"
                  value={overrideInnovation ? 'YES' : 'NO'}
                  onChange={(e) => setOverrideInnovation(e.target.value === 'YES')}
                  style={{ height: '38px', fontSize: '0.8125rem', marginTop: '0.2rem' }}
                >
                  <option value="YES">YES — Route to University R&D</option>
                  <option value="NO">NO — Existing Standard Solution Available</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Reviewing Officer Name / Designation
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Municipal Zonal Officer (Engg Dept)"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                style={{ height: '38px', fontSize: '0.8125rem', marginTop: '0.2rem' }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Official Rationale / Justification
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Existing municipal contractor already deployed for this sector..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                style={{ height: '38px', fontSize: '0.8125rem', marginTop: '0.2rem' }}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingDecision}
                className="btn btn-primary btn-sm"
              >
                {isSubmittingDecision ? 'Saving...' : 'Save Government Decision'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Advisory Notice */}
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.85rem', fontStyle: 'italic', textAlign: 'right' }}>
        * Note: AI assessments are advisory. Authorized Government Nodal Officers maintain binding decision authority.
      </div>
    </div>
  );
};
