import type { UserRole } from '../features/auth/queries/useAuth';

export function getDefaultPathForRole(role: UserRole): string {
  switch (role) {
    case 'Admin':
    case 'Employee':
    case 'HR Manager':
    case 'HR Payroll Manager':
    case 'HR Payroll User':
      return '/dashboard';
    default:
      return '/';
  }
}
