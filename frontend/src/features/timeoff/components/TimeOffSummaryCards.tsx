import React from 'react';
import { StatGrid, type StatItem } from '@/components/ui/StatCard';
import type { TimeOffRequest } from '../queries/useTimeOff';

type TimeOffSummaryCardsProps = {
  requests: TimeOffRequest[];
  isLoading?: boolean;
};

export const TimeOffSummaryCards: React.FC<TimeOffSummaryCardsProps> = ({
  requests,
  isLoading = false,
}) => {
  const total = requests.length;
  const pending = requests.filter((r) => r.status === 'pending').length;
  const approved = requests.filter((r) => r.status === 'approved').length;
  const refused = requests.filter((r) => r.status === 'refused').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const activeToday = requests.filter(
    (r) => r.status === 'approved' && r.start_date <= todayStr && r.end_date >= todayStr,
  ).length;

  const totalDaysTaken = requests
    .filter((r) => r.status === 'approved')
    .reduce((acc, r) => acc + (parseFloat(String(r.duration)) || 0), 0);

  const items: StatItem[] = [
    {
      label: 'Total Requests',
      value: String(total),
      subtext: `${approved} approved, ${refused} refused`,
    },
    {
      label: 'Pending Approvals',
      value: (
        <span className={pending > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-ink'}>
          {pending}
        </span>
      ),
      subtext: pending > 0 ? 'Requires action' : 'All reviews clear',
    },
    {
      label: 'Currently On Leave',
      value: (
        <span className={activeToday > 0 ? 'text-accent font-semibold' : 'text-ink'}>
          {activeToday}
        </span>
      ),
      subtext: 'Active workforce away today',
    },
    {
      label: 'Approved Days Logged',
      value: `${totalDaysTaken.toFixed(1)} d`,
      subtext: 'Cumulative balance deducted',
    },
  ];

  return <StatGrid columns={4} items={items} isLoading={isLoading} skeletonCount={4} />;
};
