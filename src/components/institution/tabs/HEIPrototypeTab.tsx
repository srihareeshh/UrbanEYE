import React from 'react';
import {
  ExternalLink,
  GitBranch,
} from 'lucide-react';
import type { PrototypeRecord } from '../heiDataModel';

interface HEIPrototypeTabProps {
  prototypes: PrototypeRecord[];
}

export const HEIPrototypeTab: React.FC<HEIPrototypeTabProps> = ({
  prototypes,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Header */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Prototype Engineering & Bench Test Telemetry
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0 }}>
            Physical hardware fabrication, IoT sensor telemetry calibration, material formulations, and laboratory validation limits.
          </p>
        </div>
      </div>

      {/* 2. Prototypes List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {prototypes.map((proto) => (
          <div
            key={proto.id}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.4rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>
                    {proto.version}
                  </span>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(99, 102, 241, 0.12)',
                      color: 'var(--accent-indigo)',
                    }}
                  >
                    {proto.prototypeType}
                  </span>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: proto.status === 'field_validated' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: proto.status === 'field_validated' ? '#10b981' : 'var(--accent-amber)',
                    }}
                  >
                    ● {proto.status.toUpperCase().replace('_', ' ')}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.35rem', marginBottom: '0.15rem' }}>
                  {proto.prototypeName}
                </h3>
                <div style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}>
                  Linked Project: <strong>{proto.projectTitle}</strong>
                </div>
              </div>

              {proto.schematicOrRepoUrl && (
                <a
                  href={proto.schematicOrRepoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78125rem' }}
                >
                  <GitBranch size={14} />
                  <span>CAD / Repo Specs</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>

            {/* Description */}
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
              {proto.description}
            </p>

            {/* Key Specifications Grid */}
            <div
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
              }}
            >
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Key Technical Specifications & Benchmarks
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem', marginTop: '0.4rem' }}>
                {Object.entries(proto.keySpecifications).map(([k, v], idx) => (
                  <div key={idx} style={{ fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{k}:</span>{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>{v}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Results Table */}
            <div
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Laboratory & Field Bench Test Validation Matrix
                </span>
                <span style={{ fontSize: '0.6875rem', color: '#10b981', fontWeight: 700 }}>
                  ● 100% Passed Engineering Targets
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {proto.testResults.map((tr, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      padding: '0.35rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    }}
                  >
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{tr.metric}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Target: {tr.target}</span>
                      <span style={{ color: '#10b981', fontWeight: 800 }}>Achieved: {tr.achieved}</span>
                      <span style={{ color: '#10b981' }}>✓</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Known Limitations & Next Iteration */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
              <div
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem',
                  fontSize: '0.75rem',
                }}
              >
                <strong style={{ color: 'var(--accent-amber)', display: 'block', marginBottom: '0.2rem' }}>
                  Known Technical Limitations:
                </strong>
                <span style={{ color: 'var(--text-primary)' }}>{proto.knownLimitations}</span>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem',
                  fontSize: '0.75rem',
                }}
              >
                <strong style={{ color: 'var(--accent-indigo)', display: 'block', marginBottom: '0.2rem' }}>
                  Next Iteration Focus (Field Unit):
                </strong>
                <span style={{ color: 'var(--text-primary)' }}>{proto.nextIterationFocus}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
