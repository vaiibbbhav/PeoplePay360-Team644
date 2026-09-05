import React, { useState } from 'react';
import {
  useSchedulesList,
  useCreateSchedule,
  useUpdateSchedule,
  useDeleteSchedule,
  type ScheduleItem,
  type CreateSchedulePayload,
} from '../queries/useSchedules';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatGrid } from '@/components/ui/StatCard';
import { ScheduleCard } from '../components/ScheduleCard';
import { ScheduleFormDrawer } from '../components/ScheduleFormDrawer';

export const SchedulesPage: React.FC = () => {
  const { data: schedules = [], isLoading, error } = useSchedulesList();
  const createScheduleMutation = useCreateSchedule();
  const updateScheduleMutation = useUpdateSchedule();
  const deleteScheduleMutation = useDeleteSchedule();

  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<ScheduleItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filtered schedules
  const filtered = schedules.filter((s) => {
    const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    const matchesActive =
      filterActive === 'all' ||
      (filterActive === 'active' && s.isActive) ||
      (filterActive === 'inactive' && !s.isActive);
    return matchesSearch && matchesActive;
  });

  // KPI calculations
  const totalCount = schedules.length;
  const activeCount = schedules.filter((s) => s.isActive).length;
  const avgHours =
    totalCount > 0
      ? (schedules.reduce((acc, s) => acc + (s.weeklyHours || 0), 0) / totalCount).toFixed(1)
      : '0.0';
  const totalAssigned = schedules.reduce((acc, s) => acc + (s.employeeCount || 0), 0);

  const handleOpenCreate = () => {
    setEditingSchedule(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (schedule: ScheduleItem) => {
    setEditingSchedule(schedule);
    setIsDrawerOpen(true);
  };

  const handleFormSubmit = async (payload: CreateSchedulePayload) => {
    if (editingSchedule) {
      await updateScheduleMutation.mutateAsync({
        id: editingSchedule.id,
        data: payload,
      });
    } else {
      await createScheduleMutation.mutateAsync(payload);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSchedule) return;
    setActionError(null);
    try {
      await deleteScheduleMutation.mutateAsync(deletingSchedule.id);
      setDeletingSchedule(null);
    } catch (err: any) {
      setActionError(err?.response?.data?.error || err.message || 'Failed to delete schedule');
    }
  };

  return (
    <AppLayout
      title="Work Schedules"
      actions={
        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-1.5 rounded-lg text-xs font-medium bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5"
        >
          <span>+</span> New Schedule
        </button>
      }
    >
      <main className="max-w-6xl mx-auto w-full flex-1 px-6 sm:px-8 py-8 space-y-8">
        {/* KPI Cards */}
        <StatGrid
          columns={4}
          items={[
            {
              label: 'Total Schedules',
              value: totalCount,
              subtext: 'Configured work patterns',
            },
            {
              label: 'Active Schedules',
              value: activeCount,
              subtext: 'Currently eligible for assignment',
            },
            {
              label: 'Avg Weekly Hours',
              value: `${avgHours}h`,
              subtext: 'Across all configured shifts',
            },
            {
              label: 'Assigned Employees',
              value: totalAssigned,
              subtext: 'Covered under schedules',
            },
          ]}
        />

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-line bg-bg">
          <div className="flex-1 w-full sm:w-auto relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search schedules by name..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-line bg-bg-raised text-ink text-xs placeholder:text-ink-soft/60 focus:outline-none focus:border-accent"
            />
            <svg
              className="w-4 h-4 text-ink-soft absolute left-3 top-2.5"
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

          <div className="w-full sm:w-auto">
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
              className="w-full sm:w-auto px-3.5 py-2 text-xs rounded-xl border border-line bg-bg text-ink focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Global Error message */}
        {actionError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-over-red text-xs flex justify-between items-center">
            <span>{actionError}</span>
            <button
              onClick={() => setActionError(null)}
              className="text-over-red hover:underline text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Content list / loading / empty */}
        {isLoading ? (
          <div className="border border-line rounded-2xl p-16 flex flex-col items-center justify-center gap-3 bg-bg">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-ink-soft">Loading working schedules...</span>
          </div>
        ) : error ? (
          <div className="border border-line rounded-2xl p-12 text-center bg-bg">
            <p className="text-over-red text-xs m-0">Failed to load working schedules.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-line rounded-2xl p-16 text-center bg-bg">
            <h3 className="font-serif text-lg font-bold text-ink mb-1">No schedules found</h3>
            <p className="text-xs text-ink-soft mb-4">
              {search || filterActive !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first working schedule to establish attendance and payroll hours'}
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>+</span> New Schedule
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                onEdit={handleOpenEdit}
                onDelete={(s) => setDeletingSchedule(s)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Schedule Form Drawer */}
      <ScheduleFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingSchedule}
        isSubmitting={createScheduleMutation.isPending || updateScheduleMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      {deletingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-bg border border-line rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-ink m-0">
              Delete Working Schedule?
            </h3>
            <p className="text-xs text-ink-soft leading-relaxed m-0">
              Are you sure you want to delete <b className="text-ink">{deletingSchedule.name}</b>?
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSchedule(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-line bg-transparent text-ink hover:bg-bg-raised transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteScheduleMutation.isPending}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {deleteScheduleMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
