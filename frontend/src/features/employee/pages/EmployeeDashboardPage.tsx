import React from 'react';
import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCurrentUser, type User } from '@/features/auth/queries/useAuth';
import { EmployeeDashboardView } from '@/features/dashboard/components/EmployeeDashboardView';

export const EmployeeDashboardPage: React.FC = () => {
  const { section } = useParams<{ section?: string }>();
  const { data: user } = useCurrentUser();

  const currentUser: User = user || {
    id: 'emp-session',
    firstName: 'Employee',
    lastName: 'User',
    email: 'employee@peoplepay360.com',
    role: 'Employee',
    employeeId: 'emp-001',
    employeeCode: null,
    employee: {
      id: 'emp-001',
      firstName: 'Employee',
      lastName: 'User',
      email: 'employee@peoplepay360.com',
    },
  };

  return (
    <AppLayout title="Employee Portal">
      <EmployeeDashboardView user={currentUser} section={section} />
    </AppLayout>
  );
};

export default EmployeeDashboardPage;
