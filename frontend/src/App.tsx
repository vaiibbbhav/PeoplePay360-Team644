import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeeDashboardPage } from './features/employee/pages/EmployeeDashboardPage';
import { EmployeeAttendancePage } from './features/employee/pages/EmployeeAttendancePage';
import { AttendanceTerminalPage } from './features/attendance/pages/AttendanceTerminalPage';
import { UserManagementPage } from './features/users/pages/UserManagementPage';
import { EmployeeDirectoryPage } from './features/employees/pages/EmployeeDirectoryPage';
import { EmployeeProfilePage } from './features/employees/pages/EmployeeProfilePage';

import { CompensationPage } from './features/compensation/pages/CompensationPage';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/employee/dashboard" element={<EmployeeDashboardPage />} />
          <Route path="/employee/attendance" element={<EmployeeAttendancePage />} />
          <Route path="/attendance" element={<AttendanceTerminalPage />} />
          <Route path="/users" element={<UserManagementPage />} />
          <Route path="/compensation" element={<CompensationPage />} />
          <Route path="/payslips" element={<CompensationPage />} />
          <Route path="/employees" element={<EmployeeDirectoryPage />} />
          <Route path="/employees/:id" element={<EmployeeProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
