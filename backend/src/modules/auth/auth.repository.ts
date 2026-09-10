import { eq } from 'drizzle-orm';
import { db } from '../../shared/db';
import { users, employees } from '../../db/schema';
import { UserRole } from '../../shared/auth-middleware';
import { generateEmployeeCode } from '../../shared/employee-code';

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
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive?: boolean;
}): Promise<UserRecord> => {
  const [user] = await db
    .insert(users)
    .values({
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.toLowerCase().trim(),
      passwordHash: data.passwordHash,
      role: data.role,
      isActive: data.isActive ?? true,
    })
    .returning();
  return user;
};

export const createEmployeeForUser = async (data: { userId: string }): Promise<EmployeeRecord> => {
  const employeeCode = await generateEmployeeCode();
  const [employee] = await db
    .insert(employees)
    .values({
      userId: data.userId,
      employeeCode,
      employmentStatus: 'incomplete',
    })
    .returning();
  return employee;
};

export const findEmployeeByUserId = async (userId: string): Promise<EmployeeRecord | undefined> => {
  const [employee] = await db.select().from(employees).where(eq(employees.userId, userId));
  return employee;
};

export const findEmployeeByEmail = async (email: string): Promise<EmployeeRecord | undefined> => {
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
  if (!user) return undefined;
  return findEmployeeByUserId(user.id);
};

export const findEmployeeById = async (id: string): Promise<EmployeeRecord | undefined> => {
  const [employee] = await db.select().from(employees).where(eq(employees.id, id));
  return employee;
};

export const markEmailVerified = async (userId: string): Promise<UserRecord | undefined> => {
  const [user] = await db
    .update(users)
    .set({
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();
  return user;
};

export const updateUserPassword = async (
  userId: string,
  passwordHash: string,
): Promise<UserRecord | undefined> => {
  const [user] = await db
    .update(users)
    .set({
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();
  return user;
};
