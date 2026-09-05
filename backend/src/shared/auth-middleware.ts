import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from './errors';
import { UserRole, hasPermission, hasAnyPermission, ROLE_PERMISSIONS } from './permissions';

export type { UserRole } from './permissions';
export { ROLE_PERMISSIONS };

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

    if (hasPermission(req.user.role, permission)) {
      return next();
    }

    throw new ForbiddenError(`Insufficient permissions: requires '${permission}'`);
  };
};

export const requireAnyPermission = (permissionsToCheck: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) throw new UnauthorizedError();
    if (hasAnyPermission(req.user.role, permissionsToCheck)) {
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

// Generic authorization primitive: permits access if user has the RBAC permission
// OR if the authenticated user is the owner of the resource
export const assertOwnerOrPermission = (
  req: Request,
  ownerEmployeeId: string,
  permission: string,
  errorMessage = 'You are not authorized to access this record',
): void => {
  if (!req.user) throw new UnauthorizedError();
  if (hasPermission(req.user.role, permission)) return;
  if (req.user.role === 'Employee' && req.user.employeeId === ownerEmployeeId) return;
  throw new ForbiddenError(errorMessage);
};

// Generic authorization primitive: permits access if user has the RBAC permission
// OR if the authenticated user is the direct manager of the resource owner
export const assertManagerOrPermission = (
  req: Request,
  managerEmployeeId: string | null | undefined,
  permission: string,
  errorMessage = 'Only HR administrators or the direct reporting manager can perform this action',
): void => {
  if (!req.user) throw new UnauthorizedError();
  if (hasPermission(req.user.role, permission)) return;
  if (
    req.user.role === 'Employee' &&
    req.user.employeeId &&
    managerEmployeeId === req.user.employeeId
  ) {
    return;
  }
  throw new ForbiddenError(errorMessage);
};
