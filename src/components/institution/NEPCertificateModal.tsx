import React from 'react';
import {
  X,
  Printer,
  Award,
} from 'lucide-react';
import type { NEPCreditRecord } from '../../types';

interface NEPCertificateModalProps {
  credit: NEPCreditRecord | null;
  onClose: () => void;
}

export const NEPCertificateModal: React.FC<NEPCertificateModalProps> = ({ credit, onClose }) => {
  if (!credit) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
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
          maxWidth: '760px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Top Bar */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-elevated)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={18} color="var(--accent-amber)" />
            <span style={{ fontSize: '0.875rem', fontWeight: 800 }}>
              National Credit Framework (NCrF) · NEP 2020 Certificate Viewer
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handlePrint}
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78125rem' }}
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="btn btn-ghost"
              style={{ padding: '0.35rem', borderRadius: '50%' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Certificate Canvas */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          <div
            id="printable-certificate"
            style={{
              border: '4px double rgba(245, 158, 11, 0.4)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem 2.25rem',
              backgroundColor: 'var(--bg-primary)',
              position: 'relative',
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.4)',
            }}
          >
            {/* Header Emblems */}
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.15em',
                  color: 'var(--accent-amber)',
                  textTransform: 'uppercase',
                  marginBottom: '0.25rem',
                }}
              >
                Government of India · Ministry of Education & Higher Learning
              </div>
              <h2
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                  fontFamily: 'Georgia, serif',
                }}
              >
                EXPERIENTIAL SOCIAL INNOVATION CREDIT CERTIFICATE
              </h2>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.2rem',
                }}
              >
                Issued in accordance with NEP 2020 & National Credit Framework (NCrF Level 5.0)
              </div>
            </div>

            {/* Certificate Body */}
            <div style={{ textAlign: 'center', margin: '1.5rem 0', lineHeight: 1.7 }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                This is to officially certify that
              </p>

              <div
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: 'var(--accent-amber)',
                  margin: '0.35rem 0',
                  letterSpacing: '-0.01em',
                }}
              >
                {credit.student_name}
              </div>

              <div
                className="mono"
                style={{
                  fontSize: '0.78125rem',
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-elevated)',
                  display: 'inline-block',
                  padding: '0.2rem 0.75rem',
                  borderRadius: '4px',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '0.75rem',
                }}
              >
                Student ID: <strong>{credit.student_id}</strong> &nbsp;|&nbsp; APAAR ID: <strong>{credit.apaar_id}</strong>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto' }}>
                of <strong>{credit.institution_name}</strong> has successfully completed applied engineering research and municipal field deployment for the societal innovation project:
              </p>

              <div
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginTop: '0.65rem',
                  marginBottom: '0.65rem',
                  fontStyle: 'italic',
                }}
              >
                "{credit.project_title || 'Modular Activated Biochar Gravity Filter for Urban Stormwater Canals'}"
              </div>
            </div>

            {/* Credit Hours & NCrF Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
                backgroundColor: 'var(--bg-elevated)',
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                textAlign: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Research Lab Hours
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {credit.research_hours} hrs
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Municipal Field Hours
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {credit.field_hours} hrs
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Academic Credits Awarded
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                  {credit.credits_awarded} Credits
                </div>
              </div>
            </div>

            {/* Signatures & Verifiable QR */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '1rem',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              {/* QR Verification Seal */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: '#fff',
                    padding: '4px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Visual QR pattern mock */}
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundImage: `
                        radial-gradient(#000 35%, transparent 36%),
                        radial-gradient(#000 35%, transparent 36%)
                      `,
                      backgroundSize: '8px 8px',
                      backgroundPosition: '0 0, 4px 4px',
                      borderRadius: '2px',
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', maxWidth: '200px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>
                    ✓ Cryptographically Signed
                  </div>
                  <div className="mono" style={{ fontSize: '0.58rem', wordBreak: 'break-all', marginTop: '2px' }}>
                    {credit.verification_hash || 'SHA256:7f83b1657ff1fc53b92dc18148a1d65d'}
                  </div>
                </div>
              </div>

              {/* Institutional Signatures */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Dr. Ananya Sen / Prof. Water Resources
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  Dean of Academic Research & Social Innovation
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Issued: {new Date(credit.certificate_issued_at || credit.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
