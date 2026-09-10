import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useResetPasswordMutation } from '../queries/useAuth';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetMutation = useResetPasswordMutation();

  const validatePassword = (pass: string): string | null => {
    if (pass.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(pass)) return 'Password must contain at least one uppercase letter';
    if (!/[0-9]/.test(pass)) return 'Password must contain at least one number';
    if (!/[^A-Za-z0-9]/.test(pass)) return 'Password must contain at least one special symbol';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage('Reset token is missing from the URL. Please request a new link.');
      return;
    }

    const validationErr = validatePassword(newPassword);
    if (validationErr) {
      setErrorMessage(validationErr);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    try {
      await resetMutation.mutateAsync({ token, newPassword });
      setIsSuccess(true);
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to reset password. The link may have expired.';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg text-ink">
      <header className="border-b border-line px-4 sm:px-8 py-3.5 sm:py-4 flex justify-between items-center bg-bg">
        <Link
          to="/"
          className="font-serif text-lg sm:text-xl font-bold tracking-tight text-ink no-underline"
        >
          PeoplePay<span className="text-accent">360</span>
        </Link>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink font-sans transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md mx-auto p-6 sm:p-8 border border-line rounded-2xl bg-bg-raised">
          {!token ? (
            <div className="text-center space-y-4 py-2">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-red-500/20 bg-red-500/5 text-over-red mx-auto">
                <AlertCircle className="w-5 h-5 text-over-red" />
              </div>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-ink">
                Invalid Reset Link
              </h1>
              <p className="text-xs sm:text-sm text-ink-soft leading-relaxed font-sans">
                No password reset token was provided in the URL. Please request a fresh reset link.
              </p>
              <div className="pt-2">
                <Link
                  to="/forgot-password"
                  className="inline-block py-2.5 px-4 rounded-lg font-medium text-xs sm:text-sm bg-accent text-accent-ink hover:opacity-90 transition-opacity"
                >
                  Request New Reset Link
                </Link>
              </div>
            </div>
          ) : !isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-line bg-bg text-accent mb-4">
                  <Lock className="w-5 h-5" />
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink">
                  Set New Password
                </h1>
                <p className="text-xs sm:text-sm text-ink-soft mt-1.5 leading-relaxed font-sans">
                  Create a strong password for your PeoplePay360 account.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-lg border border-red-500/20 bg-red-500/5 text-xs text-over-red flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-over-red" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-ink mb-1.5" htmlFor="newPassword">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-line bg-bg text-ink font-sans text-sm outline-none focus:border-accent transition-colors"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={resetMutation.isPending}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-ink-soft mt-1.5">
                  At least 8 characters with 1 uppercase, 1 number, and 1 symbol.
                </p>
              </div>

              <div>
                <label
                  className="block text-xs font-medium text-ink mb-1.5"
                  htmlFor="confirmPassword"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-bg text-ink font-sans text-sm outline-none focus:border-accent transition-colors"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={resetMutation.isPending}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg font-medium text-xs sm:text-sm bg-accent text-accent-ink hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                disabled={resetMutation.isPending}
              >
                {resetMutation.isPending ? 'Updating Password...' : 'Reset Password'}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-line bg-bg text-accent mx-auto">
                <CheckCircle2 className="w-6 h-6 text-accent" />
              </div>
              <h2 className="font-serif text-2xl font-bold tracking-tight text-ink">
                Password Reset Successfully
              </h2>
              <p className="text-xs sm:text-sm text-ink-soft leading-relaxed font-sans max-w-sm mx-auto">
                Your credentials have been securely updated. You can now sign in using your new
                password.
              </p>
              <div className="pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full py-2.5 px-4 rounded-lg font-medium text-xs sm:text-sm bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Sign In to Console
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-line py-4 px-4 text-center text-xs text-ink-soft">
        PeoplePay360 — Integrated HR &amp; Payroll Operations Platform
      </footer>
    </div>
  );
};
