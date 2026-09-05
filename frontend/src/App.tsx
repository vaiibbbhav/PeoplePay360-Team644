import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { VerifyEmailPage } from './features/auth/pages/VerifyEmailPage';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeeAttendancePage } from './features/employee/pages/EmployeeAttendancePage';
import { AttendanceRecordsPage } from './features/attendance/pages/AttendanceRecordsPage';
import { AttendanceTerminalPage } from './features/attendance/pages/AttendanceTerminalPage';
import { UserManagementPage } from './features/users/pages/UserManagementPage';
import { EmployeeDirectoryPage } from './features/employees/pages/EmployeeDirectoryPage';
import { EmployeeProfilePage } from './features/employees/pages/EmployeeProfilePage';
import { CompensationPage } from './features/compensation/pages/CompensationPage';
import { PayslipViewPage } from './features/compensation/pages/PayslipViewPage';
import { DocumentsPage } from './features/documents/pages/DocumentsPage';
import { OrgViewPage } from './features/organization/pages/OrgViewPage';
import { ContractsPage } from './features/contracts/pages/ContractsPage';
import { SchedulesPage } from './features/schedules/pages/SchedulesPage';
import { TimeOffPage } from './features/timeoff/pages/TimeOffPage';
import { PayrunsPage } from './features/payroll/pages/PayrunsPage';
import { PayslipsPage } from './features/payroll/pages/PayslipsPage';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

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
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Protected routes — all authenticated users */}
          <Route element={<ProtectedRoute />}>
            {/* Dashboard & Portals */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/:section" element={<DashboardPage />} />
            <Route path="/employee/dashboard" element={<Navigate to="/dashboard" replace />} />
            <Route path="/employee/dashboard/:section" element={<Navigate to="/dashboard" replace />} />
            <Route path="/analytics" element={<Navigate to="/dashboard" replace />} />

            {/* Attendance */}
            <Route path="/attendance" element={<AttendanceRecordsPage />} />
            <Route path="/attendance/terminal" element={<AttendanceTerminalPage />} />
            <Route path="/employee/attendance" element={<EmployeeAttendancePage />} />

            {/* Time Off */}
            <Route path="/time-off" element={<TimeOffPage />} />
            <Route path="/timeoff" element={<Navigate to="/time-off" replace />} />
            <Route path="/leaves" element={<Navigate to="/time-off" replace />} />
            <Route path="/employee/time-off" element={<Navigate to="/time-off" replace />} />

            {/* Compensation & Individual Payslip View */}
            <Route path="/compensation" element={<CompensationPage />} />
            <Route path="/payslip/:id" element={<PayslipViewPage />} />

            {/* Documents & Policies */}
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/policies" element={<Navigate to="/documents" replace />} />
            <Route path="/employee/docs" element={<Navigate to="/documents" replace />} />
            <Route path="/employee/documents" element={<Navigate to="/documents" replace />} />

            {/* Organization Chart */}
            <Route path="/organization" element={<OrgViewPage />} />
            <Route path="/org-view" element={<OrgViewPage />} />
            <Route path="/employee/org-view" element={<Navigate to="/org-view" replace />} />

            {/* Contracts & Work Schedules */}
            <Route path="/contracts" element={<ContractsPage />} />
            <Route path="/schedules" element={<SchedulesPage />} />
            <Route path="/working-schedules" element={<Navigate to="/schedules" replace />} />

            {/* Employees */}
            <Route path="/employees" element={<EmployeeDirectoryPage />} />
            <Route path="/employees/:id" element={<EmployeeProfilePage />} />
            <Route path="/employee/profile" element={<EmployeeProfilePage />} />
            <Route path="/profile" element={<EmployeeProfilePage />} />
            <Route path="/employee/:id" element={<EmployeeProfilePage />} />
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
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
