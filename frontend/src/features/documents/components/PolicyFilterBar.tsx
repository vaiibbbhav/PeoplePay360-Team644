import React from 'react';

type PolicyFilterBarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  statusFilter: 'all' | 'pending' | 'accepted';
  onStatusFilterChange: (status: 'all' | 'pending' | 'accepted') => void;
};

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'compliance', label: 'Compliance & Legal' },
  { id: 'security', label: 'Security & Data' },
  { id: 'workplace', label: 'Workplace & Culture' },
  { id: 'hr', label: 'HR & Operations' },
];

export const PolicyFilterBar: React.FC<PolicyFilterBarProps> = ({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  statusFilter,
  onStatusFilterChange,
}) => {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search policies by keyword or code..."
            className="w-full pl-9 pr-4 py-2 bg-bg-raised border border-line rounded-xl text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent transition-colors"
          />
          <svg
            className="w-4 h-4 text-ink-faint absolute left-3 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Status Filter Toggle */}
        <div className="flex items-center p-1 bg-bg-sunken rounded-xl border border-line-subtle text-[11px] sm:text-xs shrink-0 self-start sm:self-auto">
          <button
            onClick={() => onStatusFilterChange('all')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-bg-raised text-ink shadow-xs'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onStatusFilterChange('pending')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-bg-raised text-accent shadow-xs'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            Action Required
          </button>
          <button
            onClick={() => onStatusFilterChange('accepted')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === 'accepted'
                ? 'bg-bg-raised text-emerald-700 shadow-xs'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            Accepted
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-ink text-bg font-semibold'
                  : 'bg-bg-raised text-ink-soft border border-line hover:border-ink hover:text-ink'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
