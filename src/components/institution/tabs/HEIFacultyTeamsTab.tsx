import React, { useState } from 'react';
import {
  Users,
  GraduationCap,
  Mail,
  Clock,
} from 'lucide-react';
import type { FacultyMember, StudentResearcher } from '../heiDataModel';

interface HEIFacultyTeamsTabProps {
  facultyList: FacultyMember[];
  studentList: StudentResearcher[];
}

export const HEIFacultyTeamsTab: React.FC<HEIFacultyTeamsTabProps> = ({
  facultyList,
  studentList,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'faculty' | 'students'>('faculty');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Header & Switcher */}
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
            Faculty Mentors & Student Research Teams
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0 }}>
            Academic research leads, capstone supervisors, and digitally verified student researchers with APAAR IDs.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={() => setActiveSubTab('faculty')}
            className={`btn btn-sm ${activeSubTab === 'faculty' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78125rem' }}
          >
            <GraduationCap size={14} />
            <span>Faculty Mentors ({facultyList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('students')}
            className={`btn btn-sm ${activeSubTab === 'students' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78125rem' }}
          >
            <Users size={14} />
            <span>Student Researchers ({studentList.length})</span>
          </button>
        </div>
      </div>

      {/* 2. Content */}
      {activeSubTab === 'faculty' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          {facultyList.map((fac) => (
            <div
              key={fac.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {fac.name}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-indigo)', fontWeight: 700, marginTop: '0.15rem' }}>
                    {fac.designation}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                    {fac.department}
                  </div>
                </div>

                <div
                  style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(99, 102, 241, 0.12)',
                    color: 'var(--accent-indigo)',
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                  }}
                >
                  h-index: {fac.hIndex}
                </div>
              </div>

              {/* Specializations */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {fac.specialization.map((spec, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      padding: '0.15rem 0.45rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {spec}
                  </span>
                ))}
              </div>

              {/* Stats Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.6rem',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Mail size={12} />
                  {fac.email}
                </span>
                <span>Active Capstones: <strong style={{ color: '#10b981' }}>{fac.activeProjectsCount}</strong></span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          {studentList.map((stu) => (
            <div
              key={stu.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {stu.name}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    {stu.year} • {stu.department}
                  </div>
                  <div className="mono" style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800, marginTop: '0.15rem' }}>
                    ● {stu.apaarId} (Verified)
                  </div>
                </div>

                <div
                  style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    color: 'var(--accent-amber)',
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                  }}
                >
                  {stu.nepCreditsEarned} NEP Credits
                </div>
              </div>

              {/* Skills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {stu.skills.map((skill, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      padding: '0.15rem 0.45rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      color: 'var(--accent-indigo)',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Role & Research Hours */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.6rem',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span>Role: <strong style={{ color: 'var(--text-primary)' }}>{stu.role}</strong></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={12} color="var(--accent-indigo)" />
                  <strong>{stu.researchHours} hrs</strong> logged
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
