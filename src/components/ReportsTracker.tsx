import React, { useState, useEffect } from 'react';
import {
  Search,
  Layers,
  MapPin,
  Camera,
  ChevronRight,
  RefreshCw,
  ShieldCheck,
  AlertOctagon,
} from 'lucide-react';
import type { StoredReport } from '../types';

interface ReportsTrackerProps {
  onNewReport: () => void;
  onSelectReport: (reportId: string) => void;
}

export const ReportsTracker: React.FC<ReportsTrackerProps> = ({ onNewReport, onSelectReport }) => {
  const [reports, setReports] = useState<StoredReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch reports from backend
  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Filtered reports
  const filteredReports = reports.filter((rep) => {
    const matchesSearch =
      rep.report_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rep.description && rep.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rep.address && rep.address.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || rep.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || rep.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmed Resolved':
        return (
          <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
            <ShieldCheck size={11} /> Confirmed Resolved
          </span>
        );
      case 'Follow-up Required':
        return (
          <span className="badge" style={{ fontSize: '0.68rem', backgroundColor: 'var(--accent-rose-glow)', color: 'var(--accent-rose)', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
            <AlertOctagon size={11} /> Follow-up Required
          </span>
        );
      case 'Resolved':
        return (
          <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>
            Resolved (Awaiting Citizen)
          </span>
        );
      default:
        return (
          <span className="badge badge-slate" style={{ fontSize: '0.68rem' }}>
            {status}
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Bar */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Civic Incident Registry & Lifecycle</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Click any report to view its full live 7-stage lifecycle, activity timeline, and citizen verification.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={fetchReports}
              className="btn btn-secondary btn-sm"
              title="Refresh reports"
            >
              <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={onNewReport}
              className="btn btn-primary btn-sm"
            >
              <span>+ New Report</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div
          style={{
            display: 'flex',
            gap: '0.65rem',
            marginTop: '1.25rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: '2.25rem', height: '38px', fontSize: '0.8125rem' }}
              placeholder="Search by code (ALC-...), description, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="select"
            style={{ width: 'auto', minWidth: '140px', height: '38px', fontSize: '0.8125rem', padding: '0 0.85rem' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="Water">Water & Drainage</option>
            <option value="Roads">Roads & Transit</option>
            <option value="Sanitation">Sanitation</option>
            <option value="Electricity">Electricity</option>
            <option value="Schools">Schools</option>
            <option value="Agriculture">Agriculture</option>
            <option value="Environment">Environment</option>
            <option value="Public Services">Public Services</option>
            <option value="Other">Other</option>
          </select>

          <select
            className="select"
            style={{ width: 'auto', minWidth: '140px', height: '38px', fontSize: '0.8125rem', padding: '0 0.85rem' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Assigned">Assigned</option>
            <option value="Action Scheduled">Action Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Confirmed Resolved">Confirmed Resolved</option>
            <option value="Follow-up Required">Follow-up Required</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      {isLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading civic reports and lifecycle statuses...
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <Layers size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem auto' }} />
          <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>No Reports Found</div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: '340px', margin: '0 auto 1.25rem auto' }}>
            No incident reports match your current filter criteria.
          </p>
          <button type="button" onClick={onNewReport} className="btn btn-primary btn-sm">
            Create First Report
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filteredReports.map((rep) => (
            <div
              key={rep.id}
              onClick={() => onSelectReport(rep.id)}
              className="card"
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                padding: '1.15rem',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="mono" style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--accent-amber)' }}>
                    {rep.report_code}
                  </span>
                  <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>
                    {rep.category}
                  </span>
                  {getStatusBadge(rep.status)}
                  <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Priority: {rep.civic_priority_score}/100
                  </span>
                </div>

                <div
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                    lineHeight: 1.4,
                  }}
                >
                  {rep.description || 'No written description (Evidence media provided)'}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPin size={12} /> {rep.address || `${rep.latitude?.toFixed(4)}, ${rep.longitude?.toFixed(4)}`}
                  </span>

                  {rep.media && rep.media.length > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Camera size={12} /> {rep.media.length} media attached
                    </span>
                  )}

                  {rep.assignment && (
                    <span style={{ color: 'var(--accent-amber)', fontWeight: 500 }}>
                      • {rep.assignment.department_name}
                    </span>
                  )}

                  <span className="mono">
                    {new Date(rep.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-amber)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Track</span>
                <ChevronRight size={16} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
