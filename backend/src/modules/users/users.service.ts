import bcrypt from 'bcryptjs';
import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors';
import * as usersRepository from './users.repository';
import {
  CreateUserInput,
  UpdateUserInput,
  UserQueryInput,
  passwordSchema,
} from './users.validators';
import { UserRole } from '../../shared/auth-middleware';

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

export const createUser = async (input: CreateUserInput) => {
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

  return usersRepository.createUser({
    email: normalizedEmail,
    passwordHash,
    role: input.role as UserRole,
    employeeId: input.employeeId || null,
    isActive: input.isActive ?? true,
  });
};

export const updateUser = async (id: string, input: UpdateUserInput) => {
  const user = await usersRepository.findUserById(id);
  if (!user) {
    throw new NotFoundError('User account not found');
  }

  const updateData: {
    role?: UserRole;
    employeeId?: string | null;
    isActive?: boolean;
    passwordHash?: string;
  } = {};

  if (input.role !== undefined) {
    updateData.role = input.role as UserRole;
  }

  if (input.employeeId !== undefined) {
    updateData.employeeId = input.employeeId;
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

  return usersRepository.updateUser(id, updateData);
};

export const getEmployeeOptions = async () => {
  return usersRepository.listEmployeesForSelection();
};
