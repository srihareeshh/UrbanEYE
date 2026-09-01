import React from 'react';
import { ShieldAlert, AlertTriangle, Info, Clock, Layers } from 'lucide-react';

export type PriorityFilterValue = 'all' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

interface PriorityFilterProps {
  selectedPriority: PriorityFilterValue;
  onSelectPriority: (priority: PriorityFilterValue) => void;
}

interface FilterTab {
  id: PriorityFilterValue;
  label: string;
  color: string;
  icon: React.FC<{ size?: number; color?: string }>;
}

const PRIORITY_TABS: FilterTab[] = [
  { id: 'all', label: 'All Priorities', color: 'var(--text-secondary)', icon: Layers },
  { id: 'CRITICAL', label: 'Critical (80+)', color: '#f43f5e', icon: ShieldAlert },
  { id: 'HIGH', label: 'High (50–79)', color: '#f97316', icon: AlertTriangle },
  { id: 'MEDIUM', label: 'Medium (25–49)', color: '#38bdf8', icon: Info },
  { id: 'LOW', label: 'Low (< 25)', color: '#94a3b8', icon: Clock },
];

export const PriorityFilter: React.FC<PriorityFilterProps> = ({
  selectedPriority,
  onSelectPriority,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        overflowX: 'auto',
        paddingBottom: '0.25rem',
      }}
    >
      {PRIORITY_TABS.map((tab) => {
        const isSelected = selectedPriority === tab.id;
        const IconComponent = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onSelectPriority(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78125rem',
              fontWeight: isSelected ? 800 : 600,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: isSelected ? `1px solid ${tab.color}` : '1px solid var(--border-subtle)',
              backgroundColor: isSelected ? `${tab.color}18` : 'var(--bg-elevated)',
              color: isSelected ? (tab.id === 'all' ? 'var(--text-primary)' : tab.color) : 'var(--text-secondary)',
            }}
          >
            <IconComponent size={13} color={isSelected ? (tab.id === 'all' ? 'var(--text-primary)' : tab.color) : 'var(--text-muted)'} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
