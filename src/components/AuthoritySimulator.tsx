import React, { useState } from 'react';
import { Play, FastForward, Wrench } from 'lucide-react';
import { apiFetch } from '../utils/userSession';

interface AuthoritySimulatorProps {
  reportId: string;
  currentStatus: string;
  onStageAdvanced: () => void;
}

export const AuthoritySimulator: React.FC<AuthoritySimulatorProps> = ({
  reportId,
  currentStatus,
  onStageAdvanced,
}) => {
  const [isSimulating, setIsSimulating] = useState(false);

  const handleAdvance = async (targetStage?: string) => {
    setIsSimulating(true);
    try {
      const res = await apiFetch(`/api/reports/${reportId}/simulate-advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetStage }),
      });

      if (res.ok) {
        onStageAdvanced();
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-elevated)',
        border: '1px dashed var(--border-medium)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'var(--accent-indigo-glow)',
            color: 'var(--accent-indigo)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Wrench size={16} />
        </div>
        <div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>Municipal Authority Simulator</span>
            <span className="mono" style={{ fontSize: '0.65rem', backgroundColor: 'var(--accent-indigo-glow)', color: 'var(--accent-indigo)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
              DEMO TOOL
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Simulate municipal officer workflow and test the citizen verification loop.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {currentStatus !== 'Resolved' && currentStatus !== 'Confirmed Resolved' && (
          <>
            <button
              type="button"
              onClick={() => handleAdvance()}
              disabled={isSimulating}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              <Play size={12} />
              <span>{isSimulating ? 'Simulating...' : 'Advance Next Stage'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleAdvance('Resolved')}
              disabled={isSimulating}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              <FastForward size={12} />
              <span>Fast-Forward to Resolved</span>
            </button>
          </>
        )}

        {(currentStatus === 'Resolved' || currentStatus === 'Confirmed Resolved' || currentStatus === 'Follow-up Required') && (
          <button
            type="button"
            onClick={() => handleAdvance('In Progress')}
            disabled={isSimulating}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem' }}
          >
            <span>Restart Field Work</span>
          </button>
        )}
      </div>
    </div>
  );
};
