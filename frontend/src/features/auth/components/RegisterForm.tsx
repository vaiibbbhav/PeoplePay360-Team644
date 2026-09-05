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
    <div style={{
      maxWidth: '460px',
      margin: '0 auto',
      padding: '36px 32px',
      border: '1px solid var(--line)',
      borderRadius: '12px',
      background: 'var(--bg-raised)',
      boxShadow: 'none',
    }}>
      <div style={{ marginBottom: '28px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>Create an account</h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: '14.5px', margin: 0 }}>
          Set up your profile on PeoplePay360
        </p>
      </div>

      {errorMessage && (
        <div style={{
          padding: '12px 14px',
          borderRadius: '8px',
          border: '1px solid var(--over-red)',
          color: 'var(--over-red)',
          fontSize: '13.5px',
          marginBottom: '20px',
          background: 'color-mix(in srgb, var(--over-red) 8%, var(--bg))',
        }}>
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label className="editorial-label" htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              type="text"
              className="editorial-input"
              placeholder="Jane"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={registerMutation.isPending}
              required
            />
          </div>
          <div>
            <label className="editorial-label" htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              type="text"
              className="editorial-input"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={registerMutation.isPending}
              required
            />
          </div>
        </div>

        <div>
          <label className="editorial-label" htmlFor="email">Work Email</label>
          <input
            id="email"
            type="email"
            className="editorial-input"
            placeholder="jane.doe@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={registerMutation.isPending}
            required
          />
        </div>

        <div>
          <label className="editorial-label" htmlFor="password">Password (min. 6 characters)</label>
          <input
            id="password"
            type="password"
            className="editorial-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={registerMutation.isPending}
            required
          />
        </div>

        <div>
          <label className="editorial-label" htmlFor="role">Platform Role</label>
          <select
            id="role"
            className="editorial-input"
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
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '6px', padding: '12px' }}
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? 'Creating Account...' : 'Register Account'}
        </button>
      </form>

      <div style={{
        marginTop: '24px',
        paddingTop: '20px',
        borderTop: '1px solid var(--line)',
        textAlign: 'center',
        fontSize: '13.5px',
        color: 'var(--ink-soft)',
      }}>
        Already registered?{' '}
        <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
          Sign in
        </Link>
      </div>
    </div>
  );
};
