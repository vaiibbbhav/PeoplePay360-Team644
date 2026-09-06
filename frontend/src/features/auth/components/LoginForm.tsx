import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLoginMutation, useResendVerificationMutation, type UserRole } from '../queries/useAuth';
import { getDefaultPathForRole } from '@/lib/permissions';

type QuickRole = {
  role: UserRole;
  email: string;
  pass: string;
};

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
  const resendMutation = useResendVerificationMutation();

  const isVerified = searchParams.get('verified') === 'true';
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnverifiedEmail, setIsUnverifiedEmail] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [resendFeedback, setResendFeedback] = useState<string | null>(null);
  const [activeRoleLogin, setActiveRoleLogin] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsUnverifiedEmail(false);
    setResendStatus('idle');
    setResendFeedback(null);

    if (!email || !password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    try {
      const res = await loginMutation.mutateAsync({ email, password });
      if (res?.user?.role) {
        navigate(getDefaultPathForRole(res.user.role));
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const errorCode = err.response?.data?.code;
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to sign in';

      if (errorCode === 'EMAIL_NOT_VERIFIED' || msg.toLowerCase().includes('verify your email')) {
        setIsUnverifiedEmail(true);
      }
      setErrorMessage(msg);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setResendFeedback('Please enter your work email first.');
      return;
    }
    setResendStatus('sending');
    setResendFeedback(null);
    try {
      const res = await resendMutation.mutateAsync(email);
      setResendStatus('sent');
      setResendFeedback(res.message || 'Verification link sent! Please check your inbox.');
    } catch (err: any) {
      setResendStatus('error');
      setResendFeedback(err.response?.data?.error || 'Failed to resend verification email.');
    }
  };

  const handleQuickLogin = async (acc: QuickRole) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setErrorMessage(null);
    setIsUnverifiedEmail(false);
    setResendStatus('idle');
    setResendFeedback(null);
    setActiveRoleLogin(acc.role);

    try {
      const res = await loginMutation.mutateAsync({ email: acc.email, password: acc.pass });
      const targetRole: UserRole = res?.user?.role || acc.role;
      navigate(getDefaultPathForRole(targetRole));
    } catch (err: any) {
      const errorCode = err.response?.data?.code;
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to sign in';

      if (errorCode === 'EMAIL_NOT_VERIFIED' || msg.toLowerCase().includes('verify your email')) {
        setIsUnverifiedEmail(true);
      }
      setErrorMessage(msg);
      setActiveRoleLogin(null);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-5 sm:p-8 border border-line rounded-2xl bg-bg-raised shadow-xs">
      <div className="mb-6 text-center">
        <h2 className="font-sans text-2xl font-bold mb-1.5 text-ink">Welcome back</h2>
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

        {isUnverifiedEmail ? (
          <div className="p-4 rounded-xl border border-amber-500/25 bg-amber-500/5 dark:bg-amber-950/20 text-xs space-y-2">
            <div className="flex items-start gap-2.5">
              <span className="text-amber-600 dark:text-amber-400 text-base font-bold leading-none mt-0.5">
                ✉
              </span>
              <div className="flex-1 space-y-1">
                <h3 className="font-medium text-ink text-xs m-0">Email verification required</h3>
                <p className="text-ink-soft leading-relaxed text-[11px] m-0">
                  {errorMessage ||
                    'Please verify your email before logging in. Check your inbox for the verification link.'}
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-amber-500/15 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendStatus === 'sending'}
                className="text-xs font-medium text-ink underline hover:text-ink-soft transition-colors cursor-pointer disabled:opacity-50"
              >
                {resendStatus === 'sending'
                  ? 'Sending verification link...'
                  : 'Resend verification link'}
              </button>
              {resendFeedback && (
                <span
                  className={`text-[11px] font-medium ${
                    resendStatus === 'sent'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {resendFeedback}
                </span>
              )}
            </div>
          </div>
        ) : errorMessage ? (
          <div
            role="alert"
            className="px-3.5 py-3 rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 text-xs bg-red-500/10"
          >
            {errorMessage}
          </div>
        ) : null}
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
