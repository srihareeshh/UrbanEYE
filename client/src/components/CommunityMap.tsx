import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Navigation,
  Layers,
  Flame,
  Activity,
  X,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  GitBranch,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Filter,
  Maximize2,
} from 'lucide-react';

// ─── Type Definitions ────────────────────────────────────────────────────────

interface MapReport {
  id: string;
  report_code: string;
  category: string;
  severity: string;
  status: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  created_at: string;
  photo_url?: string;
}

interface ClusterData {
  id: string;
  center: { latitude: number; longitude: number };
  count: number;
  reports: MapReport[];
  dominantCategory: string;
  categoryCounts: Record<string, number>;
  severityCounts: Record<string, number>;
  avgPriorityScore: number;
}

interface HotspotData {
  id: string;
  name: string;
  zoneName?: string;
  dominantCategory: string;
  center: { latitude: number; longitude: number };
  radiusMeters: number;
  reportCount: number;
  communitiesImpacted: number;
  recurrenceDays: string;
  trend: string;
  avgPriorityScore: number;
  categoryBreakdown: Record<string, number>;
  reports?: MapReport[];
}

interface PatternData {
  id: string;
  title: string;
  zoneName: string;
  center: { latitude: number; longitude: number };
  connectedReportsCount: number;
  connectedCategories: string[];
  symptoms: string[];
  underlyingHypothesis: string;
  systemicRecommendation: string;
  confidenceScore: number;
  isHypothesis: boolean;
  connectedReports: MapReport[];
}

interface FilterState {
  category: string;
  status: string;
  timeframe: string;
}

interface Props {
  onViewReport: (reportId: string) => void;
  initialSelectedReportId?: string | null;
  initialCenter?: [number, number] | null;
}

// ─── Category Helpers ─────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { hue: string; dot: string }> = {
  Roads: { hue: '#f59e0b', dot: '#f59e0b' },
  Water: { hue: '#3b82f6', dot: '#3b82f6' },
  Sanitation: { hue: '#8b5cf6', dot: '#8b5cf6' },
  Electricity: { hue: '#f97316', dot: '#f97316' },
  Environment: { hue: '#10b981', dot: '#10b981' },
  Schools: { hue: '#06b6d4', dot: '#06b6d4' },
  Agriculture: { hue: '#84cc16', dot: '#84cc16' },
  'Public Services': { hue: '#ec4899', dot: '#ec4899' },
  Other: { hue: '#94a3b8', dot: '#94a3b8' },
};

const SEVERITY_COLORS: Record<string, string> = {
  Dangerous: '#ef4444',
  Serious: '#f97316',
  Moderate: '#f59e0b',
  Low: '#10b981',
};

const STATUS_COLORS: Record<string, string> = {
  Submitted: '#94a3b8',
  'Under Review': '#f59e0b',
  Assigned: '#3b82f6',
  'Action Scheduled': '#8b5cf6',
  'In Progress': '#f97316',
  Resolved: '#10b981',
  'Confirmed Resolved': '#059669',
  'Citizen Confirmation': '#06b6d4',
  'Follow-up Required': '#ef4444',
};

function getCategoryColor(cat?: string): string {
  if (!cat) return '#94a3b8';
  return CATEGORY_COLORS[cat]?.dot ?? '#94a3b8';
}

function formatRelative(dateStr?: string): string {
  if (!dateStr) return 'Recently';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return 'Recently';
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Custom Leaflet Icons ─────────────────────────────────────────────────────

function createReportIcon(category?: string, severity?: string) {
  const safeCategory = typeof category === 'string' && category.trim() ? category.trim() : 'Other';
  const safeSeverity = typeof severity === 'string' && severity.trim() ? severity.trim() : 'Moderate';
  const color = getCategoryColor(safeCategory);
  const severityColor = SEVERITY_COLORS[safeSeverity] ?? color;
  const safeId = safeCategory.replace(/[^a-zA-Z0-9]/g, '_');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38">
      <defs>
        <filter id="shadow_${safeId}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#000" flood-opacity="0.55"/>
        </filter>
      </defs>
      <g filter="url(#shadow_${safeId})">
        <path d="M15 1C7.82 1 2 6.82 2 14c0 6.64 6.7 14.86 12.06 20.91a1.26 1.26 0 0 0 1.88 0C21.3 28.86 28 20.64 28 14 28 6.82 22.18 1 15 1z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
        <circle cx="15" cy="14" r="7.5" fill="#0d1222"/>
        <circle cx="15" cy="14" r="4.5" fill="${severityColor}"/>
      </g>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    iconSize: [30, 38],
    iconAnchor: [15, 38],
    popupAnchor: [0, -40],
    className: 'alch-marker',
  });
}

