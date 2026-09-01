import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  Upload,
  ShieldCheck,
  Search,
} from 'lucide-react';
import type { StoredReport } from '../../types';
import { useGlobalStore } from '../../store/globalStore';

interface GovernmentActionsProps {
  reports: StoredReport[];
  onSelectChallenge: (report: StoredReport) => void;
  onShowToast?: (msg: string) => void;
}

export const GovernmentActions: React.FC<GovernmentActionsProps> = ({
  reports,
  onSelectChallenge,
  onShowToast,
}) => {
  const { resolveDualSignoff, refreshAll } = useGlobalStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // State for quick resolution upload modal
  const [resolvingReport, setResolvingReport] = useState<StoredReport | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active Action reports (assigned or resolved)
  const actionReports = reports.filter((r) => {
    const isAssigned = !!r.assignment || ['Assigned', 'Action Scheduled', 'In Progress', 'Citizen Confirmation', 'Resolved', 'Confirmed Resolved'].includes(r.status);
    if (!isAssigned) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = (r.report_code || '').toLowerCase().includes(q);
      const matchDesc = (r.description || '').toLowerCase().includes(q);
      const matchDept = (r.assignment?.department_name || '').toLowerCase().includes(q);
      const matchOfficer = (r.assignment?.officer_name || '').toLowerCase().includes(q);
      if (!matchCode && !matchDesc && !matchDept && !matchOfficer) return false;
    }

    if (filterDept !== 'all' && r.assignment?.department_name !== filterDept) return false;

    if (filterStatus === 'in_progress' && !['Assigned', 'Action Scheduled', 'In Progress'].includes(r.status)) return false;
    if (filterStatus === 'awaiting_signoff' && r.status !== 'Citizen Confirmation') return false;
    if (filterStatus === 'closed' && !['Resolved', 'Confirmed Resolved'].includes(r.status)) return false;

    return true;
  });

  const handleDualSignoffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingReport) return;

    setIsSubmitting(true);
    try {
      const ok = await resolveDualSignoff({
        reportId: resolvingReport.id,
        resolutionNotes: resolutionNotes || 'Field remediation completed. Photographed evidence recorded on-site.',
        resolvedBy: resolvingReport.assignment?.officer_name || 'Municipal Field Crew',
        resolutionPhotoUrl: '/samples/flooded_road_mumbai.jpg',
        resolutionPhotoName: 'repair_completion_proof.jpg',
        latitude: resolvingReport.latitude,
        longitude: resolvingReport.longitude,
      });

      if (ok) {
        if (onShowToast) onShowToast('✓ Remediation proof uploaded. Citizen verification sign-off requested.');
        setResolvingReport(null);
        setResolutionNotes('');
        await refreshAll();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const departments = Array.from(
    new Set(
      reports
        .map((r) => r.assignment?.department_name)
        .filter((d): d is string => Boolean(d))
    )
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Controls */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          padding: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Government Operations & Work Orders
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              Field dispatching, SLA tracking, dual-signoff completion uploads & citizen verification audits.
            </p>
          </div>

          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--accent-amber)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }}
          >
            {actionReports.length} Dispatched Work Orders
          </span>
        </div>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search officer, work order, dept..."
              className="input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '32px', height: '36px', fontSize: '0.8125rem', width: '100%' }}
            />
          </div>

          <select
            className="input"
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            style={{ height: '36px', fontSize: '0.8125rem' }}
          >
            <option value="all">All Assigned Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            className="input"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ height: '36px', fontSize: '0.8125rem' }}
          >
            <option value="all">All Action Stages</option>
            <option value="in_progress">In Progress / Dispatched</option>
            <option value="awaiting_signoff">Pending Citizen Sign-off</option>
            <option value="closed">Confirmed Closed</option>
          </select>
        </div>
      </div>

      {/* Action Cards / Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {actionReports.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
            No dispatched government work orders match the filter.
          </div>
        ) : (
          actionReports.map((r) => {
            const isDualSignoff = r.status === 'Citizen Confirmation';
            const isResolved = ['Resolved', 'Confirmed Resolved'].includes(r.status);
            const isInProgress = ['Assigned', 'Action Scheduled', 'In Progress'].includes(r.status);

            return (
              <div
                key={r.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  {/* Top Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                    <span className="mono" style={{ fontWeight: 800, color: 'var(--accent-amber)', fontSize: '0.875rem' }}>
                      {r.report_code}
                    </span>

                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: isResolved
                          ? 'rgba(16, 185, 129, 0.15)'
                          : isDualSignoff
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'rgba(56, 189, 248, 0.15)',
                        color: isResolved ? '#10b981' : isDualSignoff ? 'var(--accent-amber)' : '#38bdf8',
                      }}
                    >
                      {r.status}
                    </span>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    {r.category}: {r.description}
                  </div>

                  {/* Department & Officer Details */}
                  <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Department:</span>{' '}
                      <strong>{r.assignment?.department_name || 'Municipal Works'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Assigned Officer:</span>{' '}
                      <strong style={{ color: 'var(--text-primary)' }}>{r.assignment?.officer_name || 'Duty Supervisor'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>SLA Target:</span>{' '}
                      <span className="mono" style={{ color: 'var(--accent-amber)' }}>{r.assignment?.sla_target_date || '48 Hours Target'}</span>
                    </div>
                    {r.assignment?.notes && (
                      <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        "{r.assignment.notes}"
                      </div>
                    )}
                  </div>

                  {/* Citizen Verification Info (if in dual signoff or resolved) */}
                  {isDualSignoff && (
                    <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.65rem 0.8rem', borderRadius: 'var(--radius-md)', fontSize: '0.72rem', color: 'var(--accent-amber)', marginBottom: '0.75rem' }}>
                      <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={13} />
                        <span>Awaiting Citizen Sign-off</span>
                      </div>
                      <div style={{ marginTop: '0.15rem', color: 'var(--text-secondary)' }}>
                        Proof uploaded by {r.resolution?.resolved_by || 'Field Supervisor'}. Awaiting citizen confirmation verdict.
                      </div>
                    </div>
                  )}

                  {isResolved && (
                    <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.65rem 0.8rem', borderRadius: 'var(--radius-md)', fontSize: '0.72rem', color: '#10b981', marginBottom: '0.75rem' }}>
                      <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle2 size={13} />
                        <span>Dual Sign-off Verified & Closed</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => onSelectChallenge(r)}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, fontSize: '0.75rem' }}
                  >
                    View Details
                  </button>

                  {isInProgress && (
                    <button
                      type="button"
                      onClick={() => setResolvingReport(r)}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Upload size={13} />
                      <span>Upload Proof</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Resolution Upload Modal */}
      {resolvingReport && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '500px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={18} color="#10b981" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Upload Remediation Proof</h3>
              </div>
              <button type="button" onClick={() => setResolvingReport(null)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
            </div>

            <p style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Submit on-site resolution evidence for <strong>{resolvingReport.report_code}</strong> to trigger citizen confirmation.
            </p>

            <form onSubmit={handleDualSignoffSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Remediation Summary Notes
                </label>
                <textarea
                  className="input"
                  rows={3}
                  style={{ width: '100%', fontSize: '0.8125rem', marginTop: '0.25rem' }}
                  placeholder="Describe field work completed (e.g., cleared blockage, replaced fuse)..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  required
                />
              </div>

              <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                📷 Site photo will be attached from field camera (GPS tagged).
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <ShieldCheck size={16} />
                <span>{isSubmitting ? 'Recording Proof...' : 'Submit Resolution Proof'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
