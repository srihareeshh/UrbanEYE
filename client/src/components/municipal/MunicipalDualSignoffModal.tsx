import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  FileCheck,
  UserCheck,
} from 'lucide-react';
import type { StoredReport } from '../../types';

interface MunicipalDualSignoffModalProps {
  issue: StoredReport | null;
  onClose: () => void;
  onSubmitResolution: (params: {
    reportId: string;
    resolutionNotes: string;
    resolvedBy: string;
    resolutionPhotoUrl: string;
    resolutionPhotoName: string;
    latitude: number;
    longitude: number;
  }) => Promise<boolean>;
  onShowToast: (msg: string) => void;
}

export const MunicipalDualSignoffModal: React.FC<MunicipalDualSignoffModalProps> = ({
  issue,
  onClose,
  onSubmitResolution,
  onShowToast,
}) => {
  if (!issue) return null;

  const [resolvedBy, setResolvedBy] = useState('Eng. R. Shinde (Ward 14 Field Crew)');
  const [resolutionNotes, setResolutionNotes] = useState(
    `Site remediation completed. Obstruction cleared, culvert flow restored, and surrounding road graded. Tested with water flush.`
  );
  const [photoUrl] = useState('/samples/flooded_road_mumbai.jpg');
  const [photoName] = useState('remediation_site_proof.jpg');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const success = await onSubmitResolution({
      reportId: issue.id,
      resolutionNotes,
      resolvedBy,
      resolutionPhotoUrl: photoUrl,
      resolutionPhotoName: photoName,
      latitude: issue.latitude || 19.0760,
      longitude: issue.longitude || 72.8777,
    });
    setSubmitting(false);

    if (success) {
      onShowToast(`✓ Remediation proof uploaded! Issue moved to "Citizen Confirmation" state.`);
      onClose();
    } else {
      onShowToast('Failed to upload resolution proof.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-elevated)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--accent-emerald)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileCheck size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Upload Field Crew Remediation Proof</h3>
                <span
                  className="mono"
                  style={{
                    fontSize: '0.6875rem',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--accent-emerald)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  Dual Sign-off Protocol
                </span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Field crew photo & GPS stamp moves grievance into "Citizen Confirmation" before final closure.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '0.4rem', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Issue Summary */}
          <div
            style={{
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '0.78125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {issue.category} Grievance: {issue.report_code}
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              {issue.description}
            </p>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              📍 {issue.address} · Lat: {issue.latitude?.toFixed(4)}, Lng: {issue.longitude?.toFixed(4)}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Field Supervisor / Lead Engineer Name
            </label>
            <input
              type="text"
              required
              value={resolvedBy}
              onChange={(e) => setResolvedBy(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Remediation Action & Material Used
            </label>
            <textarea
              rows={3}
              required
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Photographic Evidence Attachment */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Post-Repair Photographic Proof & GPS Stamp
            </label>
            <div
              style={{
                border: '2px dashed var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                backgroundColor: 'var(--bg-input)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <img
                src={photoUrl}
                alt="Repair evidence"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: 'var(--radius-sm)',
                  objectFit: 'cover',
                  border: '1px solid var(--border-subtle)',
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {photoName}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--accent-emerald)', marginTop: '0.2rem' }}>
                  ✓ GPS Coordinates Verified (Lat {issue.latitude?.toFixed(4)}, Lng {issue.longitude?.toFixed(4)})
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Timestamp: {new Date().toLocaleString()} (Auto-Stamped)
                </div>
              </div>
            </div>
          </div>

          {/* Information Notice */}
          <div
            style={{
              padding: '0.75rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.72rem',
              color: 'var(--accent-emerald)',
            }}
          >
            <UserCheck size={16} />
            <span>
              <strong>Dual Sign-off Protocol:</strong> Submitting this field report transitions grievance to "Citizen Confirmation". Reporting citizen has 72 hours to verify resolution quality or request crew re-dispatch.
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary btn-lg"
            style={{
              backgroundColor: 'var(--accent-emerald)',
              color: '#000',
              fontWeight: 800,
              marginTop: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <CheckCircle2 size={18} />
            <span>{submitting ? 'Uploading Proof...' : 'Submit Resolution Proof for Citizen Verification'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
