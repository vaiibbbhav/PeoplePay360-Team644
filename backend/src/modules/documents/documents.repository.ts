import { eq, count, desc, sql } from 'drizzle-orm';
import { db } from '../../shared/db';
import { companyPolicies, policyAcceptances, users } from '../../db/schema';

export type PolicyRecord = typeof companyPolicies.$inferSelect;
export type PolicyAcceptanceRecord = typeof policyAcceptances.$inferSelect;

export type InsertAcceptanceInput = {
  policyId: string;
  userId: string;
  employeeId?: string | null;
  policyVersion: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function findAllPolicies(): Promise<PolicyRecord[]> {
  return db
    .select()
    .from(companyPolicies)
    .orderBy(desc(companyPolicies.isMandatory), companyPolicies.title);
}

export async function findPolicyById(id: string): Promise<PolicyRecord | null> {
  const [record] = await db
    .select()
    .from(companyPolicies)
    .where(eq(companyPolicies.id, id))
    .limit(1);
  return record || null;
}

export async function findPolicyByCode(code: string): Promise<PolicyRecord | null> {
  const [record] = await db
    .select()
    .from(companyPolicies)
    .where(eq(companyPolicies.code, code))
    .limit(1);
  return record || null;
}

export async function findUserAcceptances(userId: string): Promise<PolicyAcceptanceRecord[]> {
  return db.select().from(policyAcceptances).where(eq(policyAcceptances.userId, userId));
}

export async function recordAcceptance(
  data: InsertAcceptanceInput,
): Promise<PolicyAcceptanceRecord> {
  const [existing] = await db
    .select()
    .from(policyAcceptances)
    .where(
      sql`${policyAcceptances.policyId} = ${data.policyId} AND ${policyAcceptances.userId} = ${data.userId} AND ${policyAcceptances.policyVersion} = ${data.policyVersion}`,
    )
    .limit(1);

  if (existing) {
    return existing;
  }

  const [inserted] = await db
    .insert(policyAcceptances)
    .values({
      policyId: data.policyId,
      userId: data.userId,
      employeeId: data.employeeId || null,
      policyVersion: data.policyVersion,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
    })
    .returning();

  return inserted;
}

export async function recordBulkAcceptance(
  records: InsertAcceptanceInput[],
): Promise<PolicyAcceptanceRecord[]> {
  if (records.length === 0) return [];

  const results: PolicyAcceptanceRecord[] = [];
  for (const item of records) {
    const saved = await recordAcceptance(item);
    results.push(saved);
  }
  return results;
}

export async function getComplianceStats(): Promise<{
  totalPolicies: number;
  totalUsers: number;
  totalAcceptances: number;
}> {
  const [policyCount] = await db.select({ value: count() }).from(companyPolicies);
  const [userCount] = await db.select({ value: count() }).from(users);
  const [acceptanceCount] = await db.select({ value: count() }).from(policyAcceptances);

  return {
    totalPolicies: Number(policyCount?.value || 0),
    totalUsers: Number(userCount?.value || 0),
    totalAcceptances: Number(acceptanceCount?.value || 0),
  };
}
