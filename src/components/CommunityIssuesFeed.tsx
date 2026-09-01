import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  MapPin,
  Flame,
  RefreshCw,
  Compass,
  Building2,
  Droplets,
  Trash2,
  Zap,
  TreePine,
  Sparkles,
  Layers,
  ChevronDown,
  Navigation,
} from 'lucide-react';
import { CommunityIssueCard } from './CommunityIssueCard';
import { PriorityFilter, type PriorityFilterValue } from './PriorityFilter';
import type { StoredReport, CommunitySortOption } from '../types';
import {
  getCitizenLocation,
  setCitizenLocation,
  PRESET_COMMUNITY_AREAS,
  apiFetch,
  type SavedUserLocation,
} from '../utils/userSession';

interface CommunityIssuesFeedProps {
  onSelectIssue: (issueId: string) => void;
  onViewOnMap: (issue: StoredReport) => void;
  onShowToast: (msg: string) => void;
}

const CATEGORIES: Array<{ id: string; label: string; icon: React.FC<{ size?: number }> }> = [
  { id: 'all', label: 'All Issues', icon: Layers },
  { id: 'Water', label: 'Water', icon: Droplets },
  { id: 'Roads', label: 'Roads', icon: Building2 },
  { id: 'Sanitation', label: 'Sanitation', icon: Trash2 },
  { id: 'Electricity', label: 'Electricity', icon: Zap },
  { id: 'Environment', label: 'Environment', icon: TreePine },
  { id: 'Schools', label: 'Schools', icon: Building2 },
];

