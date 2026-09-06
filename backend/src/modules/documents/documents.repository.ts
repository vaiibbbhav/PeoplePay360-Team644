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

export async function insertPolicy(data: {
  title: string;
  code: string;
  category: string;
  version: string;
  summary: string;
  content: string;
  isMandatory?: boolean;
  effectiveDate?: string | null;
}): Promise<PolicyRecord> {
  const [created] = await db
    .insert(companyPolicies)
    .values({
      title: data.title,
      code: data.code,
      category: data.category,
      version: data.version || '1.0',
      summary: data.summary,
      content: data.content,
      isMandatory: data.isMandatory !== undefined ? data.isMandatory : true,
      effectiveDate: data.effectiveDate || null,
    })
    .returning();
  return created;
}

export async function updatePolicy(
  id: string,
  data: {
    title?: string;
    code?: string;
    category?: string;
    version?: string;
    summary?: string;
    content?: string;
    isMandatory?: boolean;
    effectiveDate?: string | null;
  },
): Promise<PolicyRecord | null> {
  const payload: Record<string, any> = {
    updatedAt: new Date(),
  };

  if (data.title !== undefined) payload.title = data.title;
  if (data.code !== undefined) payload.code = data.code;
  if (data.category !== undefined) payload.category = data.category;
  if (data.version !== undefined) payload.version = data.version;
  if (data.summary !== undefined) payload.summary = data.summary;
  if (data.content !== undefined) payload.content = data.content;
  if (data.isMandatory !== undefined) payload.isMandatory = data.isMandatory;
  if (data.effectiveDate !== undefined) payload.effectiveDate = data.effectiveDate;

  const [updated] = await db
    .update(companyPolicies)
    .set(payload)
    .where(eq(companyPolicies.id, id))
    .returning();

  return updated || null;
}

export async function deletePolicy(id: string): Promise<boolean> {
  await db.delete(companyPolicies).where(eq(companyPolicies.id, id));
  return true;
}

export async function getCompanyComplianceRoster() {
  const policies = await findAllPolicies();
  const allUsers = await db.select().from(users);
  const allAcceptances = await db.select().from(policyAcceptances);

  // Group acceptances by policyId -> userId
  const acceptanceKeyMap = new Set<string>();
  for (const acc of allAcceptances) {
    acceptanceKeyMap.add(`${acc.policyId}:${acc.userId}:${acc.policyVersion}`);
  }

  return policies.map((policy) => {
    let acceptedCount = 0;
    for (const u of allUsers) {
      if (acceptanceKeyMap.has(`${policy.id}:${u.id}:${policy.version}`)) {
        acceptedCount++;
      }
    }
    const totalUsers = allUsers.length;
    const rate = totalUsers > 0 ? Math.round((acceptedCount / totalUsers) * 100) : 100;

    return {
      policyId: policy.id,
      title: policy.title,
      code: policy.code,
      version: policy.version,
      category: policy.category,
      isMandatory: policy.isMandatory,
      acceptedCount,
      totalUsers,
      complianceRate: rate,
    };
  });
}

