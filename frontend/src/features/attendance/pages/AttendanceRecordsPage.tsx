import React, { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCurrentUser } from '@/features/auth/queries/useAuth';
import {
  useAttendanceList,
  type AttendanceRecord,
} from '../queries/useAttendance';
import { AttendanceSummaryCards } from '../components/AttendanceSummaryCards';
import {
  AttendanceFilterToolbar,
  type AttendanceFilterState,
} from '../components/AttendanceFilterToolbar';
import { AttendanceRecordsTable } from '../components/AttendanceRecordsTable';
import { ManualAttendanceDrawer } from '../components/ManualAttendanceDrawer';
import { EmployeeAttendancePage } from './EmployeeAttendancePage';

export const AttendanceRecordsPage: React.FC = () => {
  const { data: user } = useCurrentUser();
  const role = user?.role || 'Employee';

  // Role permissions
  const isEmployeeOnly = role === 'Employee';
  const canManage = ['Admin', 'HR Manager', 'HR Payroll Manager'].includes(role);

  // Filter state
  const [filter, setFilter] = useState<AttendanceFilterState>({
    search: '',
    startDate: '',
    endDate: '',
    status: '',
    exceptionsOnly: false,
  });

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  // Query: for non-employee users, fetch company-wide attendance records
  const { data: allRecords = [], isLoading } = useAttendanceList({
    // If not employee-only, don't pass employeeId so backend returns all attendance logs
    employeeId: isEmployeeOnly ? (user?.employeeId || undefined) : undefined,
    startDate: filter.startDate || undefined,
    endDate: filter.endDate || undefined,
  });

  // Client-side filtering for fast interactive search & exception toggles
  const filteredRecords = useMemo(() => {
    return allRecords.filter((record) => {
      // Search filter
      if (filter.search.trim()) {
        const query = filter.search.toLowerCase();
        const empName = (record.employee_name || '').toLowerCase();
        const empId = (record.employee_id || '').toLowerCase();
        const note = (record.exception_note || '').toLowerCase();
        const matches =
          empName.includes(query) || empId.includes(query) || note.includes(query);
        if (!matches) return false;
      }

      // Status filter
      if (filter.status) {
        if (record.status?.toLowerCase() !== filter.status.toLowerCase()) {
          return false;
        }
      }

      // Exceptions only filter
      if (filter.exceptionsOnly) {
        const isException =
          record.is_manual_edit ||
          Boolean(record.exception_note) ||
          record.status?.toLowerCase() === 'late' ||
          record.status?.toLowerCase().includes('half') ||
          record.status?.toLowerCase() === 'absent';
        if (!isException) return false;
      }

      return true;
    });
  }, [allRecords, filter]);

  // If user is strictly an Employee, delegate to the personal calendar & biometric punch card
  if (isEmployeeOnly) {
    return <EmployeeAttendancePage />;
  }

  const handleOpenManual = () => {
    setSelectedRecord(null);
    setIsDrawerOpen(true);
  };

  const handleEditRecord = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setIsDrawerOpen(true);
  };

  return (
    <AppLayout title="Attendance Records">
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans">
        {/* Page Top Header */}
        <div className="border-b border-line pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-widest text-accent font-semibold">
                Workforce Tracking & Biometrics
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-ink-soft">Live Operations Ledger</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-sans font-medium text-ink">
              Attendance Records
            </h1>
            <p className="text-xs text-ink-soft mt-1">
              Company-wide biometric punch logs, daily hours, and HR exception audit trail.
            </p>
          </div>
        </div>

        {/* Company Ledger View */}
        <div className="space-y-6">
          {/* Real-time Summary Cards */}
          <AttendanceSummaryCards records={filteredRecords} isLoading={isLoading} />

          {/* Filtering & Actions Toolbar */}
          <AttendanceFilterToolbar
            filter={filter}
            onFilterChange={setFilter}
            onOpenManualDrawer={handleOpenManual}
            canManage={canManage}
          />

          {/* Main Attendance Table */}
          <AttendanceRecordsTable
            records={filteredRecords}
            isLoading={isLoading}
            onEditRecord={handleEditRecord}
            canManage={canManage}
          />
        </div>

        {/* Slide-over Drawer for manual edits & adjustments */}
        <ManualAttendanceDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          initialRecord={selectedRecord}
        />
      </div>
    </AppLayout>
  );
};
