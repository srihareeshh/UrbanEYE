import React, { useState } from 'react';
import { Columns, Sliders } from 'lucide-react';

interface BeforeAfterViewerProps {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export const BeforeAfterViewer: React.FC<BeforeAfterViewerProps> = ({
  beforeUrl,
  afterUrl,
  beforeLabel = 'Before: Incident Report',
  afterLabel = 'After: Authority Remediation',
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(Number(e.target.value));
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-input)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
      }}
    >
      {/* Header & Mode Switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>
          Visual Proof: Before vs. After
        </div>

        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button
            type="button"
            onClick={() => setViewMode('slider')}
            className="btn btn-sm"
            style={{
              backgroundColor: viewMode === 'slider' ? 'var(--bg-elevated)' : 'transparent',
              color: viewMode === 'slider' ? 'var(--accent-amber)' : 'var(--text-muted)',
              border: viewMode === 'slider' ? '1px solid var(--accent-amber)' : '1px solid transparent',
              padding: '0.25rem 0.6rem',
              fontSize: '0.75rem',
            }}
          >
            <Sliders size={12} />
            <span>Interactive Slider</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            className="btn btn-sm"
            style={{
              backgroundColor: viewMode === 'side-by-side' ? 'var(--bg-elevated)' : 'transparent',
              color: viewMode === 'side-by-side' ? 'var(--accent-amber)' : 'var(--text-muted)',
              border: viewMode === 'side-by-side' ? '1px solid var(--accent-amber)' : '1px solid transparent',
              padding: '0.25rem 0.6rem',
              fontSize: '0.75rem',
            }}
          >
            <Columns size={12} />
            <span>Side-by-Side</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Interactive Slider View */}
      {viewMode === 'slider' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '240px',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              userSelect: 'none',
              backgroundColor: 'var(--bg-card)',
            }}
          >
            {/* After Image (Background) */}
            <img
              src={afterUrl}
              alt="After resolution"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.85)',
                color: '#ffffff',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                backdropFilter: 'blur(4px)',
              }}
            >
              {afterLabel}
            </div>

            {/* Before Image (Foreground with Clip Path) */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
              }}
            >
              <img
                src={beforeUrl}
                alt="Before incident"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  backgroundColor: 'rgba(244, 63, 94, 0.85)',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  backdropFilter: 'blur(4px)',
                }}
              >
                {beforeLabel}
              </div>
            </div>

            {/* Divider Line */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${sliderPosition}%`,
                width: '2px',
                backgroundColor: '#ffffff',
                boxShadow: '0 0 10px rgba(0,0,0,0.8)',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                }}
              >
                ⇄
              </div>
            </div>
          </div>

          {/* Slider Range Controller */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Before</span>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={handleSliderChange}
              style={{ flex: 1, accentColor: 'var(--accent-amber)', cursor: 'ew-resize' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>After</span>
          </div>
        </div>
      ) : (
        /* Mode 2: Side-by-Side View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
            <img src={beforeUrl} alt="Before" style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
            <div style={{ padding: '0.4rem 0.6rem', fontSize: '0.72rem', backgroundColor: 'var(--bg-card)', fontWeight: 600, color: 'var(--accent-rose)' }}>
              {beforeLabel}
            </div>
          </div>

          <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
            <img src={afterUrl} alt="After" style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
            <div style={{ padding: '0.4rem 0.6rem', fontSize: '0.72rem', backgroundColor: 'var(--bg-card)', fontWeight: 600, color: 'var(--accent-emerald)' }}>
              {afterLabel}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
