import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCurrentUser, type UserRole } from '@/features/auth/queries/useAuth';
import { getDefaultPathForRole } from '@/lib/permissions';

type ProtectedRouteProps = {
  allow?: (role: UserRole) => boolean;
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allow }) => {
  const { data: user, isLoading } = useCurrentUser();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-ink-soft">Loading session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allow && !allow(user.role)) {
    return <Navigate to={getDefaultPathForRole(user.role)} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
