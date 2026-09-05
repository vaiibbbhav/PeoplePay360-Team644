import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from './errors';

export type UserRole =
  'Employee' | 'HR Manager' | 'HR Payroll User' | 'HR Payroll Manager' | 'Admin';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  employeeId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'peoplepay360-hackathon-super-secret-jwt-key';

// Role hierarchy / permissions map
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  Employee: [
    'employee.self.read',
    'attendance.self.create',
    'attendance.self.read',
    'timeoff.self.create',
    'timeoff.self.read',
    'payslip.self.read',
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

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw new UnauthorizedError('No authentication token provided');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const userRole = req.user.role;
    const permissions = ROLE_PERMISSIONS[userRole] || [];

    if (permissions.includes('*') || permissions.includes(permission)) {
      return next();
    }

    throw new ForbiddenError(`Insufficient permissions: requires '${permission}'`);
  };
};

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    if (req.user.role === 'Admin' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    throw new ForbiddenError(`Role '${req.user.role}' does not have access`);
  };
};
