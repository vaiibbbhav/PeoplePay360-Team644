import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser, useLogout } from '../features/auth/queries/useAuth';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: user, isLoading, isError } = useCurrentUser();
  const logout = useLogout();

  if (isLoading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--ink-soft)' }}>
        Loading session...
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <p style={{ color: 'var(--over-red)' }}>Session expired or user not found.</p>
        <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ marginTop: '16px' }}>
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Console Navigation */}
      <header style={{
        borderBottom: '1px solid var(--line)',
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--bg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--ink)',
          }}>
            PeoplePay<span style={{ color: 'var(--accent)' }}>360</span>
          </span>
          <span style={{
            fontSize: '12px',
            padding: '3px 8px',
            borderRadius: '4px',
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            fontWeight: 600,
          }}>
            {user.role}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px', color: 'var(--ink-soft)' }}>
            {user.email}
          </span>
          <button onClick={logout} className="btn btn-ghost" style={{ padding: '7px 14px', fontSize: '13px' }}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="wrap" style={{ flex: 1, padding: '40px 32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>
            Welcome, {user.employee?.firstName || user.email.split('@')[0]}
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '15px', margin: 0 }}>
            Operational Command Center · Role: <b>{user.role}</b>
          </p>
        </div>

        {/* Action Modules Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
          marginBottom: '40px',
        }}>
          {[
            {
              title: 'Employee Master',
              desc: 'Central employee profiles, departments, and working schedules.',
              tag: 'Core HR',
            },
            {
              title: 'Contract Management',
              desc: 'Period-active compensation contracts and wage structures.',
              tag: 'Contracts',
            },
            {
              title: 'Attendance & Punches',
              desc: 'Check-in, check-out logs, and manual exception reviews.',
              tag: 'Operations',
            },
            {
              title: 'Time Off & Balances',
              desc: 'Leave allocations, employee requests, and approval actions.',
              tag: 'Leaves',
            },
            {
              title: 'Payrun Wizard',
              desc: 'Initiate batch payruns, compute salary rules, and validate slips.',
              tag: 'Payroll',
            },
            {
              title: 'Live Payroll Analytics',
              desc: 'Department salary distributions, KPI cards, and anomaly warnings.',
              tag: 'Reporting',
            },
          ].map((card) => (
            <div
              key={card.title}
              style={{
                border: '1px solid var(--line)',
                borderRadius: '12px',
                padding: '24px',
                background: 'var(--bg-raised)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}>
                  {card.tag}
                </span>
                <h3 style={{ fontSize: '18px', margin: '8px 0', fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600 }}>
                  {card.title}
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)', margin: 0, lineHeight: 1.5 }}>
                  {card.desc}
                </p>
              </div>
              <div style={{ marginTop: '20px' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--accent)', fontWeight: 500 }}>
                  Ready in module →
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Profile Card */}
        <div style={{
          border: '1px solid var(--line)',
          borderRadius: '12px',
          padding: '28px',
          background: 'var(--bg)',
        }}>
          <h3 style={{ fontSize: '19px', marginBottom: '16px' }}>Current Session Details</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            fontSize: '14px',
          }}>
            <div>
              <span style={{ color: 'var(--ink-soft)', display: 'block', fontSize: '12.5px' }}>User ID</span>
              <span style={{ fontFamily: 'monospace' }}>{user.id}</span>
            </div>
            <div>
              <span style={{ color: 'var(--ink-soft)', display: 'block', fontSize: '12.5px' }}>Assigned Role</span>
              <b>{user.role}</b>
            </div>
            <div>
              <span style={{ color: 'var(--ink-soft)', display: 'block', fontSize: '12.5px' }}>Linked Employee ID</span>
              <span style={{ fontFamily: 'monospace' }}>{user.employeeId || 'None (System Admin)'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--ink-soft)', display: 'block', fontSize: '12.5px' }}>Auth Status</span>
              <span style={{ color: 'var(--accent)', fontWeight: 500 }}>Authenticated (JWT)</span>
            </div>
          </div>
        </div>
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
