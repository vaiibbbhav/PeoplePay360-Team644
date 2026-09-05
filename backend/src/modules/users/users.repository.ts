import { eq, ilike, or, and, desc } from 'drizzle-orm';
import { db } from '../../shared/db';
import * as schema from '../../db/schema';
import { UserRole } from '../../shared/auth-middleware';

export type UserWithEmployee = {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  employeeId: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
};

export const listUsers = async (filters: {
  search?: string;
  role?: string;
  isActive?: boolean;
}): Promise<UserWithEmployee[]> => {
  const conditions = [];

  if (filters.role) {
    conditions.push(eq(schema.users.role, filters.role));
  }

  if (filters.isActive !== undefined) {
    conditions.push(eq(schema.users.isActive, filters.isActive));
  }

  if (filters.search) {
    const term = `%${filters.search.toLowerCase()}%`;
    conditions.push(
      or(
        ilike(schema.users.email, term),
        ilike(schema.employees.firstName, term),
        ilike(schema.employees.lastName, term)
      )
    );
  }

  const rows = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      role: schema.users.role,
      isActive: schema.users.isActive,
      employeeId: schema.users.employeeId,
      createdAt: schema.users.createdAt,
      updatedAt: schema.users.updatedAt,
      employee: {
        id: schema.employees.id,
        firstName: schema.employees.firstName,
        lastName: schema.employees.lastName,
        email: schema.employees.email,
      },
    })
    .from(schema.users)
    .leftJoin(schema.employees, eq(schema.users.employeeId, schema.employees.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(schema.users.createdAt));

  return rows.map((r) => ({
    ...r,
    role: r.role as UserRole,
    employee: r.employee?.id ? r.employee : null,
  }));
};

export const findUserById = async (id: string): Promise<UserWithEmployee | null> => {
  const rows = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      role: schema.users.role,
      isActive: schema.users.isActive,
      employeeId: schema.users.employeeId,
      createdAt: schema.users.createdAt,
      updatedAt: schema.users.updatedAt,
      employee: {
        id: schema.employees.id,
        firstName: schema.employees.firstName,
        lastName: schema.employees.lastName,
        email: schema.employees.email,
      },
    })
    .from(schema.users)
    .leftJoin(schema.employees, eq(schema.users.employeeId, schema.employees.id))
    .where(eq(schema.users.id, id))
    .limit(1);

  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    ...r,
    role: r.role as UserRole,
    employee: r.employee?.id ? r.employee : null,
  };
};

export const findUserByEmail = async (email: string) => {
  const rows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase().trim()))
    .limit(1);
  return rows[0] || null;
};

export const createUser = async (data: {
  email: string;
  passwordHash: string;
  role: UserRole;
  employeeId?: string | null;
  isActive?: boolean;
}): Promise<UserWithEmployee> => {
  const [created] = await db
    .insert(schema.users)
    .values({
      email: data.email.toLowerCase().trim(),
      passwordHash: data.passwordHash,
      role: data.role,
      employeeId: data.employeeId || null,
      isActive: data.isActive ?? true,
    })
    .returning();

  const fullUser = await findUserById(created.id);
  return fullUser!;
};

export const updateUser = async (
  id: string,
  data: {
    role?: UserRole;
    employeeId?: string | null;
    isActive?: boolean;
    passwordHash?: string;
  }
): Promise<UserWithEmployee> => {
  await db
    .update(schema.users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, id));

  const updated = await findUserById(id);
  return updated!;
};

export const listEmployeesForSelection = async () => {
  return db
    .select({
      id: schema.employees.id,
      firstName: schema.employees.firstName,
      lastName: schema.employees.lastName,
      email: schema.employees.email,
    })
    .from(schema.employees)
    .orderBy(schema.employees.firstName);
};
