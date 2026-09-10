import React, { type ReactNode } from 'react';

export type StatItem = {
  label: string;
  value: ReactNode;
  subtext?: string;
};

export type StatCardProps = {
  label: string;
  value: ReactNode;
  subtext?: string;
  className?: string;
  isLoading?: boolean;
};

// Reusable shimmer skeleton bar
const Shimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`block rounded bg-ink/8 animate-pulse ${className}`} aria-hidden="true" />
);

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  className = '',
  isLoading = false,
}) => {
  return (
    <div className={`p-5 rounded-2xl border border-line bg-bg-raised/40 ${className}`}>
      {isLoading ? (
        <>
          <Shimmer className="h-3 w-2/3 mb-3" />
          <Shimmer className="h-7 w-1/2 mt-1.5 mb-2" />
          <Shimmer className="h-2.5 w-3/4 mt-2" />
        </>
      ) : (
        <>
          <span className="text-xs block font-medium mb-2 text-ink-soft">{label}</span>
          <div className="text-2xl font-bold text-ink mt-1.5">{value}</div>
          {subtext && <span className="text-xs text-ink-soft mt-1.5 block">{subtext}</span>}
        </>
      )}
    </div>
  );
};

export type StatGridProps = {
  items: StatItem[];
  columns?: 2 | 3 | 4;
  className?: string;
  isLoading?: boolean;
  /** How many skeleton cards to show while loading. Defaults to `columns`. */
  skeletonCount?: number;
};

export const StatGrid: React.FC<StatGridProps> = ({
  items,
  columns = 3,
  className = '',
  isLoading = false,
  skeletonCount,
}) => {
  const colClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  }[columns];

  const count = skeletonCount ?? columns;

  if (isLoading) {
    return (
      <div className={`grid ${colClass} gap-4 ${className}`}>
        {Array.from({ length: count }).map((_, idx) => (
          <StatCard key={idx} label="" value="" isLoading />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${colClass} gap-4 ${className}`}>
      {items.map((item, idx) => (
        <StatCard key={idx} label={item.label} value={item.value} subtext={item.subtext} />
      ))}
    </div>
  );
};
