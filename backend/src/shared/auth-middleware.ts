import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from './errors';

export type UserRole =
  'Employee' | 'HR Manager' | 'HR Payroll User' | 'HR Payroll Manager' | 'Admin';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  employeeId?: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters');
  }
  return secret;
};

// Role hierarchy / permissions map
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  Employee: [
    'employee.self.read',
    'attendance.self.create',
    'attendance.self.read',
    'timeoff.self.create',
    'timeoff.self.read',
    'payslip.self.read',
    'contracts.read',
    'employee.read'
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

export const getCookieValue = (req: Request, name: string): string | undefined => {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;
  const match = cookieHeader.split(';').find((c) => c.trim().startsWith(`${name}=`));
  return match ? decodeURIComponent(match.trim().slice(name.length + 1)) : undefined;
};

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const bearerToken = authHeader && authHeader.split(' ')[1];
  const cookieToken = req.cookies?.token || getCookieValue(req, 'token');
  const token = cookieToken || bearerToken;

  if (!token) {
    throw new UnauthorizedError('No authentication token provided');
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AuthUser;
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

export const requireAnyPermission = (permissionsToCheck: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) throw new UnauthorizedError();
    const permissions = ROLE_PERMISSIONS[req.user.role] || [];
    if (
      permissions.includes('*') ||
      permissionsToCheck.some((permission) => permissions.includes(permission))
    ) {
      return next();
    }
    throw new ForbiddenError('Insufficient permissions');
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

export const assertEmployeeAccess = (req: Request, employeeId: string): void => {
  if (!req.user) throw new UnauthorizedError();
  if (req.user.role === 'Employee' && req.user.employeeId !== employeeId) {
    throw new ForbiddenError('Employees may only access their own records');
  }
};

export const requireEmployeeBodyAccess = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (req.user?.role === 'Employee' && typeof req.body?.employeeId === 'string') {
    assertEmployeeAccess(req, req.body.employeeId);
  }
  next();
};

export const requireEmployeeRead = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role === 'Employee') {
    assertEmployeeAccess(req, req.params.id);
    return next();
  }
  return requirePermission('employee.read')(req, res, next);
};
