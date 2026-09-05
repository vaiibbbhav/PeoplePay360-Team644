import React, { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useEmployeesList, type EmployeeListItem } from '@/features/employees/queries/useEmployees';
import { OrgStatsBanner } from '../components/OrgStatsBanner';
import { OrgFlowChart } from '../components/OrgFlowChart';
import { DepartmentCard } from '../components/DepartmentCard';
import { EmployeeQuickModal } from '../components/EmployeeQuickModal';

export const OrgViewPage: React.FC = () => {
  const { data: employees = [], isLoading, isError, refetch } = useEmployeesList();

  const [activeView, setActiveView] = useState<'tree' | 'departments' | 'grid'>('tree');
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeListItem | null>(null);

  // Derive unique departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e: EmployeeListItem) => {
      if (e.department_name) set.add(e.department_name);
    });
    return Array.from(set);
  }, [employees]);

  // Direct reports count lookup
  const reportsCountMap = useMemo(() => {
    const map = new Map<string, number>();
    employees.forEach((e: EmployeeListItem) => {
      if (e.manager_id) {
        map.set(e.manager_id, (map.get(e.manager_id) || 0) + 1);
      }
    });
    return map;
  }, [employees]);

  const totalManagers = useMemo(() => {
    return Array.from(reportsCountMap.values()).filter((c) => c > 0).length;
  }, [reportsCountMap]);

  // Filtered employees
  const filteredEmployees: EmployeeListItem[] = useMemo(() => {
    return employees.filter((emp: EmployeeListItem) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(q);
        const matchesTitle = (emp.job_position_title || '').toLowerCase().includes(q);
        const matchesDept = (emp.department_name || '').toLowerCase().includes(q);
        if (!matchesName && !matchesTitle && !matchesDept) return false;
      }

      if (selectedDept !== 'all' && emp.department_name !== selectedDept) {
        return false;
      }

      return true;
    });
  }, [employees, search, selectedDept]);

  // Group by department for Department view
  const departmentGroups = useMemo(() => {
    const groups: Record<string, EmployeeListItem[]> = {};
    employees.forEach((emp: EmployeeListItem) => {
      const dept = emp.department_name || 'General';
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(emp);
    });
    return groups;
  }, [employees]);

  return (
    <AppLayout title="Org View & Hierarchy">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 font-sans">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-ink-soft">Loading organization hierarchy...</p>
          </div>
        )}

        {isError && (
          <div className="p-8 text-center bg-bg-raised border border-line rounded-2xl">
            <p className="text-xs text-red-500 font-medium mb-3">
              Failed to load organization data.
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 text-xs font-medium bg-accent text-accent-ink rounded-lg cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {/* Header & View Switcher */}
            <OrgStatsBanner
              totalEmployees={employees.length}
              totalDepartments={departments.length}
              totalManagers={totalManagers}
              activeView={activeView}
              onViewChange={setActiveView}
            />

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by name, title, or department..."
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

              {/* Department Dropdown Filter */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-ink-soft whitespace-nowrap">Department:</label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="px-3 py-2 bg-bg-raised border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-accent cursor-pointer"
                >
                  <option value="all">All Departments ({departments.length})</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* View Mode 1: Hierarchy Tree (React Flow + Dagre) */}
            {activeView === 'tree' && (
              <OrgFlowChart
                employees={filteredEmployees}
                onSelectEmployee={(emp) => setSelectedEmployee(emp)}
                selectedEmployeeId={selectedEmployee?.id}
              />
            )}

            {/* View Mode 2: Department Clusters */}
            {activeView === 'departments' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(departmentGroups)
                  .filter(([dept]) => selectedDept === 'all' || dept === selectedDept)
                  .map(([dept, members]) => (
                    <DepartmentCard
                      key={dept}
                      departmentName={dept}
                      members={members}
                      onSelectEmployee={(emp) => setSelectedEmployee(emp)}
                    />
                  ))}
              </div>
            )}

            {/* View Mode 3: Directory Grid */}
            {activeView === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredEmployees.map((emp: EmployeeListItem) => {
                  const reports = reportsCountMap.get(emp.id) || 0;
                  return (
                    <div
                      key={emp.id}
                      onClick={() => setSelectedEmployee(emp)}
                      className="p-5 bg-bg-raised border border-line rounded-2xl hover:border-ink/40 transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-bg-sunken text-ink-soft border border-line-subtle truncate max-w-[130px]">
                            {emp.department_name || 'General'}
                          </span>
                          {reports > 0 && (
                            <span className="text-[10px] font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                              {reports} reports
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-serif font-medium text-ink truncate">
                          {emp.first_name} {emp.last_name}
                        </h4>
                        <p className="text-xs text-ink-soft truncate mt-0.5">
                          {emp.job_position_title || 'Team Member'}
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-line-subtle text-[11px] text-ink-faint flex items-center justify-between">
                        <span className="truncate">
                          {emp.manager_name ? `Mgr: ${emp.manager_name}` : 'Executive'}
                        </span>
                        <span className="text-accent font-medium">View →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Profile Modal */}
            <EmployeeQuickModal
              employee={selectedEmployee}
              isOpen={Boolean(selectedEmployee)}
              onClose={() => setSelectedEmployee(null)}
              directReportsCount={
                selectedEmployee ? reportsCountMap.get(selectedEmployee.id) || 0 : 0
              }
            />
          </>
        )}
      </div>
    </AppLayout>
  );
};
