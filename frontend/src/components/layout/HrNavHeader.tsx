import React from 'react';
import { Link, useLocation } from 'react-router-dom';

type HrNavHeaderProps = {
  title?: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
};

export const HrNavHeader: React.FC<HrNavHeaderProps> = ({
  title = 'HR Operations',
  subtitle,
  actionButton,
}) => {
  const location = useLocation();

  const navTabs = [
    { label: 'Directory', path: '/employees' },
    { label: 'Contracts', path: '/contracts' },
    { label: 'Work Schedules', path: '/schedules' },
    { label: 'Organization', path: '/organization' },
    { label: 'Policies & Docs', path: '/documents' },
    { label: 'Compensation', path: '/compensation' },
  ];

  const isActive = (path: string) => {
    if (path === '/employees' && (location.pathname === '/employees' || location.pathname.startsWith('/employees/'))) {
      return true;
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <header className="border-b border-line bg-bg sticky top-0 z-30">
      {/* Top row with Brand and actions */}
      <div className="px-6 sm:px-8 py-3.5 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="font-serif text-xl font-bold text-ink no-underline tracking-tight">
            PeoplePay<span className="text-accent">360</span>
          </Link>
          <div className="h-4 w-px bg-line hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">{title}</span>
            {subtitle && (
              <>
                <span className="text-ink-soft text-xs">·</span>
                <span className="text-xs text-ink-soft">{subtitle}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-line bg-transparent text-ink hover:bg-bg-raised transition-colors no-underline"
          >
            ← Console
          </Link>
          {actionButton}
        </div>
      </div>

      {/* Sub-nav row for quick domain switching */}
      <div className="px-6 sm:px-8 flex items-center gap-1 border-t border-line/60 overflow-x-auto no-scrollbar">
        {navTabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`text-xs font-medium px-3.5 py-2.5 transition-colors no-underline border-b-2 whitespace-nowrap ${
                active
                  ? 'text-ink border-accent font-semibold'
                  : 'text-ink-soft border-transparent hover:text-ink hover:border-line'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
};
