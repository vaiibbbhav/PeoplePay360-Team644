import React, { useState } from 'react';
import type { UserItem, EmployeeOption, UpdateUserInput } from '../queries/useUsers';
import type { UserRole } from '@/features/auth/queries/useAuth';
import { useClickOutside } from '@/hooks/useClickOutside';

type Props = {
  isOpen: boolean;
  user: UserItem | null;
  employees?: EmployeeOption[];
  isPending: boolean;
  onClose: () => void;
  onSave: (id: string, data: UpdateUserInput) => Promise<void>;
};

const ROLES: { id: UserRole; label: string }[] = [
  { id: 'Employee', label: 'Employee' },
  { id: 'HR Payroll User', label: 'HR Payroll User' },
  { id: 'HR Payroll Manager', label: 'HR Payroll Manager' },
  { id: 'HR Manager', label: 'HR Manager' },
  { id: 'Admin', label: 'Admin' },
];

type EditFormProps = {
  user: UserItem;
  isPending: boolean;
  onClose: () => void;
  onSave: (id: string, data: UpdateUserInput) => Promise<void>;
};

const UserEditForm: React.FC<EditFormProps> = ({ user, isPending, onClose, onSave }) => {
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(user.role);
  const [isActive, setIsActive] = useState(user.isActive);
  const [error, setError] = useState('');

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = !password || (hasMinLength && hasUppercase && hasNumber && hasSymbol);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    if (!firstName.trim()) {
      setError('First name cannot be empty.');
      return;
    }
    if (!lastName.trim()) {
      setError('Last name cannot be empty.');
      return;
    }
    if (password && !isPasswordValid) {
      setError('New password does not meet all requirements.');
      return;
    }
    try {
      await onSave(user.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(password ? { password } : {}),
        role,
        isActive,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update user.');
    }
  };

  const modalRef = useClickOutside<HTMLDivElement>(() => {
    if (!isPending) onClose();
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!isPending ? onClose : undefined}
      />

      {/* Dialog */}
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-md bg-bg border border-line rounded-xl shadow-sm overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-line">
          <h2 className="font-sans text-lg font-semibold text-ink">Edit User</h2>
          <p className="text-xs text-ink-soft mt-0.5 truncate">
            Updating access for <span className="font-medium text-ink">{user.email}</span>
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-over-red/10 border border-over-red/30 text-xs text-over-red">
                {error}
              </div>
            )}

            {/* Email — read only */}
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">Email address</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3 py-2 text-sm rounded-lg border border-line bg-bg-raised text-ink-soft opacity-70 cursor-not-allowed"
              />
              <p className="text-[11px] text-ink-soft mt-1">
                Email cannot be changed after account creation.
              </p>
            </div>

            {/* First & Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink mb-1.5">
                  First Name <span className="text-over-red">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maya"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isPending}
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-line bg-bg text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink mb-1.5">
                  Last Name <span className="text-over-red">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shah"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isPending}
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-line bg-bg text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">
                New Password <span className="text-ink-soft font-normal">(optional)</span>
              </label>
              <input
                type="password"
                placeholder="Leave blank to keep current password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 text-sm rounded-lg border border-line bg-bg text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-accent transition-colors"
              />
              {password && (
                <div className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
                  {[
                    { ok: hasMinLength, label: '8+ characters' },
                    { ok: hasUppercase, label: '1 uppercase' },
                    { ok: hasNumber, label: '1 number' },
                    { ok: hasSymbol, label: '1 special char' },
                  ].map(({ ok, label }) => (
                    <span
                      key={label}
                      className={`flex items-center gap-1 ${ok ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-ink-soft'}`}
                    >
                      {ok ? '✓' : '○'} {label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                disabled={isPending}
                className="w-full px-3 py-2 text-sm rounded-lg border border-line bg-bg text-ink focus:outline-none focus:border-accent transition-colors cursor-pointer"
              >
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-2.5 pt-1">
              <input
                type="checkbox"
                id="edit-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isPending}
                className="w-4 h-4 rounded border-line accent-accent cursor-pointer"
              />
              <label htmlFor="edit-active" className="text-sm font-medium text-ink cursor-pointer">
                Active account
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-5 flex items-center justify-between gap-3 border-t border-line pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-line bg-bg text-ink hover:bg-bg-raised transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 text-sm font-medium rounded-lg bg-accent text-accent-ink hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
            >
              {isPending ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const UserEditModal: React.FC<Props> = ({ isOpen, user, ...props }) => {
  if (!isOpen || !user) return null;
  return <UserEditForm key={user.id} user={user} {...props} />;
};
