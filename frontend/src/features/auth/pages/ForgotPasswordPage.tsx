import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useForgotPasswordMutation } from '../queries/useAuth';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const forgotMutation = useForgotPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      await forgotMutation.mutateAsync({ email });
      setSubmitted(true);
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to request password reset';
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
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-line bg-bg text-accent mb-4">
                  <Mail className="w-5 h-5" />
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink">
                  Forgot Password
                </h1>
                <p className="text-xs sm:text-sm text-ink-soft mt-1.5 leading-relaxed font-sans">
                  Enter your registered work email address. We will send you a secure link to reset
                  your password.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-lg border border-red-500/20 bg-red-500/5 text-xs text-over-red flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-over-red" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-ink mb-1.5" htmlFor="email">
                  Work Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-bg text-ink font-sans text-sm outline-none focus:border-accent transition-colors"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={forgotMutation.isPending}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg font-medium text-xs sm:text-sm bg-accent text-accent-ink hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                disabled={forgotMutation.isPending}
              >
                {forgotMutation.isPending ? 'Sending Reset Link...' : 'Send Reset Link'}
              </button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs text-ink-soft hover:text-ink font-sans">
                  Remember your credentials? <span className="text-accent underline">Sign in</span>
                </Link>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-4 py-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-line bg-bg text-accent mx-auto">
                <CheckCircle2 className="w-6 h-6 text-accent" />
              </div>
              <h2 className="font-serif text-2xl font-bold tracking-tight text-ink">
                Check Your Inbox
              </h2>
              <p className="text-xs sm:text-sm text-ink-soft leading-relaxed font-sans max-w-sm mx-auto">
                If an account matches <strong>{email}</strong>, a password reset link has been
                dispatched. The link remains valid for 1 hour.
              </p>
              <div className="pt-4 border-t border-line space-y-2">
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-accent hover:underline block mx-auto cursor-pointer"
                >
                  Didn't receive the email? Try again
                </button>
                <Link
                  to="/login"
                  className="inline-block mt-2 py-2 px-4 rounded-lg text-xs font-medium border border-line bg-bg text-ink hover:bg-bg-raised transition-colors"
                >
                  Return to Sign In
                </Link>
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
