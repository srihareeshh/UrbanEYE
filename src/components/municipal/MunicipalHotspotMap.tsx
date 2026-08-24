import React, { useState, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Flame,
  Layers,
  MapPin,
} from 'lucide-react';
import type { StoredReport } from '../../types';

// Custom Map Marker Icons for Leaflet
const createHotspotIcon = (color: string, iconHtml: string) => {
  return L.divIcon({
    className: 'custom-hotspot-pin',
    html: `
      <div style="
        background-color: ${color};
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        border: 2px solid white;
        box-shadow: 0 4px 14px rgba(0,0,0,0.5);
        cursor: pointer;
      ">
        ${iconHtml}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -32],
  });
};

const DANGEROUS_ICON = createHotspotIcon('#f43f5e', '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>');
const SERIOUS_ICON = createHotspotIcon('#f59e0b', '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>');
const HEI_ICON = createHotspotIcon('#6366f1', '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>');

interface MunicipalHotspotMapProps {
  issues: StoredReport[];
  selectedWard: string;
  onSelectIssue: (issue: StoredReport) => void;
}

export interface DynamicHotspotZone {
  id: string;
  name: string;
  ward: string;
  lat: number;
  lng: number;
  radius: number;
  riskScore: number;
  chronicType: string;
  activeIncidents: number;
  escalatedToHEI: boolean;
  color: string;
}

export const MunicipalHotspotMap: React.FC<MunicipalHotspotMapProps> = ({
  issues,
  selectedWard,
  onSelectIssue,
}) => {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  // Filter issues by ward and valid coordinates
  const filteredIssues = useMemo(() => {
    return issues.filter((iss) => {
      if (selectedWard !== 'all' && iss.address && !iss.address.toLowerCase().includes(selectedWard.toLowerCase())) {
        return false;
      }
      return typeof iss.latitude === 'number' && typeof iss.longitude === 'number';
    });
  }, [issues, selectedWard]);

  // Dynamically cluster real reported issues into hotspot zones
  const dynamicZones = useMemo<DynamicHotspotZone[]>(() => {
    if (filteredIssues.length === 0) return [];

    const clusters: { [key: string]: StoredReport[] } = {};

    filteredIssues.forEach((iss) => {
      // Group nearby issues by rounding lat/lng to ~1-2km grid
      const gridKey = `${iss.latitude.toFixed(2)}_${iss.longitude.toFixed(2)}`;
      if (!clusters[gridKey]) {
        clusters[gridKey] = [];
      }
      clusters[gridKey].push(iss);
    });

    return Object.entries(clusters).map(([key, group], index) => {
      const avgLat = group.reduce((acc, curr) => acc + curr.latitude, 0) / group.length;
      const avgLng = group.reduce((acc, curr) => acc + curr.longitude, 0) / group.length;
      const maxScore = Math.max(...group.map((g) => g.civic_priority_score || 50));
      const hasHei = group.some((g) => (g as any).is_escalated_to_hei || (g as any).hei_challenge);
      const isDangerous = group.some((g) => g.severity === 'Dangerous' || g.severity === 'Critical');
      const primaryCategory = group[0].category || 'Civic Infrastructure';
      const wardName = group[0].city || group[0].address || `Zone ${index + 1}`;

      return {
        id: `zone_${key}_${index}`,
        name: `${primaryCategory} Hotspot (${wardName})`,
        ward: wardName,
        lat: avgLat,
        lng: avgLng,
        radius: Math.min(300 + group.length * 80, 800),
        riskScore: maxScore,
        chronicType: `${group.length} reported ${primaryCategory.toLowerCase()} issue${group.length > 1 ? 's' : ''}`,
        activeIncidents: group.filter((g) => !['Resolved', 'Confirmed Resolved'].includes(g.status)).length,
        escalatedToHEI: hasHei,
        color: isDangerous ? '#f43f5e' : maxScore > 75 ? '#f59e0b' : '#3b82f6',
      };
    });
  }, [filteredIssues]);

  const activeZone = dynamicZones.find((z) => z.id === selectedZoneId) || dynamicZones[0] || null;

  const defaultCenter: [number, number] = filteredIssues.length > 0
    ? [filteredIssues[0].latitude, filteredIssues[0].longitude]
    : [19.0760, 72.8777];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem', height: '560px' }}>
      {/* Map Area */}
      <div
        style={{
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          position: 'relative',
          boxShadow: 'var(--shadow-md)',
          backgroundColor: 'var(--bg-elevated)',
        }}
      >
        <MapContainer
          center={defaultCenter}
          zoom={filteredIssues.length > 0 ? 13 : 12}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {/* Dynamic Hotspot Density Circles */}
          {dynamicZones.map((zone) => (
            <Circle
              key={zone.id}
              center={[zone.lat, zone.lng]}
              radius={zone.radius}
              pathOptions={{
                color: zone.color,
                fillColor: zone.color,
                fillOpacity: activeZone?.id === zone.id ? 0.35 : 0.18,
                weight: activeZone?.id === zone.id ? 3 : 1.5,
                dashArray: activeZone?.id === zone.id ? undefined : '4, 6',
              }}
              eventHandlers={{
                click: () => setSelectedZoneId(zone.id),
              }}
            />
          ))}

          {/* Live Incident Pins from PostgreSQL */}
          {filteredIssues.map((issue) => {
            const isHEI = (issue as any).is_escalated_to_hei || (issue as any).hei_challenge;
            const icon = isHEI
              ? HEI_ICON
              : issue.severity === 'Dangerous' || issue.severity === 'Critical'
              ? DANGEROUS_ICON
              : SERIOUS_ICON;

            return (
              <Marker
                key={issue.id}
                position={[issue.latitude, issue.longitude]}
                icon={icon}
                eventHandlers={{
                  click: () => onSelectIssue(issue),
                }}
              >
                <Popup>
                  <div style={{ padding: '0.2rem', color: '#1e293b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          backgroundColor: '#f1f5f9',
                          color: '#0f172a',
                        }}
                      >
                        {issue.report_code}
                      </span>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          backgroundColor:
                            issue.severity === 'Dangerous' || issue.severity === 'Critical'
                              ? '#ffe4e6'
                              : '#fef3c7',
                          color:
                            issue.severity === 'Dangerous' || issue.severity === 'Critical'
                              ? '#e11d48'
                              : '#d97706',
                        }}
                      >
                        {issue.severity}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, margin: '0.2rem 0', color: '#0f172a' }}>
                      {issue.category}: {issue.description.slice(0, 75)}...
                    </p>
                    <p style={{ fontSize: '0.6875rem', color: '#64748b', margin: '0.2rem 0' }}>
                      📍 {issue.address || issue.city || 'Geotagged Location'}
                    </p>
                    <button
                      type="button"
                      onClick={() => onSelectIssue(issue)}
                      style={{
                        marginTop: '0.4rem',
                        width: '100%',
                        padding: '0.3rem 0.6rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: '#f97316',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      Triage Work Order →
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Map Legend Overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            zIndex: 1000,
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.6rem 0.85rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            fontSize: '0.72rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.9rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f43f5e' }} />
            <span>Critical / Dangerous</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
            <span>Serious / Routine</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#6366f1' }} />
            <span>Escalated to HEI</span>
          </div>
        </div>
      </div>

      {/* Hotspot Intelligence Sidebar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          height: '100%',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            padding: '0.9rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
            <Flame size={18} color="var(--accent-amber)" />
            <h3 style={{ fontSize: '0.925rem', fontWeight: 800 }}>GIS Hotspot Intelligence</h3>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Spatial clustering detects chronic infrastructure degradation patterns across municipal wards.
          </p>
        </div>

        {/* Dynamic Hotspot Clusters List */}
        {dynamicZones.length === 0 ? (
          <div
            style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-card)',
              border: '1px dashed var(--border-subtle)',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.78125rem',
            }}
          >
            <MapPin size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
            <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              No Hotspots Detected
            </p>
            <p style={{ fontSize: '0.72rem' }}>
              Geotagged reports submitted by citizens will cluster and appear here dynamically.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {dynamicZones.map((zone) => {
              const isSelected = activeZone?.id === zone.id;
              return (
                <div
                  key={zone.id}
                  onClick={() => setSelectedZoneId(zone.id)}
                  style={{
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isSelected ? 'var(--bg-elevated)' : 'var(--bg-card)',
                    border: isSelected ? `1.5px solid ${zone.color}` : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? `0 4px 16px ${zone.color}20` : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span
                      className="mono"
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        backgroundColor: `${zone.color}20`,
                        color: zone.color,
                      }}
                    >
                      Priority Score {zone.riskScore}/100
                    </span>
                    {zone.escalatedToHEI && (
                      <span
                        style={{
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          color: 'var(--accent-indigo)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                        }}
                      >
                        <Layers size={11} /> HEI Escalated
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {zone.name}
                  </div>

                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.35, marginBottom: '0.4rem' }}>
                    {zone.chronicType}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                    <span>📍 {zone.ward}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{zone.activeIncidents} Active Grievances</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
