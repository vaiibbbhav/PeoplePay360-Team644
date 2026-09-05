import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRegisterMutation, type UserRole } from '../queries/useAuth';

const ROLES: UserRole[] = [
  'Employee',
  'HR Manager',
  'HR Payroll User',
  'HR Payroll Manager',
  'Admin',
];

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const registerMutation = useRegisterMutation();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Employee');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password || !firstName || !lastName) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    try {
      await registerMutation.mutateAsync({
        email,
        password,
        role,
        firstName,
        lastName,
      });
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to create account';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-8 sm:p-9 border border-line rounded-xl bg-bg-raised shadow-none">
      <div className="mb-7 text-center">
        <h2 className="font-serif text-2xl font-bold mb-2 text-ink">Create an account</h2>
        <p className="text-ink-soft text-sm m-0">
          Set up your profile on PeoplePay360
        </p>
      </div>

      {errorMessage && (
        <div className="px-3.5 py-3 rounded-lg border border-over-red text-over-red text-sm mb-5 bg-[color-mix(in_srgb,var(--over-red)_8%,var(--bg))]">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5" htmlFor="firstName">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-bg text-ink font-sans text-sm outline-none focus:border-accent transition-colors"
              placeholder="Jane"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={registerMutation.isPending}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5" htmlFor="lastName">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-bg text-ink font-sans text-sm outline-none focus:border-accent transition-colors"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={registerMutation.isPending}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-soft mb-1.5" htmlFor="email">
            Work Email
          </label>
          <input
            id="email"
            type="email"
            className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-bg text-ink font-sans text-sm outline-none focus:border-accent transition-colors"
            placeholder="jane.doe@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={registerMutation.isPending}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-soft mb-1.5" htmlFor="password">
            Password (min. 6 characters)
          </label>
          <input
            id="password"
            type="password"
            className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-bg text-ink font-sans text-sm outline-none focus:border-accent transition-colors"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={registerMutation.isPending}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-soft mb-1.5" htmlFor="role">
            Platform Role
          </label>
          <select
            id="role"
            className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-bg text-ink font-sans text-sm outline-none focus:border-accent transition-colors cursor-pointer"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            disabled={registerMutation.isPending}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full mt-1.5 py-3 px-4 rounded-lg font-medium text-sm bg-accent text-accent-ink hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? 'Creating Account...' : 'Register Account'}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-line text-center text-sm text-ink-soft">
        Already registered?{' '}
        <Link to="/login" className="text-accent font-medium no-underline hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
};
