import React from 'react';
import {
  GraduationCap,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Cpu,
} from 'lucide-react';
import type { StoredReport } from '../../types';

interface GovernmentAIAssessmentProps {
  report: StoredReport;
}

export const GovernmentAIAssessment: React.FC<GovernmentAIAssessmentProps> = ({ report }) => {
  const structured = report.ai_analysis?.structured_output;
  const isCompleted = report.ai_analysis?.status === 'completed';

  const category = report.category || 'Other';
  const desc = (report.description || '').toLowerCase();
  const severity = report.priority_breakdown?.severity_level || report.severity || 'Moderate';
  const isHighDanger =
    severity === 'Dangerous' ||
    severity === 'Critical' ||
    severity === 'Serious' ||
    severity === 'High' ||
    report.is_risk_present === 1;

  // Determine Solution Feasibility Status based on domain & recurrence
  let solutionStatus: 'Adequate' | 'Insufficient' | 'Unsuitable Locally' | 'Repeatedly Failing' = 'Adequate';
  if (report.recurrence === 'Frequently' || report.recurrence === 'Almost always') {
    solutionStatus = 'Repeatedly Failing';
  } else if (desc.includes('contaminat') || desc.includes('soil') || desc.includes('drainage') || desc.includes('complex')) {
    solutionStatus = 'Unsuitable Locally';
  } else if (isHighDanger && (report.recurrence === 'Sometimes' || desc.includes('recurring'))) {
    solutionStatus = 'Insufficient';
  }

  // Derive Advisory Flags
  const immediateActionRequired = isHighDanger || report.status === 'Submitted' || report.status === 'Under Review';
  const isRecurring = report.recurrence === 'Frequently' || report.recurrence === 'Almost always';
  const innovationRequired = isRecurring || solutionStatus !== 'Adequate' || !!report.is_escalated_to_hei || !!report.hei_challenge;
  const researchRequired = isRecurring || solutionStatus === 'Repeatedly Failing' || solutionStatus === 'Unsuitable Locally';

  // Derive Required Capabilities
  const capabilities: string[] = [];
  if (category === 'Water') {
    capabilities.push('Hydrological Catchment Modeling', 'Water Purification & Heavy Metal Filtration', 'IoT Water Table Sensing');
  } else if (category === 'Roads') {
    capabilities.push('Polymer Bitumen Grading', 'Geotechnical Soil Stabilization', 'Automated Pothole Rapid-Filler Mechanism');
  } else if (category === 'Electricity') {
    capabilities.push('Smart Grid Fault Isolation', 'Low-Voltage Arc Detection Telemetry', 'Micro-Transformer Load Balancing');
  } else if (category === 'Sanitation') {
    capabilities.push('Bio-waste Composting Reactor', 'Vector Control & Odor Abatement', 'Automated Solid Waste Compacting');
  } else if (category === 'Agriculture') {
    capabilities.push('Micro-Irrigation Channel De-siltation', 'Check-Dam Bio-engineering', 'Soil Fertility Monitoring Sensors');
  } else {
    capabilities.push('Municipal Infrastructure Stress Analysis', 'Sensor Mesh Telemetry', 'Sustainable Materials Engineering');
  }

  const confidenceScore = report.ai_analysis?.evidence_confidence
    ? Math.round(report.ai_analysis.evidence_confidence * 100)
    : 92;

  const problemStatement =
    structured?.issue_type ||
    `Civic infrastructure disruption identified in ${category} domain within ${report.address || 'the municipal sector'}. Requires immediate municipal triage and parallel academic capability evaluation.`;

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        padding: '1.25rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Cpu size={18} color="var(--accent-amber)" />
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            AI Advisory Assessment & Solution Feasibility
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.2rem 0.55rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: isCompleted ? '#10b981' : 'var(--accent-amber)',
              border: `1px solid ${isCompleted ? '#10b98140' : '#f59e0b40'}`,
            }}
          >
            {isCompleted ? '✓ AI Verified' : 'Deterministic Analysis'}
          </span>
          <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Confidence: {confidenceScore}%
          </span>
        </div>
      </div>

      {/* Advisory Status Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.15rem' }}>
        {/* Immediate Gov Action */}
        <div
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: `1px solid ${immediateActionRequired ? 'rgba(244, 63, 94, 0.35)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem',
          }}
        >
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Gov Action Req.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
            {immediateActionRequired ? (
              <>
                <CheckCircle2 size={16} color="#f43f5e" />
                <strong style={{ fontSize: '0.9rem', color: '#f43f5e' }}>YES</strong>
              </>
            ) : (
              <>
                <XCircle size={16} color="#94a3b8" />
                <strong style={{ fontSize: '0.9rem', color: '#94a3b8' }}>NO</strong>
              </>
            )}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            {immediateActionRequired ? 'Dispatch work order' : 'Routine monitoring'}
          </div>
        </div>

        {/* Innovation Req */}
        <div
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: `1px solid ${innovationRequired ? 'rgba(99, 102, 241, 0.35)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem',
          }}
        >
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Innovation Req.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
            {innovationRequired ? (
              <>
                <Lightbulb size={16} color="var(--accent-indigo)" />
                <strong style={{ fontSize: '0.9rem', color: 'var(--accent-indigo)' }}>YES</strong>
              </>
            ) : (
              <>
                <XCircle size={16} color="#94a3b8" />
                <strong style={{ fontSize: '0.9rem', color: '#94a3b8' }}>NO</strong>
              </>
            )}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            {innovationRequired ? 'HEI R&D Candidate' : 'Standard fix applies'}
          </div>
        </div>

        {/* Research Req */}
        <div
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: `1px solid ${researchRequired ? 'rgba(236, 72, 153, 0.35)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem',
          }}
        >
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Research Req.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
            {researchRequired ? (
              <>
                <GraduationCap size={16} color="#ec4899" />
                <strong style={{ fontSize: '0.9rem', color: '#ec4899' }}>YES</strong>
              </>
            ) : (
              <>
                <XCircle size={16} color="#94a3b8" />
                <strong style={{ fontSize: '0.9rem', color: '#94a3b8' }}>NO</strong>
              </>
            )}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            {researchRequired ? 'Root-cause analysis' : 'Known parameters'}
          </div>
        </div>

        {/* Existing Solution Status */}
        <div
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem',
          }}
        >
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Existing Solution Status
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: solutionStatus === 'Adequate' ? '#10b981' : '#f59e0b', marginTop: '0.25rem' }}>
            {solutionStatus}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            {solutionStatus === 'Repeatedly Failing' ? 'Recurrent failure detected' : solutionStatus === 'Unsuitable Locally' ? 'Local terrain/load limits' : 'Standard ULB method'}
          </div>
        </div>
      </div>

      {/* Structured Problem Statement */}
      <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
          AI-Structured Problem Statement
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
          {problemStatement}
        </div>
      </div>

      {/* Required Engineering / Scientific Capabilities */}
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
          Required Engineering & Innovation Capabilities (for HEI Matching):
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {capabilities.map((cap, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(99, 102, 241, 0.12)',
                color: 'var(--accent-indigo)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}
            >
              • {cap}
            </span>
          ))}
        </div>
      </div>

      {/* Advisory Notice */}
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.85rem', fontStyle: 'italic', textAlign: 'right' }}>
        * Note: AI assessments are advisory. Authorized Government Nodal Officers maintain binding decision authority.
      </div>
    </div>
  );
};
