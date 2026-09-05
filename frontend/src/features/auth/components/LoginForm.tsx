import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLoginMutation } from '../queries/useAuth';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const loginMutation = useLoginMutation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    try {
      await loginMutation.mutateAsync({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to sign in';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 sm:p-9 border border-line rounded-xl bg-bg-raised shadow-none">
      <div className="mb-7 text-center">
        <h2 className="font-serif text-2xl font-bold mb-2 text-ink">Welcome back</h2>
        <p className="text-ink-soft text-sm m-0">
          Enter your credentials to access PeoplePay360
        </p>
      </div>

      {errorMessage && (
        <div className="px-3.5 py-3 rounded-lg border border-over-red text-over-red text-sm mb-5 bg-[color-mix(in_srgb,var(--over-red)_8%,var(--bg))]">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
        <div>
          <label className="block text-xs font-medium text-ink-soft mb-1.5" htmlFor="email">
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
          <label className="block text-xs font-medium text-ink-soft mb-1.5" htmlFor="password">
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
          className="w-full mt-1.5 py-3 px-4 rounded-lg font-medium text-sm bg-accent text-accent-ink hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? 'Signing in...' : 'Sign in to Console'}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-line text-center text-sm text-ink-soft">
        Don't have an account?{' '}
        <Link to="/register" className="text-accent font-medium no-underline hover:underline">
          Create an account
        </Link>
      </div>
    </div>
  );
};
