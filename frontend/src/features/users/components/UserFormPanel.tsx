import React, { useState, useEffect } from 'react';
import type { UserItem, EmployeeOption } from '../queries/useUsers';
import type { UserRole } from '@/features/auth/queries/useAuth';

interface UserFormPanelProps {
  selectedUser: UserItem | null;
  employees: EmployeeOption[];
  onSaveCreate: (data: {
    email: string;
    password: string;
    role: UserRole;
    employeeId?: string | null;
    isActive: boolean;
  }) => Promise<void>;
  onSaveUpdate: (
    id: string,
    data: {
      password?: string;
      role?: UserRole;
      employeeId?: string | null;
      isActive?: boolean;
    }
  ) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

const ROLES: { id: UserRole; label: string; desc: string }[] = [
  {
    id: 'Employee',
    label: 'Employee',
    desc: 'Self-service check-in/out, personal attendance & payslips',
  },
  {
    id: 'HR Payroll User',
    label: 'HR Payroll User',
    desc: 'Time off requests, attendance adjustments & draft payroll runs',
  },
  {
    id: 'HR Payroll Manager',
    label: 'HR Payroll Manager',
    desc: 'Approve payruns, execute payments, manage salary structures & rules',
  },
  {
    id: 'HR Manager',
    label: 'HR Manager',
    desc: 'Master employee records, departments, contracts & work schedules',
  },
  {
    id: 'Admin',
    label: 'Admin',
    desc: 'Complete system authority, user account provisioning & RBAC grants',
  },
];

export const UserFormPanel: React.FC<UserFormPanelProps> = ({
  selectedUser,
  employees,
  onSaveCreate,
  onSaveUpdate,
  onCancel,
  isSaving,
}) => {
  const isEditing = Boolean(selectedUser);

  // Form State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<UserRole>('Employee');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // When selectedUser changes, sync form state
  useEffect(() => {
    if (selectedUser) {
      setSelectedEmployeeId(selectedUser.employeeId || '');
      setEmail(selectedUser.email);
      setPassword('');
      setRole(selectedUser.role);
      setIsActive(selectedUser.isActive);
      setErrorMessage(null);
      setSuccessMessage(null);
    } else {
      setSelectedEmployeeId('');
      setEmail('');
      setPassword('');
      setRole('Employee');
      setIsActive(true);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [selectedUser]);

  // Handle employee dropdown change
  const handleEmployeeChange = (empId: string) => {
    setSelectedEmployeeId(empId);
    if (!isEditing && empId) {
      const match = employees.find((e) => e.id === empId);
      if (match?.workEmail) {
        setEmail(match.workEmail);
      }
    }
  };

  // Password validation checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSymbol;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isEditing) {
      // Validation for Create
      if (!email.trim()) {
        setErrorMessage('Email address is required.');
        return;
      }
      if (!isPasswordValid) {
        setErrorMessage(
          'Password must satisfy all criteria: 8+ characters, 1 uppercase, 1 number, and 1 symbol.'
        );
        return;
      }

      try {
        await onSaveCreate({
          email: email.trim().toLowerCase(),
          password,
          role,
          employeeId: selectedEmployeeId || null,
          isActive,
        });
        setSuccessMessage('User account created successfully.');
        setPassword('');
      } catch (err: any) {
        setErrorMessage(
          err.response?.data?.message || err.message || 'Failed to create user account.'
        );
      }
    } else {
      // Validation for Edit
      if (password && !isPasswordValid) {
        setErrorMessage(
          'New password must satisfy all criteria: 8+ characters, 1 uppercase, 1 number, and 1 symbol.'
        );
        return;
      }

      try {
        await onSaveUpdate(selectedUser!.id, {
          ...(password ? { password } : {}),
          role,
          employeeId: selectedEmployeeId || null,
          isActive,
        });
        setSuccessMessage('User access configuration saved.');
        setPassword('');
      } catch (err: any) {
        setErrorMessage(
          err.response?.data?.message || err.message || 'Failed to update user access.'
        );
      }
    }
  };

  return (
    <div className="bg-bg border border-line rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col h-full">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-line">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-ink">
            {isEditing ? 'Edit User Access' : 'Provision New User'}
          </h2>
          <p className="text-xs text-ink-soft mt-0.5">
            {isEditing
              ? 'Modify granted role permissions and account state'
              : 'Assign system credentials and access role'}
          </p>
        </div>
        {isEditing && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs px-2.5 py-1 rounded-md border border-line text-ink hover:bg-bg-raised transition-colors cursor-pointer"
          >
            + New User
          </button>
        )}
      </div>

      {/* Alert Banners */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400">
          {successMessage}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4.5 flex-1 overflow-y-auto pr-1">
        {/* Linked Employee */}
        <div>
          <label className="block text-xs font-medium text-ink mb-1.5">
            Link Employee Profile
          </label>
          <select
            value={selectedEmployeeId}
            onChange={(e) => handleEmployeeChange(e.target.value)}
            disabled={isSaving}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-line bg-bg text-ink focus:outline-none focus:border-accent transition-colors cursor-pointer"
          >
            <option value="">None (Standalone System Account)</option>
            {employees.map((emp) => {
              const isCurrentEmployee = selectedUser?.employeeId === emp.id;
              const hasOtherAccount = emp.hasUserAccount && !isCurrentEmployee;
              return (
                <option key={emp.id} value={emp.id} disabled={hasOtherAccount}>
                  {emp.firstName} {emp.lastName} ({emp.employeeNumber}) — {emp.jobTitle}
                  {emp.departmentName ? ` [${emp.departmentName}]` : ''}
                  {hasOtherAccount ? ' (Has Account)' : ''}
                </option>
              );
            })}
          </select>
          <p className="text-[11px] text-ink-soft mt-1">
            Linking binds attendance punches and payslip generation to this login.
          </p>
        </div>

        {/* Work Email */}
        <div>
          <label className="block text-xs font-medium text-ink mb-1.5">
            Work Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            placeholder="colleague@peoplepay.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isEditing || isSaving}
            required
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-line bg-bg text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          />
          {isEditing && (
            <p className="text-[11px] text-ink-soft mt-1">
              Account email is permanently bound. Role and password can be modified below.
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-medium text-ink mb-1.5">
            {isEditing ? 'New Password (Optional)' : 'Initial Password'}{' '}
            {!isEditing && <span className="text-red-500">*</span>}
          </label>
          <input
            type="password"
            placeholder={isEditing ? 'Leave blank to retain current password' : '••••••••'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSaving}
            required={!isEditing}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-line bg-bg text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-accent transition-colors"
          />

          {/* Real-time Checklist */}
          <div className="mt-2 p-2.5 rounded-lg bg-bg-raised/50 border border-line grid grid-cols-2 gap-1.5 text-[11px]">
            <div
              className={`flex items-center gap-1.5 ${
                hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-ink-soft'
              }`}
            >
              <span>{hasMinLength ? '✓' : '○'}</span>
              <span>8+ characters</span>
            </div>
            <div
              className={`flex items-center gap-1.5 ${
                hasUppercase ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-ink-soft'
              }`}
            >
              <span>{hasUppercase ? '✓' : '○'}</span>
              <span>1 uppercase letter</span>
            </div>
            <div
              className={`flex items-center gap-1.5 ${
                hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-ink-soft'
              }`}
            >
              <span>{hasNumber ? '✓' : '○'}</span>
              <span>1 number</span>
            </div>
            <div
              className={`flex items-center gap-1.5 ${
                hasSymbol ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-ink-soft'
              }`}
            >
              <span>{hasSymbol ? '✓' : '○'}</span>
              <span>1 special symbol</span>
            </div>
          </div>
        </div>

        {/* Roles Selection */}
        <div>
          <label className="block text-xs font-medium text-ink mb-1.5">
            Role Permission Grant <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-col gap-2">
            {ROLES.map((r) => {
              const checked = role === r.id;
              return (
                <label
                  key={r.id}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    checked
                      ? 'border-accent bg-accent/5 ring-1 ring-accent/30'
                      : 'border-line bg-bg-raised/20 hover:bg-bg-raised/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role-selection"
                    value={r.id}
                    checked={checked}
                    onChange={() => setRole(r.id)}
                    disabled={isSaving}
                    className="mt-0.5 accent-accent cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-ink flex items-center justify-between">
                      <span>{r.label}</span>
                      {r.id === 'Admin' && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-normal">
                          Superuser
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-ink-soft leading-tight mt-0.5">
                      {r.desc}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Account Status Toggle */}
        <div className="pt-2 border-t border-line">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={isSaving}
              className="w-4 h-4 rounded border-line accent-accent cursor-pointer"
            />
            <div>
              <span className="text-xs font-medium text-ink">Active Account</span>
              <p className="text-[11px] text-ink-soft">
                When unchecked, user cannot sign in or generate tokens.
              </p>
            </div>
          </label>
        </div>

        {/* Submit Buttons */}
        <div className="pt-3 border-t border-line flex items-center justify-end gap-2.5 mt-auto">
          {isEditing && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-line bg-transparent hover:bg-bg-raised text-ink transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 text-xs sm:text-sm font-medium rounded-lg bg-accent text-accent-ink hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {isSaving
              ? 'Saving Access...'
              : isEditing
              ? 'Save Access Changes'
              : 'Create User & Grant Access'}
          </button>
        </div>
      </form>
    </div>
  );
};
