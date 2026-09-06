
import { db } from './db';
import { employees } from '../db/schema';
import { desc, sql } from 'drizzle-orm';

/**
 * Generates the next sequential employee code (EMP-001, EMP-002, ...).
 * Reads the highest existing code and increments by one.
 */
export async function generateEmployeeCode(): Promise<string> {
  const result = await db
    .select({ code: employees.employeeCode })
    .from(employees)
    .where(sql`${employees.employeeCode} IS NOT NULL`)
    .orderBy(desc(employees.employeeCode))
    .limit(1);

  if (result.length === 0 || !result[0].code) {
    return 'EMP-001';
  }

  const lastCode = result[0].code;
  const numericPart = lastCode.replace(/^EMP-/, '');
  const nextNum = parseInt(numericPart, 10) + 1;
  return `EMP-${String(nextNum).padStart(3, '0')}`;
}
