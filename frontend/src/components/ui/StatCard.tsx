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
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, subtext, className = '' }) => {
  return (
    <div className={`p-5 rounded-2xl border border-line bg-bg-raised/40 ${className}`}>
      <span className="text-xs block font-medium mb-2">{label}</span>
      <div className="text-2xl font-bold text-ink mt-1.5">{value}</div>
      {subtext && <span className="text-xs text-ink-soft mt-1.5 block">{subtext}</span>}
    </div>
  );
};

export type StatGridProps = {
  items: StatItem[];
  columns?: 2 | 3 | 4;
  className?: string;
};

export const StatGrid: React.FC<StatGridProps> = ({ items, columns = 3, className = '' }) => {
  const colClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  }[columns];

  return (
    <div className={`grid ${colClass} gap-4 ${className}`}>
      {items.map((item, idx) => (
        <StatCard key={idx} label={item.label} value={item.value} subtext={item.subtext} />
      ))}
    </div>
  );
};
