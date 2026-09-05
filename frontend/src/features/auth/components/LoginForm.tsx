import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLoginMutation } from '../queries/useAuth';

interface QuickRole {
  role: string;
  email: string;
  pass: string;
}

const QUICK_ROLES: QuickRole[] = [
  { role: 'Admin', email: 'admin@peoplepay.com', pass: 'Admin@123' },
  { role: 'HR Manager', email: 'maya@company.com', pass: 'Staff@123' },
  { role: 'HR Payroll Manager', email: 'nisha@company.com', pass: 'Staff@123' },
  { role: 'HR Payroll User', email: 'aarav@company.com', pass: 'Staff@123' },
  { role: 'Employee', email: 'rohan@company.com', pass: 'Staff@123' },
];

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginMutation = useLoginMutation();

  const isVerified = searchParams.get('verified') === 'true';
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeRoleLogin, setActiveRoleLogin] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    try {
      const res = await loginMutation.mutateAsync({ email, password });
      navigate(res.user.role === 'Admin' ? '/users' : '/dashboard');
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to sign in';
      setErrorMessage(msg);
    }
  };

  const handleQuickLogin = async (acc: QuickRole) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setErrorMessage(null);
    setActiveRoleLogin(acc.role);

    try {
      const res = await loginMutation.mutateAsync({ email: acc.email, password: acc.pass });
      navigate(res.user.role === 'Admin' ? '/users' : '/dashboard');
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to sign in';
      setErrorMessage(msg);
      setActiveRoleLogin(null);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-7 sm:p-9 border border-line rounded-2xl bg-bg-raised shadow-xs">
      <div className="mb-6 text-center">
        <h2 className="font-serif text-2xl font-bold mb-1.5 text-ink">Welcome back</h2>
        <p className="text-ink-soft text-xs sm:text-sm m-0">
          Enter your credentials to access PeoplePay360
        </p>
      </div>

      {isVerified && (
        <div className="px-3.5 py-3 rounded-lg border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs mb-5 bg-emerald-500/10 flex items-center gap-2 font-medium">
          <span>✓</span>
          <span>Email verified successfully. Please enter your password to sign in.</span>
        </div>
      )}

      {errorMessage && (
        <div className="px-3.5 py-3 rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 text-xs mb-5 bg-red-500/10">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-ink mb-1.5" htmlFor="email">
            Work Email
          </label>
          <input
            id="email"
            type="email"
            className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-bg text-ink font-sans text-sm outline-none focus:border-accent transition-colors"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loginMutation.isPending}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ink mb-1.5" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-bg text-ink font-sans text-sm outline-none focus:border-accent transition-colors"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loginMutation.isPending}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full mt-1 py-2.5 px-4 rounded-lg font-medium text-xs sm:text-sm bg-accent text-accent-ink hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-xs"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending && !activeRoleLogin ? 'Signing in...' : 'Sign in to Console'}
        </button>
      </form>

      {/* Simple Direct Role Buttons */}
      <div className="mt-6 pt-5 border-t border-line">
        <div className="text-xs font-medium text-ink-soft mb-2.5 text-center">
          Direct Login by Role
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {QUICK_ROLES.map((item) => (
            <button
              key={item.role}
              type="button"
              onClick={() => handleQuickLogin(item)}
              disabled={loginMutation.isPending}
              className="px-3 py-1.5 rounded-lg border border-line bg-bg hover:bg-bg-raised text-ink text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              {activeRoleLogin === item.role ? 'Signing in...' : item.role}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-line text-center text-[11px] text-ink-soft leading-relaxed">
        Accounts are provisioned by your system administrator. Contact your HR or IT department to
        request access.
      </div>
    </div>
  );
};
