import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Search,
} from 'lucide-react';
import type { HEIProject, StoredReport } from '../../types';

interface GovernmentProjectsProps {
  heiProjects: HEIProject[];
  reports?: StoredReport[];
  onSelectChallenge?: (report: StoredReport) => void;
}

export const GovernmentProjects: React.FC<GovernmentProjectsProps> = ({
  heiProjects,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');

  const STAGES = [
    { num: 1, label: 'Stage 1: Problem Def & Telemetry' },
    { num: 2, label: 'Stage 2: Simulation & Prototyping' },
    { num: 3, label: 'Stage 3: Field Pilot in Ward' },
    { num: 4, label: 'Stage 4: Tech Transfer & ULB Adoption' },
  ];

  // Fallback demo projects if database has few
  const allProjects = heiProjects.length > 0 ? heiProjects : [
    {
      id: 'proj_demo_1',
      title: 'Solar-Powered Multi-Stage Arsenic & Fluoride Water Purifier',
      institution_name: 'IIT (ISM) Dhanbad',
      department: 'Environmental Science & Engineering Dept',
      faculty_lead: 'Prof. Dr. A. V. Deshmukh',
      faculty_email: 'a.deshmukh@iitism.ac.in',
      current_stage: 3,
      total_research_hours: 145,
      total_field_hours: 60,
      funding_goal: 350000,
      funding_pledged: 250000,
      status: 'active',
      abstract: 'On-site continuous heavy metal absorption using low-cost nano-media and real-time IoT cloud telemetry.',
      created_at: '2026-05-10T10:00:00Z',
    },
    {
      id: 'proj_demo_2',
      title: 'Recycled Plastic Polymer Cold-Mix Asphalt Patching',
      institution_name: 'BIT Mesra',
      department: 'Civil & Environmental Engineering Dept',
      faculty_lead: 'Dr. P. K. Srivastava',
      faculty_email: 'pksrivastava@bitmesra.ac.in',
      current_stage: 2,
      total_research_hours: 98,
      total_field_hours: 35,
      funding_goal: 200000,
      funding_pledged: 150000,
      status: 'active',
      abstract: 'High-durability cold-mix binder utilizing post-consumer polymer waste to resist water unraveling during monsoons.',
      created_at: '2026-06-01T10:00:00Z',
    },
    {
      id: 'proj_demo_3',
      title: 'LoRaWAN Ultrasonic Urban Stormwater Siphon Gate Trigger',
      institution_name: 'NIT Jamshedpur',
      department: 'Mechanical & Civil Hydrodynamics',
      faculty_lead: 'Dr. S. K. Roy',
      faculty_email: 'skroy@nitjsr.ac.in',
      current_stage: 4,
      total_research_hours: 180,
      total_field_hours: 95,
      funding_goal: 400000,
      funding_pledged: 400000,
      status: 'active',
      abstract: 'Autonomous siphon triggers activated by edge sensors to prevent low-lying canal overtopping in urban settlements.',
      created_at: '2026-04-15T10:00:00Z',
    },
  ];

  const filteredProjects = allProjects.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (p.title || '').toLowerCase().includes(q);
      const matchInst = (p.institution_name || '').toLowerCase().includes(q);
      const matchLead = (p.faculty_lead || '').toLowerCase().includes(q);
      if (!matchTitle && !matchInst && !matchLead) return false;
    }
    if (stageFilter !== 'all' && p.current_stage !== Number(stageFilter)) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          padding: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Higher Education Innovation Project Monitoring
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              Real-time milestone tracking for university capstone engineering & scientific solutions.
            </p>
          </div>

          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(236, 72, 153, 0.15)',
              color: '#ec4899',
              border: '1px solid rgba(236, 72, 153, 0.3)',
            }}
          >
            {filteredProjects.length} Active R&D Projects
          </span>
        </div>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search project title, institution, faculty lead..."
              className="input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '32px', height: '36px', fontSize: '0.8125rem', width: '100%' }}
            />
          </div>

          <select
            className="input"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            style={{ height: '36px', fontSize: '0.8125rem' }}
          >
            <option value="all">All 4 Lifecycle Stages</option>
            <option value="1">Stage 1: Problem Def & Telemetry</option>
            <option value="2">Stage 2: Simulation & Prototyping</option>
            <option value="3">Stage 3: Field Pilot in Ward</option>
            <option value="4">Stage 4: Tech Transfer & Scaling</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredProjects.map((proj: any) => {
          const currentStage = proj.current_stage || 1;

          return (
            <div
              key={proj.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                padding: '1.35rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                        color: 'var(--accent-indigo)',
                      }}
                    >
                      {proj.institution_name}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {proj.department}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {proj.title}
                  </h3>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Faculty Lead</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>{proj.faculty_lead}</div>
                </div>
              </div>

              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '1.15rem' }}>
                {proj.abstract}
              </p>

              {/* 4-Stage Stepper Progress */}
              <div style={{ marginBottom: '1.15rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                  Project Lifecycle Stage Progress (NEP 2020 Capstone)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                  {STAGES.map((s) => {
                    const isCompleted = s.num < currentStage;
                    const isActive = s.num === currentStage;

                    return (
                      <div
                        key={s.num}
                        style={{
                          backgroundColor: isActive ? 'rgba(99, 102, 241, 0.1)' : isCompleted ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-elevated)',
                          border: isActive ? '1px solid var(--accent-indigo)' : isCompleted ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.65rem 0.75rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          {isCompleted ? (
                            <CheckCircle2 size={14} color="#10b981" />
                          ) : isActive ? (
                            <Clock size={14} color="var(--accent-indigo)" />
                          ) : (
                            <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              #{s.num}
                            </span>
                          )}
                          <span style={{ fontSize: '0.75rem', fontWeight: isActive ? 800 : 600, color: isActive ? 'var(--accent-indigo)' : isCompleted ? '#10b981' : 'var(--text-muted)' }}>
                            {s.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Micro Stats: Hours & Grants */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '1.25rem', color: 'var(--text-secondary)' }}>
                  <span>🔬 Research: <strong>{proj.total_research_hours || 0} hrs</strong></span>
                  <span>📍 Fieldwork: <strong>{proj.total_field_hours || 0} hrs</strong></span>
                  <span>💰 CSR Grant: <strong style={{ color: '#10b981' }}>₹{(proj.funding_pledged || 0).toLocaleString()}</strong> / ₹{(proj.funding_goal || 0).toLocaleString()}</span>
                </div>

                <span style={{ color: 'var(--accent-indigo)', fontWeight: 700 }}>
                  Active University R&D Track
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
