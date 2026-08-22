import React, { useState } from 'react';
import {
  X,
  GraduationCap,
  Users,
  Plus,
  Trash2,
} from 'lucide-react';
import type { HEIChallenge } from '../../types';

interface ClaimChallengeModalProps {
  challenge: HEIChallenge | null;
  onClose: () => void;
  onClaim: (challengeId: string, params: {
    institutionName: string;
    department: string;
    facultyLead: string;
    facultyEmail: string;
    studentTeam: Array<{ name: string; studentId: string; apaarId: string; role: string; hours: number }>;
    fundingGoal: number;
    abstract: string;
  }) => Promise<boolean>;
  onShowToast: (msg: string) => void;
}

export const ClaimChallengeModal: React.FC<ClaimChallengeModalProps> = ({
  challenge,
  onClose,
  onClaim,
  onShowToast,
}) => {
  if (!challenge) return null;

  const [institutionName, setInstitutionName] = useState('Birla Institute of Technology (BIT) Mesra');
  const [department, setDepartment] = useState(challenge.department_match || 'Department of Civil & Environmental Engineering');
  const [facultyLead, setFacultyLead] = useState('Dr. Ananya Sen (Prof. Water Resources)');
  const [facultyEmail, setFacultyEmail] = useState('ananya.sen@bitmesra.ac.in');
  const [fundingGoal, setFundingGoal] = useState<number>(350000);
  const [abstract, setAbstract] = useState(
    `Multidisciplinary capstone project proposing an in-situ scalable prototype to remediate ${challenge.category.toLowerCase()} issues in ${challenge.ward}.`
  );

  const [studentTeam, setStudentTeam] = useState<Array<{ name: string; studentId: string; apaarId: string; role: string; hours: number }>>([
    { name: 'Aarav Sharma', studentId: '2022-CE-041', apaarId: 'APAAR-9821-4402-1190', role: 'Team Lead & CAD Modeler', hours: 30 },
    { name: 'Pooja Verma', studentId: '2022-ENV-019', apaarId: 'APAAR-7712-3094-8821', role: 'Biochar Chemistry Researcher', hours: 30 },
    { name: 'Nikhil Rane', studentId: '2023-CE-082', apaarId: 'APAAR-4109-8831-5542', role: 'Field Deployment & Telemetry', hours: 20 },
  ]);

  const [submitting, setSubmitting] = useState(false);

  const handleAddStudent = () => {
    setStudentTeam([
      ...studentTeam,
      {
        name: '',
        studentId: `2024-ENG-0${studentTeam.length + 1}`,
        apaarId: `APAAR-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        role: 'Research Associate',
        hours: 20,
      },
    ]);
  };

  const handleRemoveStudent = (idx: number) => {
    setStudentTeam(studentTeam.filter((_, i) => i !== idx));
  };

  const handleStudentChange = (idx: number, field: string, value: any) => {
    const updated = [...studentTeam];
    (updated[idx] as any)[field] = value;
    setStudentTeam(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const success = await onClaim(challenge.id, {
      institutionName,
      department,
      facultyLead,
      facultyEmail,
      studentTeam,
      fundingGoal,
      abstract,
    });
    setSubmitting(false);

    if (success) {
      onShowToast(`✓ Challenge claimed by ${institutionName}! Capstone workspace initialized.`);
      onClose();
    } else {
      onShowToast('Failed to claim challenge.');
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
          maxWidth: '740px',
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
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-indigo)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GraduationCap size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Claim Challenge for Academic R&D</h3>
                <span
                  className="mono"
                  style={{
                    fontSize: '0.6875rem',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--accent-indigo)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  NEP 2020 Capstone
                </span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Assemble student team, assign faculty lead, and initialize 4-stage milestone pipeline.
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
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '1.25rem 1.5rem',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.1rem',
          }}
        >
          {/* Challenge Summary */}
          <div
            style={{
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {challenge.title}
              </span>
              <span
                className="mono"
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  padding: '0.1rem 0.45rem',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(99, 102, 241, 0.2)',
                  color: 'var(--accent-indigo)',
                }}
              >
                {challenge.match_percentage}% AI Dept Match
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              {challenge.description}
            </p>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Escalated by: {challenge.escalated_by} · Ward: {challenge.ward}
            </div>
          </div>

          {/* Institution & Faculty Lead */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Higher Education Institution (University)
              </label>
              <input
                type="text"
                required
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
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
                Department
              </label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Faculty Lead (Supervising Prof)
              </label>
              <input
                type="text"
                required
                value={facultyLead}
                onChange={(e) => setFacultyLead(e.target.value)}
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
                Faculty Email
              </label>
              <input
                type="email"
                required
                value={facultyEmail}
                onChange={(e) => setFacultyEmail(e.target.value)}
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
                Funding Goal (₹)
              </label>
              <input
                type="number"
                required
                value={fundingGoal}
                onChange={(e) => setFundingGoal(Number(e.target.value))}
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
          </div>

          {/* Student Team Assembly (NEP 2020 / APAAR ID) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={16} color="var(--accent-indigo)" />
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Student Capstone Team (APAAR ID Registered)
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddStudent}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.72rem', color: 'var(--accent-indigo)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              >
                <Plus size={13} /> Add Student
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {studentTeam.map((student, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr 1.3fr 1.2fr 30px',
                    gap: '0.4rem',
                    alignItems: 'center',
                    backgroundColor: 'var(--bg-input)',
                    padding: '0.45rem 0.65rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <input
                    type="text"
                    required
                    placeholder="Student Name"
                    value={student.name}
                    onChange={(e) => handleStudentChange(idx, 'name', e.target.value)}
                    style={{
                      padding: '0.35rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.75rem',
                    }}
                  />
                  <input
                    type="text"
                    required
                    placeholder="Roll / Student ID"
                    value={student.studentId}
                    onChange={(e) => handleStudentChange(idx, 'studentId', e.target.value)}
                    style={{
                      padding: '0.35rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.75rem',
                    }}
                  />
                  <input
                    type="text"
                    required
                    placeholder="APAAR ID"
                    value={student.apaarId}
                    onChange={(e) => handleStudentChange(idx, 'apaarId', e.target.value)}
                    style={{
                      padding: '0.35rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.72rem',
                    }}
                  />
                  <input
                    type="text"
                    required
                    placeholder="Role (e.g. Lead, CAD)"
                    value={student.role}
                    onChange={(e) => handleStudentChange(idx, 'role', e.target.value)}
                    style={{
                      padding: '0.35rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.75rem',
                    }}
                  />
                  {studentTeam.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStudent(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Project Abstract & Technical Methodology
            </label>
            <textarea
              rows={3}
              required
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
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

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary btn-lg"
            style={{
              backgroundColor: 'var(--accent-indigo)',
              color: '#fff',
              fontWeight: 800,
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <GraduationCap size={18} />
            <span>{submitting ? 'Claiming Challenge...' : 'Initialize Capstone Project Workspace'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
