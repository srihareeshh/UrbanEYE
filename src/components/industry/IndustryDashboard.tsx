import React, { useState } from 'react';
import {
  Coins,
  Lock,
  Unlock,
  CheckCircle2,
  FileCheck,
  Sparkles,
  Users,
  Search,
  RefreshCw,
  Globe,
  Plus,
} from 'lucide-react';
import { useGlobalStore } from '../../store/globalStore';
import type { HEIProject, CSRGrant } from '../../types';
import { CSRPledgeModal } from './CSRPledgeModal';
import { CSRAuditReportModal } from './CSRAuditReportModal';
import { MentorRegisterModal } from './MentorRegisterModal';

export const IndustryDashboard: React.FC = () => {
  const {
    heiProjects,
    csrGrants,
    corporateMentors,
    pledgeCSRGrant,
    releaseEscrowTranche,
    registerMentor,
    refreshAll,
    isLoading,
  } = useGlobalStore();

  const [activeTab, setActiveTab] = useState<'marketplace' | 'escrow' | 'mentorship'>('marketplace');
  const [selectedSDGFilter, setSelectedSDGFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [pledgeTargetProject, setPledgeTargetProject] = useState<HEIProject | null>(null);
  const [auditTargetGrant, setAuditTargetGrant] = useState<CSRGrant | null>(null);
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered Projects for Marketplace
  const filteredProjects = heiProjects.filter((proj) => {
    if (selectedSDGFilter !== 'all') {
      const hasSDG = proj.sdg_goals.some((s) => s.toLowerCase().includes(selectedSDGFilter.toLowerCase()));
      if (!hasSDG) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        proj.title.toLowerCase().includes(q) ||
        (proj.abstract || '').toLowerCase().includes(q) ||
        proj.institution_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalCommitted = csrGrants.reduce((acc, g) => acc + (g.pledge_amount || g.total_pledge_amount || 0), 0);
  const totalDisbursed = csrGrants.reduce((acc, g) => acc + g.disbursed_amount, 0);
  const totalInEscrow = totalCommitted - totalDisbursed;

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
            border: '1px solid #ec4899',
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
          <Sparkles size={17} color="#ec4899" />
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
                  color: '#ec4899',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Industry, CSR Corporates & Innovation Investors
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
              Corporate CSR & Tech Transfer Hub
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Schedule VII CSR milestone grants, smart escrow disbursement, student mentorship & patent tech transfer.
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
              <span>Refresh Grants</span>
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
              Total CSR Committed
            </span>
            <Coins size={16} color="#ec4899" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.35rem', color: 'var(--text-primary)' }}>
            ₹{totalCommitted.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Schedule VII Statutory Capital
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.1rem',
            boxShadow: '0 2px 12px rgba(16, 185, 129, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Disbursed to Universities
            </span>
            <CheckCircle2 size={16} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.35rem', color: 'var(--accent-emerald)' }}>
            ₹{totalDisbursed.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--accent-emerald)', fontWeight: 600, marginTop: '0.2rem' }}>
            Tranche 1 Verified & Released
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
              Locked in Smart Escrow
            </span>
            <Lock size={16} color="#ec4899" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.35rem', color: '#ec4899' }}>
            ₹{totalInEscrow.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Awaiting Stage 4 Municipal Pilot
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
              Corporate Mentors
            </span>
            <Users size={16} color="var(--accent-indigo)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.35rem', color: 'var(--accent-indigo)' }}>
            {corporateMentors.length} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Engineers</span>
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Weekly Capstone Reviews
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
              Section 80G Exemption
            </span>
            <FileCheck size={16} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.35rem', color: 'var(--text-primary)' }}>
            100% <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tax Credit</span>
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--accent-emerald)', fontWeight: 600, marginTop: '0.2rem' }}>
            MCA CSR-1 Form Compliant
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
            { id: 'marketplace', label: 'Societal Innovation Marketplace', icon: Globe, count: heiProjects.length },
            { id: 'escrow', label: 'Milestone-Based Escrow Manager', icon: Lock, count: csrGrants.length },
            { id: 'mentorship', label: 'Corporate Mentorship & Tech Transfer', icon: Users, count: corporateMentors.length },
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
                  backgroundColor: isActive ? '#ec4899' : 'var(--bg-card)',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  border: isActive ? '1px solid #ec4899' : '1px solid var(--border-subtle)',
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

      {/* TAB 1: SOCIETAL INNOVATION MARKETPLACE */}
      {activeTab === 'marketplace' && (
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
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {['all', 'SDG 6', 'SDG 11', 'SDG 9', 'SDG 3'].map((sdg) => (
                <button
                  key={sdg}
                  onClick={() => setSelectedSDGFilter(sdg)}
                  type="button"
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.75rem',
                    fontWeight: selectedSDGFilter === sdg ? 700 : 500,
                    backgroundColor: selectedSDGFilter === sdg ? 'var(--bg-elevated)' : 'transparent',
                    color: selectedSDGFilter === sdg ? '#ec4899' : 'var(--text-muted)',
                    border: selectedSDGFilter === sdg ? '1px solid #ec4899' : '1px solid transparent',
                    cursor: 'pointer',
                  }}
                >
                  {sdg === 'all' ? 'All SDG Goals' : sdg}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', minWidth: '240px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search prototypes, universities..."
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredProjects.map((proj) => {
              const fundingPct = Math.min(100, Math.round((proj.funding_pledged / proj.funding_goal) * 100));

              return (
                <div
                  key={proj.id}
                  className="card"
                  style={{
                    padding: '1.25rem 1.4rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    borderLeft: '4px solid #ec4899',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span
                          className="mono"
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(236, 72, 153, 0.15)',
                            color: '#ec4899',
                            border: '1px solid rgba(236, 72, 153, 0.3)',
                          }}
                        >
                          {proj.institution_name}
                        </span>

                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-elevated)',
                            color: 'var(--accent-indigo)',
                          }}
                        >
                          TRL Stage {proj.current_stage}/4
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {proj.title}
                      </h3>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>CSR Capital Funded</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ec4899' }}>
                        ₹{proj.funding_pledged.toLocaleString('en-IN')}{' '}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          / ₹{proj.funding_goal.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {proj.abstract}
                  </p>

                  {/* Progress bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      <span>Escrow Capital Progress:</span>
                      <strong style={{ color: fundingPct >= 100 ? 'var(--accent-emerald)' : '#ec4899' }}>{fundingPct}%</strong>
                    </div>
                    <div
                      style={{
                        height: '6px',
                        borderRadius: '3px',
                        backgroundColor: 'var(--bg-elevated)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${fundingPct}%`,
                          height: '100%',
                          backgroundColor: fundingPct >= 100 ? 'var(--accent-emerald)' : '#ec4899',
                        }}
                      />
                    </div>
                  </div>

                  {/* Deliverable Previews & SDG Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {proj.sdg_goals.map((sdg) => (
                        <span
                          key={sdg}
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: 'var(--accent-emerald)',
                          }}
                        >
                          {sdg}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setPledgeTargetProject(proj)}
                      className="btn btn-primary btn-sm"
                      style={{
                        backgroundColor: '#ec4899',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <Coins size={14} />
                      <span>Pledge CSR Grant via Smart Escrow</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: MILESTONE-BASED ESCROW MANAGER */}
      {activeTab === 'escrow' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {csrGrants.map((grant) => (
            <div
              key={grant.id}
              className="card"
              style={{
                padding: '1.35rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                borderTop: '4px solid #ec4899',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {grant.corporate_name}
                      <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                        CIN: {grant.cin || grant.cin_number}
                      </span>
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {grant.project_title || 'Modular Activated Biochar Gravity Filter'}
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setAuditTargetGrant(grant)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <FileCheck size={14} color="#ec4899" />
                    <span>Download CSR-1 Audit Receipt</span>
                  </button>
                </div>
              </div>

              {/* Escrow Tranches Table */}
              <div
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
                  Smart Escrow Tranche Release Schedule
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {grant.tranches?.map((tr) => {
                    const isReleased = tr.status === 'disbursed' || tr.status === 'released';

                    return (
                      <div
                        key={tr.id}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--bg-card)',
                          border: isReleased ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                              Tranche {tr.tranche_number} ({tr.percentage}%)
                            </span>
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '0.1rem 0.4rem',
                                borderRadius: '4px',
                                backgroundColor: isReleased ? 'rgba(16, 185, 129, 0.15)' : 'rgba(236, 72, 153, 0.15)',
                                color: isReleased ? 'var(--accent-emerald)' : '#ec4899',
                              }}
                            >
                              {isReleased ? '✓ Disbursed' : 'Locked in Escrow'}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                            {tr.condition_milestone || tr.trigger_condition}
                          </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <span className="mono" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            ₹{tr.amount.toLocaleString('en-IN')}
                          </span>

                          {!isReleased && (
                            <button
                              type="button"
                              onClick={async () => {
                                const success = await releaseEscrowTranche(tr.id);
                                if (success) {
                                  showToast(`✓ Tranche ${tr.tranche_number} (₹${tr.amount.toLocaleString('en-IN')}) released to university research bank account!`);
                                }
                              }}
                              className="btn btn-sm"
                              style={{
                                backgroundColor: '#ec4899',
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                              }}
                            >
                              <Unlock size={13} />
                              <span>Release Tranche</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Mentorship Hub */}
      {activeTab === 'mentorship' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Header Banner */}
          <div
            style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Industry Technical Mentorship Registry
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Corporate engineers, data scientists, and project managers mentoring student teams for 2-4 hrs/week.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowMentorModal(true)}
              className="btn btn-primary"
              style={{
                backgroundColor: '#ec4899',
                color: '#fff',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <Plus size={16} />
              <span>Register Corporate Mentor</span>
            </button>
          </div>

          {/* Mentors Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {corporateMentors.map((mentor) => (
              <div
                key={mentor.id}
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {mentor.name}
                  </div>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.45rem',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--accent-emerald)',
                    }}
                  >
                    {(mentor.hours_per_week || 3)}h/week
                  </span>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <strong>{mentor.designation}</strong> · {mentor.company}
                </div>

                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                  {(mentor.expertise || (mentor.expertise_domain ? mentor.expertise_domain.split(', ') : ['Sustainability'])).map((exp: string) => (
                    <span
                      key={exp}
                      style={{
                        fontSize: '0.625rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {exp}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CSR Pledge Modal */}
      {pledgeTargetProject && (
        <CSRPledgeModal
          project={pledgeTargetProject}
          onClose={() => setPledgeTargetProject(null)}
          onPledge={pledgeCSRGrant}
          onShowToast={showToast}
        />
      )}

      {/* CSR Audit Report Modal */}
      {auditTargetGrant && (
        <CSRAuditReportModal
          grant={auditTargetGrant}
          onClose={() => setAuditTargetGrant(null)}
        />
      )}

      {/* Mentor Register Modal */}
      {showMentorModal && (
        <MentorRegisterModal
          onClose={() => setShowMentorModal(false)}
          onRegister={registerMentor}
          onShowToast={showToast}
        />
      )}
    </div>
  );
};
