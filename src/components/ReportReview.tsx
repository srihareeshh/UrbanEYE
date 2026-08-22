import React from 'react';
import {
  MapPin,
  Camera,
  Video,
  Mic,
  FileText,
  Bookmark,
  Send,
  Edit2,
  AlertOctagon,
} from 'lucide-react';
import type { EvidenceItem, LocationState, IssueDetailsState } from '../types';
import { formatBytes } from '../utils/exifHelper';

interface ReportReviewProps {
  evidenceList: EvidenceItem[];
  location: LocationState;
  details: IssueDetailsState;
  onEditStep: (step: number) => void;
  onSubmit: () => void;
  onSaveDraft: () => void;
  isSubmitting: boolean;
  submitProgressText: string;
}

export const ReportReview: React.FC<ReportReviewProps> = ({
  evidenceList,
  location,
  details,
  onEditStep,
  onSubmit,
  onSaveDraft,
  isSubmitting,
  submitProgressText,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Title Card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Review Your Report</h2>
          <span className="badge badge-amber">Ready to Submit</span>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Please review the structured incident details below. You can jump back to any step to make edits.
        </p>
      </div>

      {/* 1. Evidence Summary */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.9375rem' }}>
            <Camera size={16} color="var(--accent-amber)" />
            <span>Attached Evidence ({evidenceList.length})</span>
          </div>
          <button
            type="button"
            onClick={() => onEditStep(1)}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
          >
            <Edit2 size={12} /> Edit
          </button>
        </div>

        {evidenceList.length === 0 ? (
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No visual/audio files attached. (Text-only report)
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
            {evidenceList.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.4rem 0.65rem',
                  fontSize: '0.75rem',
                }}
              >
                {item.mediaType === 'image' && <Camera size={14} color="var(--accent-amber)" />}
                {item.mediaType === 'video' && <Video size={14} color="#3b82f6" />}
                {item.mediaType === 'audio' && <Mic size={14} color="var(--accent-emerald)" />}
                <span
                  style={{
                    maxWidth: '140px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontWeight: 500,
                  }}
                >
                  {item.originalName}
                </span>
                <span className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>
                  ({formatBytes(item.fileSize)})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Location Summary */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.9375rem' }}>
            <MapPin size={16} color="var(--accent-amber)" />
            <span>Incident Location</span>
          </div>
          <button
            type="button"
            onClick={() => onEditStep(1)}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
          >
            <Edit2 size={12} /> Edit
          </button>
        </div>

        <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{location.address || 'Pin on map'}</div>
          <div
            className="mono"
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              marginTop: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <span>{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</span>
            <span
              style={{
                color: location.source === 'exif' ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                fontWeight: 600,
              }}
            >
              • Source: {location.source.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Issue Details Summary */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.9375rem' }}>
            <FileText size={16} color="var(--accent-amber)" />
            <span>Problem Details</span>
          </div>
          <button
            type="button"
            onClick={() => onEditStep(2)}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
          >
            <Edit2 size={12} /> Edit
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem', marginBottom: '0.85rem' }}>
          <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Category</div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', marginTop: '0.15rem' }}>
              {details.category || 'Unspecified'}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Severity</div>
            <div
              style={{
                fontWeight: 700,
                fontSize: '0.875rem',
                marginTop: '0.15rem',
                color: details.severity === 'Dangerous' ? 'var(--accent-rose)' : 'var(--text-primary)',
              }}
            >
              {details.severity}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Duration</div>
            <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginTop: '0.15rem' }}>
              {details.duration}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Recurrence</div>
            <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginTop: '0.15rem' }}>
              {details.recurrence}
            </div>
          </div>
        </div>

        {/* Description Box */}
        {details.description && (
          <div
            style={{
              backgroundColor: 'var(--bg-input)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
              Description:
            </div>
            {details.description}
          </div>
        )}

        {/* Risk Banner if Present */}
        {details.isRiskPresent && (
          <div
            style={{
              backgroundColor: 'var(--accent-rose-glow)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              marginTop: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertOctagon size={16} color="var(--accent-rose)" />
            <div style={{ fontSize: '0.78125rem', color: 'var(--text-primary)' }}>
              <strong>Immediate Safety Hazard flagged:</strong> {details.riskDescription || 'Active risk to residents reported.'}
            </div>
          </div>
        )}
      </div>

      {/* Submission Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.85rem',
          marginTop: '0.5rem',
        }}
      >
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isSubmitting}
          className="btn btn-secondary"
        >
          <Bookmark size={15} />
          <span>Save Draft</span>
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="btn btn-primary btn-lg"
          style={{ minWidth: '180px' }}
        >
          {isSubmitting ? (
            <span>{submitProgressText || 'Submitting...'}</span>
          ) : (
            <>
              <Send size={16} />
              <span>Submit Report</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
