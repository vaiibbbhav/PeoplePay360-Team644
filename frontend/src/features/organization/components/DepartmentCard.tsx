import React from 'react';
import type { EmployeeListItem } from '@/features/employees/queries/useEmployees';

type DepartmentCardProps = {
  departmentName: string;
  members: EmployeeListItem[];
  onSelectEmployee: (emp: EmployeeListItem) => void;
};

export const DepartmentCard: React.FC<DepartmentCardProps> = ({
  departmentName,
  members,
  onSelectEmployee,
}) => {
  // Try to find department manager/lead (e.g. roles or titles containing Manager/Head/Lead/Director)
  const manager =
    members.find(
      (m) =>
        m.job_position_title?.toLowerCase().includes('manager') ||
        m.job_position_title?.toLowerCase().includes('lead') ||
        m.job_position_title?.toLowerCase().includes('director') ||
        m.job_position_title?.toLowerCase().includes('head'),
    ) || members[0];

  return (
    <div className="bg-bg-raised border border-line rounded-2xl p-6 flex flex-col justify-between hover:border-ink/40 transition-all">
      <div>
        <div className="flex items-center justify-between gap-3 mb-4 pb-4 border-b border-line-subtle">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-faint">
              Department Cluster
            </span>
            <h3 className="text-lg font-sans font-medium text-ink tracking-tight">
              {departmentName}
            </h3>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-accent/10 text-accent border border-accent/20">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </span>
        </div>

        {manager && (
          <div className="mb-5 p-3 rounded-xl bg-bg-sunken border border-line-subtle">
            <span className="text-[10px] font-mono uppercase tracking-wider text-accent font-semibold block mb-1">
              Department Lead
            </span>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent font-bold flex items-center justify-center text-[10px]">
                {manager.first_name?.[0]}
                {manager.last_name?.[0]}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-ink truncate">
                  {manager.first_name} {manager.last_name}
                </p>
                <p className="text-[11px] text-ink-soft truncate">
                  {manager.job_position_title || 'Lead'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Members Roster */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-faint block mb-2">
            Team Roster
          </span>
          {members.map((emp) => (
            <div
              key={emp.id}
              onClick={() => onSelectEmployee(emp)}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-bg-sunken transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-md bg-bg border border-line text-ink-soft flex items-center justify-center text-[10px] font-medium shrink-0">
                  {emp.first_name?.[0]}
                  {emp.last_name?.[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-ink group-hover:text-accent transition-colors truncate">
                    {emp.first_name} {emp.last_name}
                  </p>
                  <p className="text-[11px] text-ink-faint truncate">
                    {emp.job_position_title || 'Team Member'}
                  </p>
                </div>
              </div>

              <span className="text-[10px] text-ink-faint opacity-0 group-hover:opacity-100 transition-opacity">
                View →
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
