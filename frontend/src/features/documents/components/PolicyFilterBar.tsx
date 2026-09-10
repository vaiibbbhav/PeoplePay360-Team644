import React from 'react';
import { SearchInput } from '@/components/ui/SearchInput';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select';

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
    <div className="p-3.5 sm:p-4 rounded-2xl border border-line bg-bg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-sans">
      <SearchInput
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search policies by name or keyword..."
      />

      <div className="flex items-center gap-2 shrink-0">
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent align="end">
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(val) => onStatusFilterChange(val as 'all' | 'pending' | 'accepted')}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Action Required</SelectItem>
            <SelectItem value="accepted">Acknowledged</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
