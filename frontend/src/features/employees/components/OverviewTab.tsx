import React from 'react';
import type { EmployeeHubDetails } from '../queries/useEmployees';
import { StatGrid } from '@/components/ui/StatCard';
import { WeeklyTimetableGrid } from '@/features/schedules/components/WeeklyTimetableGrid';
import { useScheduleDetail } from '@/features/schedules/queries/useSchedules';

type OverviewTabProps = {
  employee: EmployeeHubDetails;
};

export const OverviewTab: React.FC<OverviewTabProps> = ({ employee }) => {
  const { data: schedule, isLoading: isScheduleLoading } = useScheduleDetail(
    employee.working_schedule_id,
  );

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
      <div className="bg-bg border border-line rounded-2xl p-4 sm:p-8">
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

      {employee.working_schedule_id && (
        <div className="bg-bg border border-line rounded-2xl p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="font-serif text-lg font-semibold text-ink">
                {schedule?.name || employee.working_schedule_name || 'Working Schedule'}
              </h3>
              <p className="text-xs text-ink-soft mt-1">
                {schedule
                  ? `${schedule.lines.length} working days per week · ${schedule.employeeCount} employee${schedule.employeeCount === 1 ? '' : 's'} assigned`
                  : 'Loading schedule details…'}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-2xl font-semibold tracking-tight text-ink">
                {schedule?.weeklyHours ?? employee.weekly_hours ?? '—'}
              </span>
              <span className="text-xs text-ink-soft block -mt-1">hrs / week</span>
            </div>
          </div>

          {schedule ? (
            <>
              <WeeklyTimetableGrid lines={schedule.lines} />
              <p className="text-[11px] text-ink-soft mt-4">
                Created {formatDate(schedule.createdAt)}
              </p>
            </>
          ) : isScheduleLoading ? (
            <div className="h-[106px] border border-line rounded-xl bg-bg-raised/40 animate-pulse" />
          ) : null}
        </div>
      )}

      {/* Operational Highlights Cards - Below Profile Summary */}
      <StatGrid
        columns={4}
        items={[
          {
            label: 'Active Contracts',
            value: employee.smartCounts?.contracts ?? 0,
            subtext: 'Binding agreement records',
          },
          {
            label: 'Attendance Punches',
            value: employee.smartCounts?.attendance ?? 0,
            subtext: 'Monthly biometric logs',
          },
          {
            label: 'Time Off Requests',
            value: employee.smartCounts?.timeOff ?? 0,
            subtext: 'Leave & absence filings',
          },
          {
            label: 'Payslips',
            value: employee.smartCounts?.payslips ?? 0,
            subtext: 'Computed salary settlements',
          },
        ]}
      />

      {/* Organization Context Card */}
      <div className="bg-bg border border-line rounded-2xl p-4 sm:p-8">
        <div className="flex items-center justify-between pb-3 border-b border-line mb-6">
          <h3 className="font-sans text-lg font-semibold text-ink">Organization Hierarchy</h3>
          <span className="text-xs text-ink-soft">Direct Reporting Line</span>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl border border-line bg-bg-raised/50">
          <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent font-sans font-bold flex items-center justify-center text-sm">
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
