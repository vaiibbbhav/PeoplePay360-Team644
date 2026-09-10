import React from 'react';

type OrgStatsBannerProps = {
  totalEmployees: number;
  totalDepartments: number;
  totalManagers: number;
  activeView: 'tree' | 'departments' | 'grid';
  onViewChange: (view: 'tree' | 'departments' | 'grid') => void;
};

export const OrgStatsBanner: React.FC<OrgStatsBannerProps> = ({
  totalEmployees,
  totalDepartments,
  totalManagers,
  activeView,
  onViewChange,
}) => {
  return (
    <div className="border-b border-line pb-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="mb-1">
            <span className="text-xs font-mono text-accent font-medium">Core HR</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-ink font-bold tracking-tight mt-1">
            Org View
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-1 leading-relaxed">
            {totalEmployees} people · {totalDepartments} departments · {totalManagers} people
            managers
          </p>
        </div>

        {/* View Switcher Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center p-1 bg-bg-sunken rounded-xl border border-line-subtle text-[11px] sm:text-xs">
            <button
              onClick={() => onViewChange('tree')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeView === 'tree'
                  ? 'bg-bg-raised text-ink shadow-xs'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM9 20a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM7 10v4a1 1 0 001 1h8a1 1 0 001-1v-4M12 15v3"
                />
              </svg>
              <span>Org Chart</span>
            </button>
            <button
              onClick={() => onViewChange('departments')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeView === 'departments'
                  ? 'bg-bg-raised text-ink shadow-xs'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <span>Departments</span>
            </button>
            <button
              onClick={() => onViewChange('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeView === 'grid'
                  ? 'bg-bg-raised text-ink shadow-xs'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              <span>Directory</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
