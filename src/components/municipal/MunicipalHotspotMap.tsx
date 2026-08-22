import React, { useState } from 'react';
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
        animation: pulse 2s infinite;
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

const CHRONIC_HOTSPOT_ZONES = [
  {
    id: 'zone_14_canal',
    name: 'Ward 14 West Canal & Highway Culvert Zone',
    ward: 'Ward 14 West (Bandra/Khar)',
    lat: 19.0760,
    lng: 72.8777,
    radius: 450,
    riskScore: 94,
    chronicType: 'Recurrent Monsoon Stormwater Flooding & Chemical Runoff',
    activeIncidents: 5,
    escalatedToHEI: true,
    color: '#f43f5e',
  },
  {
    id: 'zone_08_market',
    name: 'Ward 08 Central Vegetable Market Corridor',
    ward: 'Ward 08 Central (Dadar)',
    lat: 19.0178,
    lng: 72.8478,
    radius: 380,
    riskScore: 82,
    chronicType: 'High-Density Solid Waste & Choked Street Gutters',
    activeIncidents: 4,
    escalatedToHEI: false,
    color: '#f59e0b',
  },
  {
    id: 'zone_19_highway',
    name: 'Ward 19 East Arterial Highway Junction',
    ward: 'Ward 19 East (Kurla/Chembur)',
    lat: 19.0650,
    lng: 72.8920,
    radius: 520,
    riskScore: 88,
    chronicType: 'Severe Pothole Cluster & Bitumen Subgrade Failure',
    activeIncidents: 6,
    escalatedToHEI: true,
    color: '#f43f5e',
  },
];

export const MunicipalHotspotMap: React.FC<MunicipalHotspotMapProps> = ({
  issues,
  selectedWard,
  onSelectIssue,
}) => {
  const [activeZone, setActiveZone] = useState<typeof CHRONIC_HOTSPOT_ZONES[0] | null>(CHRONIC_HOTSPOT_ZONES[0]);

  const filteredZones = selectedWard === 'all'
    ? CHRONIC_HOTSPOT_ZONES
    : CHRONIC_HOTSPOT_ZONES.filter((z) => z.ward.toLowerCase().includes(selectedWard.toLowerCase()));

  const filteredIssues = issues.filter((iss) => {
    if (selectedWard !== 'all' && iss.address && !iss.address.toLowerCase().includes(selectedWard.toLowerCase())) {
      return false;
    }
    return iss.latitude && iss.longitude;
  });

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
          center={[19.0760, 72.8777]}
          zoom={12}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {/* Chronic Hotspot Radial Density Overlays */}
          {filteredZones.map((zone) => (
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
                click: () => setActiveZone(zone),
              }}
            />
          ))}

          {/* Incident Pins */}
          {filteredIssues.map((issue) => {
            const isHEI = (issue as any).is_escalated_to_hei || (issue as any).hei_challenge;
            const icon = isHEI
              ? HEI_ICON
              : issue.severity === 'Dangerous'
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
                          fontSize: '0.65rem',
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
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          backgroundColor: issue.severity === 'Dangerous' ? '#ffe4e6' : '#fef3c7',
                          color: issue.severity === 'Dangerous' ? '#e11d48' : '#d97706',
                        }}
                      >
                        {issue.severity}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, margin: '0.2rem 0', color: '#0f172a' }}>
                      {issue.category}: {issue.description.slice(0, 75)}...
                    </p>
                    <p style={{ fontSize: '0.6875rem', color: '#64748b', margin: '0.2rem 0' }}>
                      📍 {issue.address || 'Ward 14 West'}
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
            <span>Dangerous / AI Risk 85+</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
            <span>Serious / Routine</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#6366f1' }} />
            <span>Escalated to HEI R&D</span>
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

        {/* Chronic Hotspot Clusters List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {filteredZones.map((zone) => {
            const isSelected = activeZone?.id === zone.id;
            return (
              <div
                key={zone.id}
                onClick={() => setActiveZone(zone)}
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
                    Risk Score {zone.riskScore}/100
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
                  <span>📍 {zone.ward.split('(')[0]}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{zone.activeIncidents} Active Grievances</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
