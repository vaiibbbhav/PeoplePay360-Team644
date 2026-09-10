import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Lazy-loaded page components for optimal bundle splitting
const LandingPage = lazy(() =>
  import('./features/landing/pages/LandingPage').then((m) => ({ default: m.LandingPage })),
);
const LoginPage = lazy(() =>
  import('./features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const VerifyEmailPage = lazy(() =>
  import('./features/auth/pages/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })),
);
const ForgotPasswordPage = lazy(() =>
  import('./features/auth/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
);
const ResetPasswordPage = lazy(() =>
  import('./features/auth/pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
);
const DashboardPage = lazy(() =>
  import('./features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const EmployeeAttendancePage = lazy(() =>
  import('./features/attendance/pages/EmployeeAttendancePage').then((m) => ({
    default: m.EmployeeAttendancePage,
  })),
);
const AttendanceRecordsPage = lazy(() =>
  import('./features/attendance/pages/AttendanceRecordsPage').then((m) => ({
    default: m.AttendanceRecordsPage,
  })),
);
const AttendanceTerminalPage = lazy(() =>
  import('./features/attendance/pages/AttendanceTerminalPage').then((m) => ({
    default: m.AttendanceTerminalPage,
  })),
);

const UserManagementPage = lazy(() =>
  import('./features/users/pages/UserManagementPage').then((m) => ({
    default: m.UserManagementPage,
  })),
);
const EmployeeDirectoryPage = lazy(() =>
  import('./features/employees/pages/EmployeeDirectoryPage').then((m) => ({
    default: m.EmployeeDirectoryPage,
  })),
);
const EmployeeProfilePage = lazy(() =>
  import('./features/employees/pages/EmployeeProfilePage').then((m) => ({
    default: m.EmployeeProfilePage,
  })),
);
const CompensationPage = lazy(() =>
  import('./features/compensation/pages/CompensationPage').then((m) => ({
    default: m.CompensationPage,
  })),
);
const PayslipViewPage = lazy(() =>
  import('./features/compensation/pages/PayslipViewPage').then((m) => ({
    default: m.PayslipViewPage,
  })),
);
const DocumentsPage = lazy(() =>
  import('./features/documents/pages/DocumentsPage').then((m) => ({ default: m.DocumentsPage })),
);
const OrgViewPage = lazy(() =>
  import('./features/organization/pages/OrgViewPage').then((m) => ({ default: m.OrgViewPage })),
);
const ContractsPage = lazy(() =>
  import('./features/contracts/pages/ContractsPage').then((m) => ({ default: m.ContractsPage })),
);
const SchedulesPage = lazy(() =>
  import('./features/schedules/pages/SchedulesPage').then((m) => ({ default: m.SchedulesPage })),
);
const TimeOffPage = lazy(() =>
  import('./features/timeoff/pages/TimeOffPage').then((m) => ({ default: m.TimeOffPage })),
);
const PayrunsPage = lazy(() =>
  import('./features/payroll/pages/PayrunsPage').then((m) => ({ default: m.PayrunsPage })),
);
const PayslipsPage = lazy(() =>
  import('./features/payroll/pages/PayslipsPage').then((m) => ({ default: m.PayslipsPage })),
);
const SalaryStructuresPage = lazy(() =>
  import('./features/payroll/pages/SalaryStructuresPage').then((m) => ({
    default: m.SalaryStructuresPage,
  })),
);

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
  role === 'Admin' || role === 'HR Payroll Manager' || role === 'HR Payroll User';

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
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected routes — all authenticated users */}
            <Route element={<ProtectedRoute />}>
              {/* Dashboard */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/dashboard/:section" element={<DashboardPage />} />

              {/* Attendance */}
              <Route path="/attendance" element={<AttendanceRecordsPage />} />
              <Route path="/attendance/terminal" element={<AttendanceTerminalPage />} />
              <Route path="/attendance/my" element={<EmployeeAttendancePage />} />

              {/* Time Off */}
              <Route path="/time-off" element={<TimeOffPage />} />

              {/* Compensation & Individual Payslip View */}
              <Route path="/compensation" element={<CompensationPage />} />
              <Route path="/payslip/:id" element={<PayslipViewPage />} />

              {/* Documents & Policies */}
              <Route path="/documents" element={<DocumentsPage />} />

              {/* Organization Chart */}
              <Route path="/organization" element={<OrgViewPage />} />

              {/* Contracts & Work Schedules */}
              <Route path="/contracts" element={<ContractsPage />} />
              <Route path="/schedules" element={<SchedulesPage />} />

              {/* Employees */}
              <Route path="/employees" element={<EmployeeDirectoryPage />} />
              <Route path="/employees/:id" element={<EmployeeProfilePage />} />
            </Route>

            {/* Payslips registry — HR Manager, Payroll roles, Admin */}
            <Route element={<ProtectedRoute allow={canAccessPayslips} />}>
              <Route path="/payslips" element={<PayslipsPage />} />
            </Route>

            {/* Payroll routes — payroll roles + admin only */}
            <Route element={<ProtectedRoute allow={canAccessPayroll} />}>
              <Route path="/payruns" element={<PayrunsPage />} />
              <Route path="/salary-structures" element={<SalaryStructuresPage />} />
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
