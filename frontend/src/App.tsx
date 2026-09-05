import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Lazy-loaded page components for optimal bundle splitting
const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const VerifyEmailPage = lazy(() => import('./features/auth/pages/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const EmployeeAttendancePage = lazy(() => import('./features/employee/pages/EmployeeAttendancePage').then((m) => ({ default: m.EmployeeAttendancePage })));
const AttendanceRecordsPage = lazy(() => import('./features/attendance/pages/AttendanceRecordsPage').then((m) => ({ default: m.AttendanceRecordsPage })));
const AttendanceTerminalPage = lazy(() => import('./features/attendance/pages/AttendanceTerminalPage').then((m) => ({ default: m.AttendanceTerminalPage })));
const UserManagementPage = lazy(() => import('./features/users/pages/UserManagementPage').then((m) => ({ default: m.UserManagementPage })));
const EmployeeDirectoryPage = lazy(() => import('./features/employees/pages/EmployeeDirectoryPage').then((m) => ({ default: m.EmployeeDirectoryPage })));
const EmployeeProfilePage = lazy(() => import('./features/employees/pages/EmployeeProfilePage').then((m) => ({ default: m.EmployeeProfilePage })));
const CompensationPage = lazy(() => import('./features/compensation/pages/CompensationPage').then((m) => ({ default: m.CompensationPage })));
const PayslipViewPage = lazy(() => import('./features/compensation/pages/PayslipViewPage').then((m) => ({ default: m.PayslipViewPage })));
const DocumentsPage = lazy(() => import('./features/documents/pages/DocumentsPage').then((m) => ({ default: m.DocumentsPage })));
const OrgViewPage = lazy(() => import('./features/organization/pages/OrgViewPage').then((m) => ({ default: m.OrgViewPage })));
const ContractsPage = lazy(() => import('./features/contracts/pages/ContractsPage').then((m) => ({ default: m.ContractsPage })));
const SchedulesPage = lazy(() => import('./features/schedules/pages/SchedulesPage').then((m) => ({ default: m.SchedulesPage })));
const TimeOffPage = lazy(() => import('./features/timeoff/pages/TimeOffPage').then((m) => ({ default: m.TimeOffPage })));
const PayrunsPage = lazy(() => import('./features/payroll/pages/PayrunsPage').then((m) => ({ default: m.PayrunsPage })));
const PayslipsPage = lazy(() => import('./features/payroll/pages/PayslipsPage').then((m) => ({ default: m.PayslipsPage })));

function RouteLoadingFallback() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <span className="text-xs text-ink-soft tracking-wider uppercase font-mono">Loading...</span>
      </div>
    </div>
  );
}

type UserRole = 'Employee' | 'HR Manager' | 'HR Payroll User' | 'HR Payroll Manager' | 'Admin';

const canAccessPayroll = (role: UserRole) =>
  role === 'Admin' || role === 'HR Payroll Manager' || role === 'HR Payroll User';

const canAccessPayslips = (role: UserRole) =>
  role === 'Admin' ||
  role === 'HR Payroll Manager' ||
  role === 'HR Payroll User' ||
  role === 'HR Manager';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Protected routes — all authenticated users */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/:section" element={<DashboardPage />} />
            <Route path="/employee/dashboard" element={<DashboardPage />} />
            <Route path="/employee/dashboard/:section" element={<DashboardPage />} />
            <Route path="/attendance" element={<AttendanceRecordsPage />} />
            <Route path="/employee/attendance" element={<EmployeeAttendancePage />} />
            <Route path="/attendance/terminal" element={<AttendanceTerminalPage />} />
            <Route path="/time-off" element={<TimeOffPage />} />
            <Route path="/employee/time-off" element={<TimeOffPage />} />
            <Route path="/timeoff" element={<TimeOffPage />} />
            <Route path="/leaves" element={<TimeOffPage />} />
            <Route path="/compensation" element={<CompensationPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/policies" element={<DocumentsPage />} />
            <Route path="/employee/docs" element={<DocumentsPage />} />
            <Route path="/employee/documents" element={<DocumentsPage />} />
            <Route path="/employee/org-view" element={<OrgViewPage />} />
            <Route path="/org-view" element={<OrgViewPage />} />
            <Route path="/organization" element={<OrgViewPage />} />
            <Route path="/payslip/:id" element={<PayslipViewPage />} />
            <Route path="/contracts" element={<ContractsPage />} />
            <Route path="/schedules" element={<SchedulesPage />} />
            <Route path="/working-schedules" element={<SchedulesPage />} />
            <Route path="/employees" element={<EmployeeDirectoryPage />} />
            <Route path="/employee/profile" element={<EmployeeProfilePage />} />
            <Route path="/employees/:id" element={<EmployeeProfilePage />} />
            <Route path="/profile" element={<EmployeeProfilePage />} />
            <Route path="/employee/:id" element={<EmployeeProfilePage />} />
            {/* Analytics alias: redirect to dashboard */}
            <Route path="/analytics" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Payslips registry — HR Manager, Payroll roles, Admin */}
          <Route element={<ProtectedRoute allow={canAccessPayslips} />}>
            <Route path="/payslips" element={<PayslipsPage />} />
          </Route>

          {/* Payroll routes — payroll roles + admin only */}
          <Route element={<ProtectedRoute allow={canAccessPayroll} />}>
            <Route path="/payruns" element={<PayrunsPage />} />
          </Route>

          {/* Admin only route */}
          <Route element={<ProtectedRoute allow={(role) => role === 'Admin'} />}>
            <Route path="/users" element={<UserManagementPage />} />
          </Route>

          {/* Fallback: send unauthenticated users to login, authenticated to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </QueryClientProvider>
);
}

export default App;