function createClusterIcon(count: number, dominantCategory?: string, avgPriority: number = 50) {
  const safeCategory = typeof dominantCategory === 'string' && dominantCategory.trim() ? dominantCategory.trim() : 'Other';
  const color = getCategoryColor(safeCategory);
  const safeCount = Number(count) || 1;
  const size = Math.min(68, 42 + Math.floor(safeCount * 2));
  const ring = (Number(avgPriority) || 50) >= 70 ? '#f43f5e' : color;
  const safeId = safeCategory.replace(/[^a-zA-Z0-9]/g, '_');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <filter id="cs_${safeId}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.6"/>
        </filter>
      </defs>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${color}" opacity="0.25" filter="url(#cs_${safeId})"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 5}" fill="${color}" opacity="0.85" stroke="#ffffff" stroke-width="1.5"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 9}" fill="#0d1222"/>
      <text x="${size / 2}" y="${size / 2 + 5}" text-anchor="middle" font-size="${safeCount > 99 ? '11' : '13'}" font-weight="800" fill="${ring}" font-family="monospace">${safeCount}</text>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    className: 'alch-cluster',
  });
}

// ─── Map Dynamic Controller (Headless Hook Component) ──────────────────────────

interface MapControllerProps {
  initialCenter?: [number, number] | null;
  reports: MapReport[];
  hotspots: HotspotData[];
  onMapReady?: (map: L.Map) => void;
  onLocationFound?: (latlng: L.LatLng) => void;
}

function MapViewController({
  initialCenter,
  reports,
  hotspots,
  onMapReady,
  onLocationFound,
}: MapControllerProps) {
  const map = useMap();
  const hasAutoCentered = useRef(false);

  useEffect(() => {
    if (onMapReady) onMapReady(map);
    // Invalidate size on initial mount and after layout renders
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 300);
    const t3 = setTimeout(() => map.invalidateSize(), 600);

    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', handleResize);
    };
  }, [map, onMapReady]);

  useMapEvents({
    locationfound(e) {
      if (onLocationFound) onLocationFound(e.latlng);
    },
  });

  // Handle explicit initialCenter (e.g., from "View on Map" click)
  useEffect(() => {
    if (
      initialCenter &&
      Array.isArray(initialCenter) &&
      !isNaN(Number(initialCenter[0])) &&
      !isNaN(Number(initialCenter[1])) &&
      (Number(initialCenter[0]) !== 0 || Number(initialCenter[1]) !== 0)
    ) {
      try {
        map.flyTo(initialCenter, 16, { duration: 1.2 });
        hasAutoCentered.current = true;
      } catch (e) {
        console.warn('Map flyTo failed:', e);
      }
    }
  }, [initialCenter, map]);

  // Handle auto-fit bounds on initial load if no explicit center was provided
  useEffect(() => {
    if (hasAutoCentered.current || initialCenter) return;

    const coords: [number, number][] = [];

    reports.forEach((r) => {
      const lat = Number(r.latitude);
      const lng = Number(r.longitude);
      if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
        coords.push([lat, lng]);
      }
    });

    hotspots.forEach((h) => {
      const lat = Number(h.center?.latitude);
      const lng = Number(h.center?.longitude);
      if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
        coords.push([lat, lng]);
      }
    });

    if (coords.length > 0) {
      try {
        const bounds = L.latLngBounds(coords);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
          hasAutoCentered.current = true;
        }
      } catch (e) {
        console.warn('Could not fit map bounds:', e);
      }
    }
  }, [reports, hotspots, initialCenter, map]);

  return null;
}

// ─── Bottom Sheet for Single Report ───────────────────────────────────────────

