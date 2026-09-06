import React from 'react';
import { SearchInput } from '@/components/ui/SearchInput';

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
        <SearchInput
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search policies by keyword or code..."
          wrapperClassName="max-w-md"
        />

        {/* Status Filter Toggle */}
        <div className="flex items-center p-1 bg-bg-raised rounded-xl border border-line text-xs shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onStatusFilterChange('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-bg text-ink shadow-2xs'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange('pending')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-accent-soft text-accent shadow-2xs font-semibold'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            Action Required
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange('accepted')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === 'accepted'
                ? 'bg-bg text-ink shadow-2xs'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            Acknowledged
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                isActive
                  ? 'border-accent bg-accent-soft text-accent font-semibold'
                  : 'border-line bg-bg text-ink-soft hover:bg-bg-raised hover:text-ink'
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
