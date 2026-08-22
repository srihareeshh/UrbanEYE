import React, { useMemo } from 'react';
import {
  AlertTriangle,
  Droplets,
  Zap,
  Trash,
  GraduationCap,
  Sprout,
  Trees,
  Building2,
  HelpCircle,
  Clock,
  Repeat,
  Flame,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';
import type {
  IssueCategory,
  IssueDuration,
  IssueRecurrence,
  IssueSeverity,
  IssueDetailsState,
} from '../types';
import { analyzeSmartSuggestions } from '../utils/smartAssistant';

interface IssueDetailsFormProps {
  details: IssueDetailsState;
  onChangeDetails: (details: IssueDetailsState) => void;
  mediaNames: string[];
}

const CATEGORIES: Array<{ id: IssueCategory; label: string; icon: React.ReactNode }> = [
  { id: 'Water', label: 'Water & Drainage', icon: <Droplets size={16} /> },
  { id: 'Roads', label: 'Roads & Transit', icon: <AlertTriangle size={16} /> },
  { id: 'Sanitation', label: 'Sanitation & Waste', icon: <Trash size={16} /> },
  { id: 'Electricity', label: 'Electricity & Grid', icon: <Zap size={16} /> },
  { id: 'Schools', label: 'School Safety', icon: <GraduationCap size={16} /> },
  { id: 'Agriculture', label: 'Agriculture & Land', icon: <Sprout size={16} /> },
  { id: 'Environment', label: 'Environment', icon: <Trees size={16} /> },
  { id: 'Public Services', label: 'Public Services', icon: <Building2 size={16} /> },
  { id: 'Other', label: 'Other Issue', icon: <HelpCircle size={16} /> },
];

const DURATIONS: IssueDuration[] = [
  'Today',
  'A few days',
  'A few weeks',
  'A few months',
  'Longer',
  'Not sure',
];

const RECURRENCES: IssueRecurrence[] = [
  'First time',
  'Sometimes',
  'Frequently',
  'Almost always',
  'Not sure',
];

const SEVERITIES: Array<{ id: IssueSeverity; label: string; desc: string; color: string }> = [
  { id: 'Low', label: 'Low', desc: 'Minor inconvenience, no immediate disruption', color: 'var(--accent-emerald)' },
  { id: 'Moderate', label: 'Moderate', desc: 'Noticeable problem affecting neighborhood daily', color: 'var(--accent-amber)' },
  { id: 'Serious', label: 'Serious', desc: 'Substantial disruption or property impact', color: '#f97316' },
  { id: 'Dangerous', label: 'Dangerous', desc: 'Active safety hazard or risk to life/health', color: 'var(--accent-rose)' },
];

export const IssueDetailsForm: React.FC<IssueDetailsFormProps> = ({
  details,
  onChangeDetails,
  mediaNames,
}) => {
  // Analyze smart suggestions
  const suggestion = useMemo(() => {
    return analyzeSmartSuggestions(details.description, mediaNames);
  }, [details.description, mediaNames]);

  // Apply suggestion
  const handleApplySuggestion = () => {
    if (!suggestion) return;
    onChangeDetails({
      ...details,
      category: suggestion.category || details.category,
      severity: suggestion.severity || details.severity,
      smartSuggested: true,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Description Text Area */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
          <label style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
            What happened?
          </label>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Plain language description
          </span>
        </div>

        <textarea
          className="textarea"
          rows={3}
          placeholder="Describe the issue naturally (e.g. Flooded roadway near school entrance after morning rainfall, drains are completely clogged...)"
          value={details.description}
          onChange={(e) => onChangeDetails({ ...details, description: e.target.value })}
        />

        {/* Smart Assistance Banner */}
        {suggestion && (
          <div
            style={{
              marginTop: '0.85rem',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} color="var(--accent-amber)" />
              <div style={{ fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Smart Suggestion: </span>
                {suggestion.category && <strong style={{ color: 'var(--text-primary)' }}>{suggestion.category}</strong>}
                {suggestion.category && suggestion.severity && ' • '}
                {suggestion.severity && <span className="mono" style={{ color: 'var(--accent-amber)' }}>{suggestion.severity} Severity</span>}
              </div>
            </div>

            <button
              type="button"
              onClick={handleApplySuggestion}
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: '0.75rem',
                backgroundColor: 'var(--accent-amber-glow)',
                color: 'var(--accent-amber)',
                borderColor: 'rgba(245, 158, 11, 0.3)',
              }}
            >
              <Check size={12} /> Apply Suggestion
            </button>
          </div>
        )}
      </div>

      {/* 2. Category Selection */}
      <div className="card">
        <label style={{ fontWeight: 700, fontSize: '0.9375rem', display: 'block', marginBottom: '0.75rem' }}>
          Issue Category <span style={{ color: 'var(--accent-amber)' }}>*</span>
        </label>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '0.65rem',
          }}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = details.category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onChangeDetails({ ...details, category: cat.id })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isSelected ? 'var(--accent-amber-glow)' : 'var(--bg-input)',
                  border: isSelected ? '1px solid var(--accent-amber)' : '1px solid var(--border-subtle)',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.8125rem',
                  fontWeight: isSelected ? 700 : 500,
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ color: isSelected ? 'var(--accent-amber)' : 'var(--text-muted)' }}>
                  {cat.icon}
                </div>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Duration & Recurrence Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* Duration */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <Clock size={16} color="var(--accent-amber)" />
            <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>How long has this been happening?</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {DURATIONS.map((dur) => {
              const isSelected = details.duration === dur;
              return (
                <button
                  key={dur}
                  type="button"
                  onClick={() => onChangeDetails({ ...details, duration: dur })}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.78125rem',
                    fontWeight: isSelected ? 600 : 500,
                    backgroundColor: isSelected ? 'var(--text-primary)' : 'var(--bg-input)',
                    color: isSelected ? 'var(--text-inverse)' : 'var(--text-secondary)',
                    border: isSelected ? '1px solid var(--text-primary)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {dur}
                </button>
              );
            })}
          </div>
        </div>

        {/* Recurrence */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <Repeat size={16} color="var(--accent-amber)" />
            <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Does this recur repeatedly?</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {RECURRENCES.map((rec) => {
              const isSelected = details.recurrence === rec;
              return (
                <button
                  key={rec}
                  type="button"
                  onClick={() => onChangeDetails({ ...details, recurrence: rec })}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.78125rem',
                    fontWeight: isSelected ? 600 : 500,
                    backgroundColor: isSelected ? 'var(--text-primary)' : 'var(--bg-input)',
                    color: isSelected ? 'var(--text-inverse)' : 'var(--text-secondary)',
                    border: isSelected ? '1px solid var(--text-primary)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {rec}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Severity Assessment */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
          <Flame size={16} color="var(--accent-amber)" />
          <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Estimated Severity Level</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '0.65rem',
            marginBottom: '0.85rem',
          }}
        >
          {SEVERITIES.map((sev) => {
            const isSelected = details.severity === sev.id;
            return (
              <button
                key={sev.id}
                type="button"
                onClick={() => onChangeDetails({ ...details, severity: sev.id })}
                style={{
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isSelected ? 'var(--bg-elevated)' : 'var(--bg-input)',
                  border: isSelected ? `2px solid ${sev.color}` : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: isSelected ? sev.color : 'var(--text-primary)' }}>
                    {sev.label}
                  </span>
                  {isSelected && <ShieldCheck size={14} color={sev.color} />}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                  {sev.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Immediate Risk Section if Dangerous */}
        {details.severity === 'Dangerous' && (
          <div
            style={{
              backgroundColor: 'var(--accent-rose-glow)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              marginTop: '0.85rem',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={details.isRiskPresent}
                onChange={(e) => onChangeDetails({ ...details, isRiskPresent: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-rose)' }}
              />
              <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                Is anyone currently at immediate risk or in physical danger?
              </span>
            </label>

            {details.isRiskPresent && (
              <input
                type="text"
                className="input"
                style={{ marginTop: '0.65rem', fontSize: '0.8125rem', padding: '0.5rem 0.75rem' }}
                placeholder="Optional: Specify risk (e.g. Live fallen wire near school gate, children walking past...)"
                value={details.riskDescription}
                onChange={(e) => onChangeDetails({ ...details, riskDescription: e.target.value })}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
