import React, { useState } from 'react';
import {
  MapPin,
  ChevronRight,
  Sparkles,
  Check,
  Bell,
  BellOff,
  Navigation,
  Droplets,
  Building2,
  Trash2,
  Zap,
  TreePine,
  HelpCircle,
  Users,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import type { StoredReport } from '../types';

interface CommunityIssueCardProps {
  issue: StoredReport;
  onSelectIssue: (issueId: string) => void;
  onViewOnMap: (issue: StoredReport) => void;
  onUpvoteToggle: (issueId: string) => Promise<void>;
  onFollowToggle?: (issueId: string) => Promise<void>;
}

const CATEGORY_META: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  Water: { icon: <Droplets size={13} />, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
  Roads: { icon: <Building2 size={13} />, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  Sanitation: { icon: <Trash2 size={13} />, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
  Electricity: { icon: <Zap size={13} />, color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)' },
  Environment: { icon: <TreePine size={13} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  Schools: { icon: <Building2 size={13} />, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)' },
  Agriculture: { icon: <TreePine size={13} />, color: '#84cc16', bg: 'rgba(132, 204, 22, 0.12)' },
  'Public Services': { icon: <Users size={13} />, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)' },
  Other: { icon: <HelpCircle size={13} />, color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)' },
};

function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'Confirmed Resolved':
      return (
        <span className="badge badge-emerald" style={{ fontSize: '0.68rem', gap: '0.25rem' }}>
          <ShieldCheck size={11} /> Confirmed Resolved
        </span>
      );
    case 'Resolved':
      return (
        <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>
          Resolved · Verification Open
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
    case 'Action Scheduled':
      return (
        <span
          className="badge"
          style={{
            fontSize: '0.68rem',
            backgroundColor: 'rgba(139, 92, 246, 0.15)',
            color: '#a855f7',
            border: '1px solid rgba(139, 92, 246, 0.3)',
          }}
        >
          Action Scheduled
        </span>
      );
    case 'Assigned':
      return (
        <span className="badge badge-indigo" style={{ fontSize: '0.68rem' }}>
          Assigned to Dept
        </span>
      );
    case 'Under Review':
      return (
        <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>
          Under Review
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
          <AlertTriangle size={10} /> Follow-up Required
        </span>
      );
    default:
      return (
        <span className="badge badge-slate" style={{ fontSize: '0.68rem' }}>
          {status}
        </span>
      );
  }
}

export const CommunityIssueCard: React.FC<CommunityIssueCardProps> = ({
  issue,
  onSelectIssue,
  onViewOnMap,
  onUpvoteToggle,
  onFollowToggle,
}) => {
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [justUpvotedAnimation, setJustUpvotedAnimation] = useState(false);

  const catMeta = CATEGORY_META[issue.category] || CATEGORY_META.Other;
  const isUpvoted = !!issue.is_upvoted;
  const isFollowed = !!issue.is_followed;
  const upvoteCount = issue.upvote_count || 0;

  const handleUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUpvoting) return;

    setIsUpvoting(true);
    if (!isUpvoted) {
      setJustUpvotedAnimation(true);
      setTimeout(() => setJustUpvotedAnimation(false), 800);
    }

    try {
      await onUpvoteToggle(issue.id);
    } finally {
      setIsUpvoting(false);
    }
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFollowing || !onFollowToggle) return;

    setIsFollowing(true);
    try {
      await onFollowToggle(issue.id);
    } finally {
      setIsFollowing(false);
    }
  };

  return (
    <div
      onClick={() => onSelectIssue(issue.id)}
      className="card civic-card-hover"
      style={{
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.9rem',
        padding: '1.2rem',
        position: 'relative',
        transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
        border: isUpvoted
          ? '1px solid rgba(245, 158, 11, 0.45)'
          : '1px solid var(--border-subtle)',
        backgroundColor: isUpvoted ? 'var(--bg-card)' : 'var(--bg-card)',
      }}
    >
      {/* Top Meta Header: Badges & Proximity */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          {/* Category Badge */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.2rem 0.55rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: catMeta.color,
              backgroundColor: catMeta.bg,
              border: `1px solid ${catMeta.color}30`,
            }}
          >
            {catMeta.icon}
            <span>{issue.category}</span>
          </span>

          {/* Status Badge */}
          {getStatusBadge(issue.status)}

          {/* Severity Pill */}
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 600,
              color:
                issue.severity === 'Dangerous'
                  ? '#ef4444'
                  : issue.severity === 'Serious'
                  ? '#f97316'
                  : issue.severity === 'Moderate'
                  ? '#f59e0b'
                  : '#10b981',
            }}
          >
            • {issue.severity}
          </span>
        </div>

        {/* Time Reported */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
          }}
        >
          <Clock size={11} />
          <span>{formatTimeAgo(issue.created_at)}</span>
        </div>
      </div>

      {/* Main Content Area: Evidence Thumbnail + Description */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        {/* Photo Thumbnail if available */}
        {issue.photo_url ? (
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              flexShrink: 0,
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-elevated)',
              position: 'relative',
            }}
          >
            <img
              src={issue.photo_url}
              alt={issue.category}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
            />
            {issue.media_count && issue.media_count > 1 ? (
              <span
                className="mono"
                style={{
                  position: 'absolute',
                  bottom: '3px',
                  right: '3px',
                  backgroundColor: 'rgba(0,0,0,0.75)',
                  color: '#fff',
                  fontSize: '0.6rem',
                  padding: '1px 4px',
                  borderRadius: '3px',
                  fontWeight: 600,
                }}
              >
                +{issue.media_count}
              </span>
            ) : null}
          </div>
        ) : (
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              backgroundColor: catMeta.bg,
              border: `1px solid ${catMeta.color}25`,
              color: catMeta.color,
            }}
          >
            {React.cloneElement(catMeta.icon as React.ReactElement<any>, { size: 24 })}
            <span style={{ fontSize: '0.6rem', fontWeight: 700, marginTop: '0.2rem' }}>
              {issue.category}
            </span>
          </div>
        )}

        {/* Text & Area Details */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {issue.report_code}
            </span>
          </div>

          <div
            style={{
              fontSize: '0.9375rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {issue.description || `${issue.category} civic incident reported in this neighborhood.`}
          </div>

          {/* Approximate Area / Distance Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.78125rem',
              color: 'var(--text-secondary)',
              marginTop: '0.15rem',
            }}
          >
            <MapPin size={13} color="var(--accent-amber)" style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 500 }}>
              {issue.approx_location || (issue.address ? `Near ${issue.address.split(',')[0]}` : 'Nearby Civic Zone')}
            </span>
          </div>
        </div>
      </div>

      {/* Community Support & Actions Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '0.8rem',
          marginTop: '0.2rem',
          flexWrap: 'wrap',
          gap: '0.65rem',
        }}
      >
        {/* Collective Support Count & Micro-interaction */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={handleUpvote}
            disabled={isUpvoting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: isUpvoted ? '1px solid var(--accent-amber)' : '1px solid var(--border-medium)',
              backgroundColor: isUpvoted ? 'var(--accent-amber)' : 'var(--bg-elevated)',
              color: isUpvoted ? '#000000' : 'var(--text-primary)',
              transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: justUpvotedAnimation ? 'scale(1.08)' : 'scale(1)',
              boxShadow: isUpvoted ? '0 2px 10px var(--accent-amber-glow)' : 'none',
            }}
            title={isUpvoted ? 'Click to remove support' : 'Upvote to support this civic issue'}
          >
            {isUpvoted ? (
              <Check size={14} strokeWidth={2.6} />
            ) : (
              <Sparkles size={14} color="var(--accent-amber)" />
            )}
            <span>{isUpvoted ? 'Upvoted' : 'Support Issue'}</span>
            <span
              className="mono"
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                backgroundColor: isUpvoted ? 'rgba(0,0,0,0.18)' : 'var(--bg-card)',
                padding: '0.1rem 0.4rem',
                borderRadius: '10px',
                marginLeft: '0.1rem',
              }}
            >
              {upvoteCount}
            </span>
          </button>

          {/* Follow status quick button */}
          {onFollowToggle && (
            <button
              type="button"
              onClick={handleFollow}
              disabled={isFollowing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.38rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: isFollowed ? '1px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
                backgroundColor: isFollowed ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                color: isFollowed ? '#10b981' : 'var(--text-muted)',
                transition: 'all 0.15s ease',
              }}
              title={isFollowed ? 'Following for lifecycle notifications' : 'Follow to receive updates'}
            >
              {isFollowed ? <Bell size={12} /> : <BellOff size={12} />}
              <span>{isFollowed ? 'Following' : 'Follow'}</span>
            </button>
          )}
        </div>

        {/* Secondary Navigation Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewOnMap(issue);
            }}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem', color: 'var(--text-secondary)' }}
            title="Locate on community map"
          >
            <Navigation size={13} color="var(--accent-amber)" />
            <span>Map</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectIssue(issue.id)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', gap: '0.2rem' }}
          >
            <span>Track</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Community Support Context Note */}
      <div
        style={{
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          marginTop: '-0.3rem',
        }}
      >
        <Users size={11} color="var(--accent-amber)" />
        <span>
          {upvoteCount > 0
            ? `${upvoteCount} people in this community support this report`
            : 'Be the first nearby citizen to support this report'}
        </span>
      </div>
    </div>
  );
};
