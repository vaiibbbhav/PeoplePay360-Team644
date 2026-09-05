import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { VerifyEmailPage } from './features/auth/pages/VerifyEmailPage';
import { DashboardPage } from './pages/DashboardPage';
import { UserManagementPage } from './features/users/pages/UserManagementPage';
import { AppLayout } from './components/layout/AppLayout';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Protected routes — all rendered inside the sidebar shell */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/users" element={<UserManagementPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
