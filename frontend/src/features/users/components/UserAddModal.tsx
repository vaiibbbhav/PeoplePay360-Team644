import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { EmployeeOption, CreateUserInput } from '../queries/useUsers';
import type { UserRole } from '@/features/auth/queries/useAuth';
import { generateStrongPassword } from '@/lib/passwordGenerator';
import { useClickOutside } from '@/hooks/useClickOutside';

type Props = {
  isOpen: boolean;
  employees?: EmployeeOption[];
  isPending: boolean;
  onClose: () => void;
  onSave: (data: CreateUserInput) => Promise<void>;
};

const ROLES: { id: UserRole; label: string }[] = [
  { id: 'Employee', label: 'Employee' },
  { id: 'HR Payroll User', label: 'HR Payroll User' },
  { id: 'HR Payroll Manager', label: 'HR Payroll Manager' },
  { id: 'HR Manager', label: 'HR Manager' },
  { id: 'Admin', label: 'Admin' },
];

const UserAddForm: React.FC<Omit<Props, 'isOpen'>> = ({ isPending, onClose, onSave }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Employee');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [justGenerated, setJustGenerated] = useState(false);

  const handleGeneratePassword = () => {
    const generated = generateStrongPassword(14);
    setPassword(generated);
    setShowPassword(true);
    setJustGenerated(true);
    setTimeout(() => setJustGenerated(false), 3000);
  };

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSymbol;
  const canSave =
    firstName.trim() && lastName.trim() && email.trim() && isPasswordValid && role && !isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!firstName.trim()) {
      setError('First name is required.');
      return;
    }
    if (!lastName.trim()) {
      setError('Last name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!isPasswordValid) {
      setError('Password does not meet all requirements.');
      return;
    }
    try {
      await onSave({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create user.');
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
          <h2 className="font-sans text-lg font-semibold text-ink">Add User</h2>
          <p className="text-xs text-ink-soft mt-0.5">
            Create a new system account and assign a role.
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

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">
                Email address <span className="text-over-red">*</span>
              </label>
              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-line bg-bg text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-ink">
                  Password <span className="text-over-red">*</span>
                </label>
                {justGenerated && (
                  <span className="text-[11px] font-medium text-accent flex items-center gap-1">
                    Strong password generated
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password or click sparkles to generate"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending}
                  required
                  className="w-full pl-3 pr-20 py-2 text-sm rounded-lg border border-line bg-bg text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-accent transition-colors font-mono tracking-tight"
                />

                {/* Inside-the-input actions: Sparkles button + Show/Hide toggle */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    disabled={isPending}
                    title="Auto-generate a strong password satisfying all criteria"
                    className="p-1.5 rounded-md text-ink-soft hover:text-accent transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    disabled={isPending || !password}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    className="p-1 rounded-md text-ink-soft hover:text-ink hover:bg-bg-raised transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {showPassword ? (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Checklist */}
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
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">
                Role <span className="text-over-red">*</span>
              </label>
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
              disabled={!canSave}
              className="px-5 py-2 text-sm font-medium rounded-lg bg-accent text-accent-ink hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
            >
              {isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const UserAddModal: React.FC<Props> = ({ isOpen, ...props }) => {
  if (!isOpen) return null;
  return <UserAddForm {...props} />;
};
