import React from 'react';
import { StatGrid, type StatItem } from '@/components/ui/StatCard';
import type { AttendanceRecord } from '../queries/useAttendance';

type AttendanceSummaryCardsProps = {
  records: AttendanceRecord[];
  isLoading?: boolean;
};

export const AttendanceSummaryCards: React.FC<AttendanceSummaryCardsProps> = ({
  records,
  isLoading = false,
}) => {
  const total = records.length;
  const present = records.filter(
    (r) => r.status === 'Present' || r.status.toLowerCase() === 'present',
  ).length;
  const late = records.filter(
    (r) => r.status === 'Late' || r.status.toLowerCase() === 'late',
  ).length;
  const halfDay = records.filter(
    (r) =>
      r.status === 'Half-Day' || r.status === 'Half-day' || r.status.toLowerCase() === 'half-day',
  ).length;
  const overtime = records.filter(
    (r) => r.status === 'Overtime' || r.status.toLowerCase() === 'overtime',
  ).length;
  const exceptions = records.filter((r) => r.is_manual_edit || r.exception_note).length;

  const totalHours = records.reduce((acc, r) => {
    const hrs =
      typeof r.worked_hours === 'number'
        ? r.worked_hours
        : parseFloat(String(r.worked_hours || '0'));
    return acc + (isNaN(hrs) ? 0 : hrs);
  }, 0);

  const avgHours = total > 0 ? (totalHours / total).toFixed(1) : '0.0';
  const attendanceRate = total > 0 ? Math.round(((present + overtime) / total) * 100) : 100;

  const items: StatItem[] = [
    {
      label: 'Total Logs',
      value: String(total),
      subtext: `${avgHours}h avg (${totalHours.toFixed(1)} hrs total)`,
    },
    {
      label: 'On-Time / Present',
      value: String(present),
      subtext: `${attendanceRate}% punctuality rate`,
    },
    {
      label: 'Late Arrivals',
      value: String(late),
      subtext: late > 0 ? `${late} exceeded threshold` : 'Zero late arrivals',
    },
    {
      label: 'Exceptions & Edits',
      value: String(exceptions),
      subtext:
        exceptions > 0 ? `${halfDay} half-day · ${overtime} overtime` : 'No audit exceptions',
    },
  ];

  return <StatGrid items={items} columns={4} isLoading={isLoading} skeletonCount={4} />;
};
