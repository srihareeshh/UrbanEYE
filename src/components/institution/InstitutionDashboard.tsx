import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  Award,
  BookOpen,
  Layers,
  CheckCircle2,
  Clock,
  Coins,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useGlobalStore } from '../../store/globalStore';
import type { HEIChallenge, HEIProject, ProjectMilestone, NEPCreditRecord } from '../../types';
import { ClaimChallengeModal } from './ClaimChallengeModal';
import { MilestoneUpdateModal } from './MilestoneUpdateModal';
import { NEPCertificateModal } from './NEPCertificateModal';

export const InstitutionDashboard: React.FC = () => {
  const {
    heiChallenges,
    heiProjects,
    nepCredits,
    claimChallenge,
    updateMilestone,
    generateNEPCertificate,
    refreshAll,
    isLoading,
  } = useGlobalStore();

  const [activeTab, setActiveTab] = useState<'challenges' | 'workspace' | 'nep_registry'>('workspace');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');

  // Modals state
  const [claimTargetChallenge, setClaimTargetChallenge] = useState<HEIChallenge | null>(null);
  const [milestoneTarget, setMilestoneTarget] = useState<{ project: HEIProject; milestone: ProjectMilestone } | null>(null);
  const [viewCertificate, setViewCertificate] = useState<NEPCreditRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered Challenges
  const filteredChallenges = heiChallenges.filter((chal) => {
    if (selectedDeptFilter !== 'all' && !chal.department_match.toLowerCase().includes(selectedDeptFilter.toLowerCase())) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return chal.title.toLowerCase().includes(q) || chal.description.toLowerCase().includes(q) || chal.ward.toLowerCase().includes(q);
    }
    return true;
  });

  const totalResearchHours = heiProjects.reduce((acc, p) => acc + (p.total_research_hours || 0), 0);
  const totalFundingPledged = heiProjects.reduce((acc, p) => acc + (p.funding_pledged || 0), 0);

  return (
    <div style={{ paddingBottom: '3rem' }}>
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

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: 'var(--accent-indigo)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Higher Education Institutions (HEI) · NEP 2020 Innovation Exchange
              </span>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  display: 'inline-block',
                }}
              />
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Live Sync</span>
            </div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.03em', marginTop: '0.15rem' }}>
              University R&D & Capstone Portal
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Sourcing escalated municipal challenges for student capstones, faculty mentoring & NEP 2020 experiential learning credits.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => refreshAll()}
              className="btn btn-secondary"
              disabled={isLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}
            >
              <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
              <span>Sync R&D State</span>
            </button>
          </div>
        </div>
      </div>

      {/* Executive Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '0.85rem',
          marginBottom: '1.75rem',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Open Civic Challenges
            </span>
            <BookOpen size={16} color="var(--accent-indigo)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.35rem', color: 'var(--text-primary)' }}>
            {heiChallenges.length}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Municipal Escalations
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.1rem',
            boxShadow: '0 2px 12px rgba(99, 102, 241, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Active Capstone Projects
            </span>
            <GraduationCap size={16} color="var(--accent-indigo)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.35rem', color: 'var(--accent-indigo)' }}>
            {heiProjects.length}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--accent-indigo)', fontWeight: 600, marginTop: '0.2rem' }}>
            4-Stage Pipeline Active
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Research & Field Hours
            </span>
            <Clock size={16} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.35rem', color: 'var(--text-primary)' }}>
            {totalResearchHours} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>hrs</span>
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Logged to APAAR Registry
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              NEP Credits Awarded
            </span>
            <Award size={16} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.35rem', color: 'var(--accent-emerald)' }}>
            {nepCredits.length * 4.0} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Credits</span>
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--accent-emerald)', fontWeight: 600, marginTop: '0.2rem' }}>
            NCrF Level 5.0 Approved
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              CSR Pilot Escrow
            </span>
            <Coins size={16} color="#ec4899" />
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, marginTop: '0.35rem', color: '#ec4899' }}>
            ₹{(totalFundingPledged / 100000).toFixed(1)}L
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Tata Steel & CSR Grants
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {[
            { id: 'workspace', label: 'Multidisciplinary Capstone Workspace', icon: Layers, count: heiProjects.length },
            { id: 'challenges', label: 'Challenge Discovery & Matchmaker', icon: Sparkles, count: heiChallenges.length },
            { id: 'nep_registry', label: 'NEP 2020 Credit Registry', icon: Award, count: nepCredits.length },
          ].map(({ id, label, icon: Icon, count }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 0.9rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8125rem',
                  fontWeight: isActive ? 700 : 500,
                  backgroundColor: isActive ? 'var(--accent-indigo)' : 'var(--bg-card)',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--accent-indigo)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={15} />
                <span>{label}</span>
                <span
                  className="mono"
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '0 0.35rem',
                    borderRadius: '10px',
                    backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'var(--bg-elevated)',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: MULTIDISCIPLINARY CAPSTONE WORKSPACE */}
      {activeTab === 'workspace' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {heiProjects.map((project) => {
            const stageTitles = [
              'Feasibility & Literature Study',
              'Simulation & CAD Testing',
              'Working Prototype Development',
              'Field Deployment & Municipal Pilot',
            ];

            return (
              <div
                key={project.id}
                className="card"
                style={{
                  padding: '1.35rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  borderTop: '4px solid var(--accent-indigo)',
                }}
              >
                {/* Project Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span
                        className="mono"
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(99, 102, 241, 0.15)',
                          color: 'var(--accent-indigo)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                        }}
                      >
                        {project.institution_name}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Lead: <strong>{project.faculty_lead}</strong>
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {project.title}
                    </h3>
                    <p style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                      {project.abstract}
                    </p>
                  </div>

                  {/* Funding & SDG Status */}
                  <div style={{ textAlign: 'right', minWidth: '180px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>CSR Grant Allocation</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ec4899' }}>
                      ₹{project.funding_pledged.toLocaleString('en-IN')}{' '}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        / ₹{project.funding_goal.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end', marginTop: '0.35rem' }}>
                      {project.sdg_goals.map((sdg) => (
                        <span
                          key={sdg}
                          style={{
                            fontSize: '0.625rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-elevated)',
                            color: 'var(--accent-emerald)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          {sdg.split(':')[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4-STAGE PROJECT MILESTONE PIPELINE */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                    4-Stage Project Milestone Pipeline
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '0.65rem',
                    }}
                  >
                    {[1, 2, 3, 4].map((stageNum) => {
                      const ms = project.milestones?.find((m) => m.stage_index === stageNum);
                      const isCompleted = ms?.status === 'completed';
                      const isInProgress = ms?.status === 'in_progress' || (!ms && project.current_stage === stageNum);

                      return (
                        <div
                          key={stageNum}
                          onClick={() => {
                            if (ms) {
                              setMilestoneTarget({ project, milestone: ms });
                            }
                          }}
                          style={{
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: isCompleted
                              ? 'rgba(16, 185, 129, 0.08)'
                              : isInProgress
                              ? 'rgba(99, 102, 241, 0.12)'
                              : 'var(--bg-card)',
                            border: isCompleted
                              ? '1px solid rgba(16, 185, 129, 0.3)'
                              : isInProgress
                              ? '1.5px solid var(--accent-indigo)'
                              : '1px solid var(--border-subtle)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                            <span
                              className="mono"
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                color: isCompleted ? 'var(--accent-emerald)' : isInProgress ? 'var(--accent-indigo)' : 'var(--text-muted)',
                              }}
                            >
                              Stage {stageNum}
                            </span>
                            {isCompleted ? (
                              <CheckCircle2 size={14} color="var(--accent-emerald)" />
                            ) : isInProgress ? (
                              <Clock size={14} color="var(--accent-indigo)" />
                            ) : null}
                          </div>

                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                            {stageTitles[stageNum - 1]}
                          </div>

                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                            {isCompleted ? '✓ Deliverables Logged' : isInProgress ? '● In Progress (Click to Update)' : 'Pending Unlock'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Student Team & Action Controls */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {/* Team Members */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>Student Team:</span>
                    {project.student_team.map((st) => (
                      <span
                        key={st.studentId}
                        style={{
                          fontSize: '0.6875rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'var(--bg-elevated)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <strong>{st.name}</strong> ({st.apaarId.split('-')[1]}) · {st.hours || 30}h
                      </span>
                    ))}
                  </div>

                  {/* Certificate Generation Trigger */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={async () => {
                        const firstStudent = project.student_team[0];
                        if (firstStudent) {
                          const cert = await generateNEPCertificate({
                            studentName: firstStudent.name,
                            studentId: firstStudent.studentId,
                            apaarId: firstStudent.apaarId,
                            institutionName: project.institution_name,
                            projectId: project.id,
                            researchHours: 64,
                            fieldHours: 20,
                          });
                          if (cert) {
                            setViewCertificate(cert);
                            showToast(`✓ NEP Credit Certificate generated for ${firstStudent.name}`);
                          }
                        }
                      }}
                      className="btn btn-sm"
                      style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid var(--accent-emerald)',
                        color: 'var(--accent-emerald)',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <Award size={14} />
                      <span>Issue NEP Credit Certificate</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: CHALLENGE DISCOVERY & MATCHMAKER */}
      {activeTab === 'challenges' && (
        <div>
          {/* Sub-Filters */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.65rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {['all', 'Environmental', 'Robotics', 'Materials'].map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDeptFilter(dept)}
                  type="button"
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.75rem',
                    fontWeight: selectedDeptFilter === dept ? 700 : 500,
                    backgroundColor: selectedDeptFilter === dept ? 'var(--bg-elevated)' : 'transparent',
                    color: selectedDeptFilter === dept ? 'var(--accent-indigo)' : 'var(--text-muted)',
                    border: selectedDeptFilter === dept ? '1px solid var(--accent-indigo)' : '1px solid transparent',
                    cursor: 'pointer',
                  }}
                >
                  {dept === 'all' ? 'All Departments' : `${dept} Eng.`}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', minWidth: '240px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search challenges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.4rem 0.75rem 0.4rem 2rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.78125rem',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {filteredChallenges.map((chal) => (
              <div
                key={chal.id}
                className="card"
                style={{
                  padding: '1.1rem 1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                        color: 'var(--accent-indigo)',
                      }}
                    >
                      {chal.match_percentage}% Match: {chal.department_match}
                    </span>
                    <span
                      className="mono"
                      style={{
                        fontSize: '0.6875rem',
                        padding: '0.1rem 0.45rem',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-elevated)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {chal.ward}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      color: chal.status === 'open' ? 'var(--accent-emerald)' : 'var(--text-muted)',
                    }}
                  >
                    {chal.status === 'open' ? '● Open for R&D Claim' : '✓ Claimed'}
                  </span>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {chal.title}
                  </h4>
                  <p style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {chal.description}
                  </p>
                  {chal.research_brief && (
                    <div
                      style={{
                        marginTop: '0.45rem',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.72rem',
                        color: 'var(--accent-indigo)',
                      }}
                    >
                      <strong>Research Brief:</strong> {chal.research_brief}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Escalated by: {chal.escalated_by}
                  </div>

                  <button
                    type="button"
                    onClick={() => setClaimTargetChallenge(chal)}
                    className="btn btn-primary btn-sm"
                    style={{
                      backgroundColor: 'var(--accent-indigo)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <GraduationCap size={14} />
                    <span>Claim Challenge for R&D</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: NEP 2020 CREDIT REGISTRY */}
      {activeTab === 'nep_registry' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                  National Credit Framework (NCrF) Student Credit Ledger
                </h3>
                <p style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}>
                  Verifiable experiential learning hours converted to university academic degree credits under NEP 2020.
                </p>
              </div>
            </div>

            {/* Registry Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78125rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Student Name</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>APAAR ID / Roll No</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Institution</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Research Hours</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Field Hours</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>NCrF Credits</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Certificate</th>
                  </tr>
                </thead>
                <tbody>
                  {nepCredits.map((credit) => (
                    <tr key={credit.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {credit.student_name}
                      </td>
                      <td className="mono" style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                        {credit.apaar_id}
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{credit.student_id}</div>
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                        {credit.institution_name}
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                        {credit.research_hours} hrs
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                        {credit.field_hours} hrs
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                        {credit.credits_awarded} Credits
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <button
                          type="button"
                          onClick={() => setViewCertificate(credit)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Award size={13} color="var(--accent-amber)" />
                          <span>View Certificate</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
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
