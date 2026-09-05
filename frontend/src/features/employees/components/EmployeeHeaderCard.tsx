import React from 'react';
import type { EmployeeHubDetails } from '../queries/useEmployees';

type EmployeeHeaderCardProps = {
  employee: EmployeeHubDetails;
  onEdit: () => void;
};

export const EmployeeHeaderCard: React.FC<EmployeeHeaderCardProps> = ({ employee, onEdit }) => {
  const fullName = `${employee.first_name} ${employee.last_name}`;
  const initials = `${employee.first_name[0] || ''}${employee.last_name[0] || ''}`.toUpperCase();

  const statusBadge = () => {
    switch (employee.employment_status) {
      case 'active':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border border-line bg-bg-raised text-ink">
            Active
          </span>
        );
      case 'on_leave':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border border-line bg-accent-soft text-accent">
            On Leave
          </span>
        );
      case 'terminated':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border border-line bg-bg-raised text-over-red">
            Terminated
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border border-line bg-bg-raised text-ink-soft">
            Inactive
          </span>
        );
    }
  };

  return (
    <div className="bg-bg border border-line rounded-2xl overflow-hidden mb-6">
      {/* Top Banner Cover Strip */}
      <div className="h-28 bg-bg-raised border-b border-line relative px-6 sm:px-8 flex items-end justify-end pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-bg border border-line text-ink hover:bg-bg-raised transition-colors cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5 text-ink-soft"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
              />
            </svg>
            Edit Profile
          </button>
        </div>
      </div>

      {/* Profile Header Content */}
      <div className="px-6 sm:px-8 pb-6 pt-0">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-4">
          <div className="flex items-end gap-4">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl border-4 border-bg bg-accent-soft text-accent font-serif text-2xl font-bold flex items-center justify-center relative shadow-xs overflow-hidden shrink-0">
              {employee.avatar_url ? (
                <img
                  src={employee.avatar_url}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            <div className="pb-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">{fullName}</h1>
                {statusBadge()}
              </div>

              <div className="flex items-center gap-2 text-xs sm:text-sm text-ink-soft mt-1 flex-wrap">
                <span className="font-medium text-ink">
                  {employee.job_position_title || 'Unassigned Position'}
                </span>
                <span>•</span>
                <span>{employee.department_name || 'No Department'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-bar Information: Location, Manager, Smart Counts */}
        <div className="pt-4 border-t border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs text-ink-soft flex-wrap">
            <div className="flex items-center gap-1.5">
              <svg
                className="w-4 h-4 text-ink-soft"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              </svg>
              <span>Main Headquarters</span>
            </div>

            <div className="flex items-center gap-1.5">
              <svg
                className="w-4 h-4 text-ink-soft"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
              <span>
                Manager:{' '}
                <strong className="font-medium text-ink">
                  {employee.manager_name || 'None (Direct Head)'}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <svg
                className="w-4 h-4 text-ink-soft"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
              <span>{employee.email}</span>
            </div>
          </div>

          {/* Operational Smart Counters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1 rounded-lg border border-line bg-bg-raised text-[11px] text-ink-soft">
              Contracts:{' '}
              <strong className="text-ink font-semibold">
                {employee.smartCounts?.contracts ?? 0}
              </strong>
            </div>
            <div className="px-3 py-1 rounded-lg border border-line bg-bg-raised text-[11px] text-ink-soft">
              Attendance:{' '}
              <strong className="text-ink font-semibold">
                {employee.smartCounts?.attendance ?? 0}
              </strong>
            </div>
            <div className="px-3 py-1 rounded-lg border border-line bg-bg-raised text-[11px] text-ink-soft">
              Leaves:{' '}
              <strong className="text-ink font-semibold">
                {employee.smartCounts?.timeOff ?? 0}
              </strong>
            </div>
            <div className="px-3 py-1 rounded-lg border border-line bg-bg-raised text-[11px] text-ink-soft">
              Payslips:{' '}
              <strong className="text-ink font-semibold">
                {employee.smartCounts?.payslips ?? 0}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
