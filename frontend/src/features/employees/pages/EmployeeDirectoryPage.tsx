import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployeesList, useEmployeeMeta, useCreateEmployee } from '../queries/useEmployees';
import { EmployeeFormModal } from '../components/EmployeeFormModal';
import { AppLayout } from '../../../components/layout/AppLayout';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination, usePagination } from '@/components/ui/Pagination';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select';

type ViewMode = 'kanban' | 'list';

const KANBAN_COLUMNS = [
  { status: 'active', label: 'Active' },
  { status: 'on_leave', label: 'On Leave' },
  { status: 'inactive', label: 'Inactive' },
  { status: 'terminated', label: 'Terminated' },
];

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-bg-raised text-ink border-line',
  on_leave: 'bg-accent-soft text-accent border-accent/30',
  inactive: 'bg-bg-raised text-ink-soft border-line',
  terminated: 'bg-red-50 text-red-700 border-red-200',
};

export const EmployeeDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: employees = [], isLoading } = useEmployeesList();
  const { data: meta } = useEmployeeMeta();
  const createEmployeeMutation = useCreateEmployee();

  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  const filteredEmployees = employees.filter((emp) => {
    const firstName = emp.first_name || '';
    const lastName = emp.last_name || '';
    const email = emp.email || '';
    const fullName = `${firstName} ${lastName}`.trim().toLowerCase();
    const matchesSearch =
      !search ||
      fullName.includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase()) ||
      (emp.job_position_title &&
        emp.job_position_title.toLowerCase().includes(search.toLowerCase()));

    const matchesDept = !departmentFilter || emp.department_id === departmentFilter;
    const matchesStatus = !statusFilter || emp.employment_status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const getInitials = (first: string, last: string) =>
    `${first[0] || ''}${last[0] || ''}`.toUpperCase() || 'EM';

  const EmployeeCard = ({ emp }: { emp: (typeof filteredEmployees)[0] }) => {
    const firstName = emp.first_name || '';
    const lastName = emp.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Unnamed Employee';
    const initials = getInitials(firstName, lastName);

    return (
      <div
        onClick={() => navigate(`/employees/${emp.id}`)}
        className="bg-bg border border-line rounded-2xl p-4 hover:border-ink-soft/40 transition-colors cursor-pointer"
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent font-serif font-bold text-sm flex items-center justify-center shrink-0 overflow-hidden">
            {emp.avatar_url ? (
              <img src={emp.avatar_url} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-sm font-bold text-ink leading-tight truncate">{fullName}</h3>
            <span className="text-[11px] text-ink-soft block mt-0.5 truncate">
              {emp.job_position_title || 'Unassigned Role'}
            </span>
          </div>
        </div>
        <div className="space-y-1 pt-2 border-t border-line text-[11px] text-ink-soft">
          <div className="flex justify-between">
            <span>Dept:</span>
            <span className="font-medium text-ink truncate max-w-[120px]">{emp.department_name || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span>Manager:</span>
            <span className="font-medium text-ink truncate max-w-[120px]">{emp.manager_name || '—'}</span>
          </div>
        </div>
        <div className="pt-2 mt-2 border-t border-line text-[11px] text-accent font-medium">
          View Profile →
        </div>
      </div>
    );
  };

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedEmployees,
  } = usePagination(filteredEmployees, 12);

  return (
    <AppLayout
      title="Employee Directory"
      actions={
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-1.5 rounded-lg text-xs font-medium bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5"
        >
          <span>+</span> Onboard Employee
        </button>
      }
    >
      <div className="max-w-6xl mx-auto w-full flex-1 px-4 sm:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 font-sans">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-5 sm:pb-6">
          <div>
            <div className="mb-1">
              <span className="text-xs font-mono text-accent font-medium">
                Core HR
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink mt-1">
              Employee Directory
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft mt-1 leading-relaxed">
              Company-wide employee directory, departmental structure, and employment profiles.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="sm:hidden self-start px-3.5 py-1.5 rounded-lg text-xs font-medium bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5"
          >
            <span>+</span> Onboard Employee
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3.5 sm:p-4 rounded-2xl border border-line bg-bg">
          <SearchInput
            placeholder="Search by name, email or job title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <Select
              value={departmentFilter || 'all'}
              onValueChange={(val) => setDepartmentFilter(val === 'all' ? '' : val)}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">All Departments</SelectItem>
                {meta?.departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter || 'all'}
              onValueChange={(val) => setStatusFilter(val === 'all' ? '' : val)}
            >
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-line rounded-xl overflow-hidden shrink-0">
              <button
                onClick={() => setViewMode('kanban')}
                title="Kanban View"
                className={`px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors ${viewMode === 'kanban' ? 'bg-accent text-accent-ink' : 'bg-bg text-ink-soft hover:text-ink'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                title="List View"
                className={`px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors border-l border-line ${viewMode === 'list' ? 'bg-accent text-accent-ink' : 'bg-bg text-ink-soft hover:text-ink'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="bg-bg border border-line rounded-2xl p-16 text-center text-xs text-ink-soft">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading employees...
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="bg-bg border border-line rounded-2xl p-12 sm:p-16 text-center">
            <h3 className="font-serif text-lg font-semibold text-ink mb-1">No employees found</h3>
            <p className="text-xs text-ink-soft mb-4">
              {search || departmentFilter || statusFilter
                ? 'Try adjusting your search criteria or clear your active filters.'
                : 'Get started by onboarding your first team member into PeoplePay360.'}
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-lg text-xs font-medium bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer"
            >
              + Onboard First Employee
            </button>
          </div>
        ) : viewMode === 'kanban' ? (
          // --- Kanban View ---
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {KANBAN_COLUMNS.map(({ status, label }) => {
              const colEmployees = filteredEmployees.filter((e) => e.employment_status === status);
              return (
                <div key={status} className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_BADGE[status]}`}>
                      {label}
                    </span>
                    <span className="text-[10px] text-ink-soft">{colEmployees.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[140px] max-h-[calc(100vh-280px)] overflow-y-auto no-scrollbar rounded-2xl bg-bg-raised/40 border border-line p-2">
                    {colEmployees.length === 0 ? (
                      <p className="text-[11px] text-ink-soft/50 text-center py-6">None</p>
                    ) : (
                      colEmployees.map((emp) => <EmployeeCard key={emp.id} emp={emp} />)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // --- List View with Pagination ---
          <div className="space-y-4">
            <div className="rounded-2xl border border-line overflow-hidden bg-bg">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-bg-raised border-b border-line">
                    <th className="text-left px-4 py-3 font-semibold text-ink-soft">Employee</th>
                    <th className="text-left px-4 py-3 font-semibold text-ink-soft hidden sm:table-cell">Department</th>
                    <th className="text-left px-4 py-3 font-semibold text-ink-soft hidden md:table-cell">Manager</th>
                    <th className="text-left px-4 py-3 font-semibold text-ink-soft hidden lg:table-cell">Schedule</th>
                    <th className="text-left px-4 py-3 font-semibold text-ink-soft">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEmployees.map((emp, idx) => {
                    const firstName = emp.first_name || '';
                    const lastName = emp.last_name || '';
                    const fullName = `${firstName} ${lastName}`.trim() || 'Unnamed Employee';
                    const initials = getInitials(firstName, lastName);
                    return (
                      <tr
                        key={emp.id}
                        onClick={() => navigate(`/employees/${emp.id}`)}
                        className={`border-b border-line last:border-0 cursor-pointer hover:bg-bg-raised/60 transition-colors ${idx % 2 === 0 ? 'bg-bg' : 'bg-bg-raised/20'}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent font-serif font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                              {emp.avatar_url ? (
                                <img src={emp.avatar_url} alt={fullName} className="w-full h-full object-cover" />
                              ) : (
                                <span>{initials}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-serif font-bold text-ink truncate">{fullName}</div>
                              <div className="text-[11px] text-ink-soft truncate">{emp.job_position_title || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-ink-soft hidden sm:table-cell">{emp.department_name || '—'}</td>
                        <td className="px-4 py-3 text-ink-soft hidden md:table-cell">{emp.manager_name || '—'}</td>
                        <td className="px-4 py-3 text-ink-soft hidden lg:table-cell">{emp.working_schedule_name || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${STATUS_BADGE[emp.employment_status] || STATUS_BADGE.inactive}`}>
                            {emp.employment_status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="mt-4">
              <Pagination
                variant="standalone"
                currentPage={currentPage}
                totalItems={filteredEmployees.length}
                pageSize={pageSize}
                pageSizeOptions={[12, 24, 48, 96]}
                itemName="employees"
                onPageChange={setCurrentPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {isCreateModalOpen && meta && (
        <EmployeeFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          meta={meta}
          onSave={async (data) => {
            await createEmployeeMutation.mutateAsync(data);
          }}
          isSaving={createEmployeeMutation.isPending}
        />
      )}
    </AppLayout>
  );
};
