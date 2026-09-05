import React, { useState, useEffect } from 'react';
import {
  useContractsMeta,
  type ContractItem,
  type CreateContractPayload,
  type ContractStatus,
  type WageType,
} from '../queries/useContracts';

type ContractFormDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateContractPayload) => Promise<void>;
  initialData?: ContractItem | null;
  defaultEmployeeId?: string;
  isSubmitting?: boolean;
};

export const ContractFormDrawer: React.FC<ContractFormDrawerProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  defaultEmployeeId,
  isSubmitting = false,
}) => {
  const { data: meta } = useContractsMeta();

  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [wage, setWage] = useState<number | ''>(50000);
  const [wageType, setWageType] = useState<WageType>('monthly');
  const [salaryStructureId, setSalaryStructureId] = useState('');
  const [workingScheduleId, setWorkingScheduleId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [jobPositionId, setJobPositionId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<ContractStatus>('active');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setEmployeeId(initialData.employee_id);
      setName(initialData.name);
      setWage(Number(initialData.wage) || 0);
      setWageType(initialData.wage_type || 'monthly');
      setSalaryStructureId(initialData.salary_structure_id || '');
      setWorkingScheduleId(initialData.working_schedule_id || '');
      setDepartmentId(initialData.department_id || '');
      setJobPositionId(initialData.job_position_id || '');
      setStartDate(initialData.start_date ? initialData.start_date.slice(0, 10) : '');
      setEndDate(initialData.end_date ? initialData.end_date.slice(0, 10) : '');
      setStatus(initialData.status);
      setNotes(initialData.notes || '');
    } else {
      const empId = defaultEmployeeId || '';
      setEmployeeId(empId);
      setName('Employment Agreement');
      setWage(50000);
      setWageType('monthly');
      setSalaryStructureId(meta?.salaryStructures?.[0]?.id || '');
      setWorkingScheduleId(meta?.workingSchedules?.[0]?.id || '');

      const today = new Date().toISOString().slice(0, 10);
      setStartDate(today);
      setEndDate('');
      setStatus('active');
      setNotes('');

      // Auto-populate dept & job if employee selected
      if (empId && meta?.employees) {
        const emp = meta.employees.find((e) => e.id === empId);
        if (emp) {
          if (emp.departmentId) setDepartmentId(emp.departmentId);
          if (emp.jobPositionId) setJobPositionId(emp.jobPositionId);
          if (emp.workingScheduleId) setWorkingScheduleId(emp.workingScheduleId);
        }
      }
    }
    setErrorMessage(null);
  }, [initialData, defaultEmployeeId, isOpen, meta]);

  if (!isOpen) return null;

  const handleEmployeeChange = (id: string) => {
    setEmployeeId(id);
    const emp = meta?.employees.find((e) => e.id === id);
    if (emp) {
      if (emp.departmentId) setDepartmentId(emp.departmentId);
      if (emp.jobPositionId) setJobPositionId(emp.jobPositionId);
      if (emp.workingScheduleId) setWorkingScheduleId(emp.workingScheduleId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!employeeId) {
      setErrorMessage('Please select an employee');
      return;
    }
    if (!name.trim()) {
      setErrorMessage('Contract name is required');
      return;
    }
    if (!wage || Number(wage) <= 0) {
      setErrorMessage('Contract wage must be greater than 0');
      return;
    }
    if (!salaryStructureId) {
      setErrorMessage('Please select a salary structure');
      return;
    }
    if (!startDate) {
      setErrorMessage('Start date is required');
      return;
    }
    if (endDate && endDate < startDate) {
      setErrorMessage('End date cannot be prior to start date');
      return;
    }

    try {
      await onSubmit({
        employeeId,
        name: name.trim(),
        wage: Number(wage),
        wageType,
        salaryStructureId,
        workingScheduleId: workingScheduleId || null,
        departmentId: departmentId || null,
        jobPositionId: jobPositionId || null,
        startDate,
        endDate: endDate || null,
        status,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.error || err.message || 'Failed to save contract agreement',
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-bg border-l border-line shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-line flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                {initialData ? 'Update Terms' : 'New Employment Contract'}
              </span>
              <h2 className="font-serif text-xl font-bold text-ink mt-0.5 mb-0">
                {initialData ? initialData.name : 'Draft Contract Agreement'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-line bg-transparent text-ink-soft hover:text-ink hover:bg-bg-raised transition-colors flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-over-red text-xs leading-relaxed">
                {errorMessage}
              </div>
            )}

            {/* Employee Selection */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Employee <span className="text-over-red">*</span>
              </label>
              <select
                value={employeeId}
                onChange={(e) => handleEmployeeChange(e.target.value)}
                disabled={Boolean(initialData) || Boolean(defaultEmployeeId)}
                className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-ink text-xs focus:outline-none focus:border-accent disabled:opacity-60"
                required
              >
                <option value="">Select Employee...</option>
                {meta?.employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Contract Title */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Contract Reference / Title <span className="text-over-red">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Senior Software Engineer - Full Time Agreement"
                className="w-full px-3.5 py-2 rounded-xl border border-line bg-bg text-ink text-xs placeholder:text-ink-soft/60 focus:outline-none focus:border-accent"
                required
              />
            </div>

            {/* Wage & Wage Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Wage Amount (INR) <span className="text-over-red">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="500"
                  value={wage}
                  onChange={(e) => setWage(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2 rounded-xl border border-line bg-bg text-ink text-xs focus:outline-none focus:border-accent font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Payment Frequency
                </label>
                <select
                  value={wageType}
                  onChange={(e) => setWageType(e.target.value as WageType)}
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-ink text-xs focus:outline-none focus:border-accent"
                >
                  <option value="monthly">Monthly Salary</option>
                  <option value="hourly">Hourly Rate</option>
                </select>
              </div>
            </div>

            {/* Salary Structure & Schedule */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Salary Structure <span className="text-over-red">*</span>
                </label>
                <select
                  value={salaryStructureId}
                  onChange={(e) => setSalaryStructureId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-ink text-xs focus:outline-none focus:border-accent"
                  required
                >
                  <option value="">Select Salary Structure...</option>
                  {meta?.salaryStructures.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Working Schedule
                </label>
                <select
                  value={workingScheduleId}
                  onChange={(e) => setWorkingScheduleId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-ink text-xs focus:outline-none focus:border-accent"
                >
                  <option value="">Select Working Schedule...</option>
                  {meta?.workingSchedules.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name} ({ws.weeklyHours}h/wk)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Department & Job Position */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Department
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-ink text-xs focus:outline-none focus:border-accent"
                >
                  <option value="">No Department Assigned</option>
                  {meta?.departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Job Position
                </label>
                <select
                  value={jobPositionId}
                  onChange={(e) => setJobPositionId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-ink text-xs focus:outline-none focus:border-accent"
                >
                  <option value="">No Position Assigned</option>
                  {meta?.jobPositions.map((jp) => (
                    <option key={jp.id} value={jp.id}>
                      {jp.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dates & Status */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Start Date <span className="text-over-red">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-line bg-bg text-ink text-xs focus:outline-none focus:border-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-line bg-bg text-ink text-xs focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Contract Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ContractStatus)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-line bg-bg text-ink text-xs focus:outline-none focus:border-accent"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Stipulations & Internal Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special compensation clauses, probation terms, notice period..."
                className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-ink text-xs placeholder:text-ink-soft/60 focus:outline-none focus:border-accent resize-none"
              />
            </div>

            {/* Footer buttons */}
            <div className="pt-4 border-t border-line flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-line bg-transparent text-ink hover:bg-bg-raised transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-xs font-medium bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{initialData ? 'Save Changes' : 'Execute Contract'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
