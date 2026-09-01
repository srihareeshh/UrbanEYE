import React, { useState } from 'react';
import {
  MapPin,
} from 'lucide-react';
import type { StoredReport } from '../../types';
import { MunicipalHotspotMap } from '../municipal/MunicipalHotspotMap';
import { JHARKHAND_DISTRICTS } from './governmentPrototypeData';

interface GovernmentMapProps {
  reports: StoredReport[];
  onSelectChallenge: (report: StoredReport) => void;
}

export const GovernmentMap: React.FC<GovernmentMapProps> = ({
  reports,
  onSelectChallenge,
}) => {
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Controls */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            GIS Spatial Intelligence & Systemic Hotspot Map
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
            Live geospatial challenge clusters, hazard density overlays & systemic recurrence hotspots.
          </p>
        </div>

        {/* District Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={16} color="var(--accent-amber)" />
          <select
            className="input"
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            style={{ height: '36px', fontSize: '0.8125rem', minWidth: '180px' }}
          >
            {JHARKHAND_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Map Container */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
          minHeight: '600px',
        }}
      >
        <MunicipalHotspotMap
          issues={reports}
          selectedWard={selectedDistrict === 'All Districts' ? 'all' : selectedDistrict}
          onSelectIssue={onSelectChallenge}
        />
      </div>
    </div>
  );
};
