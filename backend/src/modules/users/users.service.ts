import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors';
import * as usersRepository from './users.repository';
import {
  CreateUserInput,
  UpdateUserInput,
  UserQueryInput,
  passwordSchema,
} from './users.validators';
import { UserRole } from '../../shared/auth-middleware';
import { sendWelcomeCredentialsEmail } from '../../shared/mailer';

export const listUsers = async (query: UserQueryInput) => {
  return usersRepository.listUsers({
    search: query.search,
    role: query.role,
    isActive: query.isActive,
  });
};

export const getUserById = async (id: string) => {
  const user = await usersRepository.findUserById(id);
  if (!user) {
    throw new NotFoundError('User account not found');
  }
  return user;
};

export const createUser = async (input: CreateUserInput, actor?: any) => {
  const normalizedEmail = input.email.toLowerCase().trim();
  const existing = await usersRepository.findUserByEmail(normalizedEmail);
  if (existing) {
    throw new ConflictError('A user with this email address already exists');
  }

  // Double check password validation
  const validation = passwordSchema.safeParse(input.password);
  if (!validation.success) {
    throw new ValidationError(
      validation.error.errors[0]?.message ||
        'Password must be at least 8 characters, with 1 uppercase, 1 number, and 1 symbol',
    );
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(input.password, salt);

  const user = await usersRepository.createUser({
    firstName: input.firstName,
    lastName: input.lastName,
    email: normalizedEmail,
    passwordHash,
    role: input.role as UserRole,
    isActive: input.isActive ?? true,
  });

  // Audit logging
  try {
    await usersRepository.createAuditLog({
      actorId: actor?.id,
      actorName: 'Admin',
      action: 'USER_CREATED',
      entityType: 'user',
      entityId: user.id,
      description: `Admin created user ${user.firstName} ${user.lastName} — ${user.role}`,
      metadata: { email: user.email, role: user.role },
    });
  } catch (_e) {
    // Non-blocking audit log
  }

  // Dispatch welcome email with credentials & verification link asynchronously/gracefully
  try {
    const employeeName = `${user.firstName} ${user.lastName}`.trim();

    const JWT_SECRET = process.env.JWT_SECRET || 'peoplepay360-hackathon-super-secret-jwt-key';
    const verificationToken = jwt.sign(
      { userId: user.id, email: user.email, purpose: 'email-verification' },
      JWT_SECRET,
      { expiresIn: '8h' },
    );

    sendWelcomeCredentialsEmail({
      toEmail: normalizedEmail,
      temporaryPassword: input.password,
      role: input.role,
      employeeName,
      verificationToken,
    }).catch((err) => {
      console.error(
        '[USERS_SERVICE] Non-blocking error sending welcome email:',
        err?.message || err,
      );
    });
  } catch (err: any) {
    console.error('[USERS_SERVICE] Non-blocking error signing token:', err?.message || err);
  }

  return user;
};

export const updateUser = async (id: string, input: UpdateUserInput, actor?: any) => {
  const user = await usersRepository.findUserById(id);
  if (!user) {
    throw new NotFoundError('User account not found');
  }

  const updateData: {
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    isActive?: boolean;
    passwordHash?: string;
  } = {};

  if (input.firstName !== undefined) {
    updateData.firstName = input.firstName;
  }

  if (input.lastName !== undefined) {
    updateData.lastName = input.lastName;
  }

  if (input.role !== undefined) {
    updateData.role = input.role as UserRole;
  }

  if (input.isActive !== undefined) {
    updateData.isActive = input.isActive;
  }

  if (input.password) {
    const validation = passwordSchema.safeParse(input.password);
    if (!validation.success) {
      throw new ValidationError(
        validation.error.errors[0]?.message ||
          'Password must be at least 8 characters, with 1 uppercase, 1 number, and 1 symbol',
      );
    }
    const salt = await bcrypt.genSalt(10);
    updateData.passwordHash = await bcrypt.hash(input.password, salt);
  }

  const updated = await usersRepository.updateUser(id, updateData);

  // Audit logging
  try {
    let action = 'USER_UPDATED';
    let description = `Admin updated details for user ${user.firstName} ${user.lastName}`;
    if (input.role !== undefined && input.role !== user.role) {
      action = 'ROLE_CHANGED';
      description = `Role changed: ${user.firstName} ${user.lastName}, ${user.role} → ${input.role}`;
    } else if (input.isActive !== undefined && input.isActive !== user.isActive) {
      action = input.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED';
      description = `Admin ${input.isActive ? 'activated' : 'deactivated'} user ${user.firstName} ${user.lastName}`;
    }

    await usersRepository.createAuditLog({
      actorId: actor?.id,
      actorName: 'Admin',
      action,
      entityType: 'user',
      entityId: id,
      description,
      metadata: { previous: { role: user.role, isActive: user.isActive }, updated: input },
    });
  } catch (_e) {
    // Non-blocking
  }

  return updated;
};

export const getEmployeeOptions = async () => {
  return usersRepository.listEmployeesForSelection();
};

export const deleteUser = async (id: string, actor?: any) => {
  const currentUserId = actor?.id;
  if (currentUserId && id === currentUserId) {
    throw new ValidationError('You cannot delete your own user account');
  }
  const user = await usersRepository.findUserById(id);
  if (!user) {
    throw new NotFoundError('User account not found');
  }

  const result = await usersRepository.deleteUser(id);

  // Audit logging
  try {
    await usersRepository.createAuditLog({
      actorId: actor?.id,
      actorName: 'Admin',
      action: 'USER_DELETED',
      entityType: 'user',
      entityId: id,
      description: `Admin deactivated user ${user.firstName} ${user.lastName}`,
      metadata: { email: user.email, role: user.role },
    });
  } catch (_e) {
    // Non-blocking
  }

  return result;
};

