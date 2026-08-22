import React, { useState } from 'react';
import {
  X,
  Building2,
  GraduationCap,
  Wrench,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { StoredReport } from '../../types';

interface MunicipalTriageModalProps {
  issue: StoredReport | null;
  onClose: () => void;
  onDispatchWorkOrder: (params: {
    reportId: string;
    departmentName: string;
    officerName: string;
    targetHours: number;
    priority: string;
    notes: string;
  }) => Promise<boolean>;
  onEscalateToHEI: (params: {
    reportId: string;
    researchDomain: string;
    researchBrief: string;
    departmentMatch: string;
    matchPercentage: number;
  }) => Promise<boolean>;
  onShowToast: (msg: string) => void;
}

const DEPARTMENTS = [
  { name: 'Water Supply & Sewerage Board (Drainage Wing)', officer: 'Eng. R. Shinde', defaultSLA: 24 },
  { name: 'Roads & Traffic Infrastructure Directorate', officer: 'Insp. A. Kulkarni', defaultSLA: 48 },
  { name: 'Solid Waste Management & Sanitation Dept', officer: 'Supervisor S. Patil', defaultSLA: 24 },
  { name: 'Power Distribution & Emergency Grid Wing', officer: 'Eng. V. Nair', defaultSLA: 12 },
  { name: 'Public School & Healthcare Infrastructure', officer: 'Duty Officer M. Fernandes', defaultSLA: 36 },
];

const HEI_DEPARTMENTS = [
  { dept: 'Environmental & Civil Engineering Dept', match: 96, domain: 'Hydrology, Biosand/Biochar Filtration & Canal Drainage' },
  { dept: 'Robotics, Mechanical & IoT Sensing Dept', match: 92, domain: 'Autonomous Sub-surface Culvert Desilting & Edge Sonar' },
  { dept: 'Materials Science & Transportation Engineering', match: 94, domain: 'Polymer Cold Pave Bitumen & Wet Weather Adhesion' },
  { dept: 'Chemical Engineering & Water Treatment Lab', match: 89, domain: 'Arsenic & Heavy Metal In-Situ Chemical Sequestration' },
];

export const MunicipalTriageModal: React.FC<MunicipalTriageModalProps> = ({
  issue,
  onClose,
  onDispatchWorkOrder,
  onEscalateToHEI,
  onShowToast,
}) => {
  if (!issue) return null;

  const [activePath, setActivePath] = useState<'routine' | 'hei'>('routine');
  const [submitting, setSubmitting] = useState(false);

  // Path A: Routine Work Order State
  const [selectedDeptIndex, setSelectedDeptIndex] = useState(0);
  const [targetHours, setTargetHours] = useState(DEPARTMENTS[0].defaultSLA);
  const [priority, setPriority] = useState('High');
  const [crewNotes, setCrewNotes] = useState(
    `Deploy Ward 14 maintenance team to inspect and repair ${issue.category.toLowerCase()} issue within scheduled SLA window.`
  );

  // Path B: HEI Escalation State
  const [selectedHeiIndex, setSelectedHeiIndex] = useState(0);
  const [researchBrief, setResearchBrief] = useState(
    `Recurring structural challenge identified in ${issue.address || 'Ward 14'}. Seeking multidisciplinary capstone team to develop scalable working prototype.`
  );

  const handleRoutineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const dept = DEPARTMENTS[selectedDeptIndex];
    const success = await onDispatchWorkOrder({
      reportId: issue.id,
      departmentName: dept.name,
      officerName: dept.officer,
      targetHours,
      priority,
      notes: crewNotes,
    });
    setSubmitting(false);
    if (success) {
      onShowToast(`✓ Work order assigned to ${dept.officer} (${targetHours}h SLA)`);
      onClose();
    } else {
      onShowToast('Failed to dispatch work order.');
    }
  };

  const handleHeiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const heiDept = HEI_DEPARTMENTS[selectedHeiIndex];
    const success = await onEscalateToHEI({
      reportId: issue.id,
      departmentMatch: heiDept.dept,
      matchPercentage: heiDept.match,
      researchDomain: heiDept.domain,
      researchBrief,
    });
    setSubmitting(false);
    if (success) {
      onShowToast(`✓ Escalated to Higher Education R&D Repository (${heiDept.dept})`);
      onClose();
    } else {
      onShowToast('Failed to escalate to HEI.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-elevated)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--accent-amber)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building2 size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Municipal Triage Action Portal</h3>
                <span
                  className="mono"
                  style={{
                    fontSize: '0.6875rem',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--accent-amber)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {issue.report_code}
                </span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Select remediation path: Routine Municipal Crew Dispatch vs. Academic HEI R&D Escalation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '0.4rem', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* Issue Summary Card */}
          <div
            style={{
              padding: '0.9rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {issue.category} Incident
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.45rem',
                    borderRadius: '4px',
                    backgroundColor: issue.severity === 'Dangerous' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: issue.severity === 'Dangerous' ? 'var(--accent-rose)' : 'var(--accent-amber)',
                  }}
                >
                  AI Severity: {issue.severity}
                </span>
              </div>
              <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Civic Priority: {issue.civic_priority_score || 75}/100
              </span>
            </div>
            <p style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {issue.description}
            </p>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              📍 {issue.address || 'Ward 14 West, Mumbai'}
            </div>
          </div>

          {/* Two-Path Action Switcher Tabs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              marginBottom: '1.25rem',
              backgroundColor: 'var(--bg-input)',
              padding: '0.25rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={() => setActivePath('routine')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: activePath === 'routine' ? 'var(--bg-card)' : 'transparent',
                color: activePath === 'routine' ? 'var(--accent-amber)' : 'var(--text-secondary)',
                border: activePath === 'routine' ? '1px solid var(--accent-amber)' : '1px solid transparent',
                fontWeight: activePath === 'routine' ? 700 : 500,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Wrench size={16} />
              <span>Path A: Routine Work Order</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePath('hei')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: activePath === 'hei' ? 'var(--bg-card)' : 'transparent',
                color: activePath === 'hei' ? 'var(--accent-indigo)' : 'var(--text-secondary)',
                border: activePath === 'hei' ? '1px solid var(--accent-indigo)' : '1px solid transparent',
                fontWeight: activePath === 'hei' ? 700 : 500,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <GraduationCap size={16} />
              <span>Path B: Escalate to HEI R&D</span>
            </button>
          </div>

          {/* PATH A: Routine Work Order Form */}
          {activePath === 'routine' ? (
            <form onSubmit={handleRoutineSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Target Department & Field Engineer
                </label>
                <select
                  value={selectedDeptIndex}
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    setSelectedDeptIndex(idx);
                    setTargetHours(DEPARTMENTS[idx].defaultSLA);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8125rem',
                  }}
                >
                  {DEPARTMENTS.map((dept, idx) => (
                    <option key={dept.name} value={idx}>
                      {dept.name} — {dept.officer} (Default: {dept.defaultSLA}h)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    SLA Target Turnaround
                  </label>
                  <select
                    value={targetHours}
                    onChange={(e) => setTargetHours(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)',
                      fontSize: '0.8125rem',
                    }}
                  >
                    <option value={12}>12 Hours (Emergency Grid)</option>
                    <option value={24}>24 Hours (Urgent Sanitation / Water)</option>
                    <option value={48}>48 Hours (Standard Roads / Pavements)</option>
                    <option value={72}>72 Hours (Routine Structural)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Dispatch Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)',
                      fontSize: '0.8125rem',
                    }}
                  >
                    <option value="Emergency Priority (Level 1)">Emergency Priority (Level 1)</option>
                    <option value="High">High Priority</option>
                    <option value="Standard">Standard Work Order</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Field Crew Remediation Instructions
                </label>
                <textarea
                  rows={3}
                  value={crewNotes}
                  onChange={(e) => setCrewNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8125rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary btn-lg"
                style={{
                  backgroundColor: 'var(--accent-amber)',
                  color: '#000',
                  fontWeight: 800,
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>{submitting ? 'Dispatching Crew...' : 'Dispatch Routine Work Order'}</span>
                <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            /* PATH B: HEI Escalation Form */
            <form onSubmit={handleHeiSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                }}
              >
                <Sparkles size={20} color="var(--accent-indigo)" />
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent-indigo)' }}>
                    AI Department Matchmaker Active
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Escalating will open this challenge for multidisciplinary student capstone teams under NEP 2020.
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Target Academic Department Match
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {HEI_DEPARTMENTS.map((hei, idx) => {
                    const isSelected = selectedHeiIndex === idx;
                    return (
                      <div
                        key={hei.dept}
                        onClick={() => setSelectedHeiIndex(idx)}
                        style={{
                          padding: '0.65rem 0.85rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: isSelected ? 'var(--bg-elevated)' : 'var(--bg-input)',
                          border: isSelected ? '1.5px solid var(--accent-indigo)' : '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.78125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {hei.dept}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                            Domain: {hei.domain}
                          </div>
                        </div>
                        <span
                          className="mono"
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(99, 102, 241, 0.2)',
                            color: 'var(--accent-indigo)',
                          }}
                        >
                          {hei.match}% Match
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Problem Statement & Research Brief for University Labs
                </label>
                <textarea
                  rows={3}
                  value={researchBrief}
                  onChange={(e) => setResearchBrief(e.target.value)}
                  placeholder="Outline the recurring structural challenge, physical constraints, and desired prototype specs..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8125rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary btn-lg"
                style={{
                  backgroundColor: 'var(--accent-indigo)',
                  color: '#fff',
                  fontWeight: 800,
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>{submitting ? 'Publishing Challenge...' : 'Publish to HEI Innovation Exchange'}</span>
                <ArrowRight size={16} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
