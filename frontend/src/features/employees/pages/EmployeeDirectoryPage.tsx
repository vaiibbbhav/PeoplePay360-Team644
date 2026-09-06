import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployeesList, useEmployeeMeta, useCreateEmployee } from '../queries/useEmployees';
import { EmployeeFormModal } from '../components/EmployeeFormModal';
import { AppLayout } from '../../../components/layout/AppLayout';
import { SearchInput } from '@/components/ui/SearchInput';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select';

export const EmployeeDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: employees = [], isLoading } = useEmployeesList();
  const { data: meta } = useEmployeeMeta();
  const createEmployeeMutation = useCreateEmployee();

  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filter logic
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
      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full flex-1 px-4 sm:px-8 py-6 sm:py-8">
        {/* Page Title & Intro */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">Employee Directory</h1>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="sm:hidden self-start px-3.5 py-1.5 rounded-lg text-xs font-medium bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5"
          >
            <span>+</span> Onboard Employee
          </button>
        </div>

        {/* Toolbar & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3.5 sm:p-4 rounded-2xl border border-line bg-bg mb-6">
          <SearchInput
            placeholder="Search by employee name, email or job title..."
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
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
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
          </div>
        </div>

        {/* Directory Grid / Table */}
        {isLoading ? (
          <div className="bg-bg border border-line rounded-2xl p-16 text-center text-xs text-ink-soft">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading employees master directory...
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((emp) => {
              const firstName = emp.first_name || '';
              const lastName = emp.last_name || '';
              const fullName = `${firstName} ${lastName}`.trim() || 'Unnamed Employee';
              const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'EM';

              return (
                <div
                  key={emp.id}
                  onClick={() => navigate(`/employees/${emp.id}`)}
                  className="bg-bg border border-line rounded-2xl p-4 sm:p-5 hover:border-ink-soft/40 transition-colors cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2.5 mb-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-accent-soft text-accent font-serif font-bold text-base flex items-center justify-center shrink-0 overflow-hidden">
                          {emp.avatar_url ? (
                            <img
                              src={emp.avatar_url}
                              alt={fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{initials}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-serif text-base font-bold text-ink leading-tight truncate">
                            {fullName}
                          </h3>
                          <span className="text-xs text-ink-soft block mt-0.5 truncate">
                            {emp.job_position_title || 'Unassigned Role'}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-full border border-line shrink-0 ${
                          emp.employment_status === 'active'
                            ? 'bg-bg-raised text-ink'
                            : emp.employment_status === 'on_leave'
                              ? 'bg-accent-soft text-accent'
                              : 'bg-bg-raised text-ink-soft'
                        }`}
                      >
                        {emp.employment_status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-line text-xs text-ink-soft">
                      <div className="flex justify-between">
                        <span>Department:</span>
                        <span className="font-medium text-ink">{emp.department_name || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Manager:</span>
                        <span className="font-medium text-ink">{emp.manager_name || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Work Schedule:</span>
                        <span className="font-medium text-ink">
                          {emp.working_schedule_name || 'Standard 40h'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-line flex items-center justify-between text-[11px] text-accent font-medium">
                    <span>View Profile & Details →</span>
                    <span className="text-ink-soft truncate max-w-[150px]">{emp.email}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Onboarding / Create Employee Modal */}
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
