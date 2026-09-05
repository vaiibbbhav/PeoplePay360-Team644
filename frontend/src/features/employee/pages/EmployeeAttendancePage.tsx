import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  useAttendanceList,
  useCheckIn,
  useCheckOut,
  type AttendanceRecord,
} from '../queries/useAttendance';
import { useCurrentUser } from '@/features/auth/queries/useAuth';
import { useFingerprintStatus } from '@/features/attendance/queries/useFingerprint';
import { AttendanceStatsHeader } from '../components/AttendanceStatsHeader';
import { AttendanceCalendarGrid } from '../components/AttendanceCalendarGrid';
import { AttendanceDetailCard } from '../components/AttendanceDetailCard';
import { FingerprintModal } from '../components/FingerprintModal';
import { getTodayIST, getRecordDateIST } from '@/lib/formatters';

export const EmployeeAttendancePage: React.FC = () => {
  const location = useLocation();
  const { data: user } = useCurrentUser();
  const employeeId = user?.employeeId || user?.employee?.id || user?.id || 'emp-001';

  // Date state for calendar
  const todayStr = getTodayIST();
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [isFingerprintModalOpen, setIsFingerprintModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Close modal on Escape and prevent body scroll when modal is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDetailModalOpen(false);
      }
    };
    if (isDetailModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isDetailModalOpen]);

  // Auto-open modal if navigated with ?register=true
  useEffect(() => {
    if (location.search.includes('register=true')) {
      setIsFingerprintModalOpen(true);
    }
  }, [location.search]);

  // Computed month start/end for query
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  // Queries & Mutations
  const { data: records = [], isLoading } = useAttendanceList({
    employeeId,
    startDate,
    endDate,
  });

  const { data: fpStatus } = useFingerprintStatus(employeeId);
  const isEnrolled = fpStatus?.enrolled ?? false;
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  // Create date-to-record map for fast lookup in calendar
  const recordsMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    records.forEach((rec) => {
      // Map strictly to the single true calendar date in Indian Standard Time
      const dateKey = getRecordDateIST(rec) || rec.date;
      if (dateKey) {
        map.set(dateKey, rec);
      }
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
    <AppLayout title="Time Management">
      <div className="space-y-8 font-sans px-8 mt-6">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-sans text-3xl sm:text-4xl font-bold tracking-tight text-ink">
              Time & Attendance
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft mt-1">
              Monthly biometric punch logs, daily attendance verification, and worked hour audits.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/attendance/terminal"
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-accent text-accent-ink hover:opacity-90 transition-opacity no-underline inline-flex items-center gap-2 shadow-xs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Punch Station</span>
            </Link>

            <button
              onClick={() => setIsFingerprintModalOpen(true)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs ${!isEnrolled
                ? 'border-accent bg-accent/10 text-accent font-semibold'
                : 'border-line bg-bg hover:bg-bg-raised text-ink'
                }`}
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
              <span>{isEnrolled ? 'Update Fingerprint' : 'Add Fingerprint'}</span>
            </button>
          </div>
        </div>

        {/* Not Enrolled Warning Banner */}
        {!isEnrolled && (
          <div className="p-4 rounded-xl border border-accent/40 bg-accent/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-xs font-semibold text-ink block">
                  Fingerprint Not Registered
                </span>
                <span className="text-[11px] text-ink-soft">
                  Enroll your biometric minutiae to activate hardware terminal matching and attendance tracking.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsFingerprintModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer shrink-0"
            >
              Enroll Fingerprint Now
            </button>
          </div>
        )}

        {/* Top States Header & Summary */}
        <AttendanceStatsHeader
          records={records}
          fingerprint={isEnrolled ? { id: 'fp-active', employee_id: employeeId, encryted_template: 'AES-256-GCM' } : null}
          onOpenFingerprintModal={() => setIsFingerprintModalOpen(true)}
          monthName={monthName}
          year={year}
          isLoading={isLoading}
        />

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
              setIsDetailModalOpen(true);
            }}
          />
        </div>
      </div>

      {/* Attendance Detail Modal (opens on cell click, closes on click outside or cross button) */}
      {isDetailModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs font-sans animate-in fade-in overflow-y-auto"
          onClick={() => setIsDetailModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-bg border border-line rounded-2xl shadow-2xl my-auto animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <AttendanceDetailCard
              record={selectedRecord}
              selectedDateStr={selectedDateStr}
              isToday={selectedDateStr === todayStr}
              onClose={() => setIsDetailModalOpen(false)}
              onCheckIn={handleCheckInToday}
              onCheckOut={handleCheckOutToday}
            />
          </div>
        </div>
      )}

      {/* Change Fingerprint Modal */}
      <FingerprintModal
        isOpen={isFingerprintModalOpen}
        onClose={() => setIsFingerprintModalOpen(false)}
        employeeId={employeeId}
      />
    </AppLayout>
  );
};

export const AttendancePage = EmployeeAttendancePage;
export default EmployeeAttendancePage;
