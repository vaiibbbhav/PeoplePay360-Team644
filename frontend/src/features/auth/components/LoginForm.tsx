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
    <div style={{
      maxWidth: '420px',
      margin: '0 auto',
      padding: '36px 32px',
      border: '1px solid var(--line)',
      borderRadius: '12px',
      background: 'var(--bg-raised)',
      boxShadow: 'none',
    }}>
      <div style={{ marginBottom: '28px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>Welcome back</h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: '14.5px', margin: 0 }}>
          Enter your credentials to access PeoplePay360
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

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div>
          <label className="editorial-label" htmlFor="email">Work Email</label>
          <input
            id="email"
            type="email"
            className="editorial-input"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loginMutation.isPending}
            required
          />
        </div>

        <div>
          <label className="editorial-label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="editorial-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loginMutation.isPending}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '6px', padding: '12px' }}
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? 'Signing in...' : 'Sign in to Console'}
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
        Don't have an account?{' '}
        <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
          Create an account
        </Link>
      </div>
    </div>
  );
};
