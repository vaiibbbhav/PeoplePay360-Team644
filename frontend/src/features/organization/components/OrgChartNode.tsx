import React from 'react';
import type { EmployeeListItem } from '@/features/employees/queries/useEmployees';

type OrgChartNodeProps = {
  employee: EmployeeListItem;
  reportsCount: number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onSelect?: (employee: EmployeeListItem) => void;
  isSelected?: boolean;
};

export const OrgChartNode: React.FC<OrgChartNodeProps> = ({
  employee,
  reportsCount,
  isExpanded = true,
  onToggleExpand,
  onSelect,
  isSelected = false,
}) => {
  const initials =
    `${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div
      onClick={() => onSelect?.(employee)}
      className={`relative group w-64 p-4 rounded-2xl bg-bg-raised border transition-all duration-200 cursor-pointer select-none text-left shadow-xs hover:shadow-md ${
        isSelected
          ? 'border-accent ring-2 ring-accent/20 bg-accent/[0.02]'
          : 'border-line hover:border-ink/50'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 text-accent font-semibold flex items-center justify-center text-xs shrink-0">
          {initials}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-serif font-medium text-ink truncate tracking-tight">
            {employee.first_name} {employee.last_name}
          </h4>
          <p className="text-xs text-ink-soft truncate mt-0.5">
            {employee.job_position_title || 'Team Member'}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-bg-sunken text-ink-soft border border-line-subtle truncate max-w-[120px]">
              {employee.department_name || 'General'}
            </span>
            {reportsCount > 0 && (
              <span className="text-[10px] font-mono text-accent font-semibold bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20 shrink-0">
                {reportsCount} {reportsCount === 1 ? 'report' : 'reports'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expand / Collapse button if node has reports */}
      {reportsCount > 0 && onToggleExpand && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          title={isExpanded ? 'Collapse team' : 'Expand team'}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-bg border border-line text-ink-soft hover:text-ink hover:border-ink flex items-center justify-center text-xs transition-colors cursor-pointer shadow-xs z-10"
        >
          {isExpanded ? (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 5v14m-7-7h14"
              />
            </svg>
          )}
        </button>
      )}
    </div>
  );
};
