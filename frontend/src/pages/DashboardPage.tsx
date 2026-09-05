import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useCurrentUser } from '@/features/auth/queries/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmployeeDashboardView } from '@/features/dashboard/components/EmployeeDashboardView';
import { HrManagerDashboardView } from '@/features/dashboard/components/HrManagerDashboardView';
import { PayrollDashboardView } from '@/features/dashboard/components/PayrollDashboardView';
import { AdminDashboardView } from '@/features/dashboard/components/AdminDashboardView';

export const DashboardPage: React.FC = () => {
  const { section } = useParams<{ section?: string }>();
  const { data: user, isLoading } = useCurrentUser();

  // Smooth scroll to matching module section if path has section param
  useEffect(() => {
    if (section) {
      const el = document.getElementById(section);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [section]);

  if (isLoading || !user) {
    return null; // AppLayout or parent suspense handles loading spinner
  }

  // Render dedicated role dashboard
  const renderDashboardContent = () => {
    switch (user.role) {
      case 'Employee':
        return <EmployeeDashboardView user={user} section={section} />;
      case 'HR Manager':
        return <HrManagerDashboardView user={user} />;
      case 'HR Payroll User':
      case 'HR Payroll Manager':
        return <PayrollDashboardView user={user} />;
      case 'Admin':
        return <AdminDashboardView user={user} />;
      default:
        return <EmployeeDashboardView user={user} section={section} />;
    }
  };

  const pageTitle =
    user.role === 'Employee'
      ? 'Employee Portal'
      : user.role === 'HR Manager'
        ? 'HR Operations'
        : user.role === 'Admin'
          ? 'System Admin'
          : 'Payroll Console';

  return <AppLayout title={pageTitle}>{renderDashboardContent()}</AppLayout>;
};

export default DashboardPage;
