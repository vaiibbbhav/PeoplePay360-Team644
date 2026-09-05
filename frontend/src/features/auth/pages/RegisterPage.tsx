import React from 'react';
import { Link } from 'react-router-dom';
import { RegisterForm } from '../components/RegisterForm';

export const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-ink">
      <header className="border-b border-line px-8 py-4 flex justify-between items-center bg-bg">
        <Link
          to="/"
          className="font-serif text-xl font-bold tracking-tight text-ink no-underline"
        >
          PeoplePay<span className="text-accent">360</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <RegisterForm />
      </main>

      <footer className="border-t border-line py-5 px-8 text-center text-xs text-ink-soft">
        PeoplePay360 — Integrated HR & Payroll Operations Platform
      </footer>
    </div>
  );
};
