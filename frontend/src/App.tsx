import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { VerifyEmailPage } from './features/auth/pages/VerifyEmailPage';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeeAttendancePage } from './features/employee/pages/EmployeeAttendancePage';
import { UserManagementPage } from './features/users/pages/UserManagementPage';
import { EmployeeDirectoryPage } from './features/employees/pages/EmployeeDirectoryPage';
import { EmployeeProfilePage } from './features/employees/pages/EmployeeProfilePage';
import { CompensationPage } from './features/compensation/pages/CompensationPage';
import { PayslipViewPage } from './features/compensation/pages/PayslipViewPage';
import { DocumentsPage } from './features/documents/pages/DocumentsPage';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/attendance" element={<EmployeeAttendancePage />} />
          <Route path="/employee/dashboard" element={<Navigate to="/dashboard" replace />} />
          <Route path="/employee/attendance" element={<Navigate to="/attendance" replace />} />
          <Route path="/users" element={<UserManagementPage />} />
          <Route path="/compensation" element={<CompensationPage />} />
          <Route path="/payslips" element={<CompensationPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/policies" element={<DocumentsPage />} />
          <Route path="/payslip/:id" element={<PayslipViewPage />} />
          <Route path="/employees" element={<EmployeeDirectoryPage />} />
          <Route path="/employees/:id" element={<EmployeeProfilePage />} />
          <Route path="/profile" element={<EmployeeProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
