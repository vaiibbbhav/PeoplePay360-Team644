import React from 'react';
import type { EmployeeHubDetails } from '../queries/useEmployees';

type OverviewTabProps = {
  employee: EmployeeHubDetails;
};

export const OverviewTab: React.FC<OverviewTabProps> = ({ employee }) => {
  const formatDate = (val: string | null | undefined) => {
    if (!val) return '—';
    try {
      const d = new Date(val);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return val;
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Summary Panel */}
      <div className="bg-bg border border-line rounded-2xl p-6 sm:p-8">
        <h3 className="font-serif text-lg font-semibold text-ink mb-6 pb-3 border-b border-line">
          Profile Summary
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
          <div>
            <span className="text-xs text-ink-soft block mb-1">Department</span>
            <span className="text-sm font-medium text-ink">
              {employee.department_name || 'Unassigned'}
            </span>
          </div>

          <div>
            <span className="text-xs text-ink-soft block mb-1">Designation</span>
            <span className="text-sm font-medium text-ink">
              {employee.job_position_title || 'Unassigned'}
            </span>
          </div>

          <div>
            <span className="text-xs text-ink-soft block mb-1">Head of Department / Manager</span>
            <span className="text-sm font-medium text-ink">
              {employee.manager_name || 'Direct Executive'}
            </span>
          </div>

          <div>
            <span className="text-xs text-ink-soft block mb-1">Company</span>
            <span className="text-sm font-medium text-ink">PeoplePay360 Operations Ltd.</span>
          </div>

          <div>
            <span className="text-xs text-ink-soft block mb-1">Working Schedule</span>
            <span className="text-sm font-medium text-ink">
              {employee.working_schedule_name || 'Standard 40h'}
            </span>
          </div>

          <div>
            <span className="text-xs text-ink-soft block mb-1">Employment Status</span>
            <span className="text-sm font-medium text-ink capitalize">
              {employee.employment_status.replace('_', ' ')}
            </span>
          </div>

          <div>
            <span className="text-xs text-ink-soft block mb-1">Date Of Joining</span>
            <span className="text-sm font-medium text-ink">
              {formatDate(employee.date_of_joining)}
            </span>
          </div>

          <div>
            <span className="text-xs text-ink-soft block mb-1">Date Of Birth</span>
            <span className="text-sm font-medium text-ink">
              {formatDate(employee.date_of_birth)}
            </span>
          </div>

          <div>
            <span className="text-xs text-ink-soft block mb-1">Gender</span>
            <span className="text-sm font-medium text-ink capitalize">
              {employee.gender || 'Not specified'}
            </span>
          </div>
        </div>
      </div>

      {/* Organization Context Card */}
      <div className="bg-bg border border-line rounded-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between pb-3 border-b border-line mb-6">
          <h3 className="font-serif text-lg font-semibold text-ink">
            Organization Hierarchy
          </h3>
          <span className="text-xs text-ink-soft">Direct Reporting Line</span>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl border border-line bg-bg-raised/50">
          <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent font-serif font-bold flex items-center justify-center text-sm">
            {employee.manager_name ? employee.manager_name[0] : '—'}
          </div>
          <div>
            <span className="text-xs text-ink-soft block">Reports to</span>
            <span className="text-sm font-medium text-ink">
              {employee.manager_name || 'No Direct Manager Assigned'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
