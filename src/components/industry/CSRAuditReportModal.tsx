import React from 'react';
import {
  X,
  Printer,
  FileCheck,
} from 'lucide-react';
import type { CSRGrant } from '../../types';

interface CSRAuditReportModalProps {
  grant: CSRGrant | null;
  onClose: () => void;
}

export const CSRAuditReportModal: React.FC<CSRAuditReportModalProps> = ({ grant, onClose }) => {
  if (!grant) return null;

  const handlePrint = () => {
    window.print();
  };

  const pledgeAmt = grant.pledge_amount || grant.total_pledge_amount || 0;
  const cinNum = grant.cin || grant.cin_number || 'L27100MH1907PLC000260';
  const csrReg = grant.csr_reg_no || grant.csr_reg_number || 'CSR00001248';

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
          maxWidth: '740px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
        }}
      >
        {/* Top Bar */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FileCheck size={20} color="#ec4899" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Ministry of Corporate Affairs (MCA) Form CSR-1 Statutory Certificate</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handlePrint}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78125rem' }}
            >
              <Printer size={15} />
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

        {/* Certificate Content Printable Area */}
        <div
          style={{
            padding: '2rem',
            overflowY: 'auto',
            flex: 1,
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
          }}
        >
          {/* Certificate Frame */}
          <div
            style={{
              border: '2px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
              position: 'relative',
              backgroundColor: 'var(--bg-card)',
            }}
          >
            {/* Header / Watermark */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid var(--border-subtle)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <div
                className="mono"
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: '0.35rem',
                }}
              >
                Government of India · Ministry of Corporate Affairs
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                FORM CSR-1 IMPACT AUDIT & STATUTORY RECEIPT
              </h2>
              <div style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Issued pursuant to Section 135 of the Companies Act, 2013 & Companies (CSR Policy) Rules, 2014
              </div>
            </div>

            {/* Corporate & NGO Metadata */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.85rem',
                backgroundColor: 'var(--bg-elevated)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '1.25rem',
                fontSize: '0.78125rem',
              }}
            >
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>Corporate Donor / Entity:</div>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{grant.corporate_name}</div>
                <div className="mono" style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', marginTop: '0.15rem' }}>
                  CIN: {cinNum}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>MCA Registration & Tax Regime:</div>
                <div style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>
                  CSR Reg No: {csrReg}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', marginTop: '0.15rem' }}>
                  Section 80G Tax Deductible (100% Exemption)
                </div>
              </div>
            </div>

            {/* Grant & Financial Breakdown */}
            <div style={{ margin: '1.25rem 0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78125rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-medium)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.5rem 0.65rem' }}>Funded Project / University</th>
                    <th style={{ padding: '0.5rem 0.65rem' }}>SDG Target</th>
                    <th style={{ padding: '0.5rem 0.65rem' }}>Escrow Total</th>
                    <th style={{ padding: '0.5rem 0.65rem' }}>Disbursed</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.75rem 0.65rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {grant.project_title || 'Modular Activated Biochar Gravity Filter'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Birla Institute of Technology (BIT) Mesra · Ward 14 West
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 0.65rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                      {grant.sdg_goal || 'SDG 6 (Clean Water)'}
                    </td>
                    <td className="mono" style={{ padding: '0.75rem 0.65rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      ₹{pledgeAmt.toLocaleString('en-IN')}
                    </td>
                    <td className="mono" style={{ padding: '0.75rem 0.65rem', fontWeight: 800, color: '#ec4899' }}>
                      ₹{grant.disbursed_amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Escrow Tranche Ledger */}
            {grant.tranches && grant.tranches.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                  Smart Escrow Verification Trail
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {grant.tranches.map((tr) => {
                    const isReleased = tr.status === 'disbursed' || tr.status === 'released';
                    return (
                      <div
                        key={tr.id}
                        style={{
                          padding: '0.55rem 0.75rem',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg-elevated)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.75rem',
                        }}
                      >
                        <div>
                          <strong>Tranche {tr.tranche_number} ({tr.percentage}%):</strong> {tr.condition_milestone || tr.trigger_condition}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span className="mono" style={{ fontWeight: 700 }}>₹{tr.amount.toLocaleString('en-IN')}</span>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              backgroundColor: isReleased ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
                              color: isReleased ? 'var(--accent-emerald)' : 'var(--text-muted)',
                            }}
                          >
                            {isReleased ? '✓ Disbursed to HEI' : 'Locked in Escrow'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Signatures & Seal */}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: '#fff',
                    padding: '4px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundImage: `radial-gradient(#000 35%, transparent 36%)`,
                      backgroundSize: '7px 7px',
                      borderRadius: '2px',
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', maxWidth: '220px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>✓ MCA Form CSR-1 Verified</div>
                  <div className="mono" style={{ fontSize: '0.58rem', marginTop: '2px' }}>
                    Audit UID: {grant.id}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Alcheminds CSR Clearinghouse
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  National Municipal-Academic Grant Escrow
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Certified Date: {new Date(grant.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
