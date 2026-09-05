export type UserRole =
  'Employee' | 'HR Manager' | 'HR Payroll User' | 'HR Payroll Manager' | 'Admin';

// Role hierarchy / permissions map matching the PeoplePay360 specification
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  Employee: [
    'employee.self.read',
    'attendance.self.create',
    'attendance.self.read',
    'timeoff.self.create',
    'timeoff.self.read',
    'payslip.self.read',
    'contracts.read',
    'employee.read',
  ],
  'HR Manager': [
    // HR Manager has full CRUD on Employees, Attendance, Contracts, Working Schedules, Time Off
    'employee.read',
    'employee.write',
    'employee.delete',
    'attendance.read',
    'attendance.write',
    'attendance.delete',
    'contracts.read',
    'contracts.write',
    'contracts.delete',
    'schedules.read',
    'schedules.write',
    'schedules.delete',
    'timeoff.read',
    'timeoff.write',
    'timeoff.approve',
  ],
  'HR Payroll User': [
    // All HR Manager permissions
    'employee.read',
    'employee.write',
    'employee.delete',
    'attendance.read',
    'attendance.write',
    'attendance.delete',
    'contracts.read',
    'contracts.write',
    'contracts.delete',
    'schedules.read',
    'schedules.write',
    'schedules.delete',
    'timeoff.read',
    'timeoff.write',
    'timeoff.approve',
    // Payrun & payslip CRU
    'payroll.payrun.read',
    'payroll.payrun.create',
    'payroll.payrun.update',
    'payroll.payslip.read',
    'payroll.payslip.create',
    'payroll.payslip.update',
    // Read-only salary structure & rules
    'payroll.structure.read',
    'payroll.rule.read',
  ],
  'HR Payroll Manager': [
    // Full HR and Payroll permissions including full CRUD on Structures & Rules
    'employee.read',
    'employee.write',
    'employee.delete',
    'attendance.read',
    'attendance.write',
    'attendance.delete',
    'contracts.read',
    'contracts.write',
    'contracts.delete',
    'schedules.read',
    'schedules.write',
    'schedules.delete',
    'timeoff.read',
    'timeoff.write',
    'timeoff.approve',
    'payroll.payrun.read',
    'payroll.payrun.create',
    'payroll.payrun.update',
    'payroll.payrun.delete',
    'payroll.payslip.read',
    'payroll.payslip.create',
    'payroll.payslip.update',
    'payroll.payslip.delete',
    'payroll.structure.read',
    'payroll.structure.write',
    'payroll.structure.delete',
    'payroll.rule.read',
    'payroll.rule.write',
    'payroll.rule.delete',
    'reporting.read',
  ],
  Admin: ['*'], // Wildcard: full access
};

export const hasPermission = (role: UserRole, permission: string): boolean => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes('*') || permissions.includes(permission);
};

export const hasAnyPermission = (role: UserRole, permissionsToCheck: string[]): boolean => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return (
    permissions.includes('*') ||
    permissionsToCheck.some((permission) => permissions.includes(permission))
  );
};
