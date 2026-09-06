import React from 'react';
import { useNavigate } from 'react-router-dom';

type SmartButtonBarProps = {
  employeeId: string;
  contractCount: number;
  attendanceCount: number;
  timeOffCount: number;
  payslipCount: number;
};

type SmartButton = {
  label: string;
  count: number;
  path: string;
};

export const SmartButtonBar: React.FC<SmartButtonBarProps> = ({
  employeeId,
  contractCount,
  attendanceCount,
  timeOffCount,
  payslipCount,
}) => {
  const navigate = useNavigate();

  const buttons: SmartButton[] = [
    { label: 'Contracts', count: contractCount, path: `/contracts?employeeId=${employeeId}` },
    { label: 'Attendance', count: attendanceCount, path: `/attendance?employeeId=${employeeId}` },
    { label: 'Time Off', count: timeOffCount, path: `/time-off?employeeId=${employeeId}` },
    { label: 'Payslips', count: payslipCount, path: `/payslips?employeeId=${employeeId}` },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {buttons.map((btn) => (
        <button
          key={btn.label}
          onClick={() => navigate(btn.path)}
          className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-line bg-bg hover:border-accent/40 hover:bg-accent-soft/20 transition-colors cursor-pointer"
        >
          <div className="text-xl font-bold font-serif text-ink">{btn.count}</div>
          <div className="text-[11px] text-ink-soft font-medium">{btn.label}</div>
        </button>
      ))}
    </div>
  );
};
