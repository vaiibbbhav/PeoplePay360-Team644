import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { publicApi } from '@/api/apiClient';

type VerificationStatus = 'loading' | 'success' | 'error';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<VerificationStatus>(() => (token ? 'loading' : 'error'));
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState(() =>
    token ? '' : 'No verification token found in URL.',
  );
  
  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    const performVerification = async () => {
      try {
        const { data } = await publicApi.post<{ success: boolean; email: string; message: string }>(
          '/auth/verify-email',
          { token },
        );
        if (isMounted) {
          setEmail(data.email || '');
          setStatus('success');
        }
      } catch (err: any) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage(
            err.response?.data?.message ||
              err.response?.data?.error ||
              'Verification link is invalid or has expired.',
          );
        }
      }
    };

    performVerification();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col bg-bg text-ink font-sans">
      {/* Header */}
      <header className="border-b border-line px-8 py-4 flex justify-between items-center bg-bg">
        <Link to="/" className="font-serif text-xl font-bold tracking-tight text-ink no-underline">
          PeoplePay<span className="text-accent">360</span>
        </Link>
      </header>

      {/* Main Card */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md mx-auto p-8 border border-line rounded-2xl bg-bg-raised text-center shadow-xs">
          {status === 'loading' && (
            <div className="py-8 flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <h2 className="font-serif text-xl font-semibold text-ink">Verifying Email...</h2>
              <p className="text-xs text-ink-soft max-w-xs leading-relaxed">
                Please wait while we confirm your verification link with the server.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-xl font-semibold border border-emerald-300 dark:border-emerald-800/40">
                ✓
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-ink">Email Verified!</h2>
                <p className="text-xs text-ink-soft mt-1.5 leading-relaxed">
                  Your email address <span className="font-medium text-ink font-mono">{email}</span>{' '}
                  has been confirmed. Your account is now active and ready.
                </p>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/login?email=${encodeURIComponent(email)}&verified=true`)
                  }
                  className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Proceed to Sign In &rarr;
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-over-red/10 text-over-red flex items-center justify-center mx-auto text-xl font-semibold border border-over-red/30">
                !
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-ink">Verification Failed</h2>
                <p className="text-xs text-ink-soft mt-1.5 leading-relaxed">{errorMessage}</p>
              </div>

              <div className="pt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-bg border border-line text-ink hover:bg-bg-raised transition-colors cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-line py-5 px-8 text-center text-xs text-ink-soft">
        PeoplePay360 — Integrated HR &amp; Payroll Operations Platform
      </footer>
    </div>
  );
};
