import React, { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { EmployeeListItem } from '@/features/employees/queries/useEmployees';

export type OrgNodeData = {
  employee: EmployeeListItem;
  reportsCount: number;
  isCollapsed: boolean;
  onToggleCollapse: (id: string) => void;
  onSelectEmployee: (emp: EmployeeListItem) => void;
  isSelected?: boolean;
};

export type OrgCustomNode = Node<OrgNodeData, 'orgNode'>;

export const OrgNode: React.FC<NodeProps<OrgCustomNode>> = memo(({ data }) => {
  const { employee, reportsCount, isCollapsed, onToggleCollapse, onSelectEmployee, isSelected } =
    data;

  const initials =
    `${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`.toUpperCase();

  const isExecutive = !employee.manager_id;

  return (
    <div
      onClick={() => onSelectEmployee(employee)}
      className={`relative w-[244px] rounded-xl border bg-bg-raised p-3 text-left transition-colors select-none group cursor-pointer ${
        isSelected
          ? 'border-accent ring-2 ring-accent/30 bg-accent/[0.03] scale-[1.02]'
          : isExecutive
            ? 'border-accent/40 hover:border-accent'
            : 'border-line hover:border-ink/50'
      }`}
    >
      {employee.manager_id && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-2.5 !h-2.5 !bg-accent !border-2 !border-bg !rounded-full !-top-1.5 transition-transform group-hover:scale-125"
        />
      )}

      <div className="flex items-start gap-3">
        {/* Avatar with status indicator */}
        <div className="relative shrink-0">
          <div
            className={`w-10 h-10 rounded-lg font-semibold flex items-center justify-center text-xs tracking-wider border ${
              isExecutive
                ? 'bg-accent text-accent-ink border-accent/30 font-bold'
                : 'bg-accent/10 text-accent border-accent/20'
            }`}
          >
            {initials}
          </div>
          {employee.employment_status === 'active' && (
            <span
              title="Active Employee"
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-bg"
            />
          )}
        </div>

        {/* Text Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] font-mono uppercase tracking-widest font-semibold px-2 py-0.5 rounded bg-bg-sunken text-ink-soft border border-line-subtle truncate max-w-[130px]">
              {employee.department_name || 'General'}
            </span>
          </div>

          <h4 className="text-sm font-sans font-medium text-ink truncate tracking-tight mt-1">
            {employee.first_name} {employee.last_name}
          </h4>

          <p className="text-xs text-ink-soft truncate mt-0.5">
            {employee.job_position_title || 'Team Member'}
          </p>
        </div>
      </div>

      <div className="mt-3 border-t border-line-subtle pt-2 text-[11px] text-ink-faint">
        <span className="text-accent group-hover:translate-x-0.5 transition-transform font-medium">
          View profile →
        </span>
      </div>

      {/* Bottom Handle & Expand/Collapse Trigger */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-accent !border-2 !border-bg !rounded-full !-bottom-1.5 transition-transform group-hover:scale-125"
      />

      {reportsCount > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse(employee.id);
          }}
          title={isCollapsed ? `Expand ${reportsCount} reports` : 'Collapse team'}
          className={`absolute -bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono font-semibold transition-all cursor-pointer shadow-xs ${
            isCollapsed
              ? 'bg-accent text-accent-ink border-accent hover:opacity-90'
              : 'bg-bg-raised text-ink-soft border-line hover:border-ink hover:text-ink'
          }`}
        >
          <span>{reportsCount}</span>
          <svg
            className={`w-3 h-3 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      )}
    </div>
  );
});

OrgNode.displayName = 'OrgNode';
