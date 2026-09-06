import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { useCurrentUser } from '../queries/useAuth';
import { getDefaultPathForRole } from '@/lib/permissions';

export const LoginPage: React.FC = () => {
  const { data: user, isLoading, isError } = useCurrentUser();

  if (isLoading) {
    return null;
  }

  if (user && !isError) {
    return <Navigate to={getDefaultPathForRole(user.role)} replace />;
  }
  return (
    <div className="min-h-screen flex flex-col bg-bg text-ink">
      <header className="border-b border-line px-4 sm:px-8 py-3.5 sm:py-4 flex justify-between items-center bg-bg">
        <Link
          to="/"
          className="font-serif text-lg sm:text-xl font-bold tracking-tight text-ink no-underline"
        >
          PeoplePay<span className="text-accent">360</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-3.5 sm:p-8">
        <LoginForm />
      </main>

      <footer className="border-t border-line py-4 px-4 text-center text-xs text-ink-soft">
        PeoplePay360 — Integrated HR & Payroll Operations Platform
      </footer>
    </div>
  );
};
