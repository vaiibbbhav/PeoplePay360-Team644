import React from 'react';
import type { EmployeeHubDetails } from '../queries/useEmployees';

type EmploymentDetailsTabProps = {
  employee: EmployeeHubDetails;
};

export const EmploymentDetailsTab: React.FC<EmploymentDetailsTabProps> = ({ employee }) => {
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
      {/* Position & Organizational Mapping */}
      <div className="bg-bg border border-line rounded-2xl p-6 sm:p-8">
        <h3 className="font-serif text-lg font-semibold text-ink mb-6 pb-3 border-b border-line">
          Work & Organizational Assignment
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
          <div>
            <span className="text-xs text-ink-soft block mb-1">Department</span>
            <span className="text-sm font-medium text-ink">
              {employee.department_name || 'Unassigned'}
            </span>
          </div>

          <div>
            <span className="text-xs text-ink-soft block mb-1">Designation / Role Title</span>
            <span className="text-sm font-medium text-ink">
              {employee.job_position_title || 'Unassigned'}
            </span>
          </div>

          <div>
            <span className="text-xs text-ink-soft block mb-1">Reporting Manager</span>
            <span className="text-sm font-medium text-ink">
              {employee.manager_name || 'Direct Executive'}
            </span>
          </div>

          <div>
            <span className="text-xs text-ink-soft block mb-1">Working Schedule Policy</span>
            <span className="text-sm font-medium text-ink">
              {employee.working_schedule_name || 'Standard 40h'}
            </span>
          </div>

          <div>
            <span className="text-xs text-ink-soft block mb-1">Weekly Standard Hours</span>
            <span className="text-sm font-medium text-ink">
              {employee.weekly_hours ? `${employee.weekly_hours} hrs / week` : '40.00 hrs / week'}
            </span>
          </div>

          <div>
            <span className="text-xs text-ink-soft block mb-1">Date Of Joining</span>
            <span className="text-sm font-medium text-ink">
              {formatDate(employee.date_of_joining)}
            </span>
          </div>

          <div>
            <span className="text-xs text-ink-soft block mb-1">Operational Status</span>
            <span className="text-sm font-medium text-ink capitalize">
              {employee.employment_status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
