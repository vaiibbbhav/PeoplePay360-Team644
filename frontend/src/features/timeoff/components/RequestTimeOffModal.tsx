import React, { useState } from 'react';
import { useEmployeesList } from '@/features/employees/queries/useEmployees';
import {
  useTimeOffTypes,
  useCreateTimeOffRequest,
} from '../queries/useTimeOff';
import { useCurrentUser } from '@/features/auth/queries/useAuth';

type RequestTimeOffModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const RequestTimeOffModal: React.FC<RequestTimeOffModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data: user } = useCurrentUser();
  const { data: types = [] } = useTimeOffTypes();
  const { data: employees = [] } = useEmployeesList();
  const createMutation = useCreateTimeOffRequest();

  const isEmployeeRole = user?.role === 'Employee';
  const defaultEmployeeId = user?.employee?.id || user?.employeeId || (employees[0]?.id ?? '');

  const [employeeId, setEmployeeId] = useState(defaultEmployeeId);
  const [timeOffTypeId, setTimeOffTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState('1');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const selectedType = types.find((t) => t.id === timeOffTypeId) || types[0];
    if (!selectedType) {
      setError('Please select a valid time off type.');
      return;
    }

    const empId = isEmployeeRole ? defaultEmployeeId : employeeId;
    if (!empId) {
      setError('Please select an employee.');
      return;
    }

    if (!startDate || !endDate) {
      setError('Please select start and end dates.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        employeeId: empId,
        timeOffTypeId: selectedType.id,
        startDate,
        endDate,
        duration: parseFloat(duration) || 1,
        reason: reason.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to submit leave request');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-bg border border-line rounded-2xl w-full max-w-lg shadow-xl overflow-hidden font-sans">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-ink m-0">
              Request Time Off
            </h3>
            <p className="text-xs text-ink-soft mt-0.5 mb-0">
              Submit a leave application for approval
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-soft hover:text-ink text-xl leading-none cursor-pointer bg-transparent border-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-over-red rounded-lg">
              {error}
            </div>
          )}

          {!isEmployeeRole && (
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
                Employee
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-line rounded-xl bg-bg text-ink focus:outline-hidden focus:border-accent"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} ({emp.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
              Time Off Type
            </label>
            <select
              value={timeOffTypeId}
              onChange={(e) => setTimeOffTypeId(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-line rounded-xl bg-bg text-ink focus:outline-hidden focus:border-accent"
            >
              <option value="">Select leave category...</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.unit}) {type.isPaid ? '· Paid' : '· Unpaid'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (!endDate) setEndDate(e.target.value);
                }}
                required
                className="w-full px-3 py-2 text-xs border border-line rounded-xl bg-bg text-ink focus:outline-hidden focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-line rounded-xl bg-bg text-ink focus:outline-hidden focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
              Duration (Days / Hours)
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-line rounded-xl bg-bg text-ink focus:outline-hidden focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
              Reason / Remarks
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Annual family vacation, personal medical appointment..."
              className="w-full px-3 py-2 text-xs border border-line rounded-xl bg-bg text-ink focus:outline-hidden focus:border-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium border border-line bg-transparent text-ink hover:bg-bg-raised transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-accent text-accent-ink hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
            >
              {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
