import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div>
      {/* ---------- Sticky Nav ---------- */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'color-mix(in srgb, var(--bg) 88%, transparent)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--line)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 32px',
          maxWidth: '1120px',
          margin: '0 auto',
        }}>
          <a href="#top" style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '21px',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            textDecoration: 'none',
            color: 'var(--ink)',
          }}>
            PeoplePay<span style={{ color: 'var(--accent)' }}>360</span>
          </a>

          <nav style={{
            display: 'flex',
            gap: '28px',
            fontSize: '14.5px',
            color: 'var(--ink-soft)',
            alignItems: 'center',
          }}>
            <a href="#modules" style={{ textDecoration: 'none' }}>Modules</a>
            <a href="#flow" style={{ textDecoration: 'none' }}>Flow</a>
            <a href="#validation" style={{ textDecoration: 'none' }}>Validation Engine</a>
            <a href="#roles" style={{ textDecoration: 'none' }}>Roles</a>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              style={{
                width: '42px',
                height: '24px',
                borderRadius: '100px',
                border: '1px solid var(--line)',
                background: 'var(--bg-raised)',
                position: 'relative',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <span style={{
                position: 'absolute',
                top: '2px',
                left: '2px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'var(--accent)',
                transform: isDark ? 'translateX(18px)' : 'translateX(0)',
                transition: 'transform 0.25s ease',
                display: 'block',
              }} />
            </button>

            <Link to="/login" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '13.5px' }}>
              Sign in
            </Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13.5px' }}>
              Register
            </Link>
          </div>
        </div>
      </header>

      <main id="top">
        {/* ---------- HERO ---------- */}
        <section style={{ padding: '88px 0 64px', borderBottom: '1px solid var(--line)' }}>
          <div className="wrap" style={{
            display: 'grid',
            gridTemplateColumns: '1.15fr 0.85fr',
            gap: '56px',
            alignItems: 'end',
          }}>
            <div>
              <div style={{
                fontSize: '14px',
                color: 'var(--ink-soft)',
                marginBottom: '20px',
                letterSpacing: '0.02em',
              }}>
                Past fragmented HR records, for real operational enterprise teams.
              </div>
              <h1 style={{ fontSize: '54px', maxWidth: '16ch', lineHeight: 1.1 }}>
                An HR & Payroll engine that <span style={{ color: 'var(--accent)' }}>unifies, computes,</span> and reconciles itself.
              </h1>
              <p style={{
                marginTop: '24px',
                fontSize: '17px',
                color: 'var(--ink-soft)',
                maxWidth: '46ch',
                lineHeight: 1.6,
              }}>
                Employee master records, period-specific contracts, attendance exceptions, and sequential salary rule engines unified on a single ledger.
              </p>
              <div style={{ marginTop: '32px', display: 'flex', gap: '14px', alignItems: 'center' }}>
                <a href="#flow" className="btn btn-primary">
                  See the full flow
                </a>
                <Link to="/login" className="btn btn-ghost">
                  Access Console
                </Link>
              </div>
            </div>

            {/* Hero Flow Mini Panel */}
            <div style={{
              border: '1px solid var(--line)',
              borderRadius: '14px',
              padding: '28px',
              background: 'var(--bg-raised)',
            }}>
              <div style={{ fontSize: '13px', color: 'var(--ink-soft)', marginBottom: '18px' }}>
                Employee to payslip, one connected flow
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[
                  { title: 'Employee Profile & Schedule Assigned', sub: 'Master identity, department, working hours', filled: true },
                  { title: 'Active Period Contract Bound', sub: 'Period-matched wage & salary structure', filled: true },
                  { title: 'Attendance & Leave Exceptions Logged', sub: 'Punches, manual edits, allocation deductions', filled: true },
                  { title: 'Salary Rules Evaluated in Sequence', sub: 'Basic → Allowances → Gross → Deductions → Net', filled: true },
                  { title: 'Payrun Validated, Paid & Dispatched', sub: 'PDF payslips generated & emailed', filled: false },
                ].map((step, idx, arr) => (
                  <div
                    key={step.title}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      padding: '11px 0',
                      position: 'relative',
                    }}
                  >
                    {idx !== arr.length - 1 && (
                      <div style={{
                        position: 'absolute',
                        left: '5px',
                        top: '28px',
                        width: '1px',
                        height: '24px',
                        background: 'var(--line)',
                      }} />
                    )}
                    <div style={{
                      width: '11px',
                      height: '11px',
                      borderRadius: '50%',
                      border: '1.5px solid var(--accent)',
                      background: step.filled ? 'var(--accent)' : 'transparent',
                      marginTop: '5px',
                      flexShrink: 0,
                    }} />
                    <div>
                      <span style={{ fontSize: '14.5px', fontWeight: 500 }}>{step.title}</span>
                      <small style={{ color: 'var(--ink-soft)', fontSize: '12.5px', display: 'block', marginTop: '2px' }}>
                        {step.sub}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---------- PROBLEM SECTION ---------- */}
        <section style={{ padding: '80px 0', borderBottom: '1px solid var(--line)' }}>
          <div className="wrap">
            <div style={{ maxWidth: '56ch', marginBottom: '44px' }}>
              <h2 style={{ fontSize: '32px' }}>Most basic HR tools stop at isolated CRUD tables.</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)', marginBottom: '10px' }}>
                  The basics fall short
                </div>
                <p style={{ color: 'var(--ink-soft)', fontSize: '15.5px', margin: 0, lineHeight: 1.6 }}>
                  An employee accumulates multiple historical contracts, but payroll accidentally pulls an outdated wage. Working hours mismatch schedule templates, leave requests get approved without allocation balance deductions, and manual attendance edits slip through unnoticed.
                </p>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)', marginBottom: '10px' }}>
                  A unified operational engine instead
                </div>
                <p style={{ color: 'var(--ink-soft)', fontSize: '15.5px', margin: 0, lineHeight: 1.6 }}>
                  Every payroll batch enforces period-specific contract matching. Worked hours compare directly against working schedule lines, approved leaves automatically decrement allocations, and salary rules execute sequentially with full auditability.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- FLOW STRIP ---------- */}
        <section id="flow" style={{ padding: '80px 0', borderBottom: '1px solid var(--line)' }}>
          <div className="wrap">
            <div style={{ maxWidth: '56ch', marginBottom: '44px' }}>
              <h2 style={{ fontSize: '32px' }}>The complete operational lifecycle</h2>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              border: '1px solid var(--line)',
              borderRadius: '14px',
              overflow: 'hidden',
            }}>
              {[
                { fnum: '01. Master Hub', title: 'Employee & Schedule', desc: 'Central profile, department, manager, and weekly shift definition.' },
                { fnum: '02. Contracts', title: 'Period Binding', desc: 'Active contract validity matching the target payroll cycle dates.' },
                { fnum: '03. Operations', title: 'Time & Leave', desc: 'Daily attendance punches, exception reviews, and leave balance deductions.' },
                { fnum: '04. Rule Engine', title: 'Formula Sequence', desc: 'Basic, HRA, PF deductions, and gross-to-net salary computation.' },
                { fnum: '05. Settlement', title: 'Payrun & Payslips', desc: 'Batch review, warning checks, PDF generation, and bulk email distribution.' },
              ].map((cell, i, arr) => (
                <div
                  key={cell.fnum}
                  style={{
                    padding: '24px 20px',
                    borderRight: i !== arr.length - 1 ? '1px solid var(--line)' : 'none',
                    background: 'var(--bg)',
                  }}
                >
                  <div style={{ color: 'var(--accent)', fontSize: '12.5px', fontWeight: 600, marginBottom: '8px' }}>
                    {cell.fnum}
                  </div>
                  <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px', margin: '0 0 6px 0' }}>
                    {cell.title}
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--ink-soft)', margin: 0, lineHeight: 1.5 }}>
                    {cell.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- MODULES GRID ---------- */}
        <section id="modules" style={{ padding: '80px 0', borderBottom: '1px solid var(--line)' }}>
          <div className="wrap">
            <div style={{ maxWidth: '56ch', marginBottom: '44px' }}>
              <h2 style={{ fontSize: '32px' }}>Two sides, one unified data model</h2>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1px',
              background: 'var(--line)',
              border: '1px solid var(--line)',
              borderRadius: '14px',
              overflow: 'hidden',
            }}>
              <div style={{ background: 'var(--bg)', padding: '34px' }}>
                <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600, marginBottom: '16px', display: 'block' }}>
                  Configuration & Policies
                </span>
                <h3 style={{ fontSize: '22px', marginBottom: '20px' }}>HR Backend Management</h3>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {[
                    { label: 'Employee Master', desc: 'Kanban, List, and Form views with departmental hierarchy.' },
                    { label: 'Contract History', desc: 'Wage tiers, wage types, and historical agreement archives.' },
                    { label: 'Working Schedules', desc: 'Weekly shift blocks, break rules, and auto-computed weekly hours.' },
                    { label: 'Time Off Types', desc: 'Paid/unpaid policies, day/hour units, and approval workflows.' },
                    { label: 'Salary Structures', desc: 'Containers grouping ordered salary rules for execution.' },
                    { label: 'Salary Rule Engine', desc: 'Fixed, percentage-of-code, and dynamic formula calculations.' },
                  ].map((item, idx) => (
                    <li
                      key={item.label}
                      style={{
                        padding: '12px 0',
                        borderTop: idx !== 0 ? '1px solid var(--line)' : 'none',
                        fontSize: '14.5px',
                        color: 'var(--ink-soft)',
                        display: 'flex',
                        gap: '10px',
                      }}
                    >
                      <b style={{ color: 'var(--ink)', fontWeight: 500, minWidth: '130px' }}>{item.label}</b>
                      <span>{item.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ background: 'var(--bg)', padding: '34px' }}>
                <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600, marginBottom: '16px', display: 'block' }}>
                  Operational Experience
                </span>
                <h3 style={{ fontSize: '22px', marginBottom: '20px' }}>HR & Payroll Operations</h3>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {[
                    { label: 'Employee Hub', desc: 'Smart navigation buttons linking to Attendance, Contracts, and Leaves.' },
                    { label: 'Attendance Review', desc: 'Real-time punch records, worked hours, and manual correction audit logs.' },
                    { label: 'Leave Requests', desc: 'Employee requests with approval/refusal and balance decrementing.' },
                    { label: 'Payrun Wizard', desc: 'Two-step creation: scope & period definition, then eligible staff selection.' },
                    { label: 'Payslip Breakdown', desc: 'Itemized rule calculations (Basic, Allowances, Gross, Deductions, Net).' },
                    { label: 'Payroll Dashboard', desc: 'Aggregated analytics: live KPIs, department salary charts, and warnings.' },
                  ].map((item, idx) => (
                    <li
                      key={item.label}
                      style={{
                        padding: '12px 0',
                        borderTop: idx !== 0 ? '1px solid var(--line)' : 'none',
                        fontSize: '14.5px',
                        color: 'var(--ink-soft)',
                        display: 'flex',
                        gap: '10px',
                      }}
                    >
                      <b style={{ color: 'var(--ink)', fontWeight: 500, minWidth: '130px' }}>{item.label}</b>
                      <span>{item.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- VALIDATION & ANOMALY DIAGNOSTICS ---------- */}
        <section id="validation" style={{ padding: '80px 0', borderBottom: '1px solid var(--line)' }}>
          <div className="wrap">
            <div style={{ maxWidth: '56ch', marginBottom: '44px' }}>
              <h2 style={{ fontSize: '32px' }}>Pre-computation payroll validation</h2>
              <p style={{ marginTop: '12px', color: 'var(--ink-soft)', fontSize: '15.5px' }}>
                Checked line by line prior to final payrun validation, preventing erroneous payouts.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '52px', alignItems: 'start' }}>
              <div>
                <p style={{ color: 'var(--ink-soft)', fontSize: '15.5px', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                  A payrun should never execute blindly. Our system verifies employee master readiness, active period contracts, attendance integrity, and duplicate slip risks.
                </p>
                <div style={{
                  borderLeft: '2px solid var(--accent)',
                  paddingLeft: '18px',
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: 'italic',
                  fontSize: '18px',
                  color: 'var(--ink)',
                  margin: '24px 0',
                }}>
                  "One missing bank routing number or unconfirmed attendance edit flags the payrun before funds are committed."
                </div>
                <p style={{ color: 'var(--ink-soft)', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
                  Officers can inspect anomalies with single-click filtering, update records, and recompute the batch instantly.
                </p>
              </div>

              {/* Validation Card */}
              <div style={{
                border: '1px solid var(--line)',
                borderRadius: '14px',
                padding: '28px',
                background: 'var(--bg-raised)',
              }}>
                <div style={{ fontSize: '13px', color: 'var(--ink-soft)', marginBottom: '20px' }}>
                  Live Payrun Batch Diagnostics · Period: Oct 01 – Oct 31
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                    <span>Active Contract Verification</span>
                    <span style={{ color: 'var(--ink-soft)', fontSize: '12.5px' }}>32 / 32 Valid</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '4px', background: 'var(--line)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '100%', background: 'var(--accent)' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                    <span>Bank Routing Information</span>
                    <span style={{ color: 'var(--over-red)', fontSize: '12.5px', fontWeight: 500 }}>1 Missing</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '4px', background: 'var(--line)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '96%', background: 'var(--over-red)' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                    <span>Attendance Punch Coverage</span>
                    <span style={{ color: 'var(--ink-soft)', fontSize: '12.5px' }}>100% Reconciled</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '4px', background: 'var(--line)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '100%', background: 'var(--accent)' }} />
                  </div>
                </div>

                <div style={{
                  marginTop: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--line)',
                  fontSize: '13.5px',
                  color: 'var(--ink-soft)',
                }}>
                  Batch flagged for audit: <span style={{ color: 'var(--over-red)', fontWeight: 500 }}>Employee #104 (Marcus Vance) requires bank account details before dispatch.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- ROLES SECTION ---------- */}
        <section id="roles" style={{ padding: '80px 0', borderBottom: '1px solid var(--line)' }}>
          <div className="wrap">
            <div style={{ maxWidth: '56ch', marginBottom: '44px' }}>
              <h2 style={{ fontSize: '32px' }}>Five roles, one unified ledger</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '22px' }}>
              {[
                {
                  role: 'Employee',
                  items: ['Self-service portal', 'Check in / check out', 'Submit leave requests', 'Download PDF payslips'],
                },
                {
                  role: 'HR Manager',
                  items: ['Full CRUD on Employees', 'Contract management', 'Approve/refuse time off', 'Attendance manual edits'],
                },
                {
                  role: 'HR Payroll User',
                  items: ['All HR Manager rights', 'Create & execute payruns', 'Generate payslips', 'Read-only salary rules'],
                },
                {
                  role: 'HR Payroll Mgr',
                  items: ['Full platform CRUD', 'Salary rule formulas', 'Bulk email distribution', 'Full payroll history'],
                },
                {
                  role: 'Admin',
                  items: ['System administration', 'User management', 'Role assignments', 'Database audits'],
                },
              ].map((card) => (
                <div key={card.role} style={{
                  border: '1px solid var(--line)',
                  borderRadius: '12px',
                  padding: '22px 18px',
                  background: 'var(--bg)',
                }}>
                  <h4 style={{
                    fontSize: '15.5px',
                    fontWeight: 600,
                    margin: '0 0 12px 0',
                    paddingBottom: '10px',
                    borderBottom: '1px solid var(--line)',
                  }}>
                    {card.role}
                  </h4>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, color: 'var(--ink-soft)', fontSize: '13px' }}>
                    {card.items.map((it) => (
                      <li key={it} style={{ padding: '4px 0', position: 'relative', paddingLeft: '14px' }}>
                        <span style={{
                          position: 'absolute',
                          left: 0,
                          top: '10px',
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: 'var(--accent)',
                        }} />
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- CTA / DELIVERABLES ---------- */}
        <section style={{ padding: '80px 0' }}>
          <div className="wrap" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '60px' }}>
            <div>
              <h2 style={{ fontSize: '32px', maxWidth: '16ch' }}>
                Operational integrity ready for demonstration
              </h2>
              <p style={{ color: 'var(--ink-soft)', marginTop: '16px', maxWidth: '42ch', fontSize: '15.5px', lineHeight: 1.6 }}>
                Real business logic — contract selection, working schedule mathematics, and ordered salary computation — runs in application code.
              </p>
              <div style={{ marginTop: '28px', display: 'flex', gap: '14px' }}>
                <Link to="/register" className="btn btn-primary">
                  Create Platform Account
                </Link>
                <Link to="/login" className="btn btn-ghost">
                  Sign in
                </Link>
              </div>
            </div>

            <div style={{
              border: '1px solid var(--line)',
              borderRadius: '14px',
              padding: '8px 28px',
              background: 'var(--bg-raised)',
            }}>
              {[
                { title: 'Working Full-Stack Platform', desc: 'React 19 + Express + Neon Postgres' },
                { title: 'Live Demonstration Flow', desc: 'Employee to Payslip & Leave Allocation' },
                { title: 'Interactive Wireframe Prototype', desc: 'Excalidraw mockup verified' },
                { title: 'Modular Architecture', desc: '4-layer backend & feature-driven UI' },
              ].map((row, i, arr) => (
                <div
                  key={row.title}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '20px',
                    padding: '16px 0',
                    borderBottom: i !== arr.length - 1 ? '1px solid var(--line)' : 'none',
                    fontSize: '14px',
                  }}
                >
                  <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{row.title}</span>
                  <span style={{ color: 'var(--ink-soft)', textAlign: 'right' }}>{row.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- FOOTER ---------- */}
        <footer style={{
          borderTop: '1px solid var(--line)',
          padding: '36px 0 48px',
        }}>
          <div className="wrap" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '13.5px',
            color: 'var(--ink-soft)',
          }}>
            <span>PeoplePay360 — Integrated HR & Payroll Operations Platform</span>
            <span>Master Data → Contracts → Time Off → Payroll → Reporting</span>
          </div>
        </footer>
      </main>
    </div>
  );
};