function ReportBottomSheet({
  report,
  onClose,
  onViewReport,
}: {
  report: MapReport;
  onClose: () => void;
  onViewReport: (id: string) => void;
}) {
  const catColor = getCategoryColor(report.category);
  const statusColor = STATUS_COLORS[report.status] ?? '#94a3b8';
  const desc = report.description || 'Civic incident report recorded on Alcheminds.';

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 2000,
        background: 'var(--bg-card)',
        borderTop: `3px solid ${catColor}`,
        borderRadius: '20px 20px 0 0',
        padding: '1.5rem',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
        animation: 'slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        maxWidth: '720px',
        margin: '0 auto',
      }}
    >
      {/* Drag Handle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'var(--border-medium)' }} />
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                background: catColor + '22',
                color: catColor,
                border: `1px solid ${catColor}44`,
                fontFamily: 'monospace',
              }}
            >
              {report.category || 'Civic'}
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                background: statusColor + '20',
                color: statusColor,
                border: `1px solid ${statusColor}44`,
              }}
            >
              {report.status || 'Active'}
            </span>
          </div>
          <div
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.3,
            }}
          >
            {desc.length > 120 ? desc.slice(0, 120) + '…' : desc}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '0.4rem',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            flexShrink: 0,
            marginLeft: '0.75rem',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.65rem',
          marginBottom: '1.25rem',
        }}
      >
        {[
          { label: 'Severity', value: report.severity || 'Moderate', color: SEVERITY_COLORS[report.severity] || catColor },
          { label: 'Reported', value: formatRelative(report.created_at), color: 'var(--text-secondary)' },
          { label: 'Location', value: report.city || report.address?.split(',')[0] || `${Number(report.latitude).toFixed(4)}, ${Number(report.longitude).toFixed(4)}`, color: 'var(--text-secondary)' },
          { label: 'Incident Code', value: report.report_code || report.id, color: 'var(--accent-amber)', mono: true },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              background: 'var(--bg-elevated)',
              borderRadius: '10px',
              padding: '0.65rem 0.85rem',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.2rem' }}>
              {item.label}
            </div>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: item.color,
                fontFamily: (item as any).mono ? 'monospace' : undefined,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={() => onViewReport(report.id)}
        style={{
          width: '100%',
          padding: '0.875rem',
          borderRadius: 'var(--radius-md)',
          background: `linear-gradient(135deg, ${catColor}, ${catColor}cc)`,
          border: 'none',
          color: '#000',
          fontWeight: 700,
          fontSize: '0.9rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          boxShadow: `0 4px 20px ${catColor}44`,
          transition: 'all 0.2s',
        }}
      >
        <ExternalLink size={16} />
        View Full Report & Lifecycle
      </button>
    </div>
  );
}

// ─── Cluster Bottom Sheet ─────────────────────────────────────────────────────

function ClusterBottomSheet({
  cluster,
  onClose,
  onViewReport,
}: {
  cluster: ClusterData;
  onClose: () => void;
  onViewReport: (id: string) => void;
}) {
  const color = getCategoryColor(cluster.dominantCategory);
  const [expanded, setExpanded] = useState(false);
  const clusterReports = cluster.reports || [];

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 2000,
        background: 'var(--bg-card)',
        borderTop: `3px solid ${color}`,
        borderRadius: '20px 20px 0 0',
        padding: '1.5rem',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
        animation: 'slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        maxHeight: '70vh',
        overflowY: 'auto',
        maxWidth: '720px',
        margin: '0 auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'var(--border-medium)' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 8px ${color}`,
              }}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              GEOGRAPHIC CLUSTER
            </span>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {cluster.count} reports · {cluster.dominantCategory || 'Civic'} zone
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '0.4rem',
            cursor: 'pointer',
            color: 'var(--text-muted)',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Category Breakdown */}
      {cluster.categoryCounts && Object.keys(cluster.categoryCounts).length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.5rem' }}>
            CATEGORY BREAKDOWN
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {Object.entries(cluster.categoryCounts).map(([cat, cnt]) => (
              <span
                key={cat}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  background: getCategoryColor(cat) + '22',
                  color: getCategoryColor(cat),
                  border: `1px solid ${getCategoryColor(cat)}44`,
                  fontWeight: 600,
                }}
              >
                {cat} ({cnt})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Avg Priority */}
      <div
        style={{
          background: 'var(--bg-elevated)',
          borderRadius: '10px',
          padding: '0.75rem 1rem',
          border: '1px solid var(--border-subtle)',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Avg Civic Priority Score</span>
        <span
          style={{
            fontSize: '1.1rem',
            fontWeight: 800,
            color: (cluster.avgPriorityScore || 50) >= 70 ? '#ef4444' : color,
            fontFamily: 'monospace',
          }}
        >
          {cluster.avgPriorityScore || 50}/100
        </span>
      </div>

      {/* Individual reports list toggle */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          padding: '0.65rem',
          borderRadius: '10px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-secondary)',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: expanded ? '0.75rem' : 0,
        }}
      >
        <span>View {clusterReports.length} individual reports</span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded &&
        clusterReports.slice(0, 15).map((r) => (
          <div
            key={r.id}
            onClick={() => onViewReport(r.id)}
            style={{
              padding: '0.7rem 0.85rem',
              marginBottom: '0.4rem',
              borderRadius: '10px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'border-color 0.15s',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: getCategoryColor(r.category),
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {r.description || 'Civic Incident'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {r.severity || 'Moderate'} · {formatRelative(r.created_at)}
              </div>
            </div>
            <ExternalLink size={14} color="var(--text-muted)" />
          </div>
        ))}
    </div>
  );
}

// ─── Hotspot Panel ────────────────────────────────────────────────────────────

function HotspotInfoPanel({
  hotspots,
  patterns,
  onClose,
  onFocusHotspot,
}: {
  hotspots: HotspotData[];
  patterns: PatternData[];
  onClose: () => void;
  onFocusHotspot?: (hs: HotspotData) => void;
}) {
  const [tab, setTab] = useState<'hotspots' | 'patterns'>('hotspots');

  const trendColor = (t: string) => {
    if (t === 'Critical') return '#ef4444';
    if (t === 'Increasing') return '#f97316';
    return '#10b981';
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '5.5rem',
        right: '1rem',
        zIndex: 1500,
        width: '320px',
        maxHeight: 'calc(100vh - 8rem)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-medium)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeInRight 0.2s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1rem 1.25rem 0.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: '0.15rem' }}>
            INTELLIGENCE LAYER
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Civic Analysis</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '0.35rem',
            cursor: 'pointer',
            color: 'var(--text-muted)',
          }}
        >
          <X size={15} />
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          padding: '0.5rem 0.75rem',
          gap: '0.35rem',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      >
        {[
          { key: 'hotspots', label: `Hotspots (${hotspots.length})`, icon: <Flame size={13} /> },
          { key: 'patterns', label: `Patterns (${patterns.length})`, icon: <GitBranch size={13} /> },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key as typeof tab)}
            style={{
              flex: 1,
              padding: '0.4rem 0.6rem',
              borderRadius: '8px',
              border: tab === t.key ? '1px solid var(--accent-amber)44' : '1px solid transparent',
              background: tab === t.key ? 'var(--accent-amber-glow)' : 'transparent',
              color: tab === t.key ? 'var(--accent-amber)' : 'var(--text-muted)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ overflowY: 'auto', flex: 1, padding: '0.75rem' }}>
        {tab === 'hotspots' && (
          <>
            {hotspots.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No civic hotspots detected in the current view.
              </div>
            ) : (
              hotspots.map((hs) => {
                const color = getCategoryColor(hs.dominantCategory);
                return (
                  <div
                    key={hs.id}
                    onClick={() => onFocusHotspot && onFocusHotspot(hs)}
                    style={{
                      marginBottom: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${color}44`,
                      background: color + '08',
                      overflow: 'hidden',
                      cursor: onFocusHotspot ? 'pointer' : 'default',
                      transition: 'transform 0.15s, border-color 0.15s',
                    }}
                  >
                    {/* Hotspot Header */}
                    <div
                      style={{
                        padding: '0.7rem 0.85rem 0.5rem',
                        borderBottom: `1px solid ${color}22`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.65rem',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          color: hs.trend === 'Critical' ? '#ef4444' : color,
                          letterSpacing: '0.04em',
                          marginBottom: '0.25rem',
                        }}
                      >
                        CIVIC HOTSPOT
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {hs.dominantCategory} — {hs.zoneName || hs.name?.split(' ')[0] || 'Zone'}
                      </div>
                    </div>
                    {/* Stats */}
                    <div style={{ padding: '0.65rem 0.85rem' }}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '0.4rem',
                          marginBottom: '0.5rem',
                        }}
                      >
                        {[
                          { label: 'Reports', value: String(hs.reportCount || 0) },
                          { label: 'Communities', value: String(hs.communitiesImpacted || 1) },
                          { label: 'Span', value: hs.recurrenceDays || 'Active' },
                          { label: 'Trend', value: hs.trend || 'Monitoring' },
                        ].map(({ label, value }) => (
                          <div
                            key={label}
                            style={{
                              background: 'var(--bg-elevated)',
                              borderRadius: '8px',
                              padding: '0.45rem 0.55rem',
                            }}
                          >
                            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>
                              {label}
                            </div>
                            <div
                              style={{
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                color: label === 'Trend' ? trendColor(value) : 'var(--text-primary)',
                              }}
                            >
                              {value}
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Category chips */}
                      {hs.categoryBreakdown && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {Object.entries(hs.categoryBreakdown).map(([cat, cnt]) => (
                            <span
                              key={cat}
                              style={{
                                fontSize: '0.65rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: 'var(--radius-full)',
                                background: getCategoryColor(cat) + '20',
                                color: getCategoryColor(cat),
                                fontWeight: 600,
                              }}
                            >
                              {cat} {cnt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {tab === 'patterns' && (
          <>
            {patterns.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No systemic patterns detected yet.
              </div>
            ) : (
              patterns.map((p) => (
                <div
                  key={p.id}
                  style={{
                    marginBottom: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    background: 'rgba(99, 102, 241, 0.05)',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '0.75rem 0.85rem 0.5rem', borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
                    <div
                      style={{
                        fontSize: '0.62rem',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        color: '#818cf8',
                        marginBottom: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <GitBranch size={11} />
                      HYPOTHESIS · {Math.round((p.confidenceScore || 0.75) * 100)}% CONFIDENCE
                    </div>
                    <div style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {p.title}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {p.connectedReportsCount} connected reports · {p.zoneName || 'Area'}
                    </div>
                  </div>

                  <div style={{ padding: '0.75rem 0.85rem' }}>
                    {p.symptoms && p.symptoms.length > 0 && (
                      <div style={{ marginBottom: '0.65rem' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.35rem' }}>
                          OBSERVED SYMPTOMS
                        </div>
                        {p.symptoms.map((s, i) => (
                          <div
                            key={i}
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                              padding: '0.2rem 0',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                            }}
                          >
                            <span style={{ color: '#818cf8', fontSize: '0.9rem', lineHeight: 1 }}>•</span>
                            {s}
                          </div>
                        ))}
                      </div>
                    )}

                    <div
                      style={{
                        background: 'rgba(99, 102, 241, 0.08)',
                        borderRadius: '8px',
                        padding: '0.6rem 0.75rem',
                        marginBottom: '0.5rem',
                        borderLeft: '3px solid #818cf8',
                      }}
                    >
                      <div style={{ fontSize: '0.65rem', color: '#818cf8', fontWeight: 700, marginBottom: '0.2rem' }}>
                        POTENTIAL UNDERLYING PROBLEM
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {p.underlyingHypothesis}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Filters Bar ──────────────────────────────────────────────────────────────

function FiltersBar({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}) {
  const categories = ['All', 'Roads', 'Water', 'Sanitation', 'Electricity', 'Environment', 'Other'];
  const statuses = ['All', 'Active', 'Resolved', 'Emerging'];
  const timeframes = ['All', 'Today', '7 Days', '30 Days'];

  const chip = (
    label: string,
    active: boolean,
    onClick: () => void,
    color?: string
  ) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      style={{
        padding: '0.3rem 0.7rem',
        borderRadius: 'var(--radius-full)',
        border: active ? `1px solid ${color ?? 'var(--accent-amber)'}` : '1px solid var(--border-subtle)',
        background: active ? (color ? color + '20' : 'var(--accent-amber-glow)') : 'var(--bg-elevated)',
        color: active ? (color ?? 'var(--accent-amber)') : 'var(--text-secondary)',
        fontSize: '0.75rem',
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        right: '1rem',
        zIndex: 1000,
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-medium)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        padding: '0.75rem 1rem',
        maxWidth: '840px',
        margin: '0 auto',
      }}
    >
      {/* Category row */}
      <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.4rem', marginBottom: '0.4rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
          <Layers size={13} color="var(--text-muted)" />
        </div>
        {categories.map((c) =>
          chip(
            c,
            filters.category === c || (c === 'All' && !filters.category),
            () => onChange({ ...filters, category: c === 'All' ? '' : c }),
            c !== 'All' ? getCategoryColor(c) : undefined
          )
        )}
      </div>

      {/* Status & Timeframe row */}
      <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
          <Filter size={12} color="var(--text-muted)" />
        </div>
        {statuses.map((s) =>
          chip(
            s,
            filters.status === s || (s === 'All' && !filters.status),
            () => onChange({ ...filters, status: s === 'All' ? '' : s })
          )
        )}
        <div style={{ width: '1px', background: 'var(--border-subtle)', flexShrink: 0, margin: '0 0.25rem' }} />
        {timeframes.map((t) =>
          chip(
            t,
            filters.timeframe === t || (t === 'All' && !filters.timeframe),
            () => onChange({ ...filters, timeframe: t === 'All' ? '' : t })
          )
        )}
      </div>
    </div>
  );
}

// ─── Stats Overlay ────────────────────────────────────────────────────────────

function StatsOverlay({ reports, clusters, hotspots }: { reports: MapReport[]; clusters: ClusterData[]; hotspots: HotspotData[] }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '1.5rem',
        left: '1rem',
        zIndex: 1000,
        display: 'flex',
        gap: '0.5rem',
      }}
    >
      {[
        { label: 'Reports', value: reports.length, color: 'var(--accent-amber)' },
        { label: 'Clusters', value: clusters.length, color: '#3b82f6' },
        { label: 'Hotspots', value: hotspots.length, color: '#ef4444' },
      ].map((stat) => (
        <div
          key={stat.label}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: '10px',
            padding: '0.4rem 0.75rem',
            boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: stat.color, fontFamily: 'monospace', lineHeight: 1 }}>
            {stat.value}
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 500 }}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main CommunityMap Component ──────────────────────────────────────────────

export const CommunityMap: React.FC<Props> = ({
  onViewReport,
  initialSelectedReportId,
  initialCenter,
}) => {
  const [reports, setReports] = useState<MapReport[]>([]);
  const [clusters, setClusters] = useState<ClusterData[]>([]);
  const [hotspots, setHotspots] = useState<HotspotData[]>([]);
  const [patterns, setPatterns] = useState<PatternData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({ category: '', status: '', timeframe: '' });
  const [selectedReport, setSelectedReport] = useState<MapReport | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<ClusterData | null>(null);
  const [showIntelligence, setShowIntelligence] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const defaultCenter: [number, number] = [19.076, 72.8777]; // Default Mumbai / fallback

  const buildQuery = (f: FilterState) => {
    const params = new URLSearchParams();
    if (f.category) params.set('category', f.category);
    if (f.status) params.set('status', f.status);
    if (f.timeframe) params.set('timeframe', f.timeframe);
    return params.toString();
  };

  const fetchData = useCallback(async (f: FilterState) => {
    setLoading(true);
    setError(null);
    try {
      const qs = buildQuery(f);
      const [mapRes, hotspotRes, patternRes] = await Promise.all([
        fetch(`/api/map/reports?${qs}`),
        fetch(`/api/map/hotspots?${qs}`),
        fetch(`/api/map/patterns?${qs}`),
      ]);

      const mapData = await mapRes.json();
      const hotspotData = await hotspotRes.json();
      const patternData = await patternRes.json();

      const fetchedReports = (mapData.reports || []).filter(
        (r: any) => r && !isNaN(Number(r.latitude)) && !isNaN(Number(r.longitude))
      );
      setReports(fetchedReports);
      setClusters(mapData.clusters || []);
      setHotspots(hotspotData.hotspots || []);
      setPatterns(patternData.patterns || []);

      // If deep-linked report ID is passed, auto-select it and open bottom sheet
      if (initialSelectedReportId && fetchedReports.length > 0) {
        const match = fetchedReports.find(
          (r: MapReport) => r.id === initialSelectedReportId || r.report_code === initialSelectedReportId
        );
        if (match) {
          setSelectedReport(match);
        }
      }
    } catch (e: any) {
      console.error('Failed to load map data:', e);
      setError('Failed to load map data. Please verify the backend server is running.');
    } finally {
      setLoading(false);
    }
  }, [initialSelectedReportId]);

  useEffect(() => {
    fetchData(filters);
  }, [filters, fetchData]);

  // Handle deep-link report selection whenever initialSelectedReportId changes
  useEffect(() => {
    if (initialSelectedReportId && reports.length > 0) {
      const match = reports.find(
        (r) => r.id === initialSelectedReportId || r.report_code === initialSelectedReportId
      );
      if (match) {
        setSelectedReport(match);
        setSelectedCluster(null);
      }
    }
  }, [initialSelectedReportId, reports]);

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setSelectedReport(null);
    setSelectedCluster(null);
  };

  const handleLocateMe = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.locate({ setView: true, maxZoom: 15 });
    }
  };

  const handleFitAll = () => {
    if (!mapInstanceRef.current) return;
    const coords: [number, number][] = [];
    reports.forEach((r) => {
      const lat = Number(r.latitude);
      const lng = Number(r.longitude);
      if (!isNaN(lat) && !isNaN(lng)) coords.push([lat, lng]);
    });
    hotspots.forEach((h) => {
      const lat = Number(h.center?.latitude);
      const lng = Number(h.center?.longitude);
      if (!isNaN(lat) && !isNaN(lng)) coords.push([lat, lng]);
    });
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  };

  const handleFocusHotspot = (hs: HotspotData) => {
    if (!mapInstanceRef.current || !hs.center) return;
    const lat = Number(hs.center.latitude);
    const lng = Number(hs.center.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      mapInstanceRef.current.flyTo([lat, lng], 15, { duration: 1 });
      setShowIntelligence(false);
    }
  };

  // Filter single reports vs multi clusters safely
  const singleReports = (clusters || [])
    .filter((c) => c && c.count === 1 && c.reports && c.reports.length > 0 && c.reports[0])
    .map((c) => c.reports[0])
    .filter((r) => r && !isNaN(Number(r.latitude)) && !isNaN(Number(r.longitude)));

  const multiClusters = (clusters || []).filter(
    (c) => c && c.count > 1 && c.center && !isNaN(Number(c.center.latitude)) && !isNaN(Number(c.center.longitude))
  );

  const validHotspots = (hotspots || []).filter(
    (hs) => hs && hs.center && !isNaN(Number(hs.center.latitude)) && !isNaN(Number(hs.center.longitude))
  );

  // Individual reports to render: either unclustered single reports or all reports fallback
  const reportsToRender =
    clusters && clusters.length > 0
      ? singleReports
      : (reports || []).filter((r) => r && !isNaN(Number(r.latitude)) && !isNaN(Number(r.longitude)));

  return (
    <div
      className="community-map-wrapper"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 'calc(100vh - 70px)',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      {/* Leaflet Custom Map Styles */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeInRight {
          from { transform: translateX(16px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .alch-marker, .alch-cluster {
          background: transparent !important;
          border: none !important;
          cursor: pointer;
        }
        .leaflet-container {
          background: var(--bg-primary) !important;
          font-family: inherit !important;
          width: 100% !important;
          height: 100% !important;
          min-height: 100% !important;
        }
        .leaflet-control-zoom {
          border: 1px solid var(--border-medium) !important;
          border-radius: 10px !important;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0,0,0,0.4) !important;
        }
        .leaflet-control-zoom-in, .leaflet-control-zoom-out {
          background: var(--bg-card) !important;
          color: var(--text-secondary) !important;
          border: none !important;
          font-size: 16px !important;
          line-height: 28px !important;
          width: 28px !important;
          height: 28px !important;
        }
        .leaflet-control-zoom-in:hover, .leaflet-control-zoom-out:hover {
          background: var(--bg-elevated) !important;
          color: var(--accent-amber) !important;
        }
        .leaflet-control-attribution {
          background: var(--bg-card) !important;
          color: var(--text-muted) !important;
          font-size: 10px !important;
        }
        .leaflet-control-attribution a {
          color: var(--text-muted) !important;
        }
      `}</style>

      {/* Filters Bar */}
      <FiltersBar filters={filters} onChange={handleFiltersChange} />

      {/* Interactive Map */}
      <MapContainer
        center={initialCenter || defaultCenter}
        zoom={12}
        style={{ width: '100%', height: '100%', minHeight: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapViewController
          initialCenter={initialCenter}
          reports={reports}
          hotspots={validHotspots}
          onMapReady={(map) => {
            mapInstanceRef.current = map;
          }}
          onLocationFound={(latlng) => setUserPos([latlng.lat, latlng.lng])}
        />

        {/* User live location marker */}
        {userPos && (
          <Marker
            position={userPos}
            icon={L.divIcon({
              html: `<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 0 4px rgba(59,130,246,0.3)"></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8],
              className: 'alch-marker',
            })}
          />
        )}

        {/* Civic Hotspot overlays */}
        {showHotspots &&
          validHotspots.map((hs) => {
            const color = getCategoryColor(hs.dominantCategory);
            const ringColor = hs.trend === 'Critical' ? '#ef4444' : hs.trend === 'Increasing' ? '#f97316' : color;
            const centerPos: [number, number] = [Number(hs.center.latitude), Number(hs.center.longitude)];
            return (
              <React.Fragment key={hs.id}>
                <Circle
                  center={centerPos}
                  radius={hs.radiusMeters || 500}
                  pathOptions={{
                    color: ringColor,
                    fillColor: ringColor,
                    fillOpacity: 0.08,
                    weight: 1.5,
                    dashArray: '6, 4',
                    opacity: 0.6,
                  }}
                  eventHandlers={{
                    click: () => {
                      if (hs.reports && hs.reports.length > 0) {
                        setSelectedCluster({
                          id: hs.id,
                          center: hs.center,
                          count: hs.reportCount,
                          reports: hs.reports,
                          dominantCategory: hs.dominantCategory,
                          categoryCounts: hs.categoryBreakdown || {},
                          severityCounts: {},
                          avgPriorityScore: hs.avgPriorityScore,
                        });
                        setSelectedReport(null);
                      }
                    },
                  }}
                />
                <Circle
                  center={centerPos}
                  radius={(hs.radiusMeters || 500) * 0.35}
                  pathOptions={{
                    color: ringColor,
                    fillColor: ringColor,
                    fillOpacity: 0.16,
                    weight: 0,
                  }}
                />
              </React.Fragment>
            );
          })}

        {/* Individual report markers */}
        {reportsToRender.map((report) => (
          <Marker
            key={report.id}
            position={[Number(report.latitude), Number(report.longitude)]}
            icon={createReportIcon(report.category, report.severity)}
            eventHandlers={{
              click: () => {
                setSelectedReport(report);
                setSelectedCluster(null);
              },
            }}
          />
        ))}

        {/* Cluster markers */}
        {multiClusters.map((cluster) => (
          <Marker
            key={cluster.id}
            position={[Number(cluster.center.latitude), Number(cluster.center.longitude)]}
            icon={createClusterIcon(cluster.count, cluster.dominantCategory, cluster.avgPriorityScore)}
            eventHandlers={{
              click: () => {
                setSelectedCluster(cluster);
                setSelectedReport(null);
              },
            }}
          />
        ))}
      </MapContainer>

      {/* Loading overlay */}
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: '6rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2000,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: '10px',
            padding: '0.65rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
        >
          <RefreshCw size={14} color="var(--accent-amber)" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Loading civic data…</span>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: '6rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2000,
            background: 'var(--bg-card)',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: '10px',
            padding: '0.65rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
        >
          <AlertTriangle size={14} color="#ef4444" />
          <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 500 }}>{error}</span>
        </div>
      )}

      {/* Stats Overlay */}
      {!loading && <StatsOverlay reports={reports} clusters={clusters} hotspots={hotspots} />}

      {/* Map Control Buttons (right side overlay) */}
      <div
        style={{
          position: 'absolute',
          top: '5.5rem',
          right: '1rem',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
        }}
      >
        {/* Intelligence Panel Toggle */}
        <button
          type="button"
          onClick={() => setShowIntelligence(!showIntelligence)}
          title="Civic Intelligence & Analysis"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: showIntelligence ? 'var(--accent-amber-glow)' : 'var(--bg-card)',
            border: `1px solid ${showIntelligence ? 'var(--accent-amber)' : 'var(--border-medium)'}`,
            color: showIntelligence ? 'var(--accent-amber)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
            transition: 'all 0.2s',
          }}
        >
          <Activity size={17} />
        </button>

        {/* Hotspot visibility toggle */}
        <button
          type="button"
          onClick={() => setShowHotspots(!showHotspots)}
          title={showHotspots ? 'Hide hotspot zones' : 'Show hotspot zones'}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: showHotspots ? 'rgba(239,68,68,0.12)' : 'var(--bg-card)',
            border: `1px solid ${showHotspots ? 'rgba(239,68,68,0.4)' : 'var(--border-medium)'}`,
            color: showHotspots ? '#ef4444' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
            transition: 'all 0.2s',
          }}
        >
          {showHotspots ? <Eye size={17} /> : <EyeOff size={17} />}
        </button>

        {/* Fit All Reports */}
        <button
          type="button"
          onClick={handleFitAll}
          title="Fit all reports in view"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
            transition: 'all 0.2s',
          }}
        >
          <Maximize2 size={16} />
        </button>

        {/* Go to my location */}
        <button
          type="button"
          onClick={handleLocateMe}
          title="Go to my location"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            color: 'var(--accent-amber)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
            transition: 'all 0.2s',
          }}
        >
          <Navigation size={16} />
        </button>

        {/* Refresh map */}
        <button
          type="button"
          onClick={() => fetchData(filters)}
          title="Refresh map"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
            transition: 'all 0.2s',
          }}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Intelligence Panel */}
      {showIntelligence && (
        <HotspotInfoPanel
          hotspots={validHotspots}
          patterns={patterns}
          onClose={() => setShowIntelligence(false)}
          onFocusHotspot={handleFocusHotspot}
        />
      )}

      {/* Bottom Sheets */}
      {selectedReport && !selectedCluster && (
        <ReportBottomSheet
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onViewReport={(id) => {
            setSelectedReport(null);
            onViewReport(id);
          }}
        />
      )}

      {selectedCluster && !selectedReport && (
        <ClusterBottomSheet
          cluster={selectedCluster}
          onClose={() => setSelectedCluster(null)}
          onViewReport={(id) => {
            setSelectedCluster(null);
            onViewReport(id);
          }}
        />
      )}
    </div>
  );
};
export default CommunityMap;
