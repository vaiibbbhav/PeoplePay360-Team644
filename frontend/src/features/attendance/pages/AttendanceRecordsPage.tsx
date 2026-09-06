import React, { useState, useMemo } from 'react';
import { Download, RefreshCw } from 'lucide-react';
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
  const { data: allRecords = [], isLoading, refetch } = useAttendanceList({
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
        const empEmail = (record.employee_email || '').toLowerCase();
        const empId = (record.employee_id || '').toLowerCase();
        const note = (record.exception_note || '').toLowerCase();
        const matches =
          empName.includes(query) ||
          empEmail.includes(query) ||
          empId.includes(query) ||
          note.includes(query);
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

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;
    const headers = [
      'Employee Name',
      'Employee Email',
      'Date',
      'Check In',
      'Check Out',
      'Worked Hours',
      'Status',
      'Source',
      'Exception Note',
    ];
    const rows = filteredRecords.map((r) => [
      `"${r.employee_name || ''}"`,
      `"${r.employee_email || ''}"`,
      r.date,
      r.check_in || '',
      r.check_out || '',
      r.worked_hours,
      r.status,
      r.is_manual_edit ? 'Manual Edit' : 'Biometric Sensor',
      `"${r.exception_note || ''}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `attendance_records_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppLayout title="Attendance Records">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 font-sans">
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5 sm:pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-accent font-medium">
                Workforce Tracking & Biometrics
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-ink-soft">Live Operations Ledger</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink mt-1">
              Attendance Records
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft mt-1 leading-relaxed">
              Company-wide biometric punch logs, daily hours, and HR exception audit trail.
            </p>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredRecords.length === 0}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold border border-line bg-bg hover:bg-bg-raised text-ink transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-ink-soft" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold border border-line bg-bg hover:bg-bg-raised text-ink transition-all cursor-pointer shadow-xs"
              title="Refresh attendance records"
            >
              <RefreshCw className="w-3.5 h-3.5 text-ink-soft" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Company Ledger View */}
        <div className="space-y-6 sm:space-y-8">
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
