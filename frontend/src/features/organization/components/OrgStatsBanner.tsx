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
    <div className="bg-bg-raised border border-line rounded-2xl p-6 mb-8 transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide uppercase bg-accent/10 text-accent border border-accent/20">
              Enterprise Structure
            </span>
            <span className="text-xs text-ink-soft">
              {totalEmployees} active team members across {totalDepartments} departments
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-sans text-ink font-normal mt-2 tracking-tight">
            Organization View & Hierarchy
          </h1>
          <p className="text-sm text-ink-soft mt-1 max-w-2xl leading-relaxed">
            Explore reporting lines, department leadership, team structures, and company roster.
          </p>
        </div>

        {/* View Switcher Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center p-1 bg-bg-sunken rounded-xl border border-line-subtle text-xs">
            <button
              onClick={() => onViewChange('tree')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
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

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t border-line-subtle">
        <div className="p-3 bg-bg-sunken rounded-xl border border-line-subtle">
          <span className="text-[11px] font-mono text-ink-faint uppercase tracking-wider block">
            Total Headcount
          </span>
          <span className="text-xl font-sans font-bold text-ink mt-0.5 block">
            {totalEmployees}
          </span>
        </div>
        <div className="p-3 bg-bg-sunken rounded-xl border border-line-subtle">
          <span className="text-[11px] font-mono text-ink-faint uppercase tracking-wider block">
            Departments
          </span>
          <span className="text-xl font-sans font-bold text-ink mt-0.5 block">
            {totalDepartments}
          </span>
        </div>
        <div className="p-3 bg-bg-sunken rounded-xl border border-line-subtle col-span-2 sm:col-span-1">
          <span className="text-[11px] font-mono text-ink-faint uppercase tracking-wider block">
            People Managers
          </span>
          <span className="text-xl font-sans font-bold text-ink mt-0.5 block">
            {totalManagers}
          </span>
        </div>
      </div>
    </div>
  );
};
