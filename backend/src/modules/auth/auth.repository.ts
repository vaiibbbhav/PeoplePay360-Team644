import { eq } from 'drizzle-orm';
import { db } from '../../shared/db';
import { users, employees } from '../../db/schema';
import { UserRole } from '../../shared/auth-middleware';

export type UserRecord = typeof users.$inferSelect;
export type NewUserRecord = typeof users.$inferInsert;
export type EmployeeRecord = typeof employees.$inferSelect;

export const findUserByEmail = async (email: string): Promise<UserRecord | undefined> => {
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
  return user;
};

export const findUserById = async (id: string): Promise<UserRecord | undefined> => {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
};

export const createUser = async (data: {
  email: string;
  passwordHash: string;
  role: UserRole;
  employeeId?: string | null;
}): Promise<UserRecord> => {
  const [user] = await db
    .insert(users)
    .values({
      email: data.email.toLowerCase().trim(),
      passwordHash: data.passwordHash,
      role: data.role,
      employeeId: data.employeeId || null,
    })
    .returning();
  return user;
};

export const createEmployeeForUser = async (data: {
  firstName: string;
  lastName: string;
  email: string;
}): Promise<EmployeeRecord> => {
  const [employee] = await db
    .insert(employees)
    .values({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase().trim(),
      employmentStatus: 'active',
    })
    .returning();
  return employee;
};

export const findEmployeeByEmail = async (email: string): Promise<EmployeeRecord | undefined> => {
  const [employee] = await db
    .select()
    .from(employees)
    .where(eq(employees.email, email.toLowerCase().trim()));
  return employee;
};

export const findEmployeeById = async (id: string): Promise<EmployeeRecord | undefined> => {
  const [employee] = await db.select().from(employees).where(eq(employees.id, id));
  return employee;
};
