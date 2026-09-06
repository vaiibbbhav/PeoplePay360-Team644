import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, NotFoundError } from '../../shared/errors';
import { EmailNotVerifiedError } from './auth.errors';
import { LoginInput } from './auth.validators';
import * as authRepository from './auth.repository';
import { AuthUser, UserRole } from '../../shared/auth-middleware';
import { sendVerificationEmail } from '../../shared/mailer';

export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters');
  }
  return secret;
};
const TOKEN_EXPIRY = '7d';

export type UserPayload = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  employeeId?: string | null;
  employee?: {
    id: string;
    employmentStatus: string;
  } | null;
};

export type AuthResponse = {
  user: UserPayload;
  token: string;
};

const generateToken = (user: {
  id: string;
  email: string;
  role: UserRole;
  employeeId?: string | null;
}): string => {
  const payload: AuthUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    employeeId: user.employeeId || undefined,
  };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: TOKEN_EXPIRY });
};

export const login = async (input: LoginInput): Promise<AuthResponse> => {
  const normalizedEmail = input.email.toLowerCase().trim();
  const user = await authRepository.findUserByEmail(normalizedEmail);
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!user.isActive) {
    throw new UnauthorizedError(
      'Account is deactivated. Please contact your system administrator.',
    );
  }

  const isMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!user.isEmailVerified) {
    throw new EmailNotVerifiedError(
      'Please verify your email before logging in. Check your inbox for the verification link.',
    );
  }

  const employee = await authRepository.findEmployeeByUserId(user.id);
  const employeeData = employee
    ? {
        id: employee.id,
        employmentStatus: employee.employmentStatus,
      }
    : null;
  const employeeId = employee?.id || null;

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
    employeeId,
  });

  return {
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role as UserRole,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      employeeId,
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

  const employee = await authRepository.findEmployeeByUserId(user.id);
  const employeeData = employee
    ? {
        id: employee.id,
        employmentStatus: employee.employmentStatus,
      }
    : null;
  const employeeId = employee?.id || null;

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role as UserRole,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    employeeId,
    employee: employeeData,
  };
};

export const refreshToken = async (currentToken: string): Promise<AuthResponse> => {
  try {
    const decoded = jwt.verify(currentToken, getJwtSecret(), {
      ignoreExpiration: true,
    }) as AuthUser & { exp?: number; iat?: number };

    // Prevent reviving ancient or revoked tokens: refresh only permitted within 7 days of expiration
    const MAX_REFRESH_GRACE_SECONDS = 7 * 24 * 60 * 60; // 7 days
    if (decoded.exp && Math.floor(Date.now() / 1000) > decoded.exp + MAX_REFRESH_GRACE_SECONDS) {
      throw new UnauthorizedError('Session expired. Please log in again.');
    }

    const user = await authRepository.findUserById(decoded.id);
    if (!user) {
      throw new UnauthorizedError('User does not exist');
    }

    if (!user.isActive) {
      throw new UnauthorizedError(
        'Account is deactivated. Please contact your system administrator.',
      );
    }

    if (!user.isEmailVerified) {
      throw new EmailNotVerifiedError('Please verify your email before logging in.');
    }

    const employee = await authRepository.findEmployeeByUserId(user.id);
    const employeeData = employee
      ? {
          id: employee.id,
          employmentStatus: employee.employmentStatus,
        }
      : null;
    const employeeId = employee?.id || null;

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      employeeId,
    });

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role as UserRole,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        employeeId,
        employee: employeeData,
      },
      token,
    };
  } catch (err: unknown) {
    if (err instanceof EmailNotVerifiedError || err instanceof UnauthorizedError) {
      throw err;
    }
    throw new UnauthorizedError('Invalid or expired token');
  }
};

export const verifyEmail = async (token: string): Promise<{ email: string }> => {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as {
      userId: string;
      email: string;
      purpose: string;
    };

    if (decoded.purpose !== 'email-verification') {
      throw new UnauthorizedError('Invalid verification token');
    }

    const user = await authRepository.findUserById(decoded.userId);
    if (!user) {
      throw new NotFoundError('User account not found');
    }

    await authRepository.markEmailVerified(user.id);

    return { email: user.email };
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError || err instanceof NotFoundError) {
      throw err;
    }
    throw new UnauthorizedError('Verification token is invalid or has expired');
  }
};

export const resendVerificationEmail = async (
  email: string,
): Promise<{ success: boolean; message: string }> => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await authRepository.findUserByEmail(normalizedEmail);
  if (!user) {
    return {
      success: true,
      message: 'If an account exists with this email, a verification link has been sent.',
    };
  }

  if (user.isEmailVerified) {
    return {
      success: true,
      message: 'This email is already verified. You can sign in directly.',
    };
  }

  const verificationToken = jwt.sign(
    { userId: user.id, email: user.email, purpose: 'email-verification' },
    getJwtSecret(),
    { expiresIn: '8h' },
  );

  const employeeName = `${user.firstName} ${user.lastName}`.trim();

  await sendVerificationEmail({
    toEmail: user.email,
    employeeName,
    verificationToken,
  });

  return {
    success: true,
    message: 'Verification email has been sent. Please check your inbox.',
  };
};
