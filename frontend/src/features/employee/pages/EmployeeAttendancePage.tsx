import React, { useState, useMemo } from 'react';
import { EmployeeLayout } from '../components/EmployeeLayout';
import {
  useAttendanceList,
  useFingerprint,
  useCheckIn,
  useCheckOut,
  type AttendanceRecord,
} from '../queries/useAttendance';
import { useCurrentUser } from '@/features/auth/queries/useAuth';
import { AttendanceStatsHeader } from '../components/AttendanceStatsHeader';
import { AttendanceCalendarGrid } from '../components/AttendanceCalendarGrid';
import { AttendanceDetailCard } from '../components/AttendanceDetailCard';
import { FingerprintModal } from '../components/FingerprintModal';

export const EmployeeAttendancePage: React.FC = () => {
  const { data: user } = useCurrentUser();
  const employeeId = user?.employeeId || user?.employee?.id || user?.id || 'emp-001';

  // Date state for calendar
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`;

  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [isFingerprintModalOpen, setIsFingerprintModalOpen] = useState<boolean>(false);

  // Computed month start/end for query
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  // Queries & Mutations
  const { data: records = [] } = useAttendanceList({
    employeeId,
    startDate,
    endDate,
  });

  const { data: fingerprint = null } = useFingerprint(employeeId);
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  // Create date-to-record map for fast lookup in calendar
  const recordsMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    records.forEach((rec) => {
      map.set(rec.date, rec);
    });
    return map;
  }, [records]);

  // Record for currently selected date
  const selectedRecord = recordsMap.get(selectedDateStr) || null;

  // Handlers for month navigation
  const handlePrevMonth = () => {
    setCalendarDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCalendarDate(today);
    setSelectedDateStr(todayStr);
  };

  const handleCheckInToday = () => {
    checkInMutation.mutate({
      employeeId,
      checkIn: new Date().toISOString(),
    });
  };

  const handleCheckOutToday = () => {
    checkOutMutation.mutate({
      employeeId,
      checkOut: new Date().toISOString(),
    });
  };

  const monthName = calendarDate.toLocaleString('default', { month: 'long' });

  return (
    <EmployeeLayout title="Attendance & Punches">
      <div className="space-y-8 font-sans">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-ink">
              Time & Attendance
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft mt-1">
              Monthly biometric punch logs, daily attendance verification, and worked hour audits.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFingerprintModalOpen(true)}
              className="px-3.5 py-2 rounded-lg text-xs font-medium border border-line bg-bg hover:bg-bg-raised text-ink transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs"
            >
              <svg
                className="w-4 h-4 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 004.07 9m5.918 8d.5.5 0 01.5.5v2a.5.5 0 01-.5.5h-2a.5.5 0 01-.5-.5v-2a.5.5 0 01.5-.5h2z"
                />
              </svg>
              <span>Change Fingerprint</span>
            </button>
          </div>
        </div>

        {/* Top States Header & Summary */}
        <AttendanceStatsHeader
          records={records}
          fingerprint={fingerprint}
          onOpenFingerprintModal={() => setIsFingerprintModalOpen(true)}
          monthName={monthName}
          year={year}
        />

        {/* Higher View Card of Selected Date (Show when clicked) */}
        <div id="attendance-detail-section" className="scroll-mt-24">
          <AttendanceDetailCard
            record={selectedRecord}
            selectedDateStr={selectedDateStr}
            isToday={selectedDateStr === todayStr}
            onCheckIn={handleCheckInToday}
            onCheckOut={handleCheckOutToday}
          />
        </div>

        {/* Calendar-like View */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-ink">Monthly Punch Calendar</h2>
            <span className="text-xs text-ink-soft">
              Click any date card to inspect full statistics
            </span>
          </div>

          <AttendanceCalendarGrid
            currentDate={calendarDate}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onToday={handleToday}
            recordsMap={recordsMap}
            selectedDateStr={selectedDateStr}
            onSelectDate={(dateStr) => {
              setSelectedDateStr(dateStr);
              // Smooth scroll to higher view card on mobile/narrow screens
              const elem = document.getElementById('attendance-detail-section');
              if (elem) {
                elem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            }}
          />
        </div>
      </div>

      {/* Change Fingerprint Modal */}
      <FingerprintModal
        isOpen={isFingerprintModalOpen}
        onClose={() => setIsFingerprintModalOpen(false)}
        employeeId={employeeId}
      />
    </EmployeeLayout>
  );
};

export const AttendancePage = EmployeeAttendancePage;
export default EmployeeAttendancePage;
