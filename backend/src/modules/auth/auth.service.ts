import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../shared/errors';
import { RegisterInput, LoginInput } from './auth.validators';
import * as authRepository from './auth.repository';
import { AuthUser, UserRole } from '../../shared/auth-middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'peoplepay360-hackathon-super-secret-jwt-key';
const TOKEN_EXPIRY = '7d';

export type UserPayload = {
  id: string;
  email: string;
  role: UserRole;
  employeeId?: string | null;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
};

export type AuthResponse = {
  user: UserPayload;
  token: string;
};

const generateToken = (user: { id: string; email: string; role: UserRole; employeeId?: string | null }): string => {
  const payload: AuthUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    employeeId: user.employeeId || undefined,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

export const register = async (input: RegisterInput): Promise<AuthResponse> => {
  const normalizedEmail = input.email.toLowerCase().trim();
  const existingUser = await authRepository.findUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new ConflictError('A user with this email address already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(input.password, salt);

  let employeeId: string | null = null;
  let employeeData = null;

  if (input.firstName && input.lastName) {
    // Check if an employee record already exists with this email
    let employee = await authRepository.findEmployeeByEmail(normalizedEmail);
    if (!employee) {
      employee = await authRepository.createEmployeeForUser({
        firstName: input.firstName,
        lastName: input.lastName,
        email: normalizedEmail,
      });
    }
    employeeId = employee.id;
    employeeData = {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
    };
  }

  const user = await authRepository.createUser({
    email: normalizedEmail,
    passwordHash,
    role: input.role as UserRole,
    employeeId,
  });

  const token = generateToken({ ...user, role: user.role as UserRole });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      employeeId: user.employeeId,
      employee: employeeData,
    },
    token,
  };
};

export const login = async (input: LoginInput): Promise<AuthResponse> => {
  const normalizedEmail = input.email.toLowerCase().trim();
  const user = await authRepository.findUserByEmail(normalizedEmail);
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid email or password');
  }

  let employeeData = null;
  if (user.employeeId) {
    const employee = await authRepository.findEmployeeById(user.employeeId);
    if (employee) {
      employeeData = {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
      };
    }
  }

  const token = generateToken({ ...user, role: user.role as UserRole });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      employeeId: user.employeeId,
      employee: employeeData,
    },
    token,
  };
};

export const getCurrentUser = async (userId: string): Promise<UserPayload> => {
  const user = await authRepository.findUserById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  let employeeData = null;
  if (user.employeeId) {
    const employee = await authRepository.findEmployeeById(user.employeeId);
    if (employee) {
      employeeData = {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
      };
    }
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
    employeeId: user.employeeId,
    employee: employeeData,
  };
};

export const refreshToken = async (currentToken: string): Promise<AuthResponse> => {
  try {
    const decoded = jwt.verify(currentToken, JWT_SECRET, { ignoreExpiration: true }) as AuthUser;
    const user = await authRepository.findUserById(decoded.id);
    if (!user) {
      throw new UnauthorizedError('User does not exist');
    }

    let employeeData = null;
    if (user.employeeId) {
      const employee = await authRepository.findEmployeeById(user.employeeId);
      if (employee) {
        employeeData = {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
        };
      }
    }

    const token = generateToken({ ...user, role: user.role as UserRole });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        employeeId: user.employeeId,
        employee: employeeData,
      },
      token,
    };
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
};

