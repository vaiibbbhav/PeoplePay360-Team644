import { eq, ilike, or, and, desc } from 'drizzle-orm';
import { db } from '../../shared/db';
import * as schema from '../../db/schema';
import { UserRole } from '../../shared/auth-middleware';

export type UserWithEmployee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
  employee: {
    id: string;
    employmentStatus: string;
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
        ilike(schema.users.firstName, term),
        ilike(schema.users.lastName, term),
      ),
    );
  }

  const rows = await db
    .select({
      id: schema.users.id,
      firstName: schema.users.firstName,
      lastName: schema.users.lastName,
      email: schema.users.email,
      role: schema.users.role,
      isActive: schema.users.isActive,
      isEmailVerified: schema.users.isEmailVerified,
      createdAt: schema.users.createdAt,
      updatedAt: schema.users.updatedAt,
      employee: {
        id: schema.employees.id,
        employmentStatus: schema.employees.employmentStatus,
      },
    })
    .from(schema.users)
    .leftJoin(schema.employees, eq(schema.employees.userId, schema.users.id))
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
      firstName: schema.users.firstName,
      lastName: schema.users.lastName,
      email: schema.users.email,
      role: schema.users.role,
      isActive: schema.users.isActive,
      isEmailVerified: schema.users.isEmailVerified,
      createdAt: schema.users.createdAt,
      updatedAt: schema.users.updatedAt,
      employee: {
        id: schema.employees.id,
        employmentStatus: schema.employees.employmentStatus,
      },
    })
    .from(schema.users)
    .leftJoin(schema.employees, eq(schema.employees.userId, schema.users.id))
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
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive?: boolean;
}): Promise<UserWithEmployee> => {
  const result = await db.transaction(async (tx) => {
    const [createdUser] = await tx
      .insert(schema.users)
      .values({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.toLowerCase().trim(),
        passwordHash: data.passwordHash,
        role: data.role,
        isActive: data.isActive ?? true,
      })
      .returning();

    const [createdEmployee] = await tx
      .insert(schema.employees)
      .values({
        userId: createdUser.id,
        employmentStatus: 'incomplete',
      })
      .returning();

    return {
      id: createdUser.id,
      firstName: createdUser.firstName,
      lastName: createdUser.lastName,
      email: createdUser.email,
      role: createdUser.role as UserRole,
      isActive: createdUser.isActive,
      isEmailVerified: createdUser.isEmailVerified,
      createdAt: createdUser.createdAt,
      updatedAt: createdUser.updatedAt,
      employee: {
        id: createdEmployee.id,
        employmentStatus: createdEmployee.employmentStatus,
      },
    };
  });

  return result;
};

export const updateUser = async (
  id: string,
  data: {
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    isActive?: boolean;
    passwordHash?: string;
  },
): Promise<UserWithEmployee> => {
  const updatePayload: Partial<typeof schema.users.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.firstName !== undefined) updatePayload.firstName = data.firstName.trim();
  if (data.lastName !== undefined) updatePayload.lastName = data.lastName.trim();
  if (data.role !== undefined) updatePayload.role = data.role;
  if (data.isActive !== undefined) updatePayload.isActive = data.isActive;
  if (data.passwordHash !== undefined) updatePayload.passwordHash = data.passwordHash;

  await db.update(schema.users).set(updatePayload).where(eq(schema.users.id, id));

  const updated = await findUserById(id);
  return updated!;
};

export const listEmployeesForSelection = async () => {
  return db
    .select({
      id: schema.employees.id,
      firstName: schema.users.firstName,
      lastName: schema.users.lastName,
      email: schema.users.email,
    })
    .from(schema.employees)
    .innerJoin(schema.users, eq(schema.employees.userId, schema.users.id))
    .orderBy(schema.users.firstName);
};

export const deleteUser = async (id: string): Promise<boolean> => {
  const result = await db
    .delete(schema.users)
    .where(eq(schema.users.id, id))
    .returning({ id: schema.users.id });
  return result.length > 0;
};

export const createAuditLog = async (log: {
  actorId?: string | null;
  actorName: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  description: string;
  metadata?: Record<string, unknown>;
}) => {
  return db.insert(schema.auditLogs).values({
    actorId: log.actorId ?? null,
    actorName: log.actorName || 'System Admin',
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId ?? null,
    description: log.description,
    metadata: log.metadata || {},
  });
};