export const CommunityIssuesFeed: React.FC<CommunityIssuesFeedProps> = ({
  onSelectIssue,
  onViewOnMap,
  onShowToast,
}) => {
  const [issues, setIssues] = useState<StoredReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState<CommunitySortOption>('nearby');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<PriorityFilterValue>('all');
  const [currentLocation, setCurrentLocation] = useState<SavedUserLocation>(getCitizenLocation());
  const [isLocationSelectorOpen, setIsLocationSelectorOpen] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const locationSelectorRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        locationSelectorRef.current &&
        !locationSelectorRef.current.contains(e.target as Node)
      ) {
        setIsLocationSelectorOpen(false);
      }
    };
    if (isLocationSelectorOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLocationSelectorOpen]);

  // Fetch Community Issues from API
  const fetchCommunityIssues = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        lat: currentLocation.latitude.toString(),
        lng: currentLocation.longitude.toString(),
        sort: selectedSort,
        category: selectedCategory,
        priority: selectedPriority,
        search: searchQuery,
      });

      const res = await apiFetch(`/api/community/issues?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setIssues(data.issues || []);
      }
    } catch (err) {
      console.error('Failed to load community issues:', err);
      onShowToast('Could not load community feed. Please retry.');
    } finally {
      setIsLoading(false);
    }
  }, [currentLocation, selectedSort, selectedCategory, selectedPriority, searchQuery, onShowToast]);

  useEffect(() => {
    fetchCommunityIssues();
  }, [fetchCommunityIssues]);

  // Handle GPS location detection
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      onShowToast('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const detected: SavedUserLocation = {
          name: 'My Device Location',
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setCurrentLocation(detected);
        setCitizenLocation(detected);
        setIsDetectingGps(false);
        setIsLocationSelectorOpen(false);
        onShowToast('📍 Location updated from device GPS');
      },
      (err) => {
        console.warn('GPS detection error:', err.message);
        setIsDetectingGps(false);
        onShowToast('Location access denied. Using selected area.');
      },
      { timeout: 8000 }
    );
  };

  const handleSelectPresetArea = (area: SavedUserLocation) => {
    setCurrentLocation(area);
    setCitizenLocation(area);
    setIsLocationSelectorOpen(false);
    onShowToast(`📍 Area set to: ${area.name}`);
  };

  // Upvote toggle handler with optimistic update
  const handleUpvoteToggle = async (issueId: string) => {
    // Optimistic frontend update
    setIssues((prev) =>
      prev.map((item) => {
        if (item.id === issueId) {
          const nextIsUpvoted = !item.is_upvoted;
          const currentCount = item.upvote_count || 0;
          return {
            ...item,
            is_upvoted: nextIsUpvoted,
            upvote_count: nextIsUpvoted ? currentCount + 1 : Math.max(0, currentCount - 1),
            is_followed: nextIsUpvoted ? true : item.is_followed, // Auto-follow on upvote
          };
        }
        return item;
      })
    );

    try {
      const res = await apiFetch(`/api/reports/${issueId}/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        // Sync with authoritative server response
        setIssues((prev) =>
          prev.map((item) => {
            if (item.id === issueId) {
              return {
                ...item,
                is_upvoted: data.is_upvoted,
                upvote_count: data.upvote_count,
                is_followed: data.is_followed,
                follower_count: data.follower_count,
              };
            }
            return item;
          })
        );

        if (data.is_upvoted) {
          onShowToast('✓ Support recorded! You are now tracking updates for this issue.');
        } else {
          onShowToast('Support removed.');
        }
      }
    } catch (e) {
      console.error('Upvote failed:', e);
      onShowToast('Failed to record support. Please check connection.');
      fetchCommunityIssues(); // Revert
    }
  };

  // Follow toggle handler
  const handleFollowToggle = async (issueId: string) => {
    setIssues((prev) =>
      prev.map((item) => {
        if (item.id === issueId) {
          const nextFollow = !item.is_followed;
          const currentCount = item.follower_count || 0;
          return {
            ...item,
            is_followed: nextFollow,
            follower_count: nextFollow ? currentCount + 1 : Math.max(0, currentCount - 1),
          };
        }
        return item;
      })
    );

    try {
      const res = await apiFetch(`/api/reports/${issueId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        setIssues((prev) =>
          prev.map((item) => {
            if (item.id === issueId) {
              return {
                ...item,
                is_followed: data.is_followed,
                follower_count: data.follower_count,
              };
            }
            return item;
          })
        );
        onShowToast(data.message || (data.is_followed ? 'Following issue' : 'Unfollowed issue'));
      }
    } catch (e) {
      console.error('Follow failed:', e);
      fetchCommunityIssues();
    }
  };

  // Calculate high-level stats for banner
  const activeCount = issues.filter(
    (i) => i.status !== 'Confirmed Resolved' && i.status !== 'Resolved'
  ).length;
  const totalUpvotes = issues.reduce((acc, curr) => acc + (curr.upvote_count || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Header Banner: Civic Participation Context & Proximity */}
      <div className="card" style={{ position: 'relative', overflow: 'visible', zIndex: 30 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Community Issues & Civic Support
              </h1>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: '580px', lineHeight: 1.45 }}>
              Discover issues reported by citizens near you. Upvote reports to signal community priority to municipalities, and follow them for real-time remediation updates.
            </p>
          </div>

          {/* Location Area Picker Dropdown */}
          <div ref={locationSelectorRef} style={{ position: 'relative', zIndex: 50 }}>
            <button
              type="button"
              onClick={() => setIsLocationSelectorOpen(!isLocationSelectorOpen)}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-medium)',
              }}
            >
              <MapPin size={14} color="var(--accent-amber)" />
              <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{currentLocation.name}</span>
              <ChevronDown size={14} />
            </button>

            {/* Dropdown Menu */}
            {isLocationSelectorOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 0.4rem)',
                  left: 0,
                  width: '280px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 12px 36px rgba(0,0,0,0.65)',
                  zIndex: 200,
                  padding: '0.5rem',
                }}
              >
                <div style={{ padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Select Neighborhood / Zone
                </div>

                {/* GPS Option */}
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  disabled={isDetectingGps}
                  className="btn btn-ghost btn-sm"
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    gap: '0.5rem',
                    padding: '0.5rem 0.65rem',
                    color: 'var(--accent-amber)',
                    fontWeight: 600,
                  }}
                >
                  <Navigation size={14} className={isDetectingGps ? 'spin' : ''} />
                  <span>{isDetectingGps ? 'Detecting GPS...' : 'Use Current Device GPS'}</span>
                </button>

                <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '0.35rem 0' }} />

                {PRESET_COMMUNITY_AREAS.map((area) => (
                  <button
                    key={area.name}
                    type="button"
                    onClick={() => handleSelectPresetArea(area)}
                    className="btn btn-ghost btn-sm"
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      gap: '0.45rem',
                      padding: '0.45rem 0.65rem',
                      fontSize: '0.78125rem',
                      backgroundColor: currentLocation.name === area.name ? 'var(--bg-card)' : 'transparent',
                      color: currentLocation.name === area.name ? 'var(--accent-amber)' : 'var(--text-primary)',
                      fontWeight: currentLocation.name === area.name ? 700 : 400,
                    }}
                  >
                    <MapPin size={12} />
                    <span>{area.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Civic Signal Stats Bar */}
        <div
          style={{
            display: 'flex',
            gap: '1.25rem',
            marginTop: '1.15rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Compass size={14} color="var(--accent-amber)" />
            <span style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{issues.length}</strong> Community Reports Nearby
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Flame size={14} color="#f97316" />
            <span style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{activeCount}</strong> Active Under Remediation
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={14} color="var(--accent-emerald)" />
            <span style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{totalUpvotes}</strong> Collective Community Supports
            </span>
          </div>
        </div>
      </div>

      {/* 2. Controls: Search, Sort Segmented Tabs & Category Filters */}
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Top Row: Search Input & Sort Tabs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            {/* Search Input */}
            <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
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
                placeholder="Search issues, road names, problem types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Sort Segmented Control */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                padding: '0.2rem',
                gap: '0.2rem',
              }}
            >
              {[
                { id: 'nearby', label: 'Nearby' },
                { id: 'supported', label: 'Most Supported' },
                { id: 'recent', label: 'Recent' },
                { id: 'serious', label: 'Serious' },
              ].map((opt) => {
                const isActive = selectedSort === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedSort(opt.id as CommunitySortOption)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.78125rem',
                      fontWeight: isActive ? 700 : 500,
                      border: 'none',
                      backgroundColor: isActive ? 'var(--bg-card)' : 'transparent',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                      boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.2)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchCommunityIssues}
              className="btn btn-secondary btn-sm"
              style={{ height: '36px', padding: '0 0.75rem' }}
              title="Refresh feed"
            >
              <RefreshCw size={13} className={isLoading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Bottom Row: Category Filter Pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              overflowX: 'auto',
              paddingBottom: '0.2rem',
              scrollbarWidth: 'none',
            }}
          >
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: isActive ? 700 : 500,
                    border: isActive
                      ? '1px solid var(--accent-amber)'
                      : '1px solid var(--border-subtle)',
                    backgroundColor: isActive ? 'var(--accent-amber)' : 'var(--bg-elevated)',
                    color: isActive ? '#000000' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={12} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Priority Bucket Filter */}
          <div style={{ paddingTop: '0.45rem', borderTop: '1px solid var(--border-subtle)' }}>
            <PriorityFilter
              selectedPriority={selectedPriority}
              onSelectPriority={setSelectedPriority}
            />
          </div>
        </div>
      </div>

      {/* 3. Community Feed Content */}
      {isLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.75rem auto', color: 'var(--accent-amber)' }} />
          <div style={{ fontWeight: 600 }}>Loading nearby community issues...</div>
          <div style={{ fontSize: '0.78125rem', marginTop: '0.25rem' }}>Computing proximity and civic upvote metrics</div>
        </div>
      ) : issues.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Layers size={40} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem auto' }} />
          <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.35rem' }}>
            No Reports Found In This Area
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 1.25rem auto' }}>
            No civic reports match your search query or category filter in {currentLocation.name}.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="btn btn-secondary btn-sm"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {issues.map((issue) => (
            <CommunityIssueCard
              key={issue.id}
              issue={issue}
              onSelectIssue={onSelectIssue}
              onViewOnMap={onViewOnMap}
              onUpvoteToggle={handleUpvoteToggle}
              onFollowToggle={handleFollowToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};
