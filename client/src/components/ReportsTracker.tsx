import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Layers,
  MapPin,
  Camera,
  ChevronRight,
  RefreshCw,
  ShieldCheck,
  AlertOctagon,
  Sparkles,
  Bell,
  BellRing,
  User,
  CheckCheck,
  Clock,
  ArrowRight,
  Navigation,
} from 'lucide-react';
import type { StoredReport, UserNotification } from '../types';
import { apiFetch } from '../utils/userSession';

interface ReportsTrackerProps {
  onNewReport: () => void;
  onSelectReport: (reportId: string) => void;
  onViewOnMap?: (report: StoredReport) => void;
  initialTab?: 'all' | 'my' | 'following' | 'upvoted' | 'updates';
}

type TrackerTab = 'all' | 'my' | 'following' | 'upvoted' | 'updates';

export const ReportsTracker: React.FC<ReportsTrackerProps> = ({
  onNewReport,
  onSelectReport,
  onViewOnMap,
  initialTab = 'all',
}) => {
  const [activeTab, setActiveTab] = useState<TrackerTab>(initialTab);
  const [allReports, setAllReports] = useState<StoredReport[]>([]);
  const [myReports, setMyReports] = useState<StoredReport[]>([]);
  const [followingReports, setFollowingReports] = useState<StoredReport[]>([]);
  const [upvotedReports, setUpvotedReports] = useState<StoredReport[]>([]);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch all reports + user specific activity
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allRes, activityRes] = await Promise.all([
        apiFetch('/api/reports'),
        apiFetch('/api/user/activity'),
      ]);

      if (allRes.ok) {
        const allData = await allRes.json();
        setAllReports(allData.reports || []);
      }

      if (activityRes.ok) {
        const actData = await activityRes.json();
        setMyReports(actData.myReports || []);
        setFollowingReports(actData.followingReports || []);
        setUpvotedReports(actData.upvotedReports || []);
        setNotifications(actData.notifications || []);
        setUnreadCount(actData.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load tracker reports & activity:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Mark single notification as read
  const handleMarkAsRead = async (notifId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await apiFetch(`/api/user/notifications/${notifId}/read`, { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/api/user/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  // Pick dataset based on tab
  const getActiveDataset = () => {
    switch (activeTab) {
      case 'my':
        return myReports;
      case 'following':
        return followingReports;
      case 'upvoted':
        return upvotedReports;
      case 'all':
      default:
        return allReports;
    }
  };

  const currentDataset = getActiveDataset();

  // Filtered reports
  const filteredReports = currentDataset.filter((rep) => {
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
          <span
            className="badge"
            style={{
              fontSize: '0.68rem',
              backgroundColor: 'rgba(244, 63, 94, 0.15)',
              color: '#f43f5e',
              border: '1px solid rgba(244, 63, 94, 0.3)',
            }}
          >
            <AlertOctagon size={11} /> Follow-up Required
          </span>
        );
      case 'Resolved':
        return (
          <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>
            Resolved · Citizen Verification
          </span>
        );
      case 'In Progress':
        return (
          <span
            className="badge"
            style={{
              fontSize: '0.68rem',
              backgroundColor: 'rgba(249, 115, 22, 0.15)',
              color: '#f97316',
              border: '1px solid rgba(249, 115, 22, 0.3)',
            }}
          >
            ● In Progress
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
      {/* Header Bar with Segmented Tabs */}
      <div className="card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '1rem',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Civic Activity & Lifecycle Tracking</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Track the live 7-stage lifecycle of your reported, followed, and supported civic issues.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={fetchData}
              className="btn btn-secondary btn-sm"
              title="Refresh activity"
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

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-full)',
            padding: '0.25rem',
            gap: '0.25rem',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'all', label: 'All Reports', count: allReports.length, icon: Layers },
            { id: 'my', label: 'My Reports', count: myReports.length, icon: User },
            { id: 'following', label: 'Following', count: followingReports.length, icon: Bell },
            { id: 'upvoted', label: 'Upvoted', count: upvotedReports.length, icon: Sparkles },
            {
              id: 'updates',
              label: 'Updates & Milestones',
              badge: unreadCount > 0 ? unreadCount : undefined,
              icon: BellRing,
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TrackerTab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.78125rem',
                  fontWeight: isActive ? 700 : 500,
                  border: 'none',
                  backgroundColor: isActive ? 'var(--bg-card)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.2)' : 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                <Icon size={13} color={isActive ? 'var(--accent-amber)' : 'currentColor'} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className="mono"
                    style={{
                      fontSize: '0.68rem',
                      opacity: 0.8,
                      backgroundColor: isActive ? 'var(--bg-elevated)' : 'rgba(255,255,255,0.06)',
                      padding: '0.1rem 0.35rem',
                      borderRadius: '8px',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
                {tab.badge && tab.badge > 0 ? (
                  <span
                    className="mono"
                    style={{
                      backgroundColor: 'var(--accent-rose)',
                      color: '#fff',
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '10px',
                    }}
                  >
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Search & Filter Bar (Shown for report tabs) */}
        {activeTab !== 'updates' && (
          <div
            style={{
              display: 'flex',
              gap: '0.65rem',
              marginTop: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
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
        )}
      </div>

      {/* Content Rendering: Report List vs Updates Timeline */}
      {isLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.75rem auto', color: 'var(--accent-amber)' }} />
          <div>Loading civic reports and lifecycle statuses...</div>
        </div>
      ) : activeTab === 'updates' ? (
        /* UPDATES & MILESTONES FEED */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {notifications.length > 0 && unreadCount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.75rem', color: 'var(--text-muted)', gap: '0.35rem' }}
              >
                <CheckCheck size={14} />
                <span>Mark All Read</span>
              </button>
            </div>
          )}

          {notifications.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
              <Bell size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem auto' }} />
              <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>
                No Milestone Updates Yet
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto' }}>
                When you report, upvote, or follow an issue, you will receive real-time notifications here as municipal authorities assign workers, schedule action, and resolve problems.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.is_read) handleMarkAsRead(notif.id);
                  onSelectReport(notif.report_id);
                }}
                className="card"
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  padding: '1.1rem',
                  borderLeft: notif.is_read ? '1px solid var(--border-subtle)' : '3px solid var(--accent-amber)',
                  backgroundColor: notif.is_read ? 'var(--bg-card)' : 'var(--bg-elevated)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', flex: 1 }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: notif.is_read ? 'var(--bg-elevated)' : 'var(--accent-amber-glow)',
                      color: notif.is_read ? 'var(--text-muted)' : 'var(--accent-amber)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    <BellRing size={16} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      {notif.report_code && (
                        <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
                          {notif.report_code}
                        </span>
                      )}
                      {notif.category && (
                        <span className="badge badge-slate" style={{ fontSize: '0.65rem' }}>
                          {notif.category}
                        </span>
                      )}
                      {notif.status && getStatusBadge(notif.status)}
                    </div>

                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {notif.title}
                    </div>

                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {notif.message}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      <Clock size={11} />
                      <span>{new Date(notif.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-amber)', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Track</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            ))
          )}
        </div>
      ) : filteredReports.length === 0 ? (
        /* EMPTY STATE FOR REPORTS */
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <Layers size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem auto' }} />
          <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>
            {activeTab === 'my'
              ? 'No Reports Submitted By You Yet'
              : activeTab === 'following'
              ? 'You Are Not Following Any Issues Yet'
              : activeTab === 'upvoted'
              ? 'You Have Not Upvoted Any Issues Yet'
              : 'No Reports Found'}
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto 1.25rem auto' }}>
            {activeTab === 'my'
              ? 'Submit your first civic issue to start tracking its resolution.'
              : activeTab === 'following'
              ? 'Explore nearby issues in the Community feed and click Follow to receive lifecycle progress updates.'
              : activeTab === 'upvoted'
              ? 'Upvote issues in your community to signal high priority to municipal departments.'
              : 'No incident reports match your current filter criteria.'}
          </p>
          <button type="button" onClick={onNewReport} className="btn btn-primary btn-sm">
            Report Civic Issue
          </button>
        </div>
      ) : (
        /* REPORT CARDS LIST */
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
                transition: 'border-color 0.15s ease',
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

                  {rep.upvote_count !== undefined && rep.upvote_count > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                      <Sparkles size={12} /> {rep.upvote_count} supports
                    </span>
                  )}

                  {rep.media && rep.media.length > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Camera size={12} /> {rep.media.length} media
                    </span>
                  )}

                  <span className="mono">
                    {new Date(rep.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                {onViewOnMap && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewOnMap(rep);
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem', color: 'var(--text-secondary)' }}
                    title="Locate on community map"
                  >
                    <Navigation size={13} color="var(--accent-amber)" />
                    <span>Map</span>
                  </button>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-amber)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Track</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
  },
});
