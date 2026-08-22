import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  FileCode,
  Video,
  GitBranch,
  Layers,
  Clock,
} from 'lucide-react';
import type { HEIProject, ProjectMilestone } from '../../types';

interface MilestoneUpdateModalProps {
  project: HEIProject | null;
  milestone: ProjectMilestone | null;
  onClose: () => void;
  onUpdateMilestone: (projectId: string, stageIndex: number, params: {
    status: 'completed' | 'in_progress';
    deliverables: any;
    researchHours: number;
  }) => Promise<boolean>;
  onShowToast: (msg: string) => void;
}

export const MilestoneUpdateModal: React.FC<MilestoneUpdateModalProps> = ({
  project,
  milestone,
  onClose,
  onUpdateMilestone,
  onShowToast,
}) => {
  if (!project || !milestone) return null;

  const [schematicUrl, setSchematicUrl] = useState(milestone.deliverables?.schematicUrl || '/samples/lab_schematic_stage1.pdf');
  const [videoUrl, setVideoUrl] = useState(milestone.deliverables?.videoUrl || 'https://youtu.be/sample-lab-prototype-demo');
  const [githubUrl, setGithubUrl] = useState(milestone.deliverables?.githubUrl || 'https://github.com/alcheminds/bit-mesra-biofilter');
  const [testDataNotes, setTestDataNotes] = useState(
    milestone.deliverables?.testDataNotes || 'Tested in lab flow chamber. Achieved 91.4% particulate reduction with 0.8 bar backpressure.'
  );
  const [researchHours, setResearchHours] = useState<number>(milestone.research_hours || 40);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const deliverables = {
      schematicUrl,
      videoUrl,
      githubUrl,
      testDataNotes,
      prototypeUrl: '/samples/prototype_biofilter.jpg',
      telemetryUrl: 'https://telemetry.alcheminds.gov.in/node-14',
    };

    const success = await onUpdateMilestone(project.id, milestone.stage_index, {
      status: 'completed',
      deliverables,
      researchHours,
    });
    setSubmitting(false);

    if (success) {
      onShowToast(`✓ Stage ${milestone.stage_index} milestone marked complete! Deliverables logged to NEP registry.`);
      onClose();
    } else {
      onShowToast('Failed to update milestone.');
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
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-indigo)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Layers size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                  Stage {milestone.stage_index}: {milestone.title}
                </h3>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Upload capstone technical deliverables, lab test data & student research hours.
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
            gap: '1rem',
          }}
        >
          {/* Milestone Overview */}
          <div
            style={{
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Project: {project.title}
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              {milestone.description}
            </p>
          </div>

          {/* Technical Deliverables Fields */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              CAD / Engineering Schematic Document URL
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileCode size={16} color="var(--accent-indigo)" />
              <input
                type="text"
                required
                value={schematicUrl}
                onChange={(e) => setSchematicUrl(e.target.value)}
                placeholder="e.g. /samples/cad_drawings.pdf or Cloud Storage Link"
                style={{
                  flex: 1,
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Working Prototype Video Demonstration URL
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Video size={16} color="var(--accent-rose)" />
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="e.g. YouTube / Vimeo / Drive Prototype Demo URL"
                style={{
                  flex: 1,
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Open Source GitHub / Hardware Repository Link
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GitBranch size={16} color="var(--text-primary)" />
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/organization/repo"
                style={{
                  flex: 1,
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Lab Test Data, Turbidity/Flow Readings & Observations
            </label>
            <textarea
              rows={3}
              required
              value={testDataNotes}
              onChange={(e) => setTestDataNotes(e.target.value)}
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

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Student Research & Field Hours to Credit (NEP 2020)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} color="var(--accent-amber)" />
              <input
                type="number"
                required
                value={researchHours}
                onChange={(e) => setResearchHours(Number(e.target.value))}
                style={{
                  width: '120px',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
                }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Hours logged to student APAAR accounts (~{(researchHours / 20).toFixed(1)} NCrF Academic Credits)
              </span>
            </div>
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
            <CheckCircle2 size={18} />
            <span>{submitting ? 'Updating Milestone...' : 'Mark Milestone Completed & Advance Pipeline'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
