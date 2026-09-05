import React from 'react';
import { Link } from 'react-router-dom';
import { RegisterForm } from '../components/RegisterForm';

export const RegisterPage: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        borderBottom: '1px solid var(--line)',
        padding: '18px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--bg)',
      }}>
        <Link to="/" style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '21px',
          fontWeight: 700,
          textDecoration: 'none',
          color: 'var(--ink)',
        }}>
          PeoplePay<span style={{ color: 'var(--accent)' }}>360</span>
        </Link>
        <Link to="/" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '13.5px' }}>
          Back to Overview
        </Link>
      </header>

      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 20px',
      }}>
        <RegisterForm />
      </main>

      <footer style={{
        borderTop: '1px solid var(--line)',
        padding: '20px 32px',
        textAlign: 'center',
        fontSize: '13px',
        color: 'var(--ink-soft)',
      }}>
        PeoplePay360 — Integrated HR & Payroll Operations Platform
      </footer>
    </div>
  );
};
