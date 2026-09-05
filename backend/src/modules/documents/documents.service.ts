import * as docsRepo from './documents.repository';
import { NotFoundError, ConflictError } from '../../shared/errors';
import type { CreatePolicyInput, UpdatePolicyInput } from './documents.validators';

export type PolicyWithStatus = {
  id: string;
  title: string;
  code: string;
  category: string;
  version: string;
  summary: string;
  content: string;
  isMandatory: boolean;
  effectiveDate: string | null;
  createdAt: Date | null;
  isAccepted: boolean;
  acceptedAt: Date | null;
  acceptedVersion: string | null;
};

export type UserComplianceOverview = {
  policies: PolicyWithStatus[];
  stats: {
    total: number;
    acceptedCount: number;
    pendingCount: number;
    mandatoryCount: number;
    mandatoryPendingCount: number;
    compliancePercentage: number;
    allAccepted: boolean;
  };
};

export async function getPoliciesForUser(userId: string): Promise<UserComplianceOverview> {
  const policies = await docsRepo.findAllPolicies();
  const acceptances = await docsRepo.findUserAcceptances(userId);

  const acceptanceMap = new Map<string, docsRepo.PolicyAcceptanceRecord>();
  for (const acc of acceptances) {
    acceptanceMap.set(acc.policyId, acc);
  }

  let acceptedCount = 0;
  let mandatoryCount = 0;
  let mandatoryPendingCount = 0;

  const enrichedPolicies: PolicyWithStatus[] = policies.map((policy) => {
    const acc = acceptanceMap.get(policy.id);
    const isAccepted = Boolean(acc && acc.policyVersion === policy.version);

    if (policy.isMandatory) {
      mandatoryCount += 1;
      if (!isAccepted) {
        mandatoryPendingCount += 1;
      }
    }

    if (isAccepted) {
      acceptedCount += 1;
    }

    return {
      id: policy.id,
      title: policy.title,
      code: policy.code,
      category: policy.category,
      version: policy.version,
      summary: policy.summary,
      content: policy.content,
      isMandatory: policy.isMandatory,
      effectiveDate: policy.effectiveDate,
      createdAt: policy.createdAt,
      isAccepted,
      acceptedAt: acc ? acc.acceptedAt : null,
      acceptedVersion: acc ? acc.policyVersion : null,
    };
  });

  const total = enrichedPolicies.length;
  const pendingCount = total - acceptedCount;
  const compliancePercentage = total > 0 ? Math.round((acceptedCount / total) * 100) : 100;
  const allAccepted = pendingCount === 0;

  return {
    policies: enrichedPolicies,
    stats: {
      total,
      acceptedCount,
      pendingCount,
      mandatoryCount,
      mandatoryPendingCount,
      compliancePercentage,
      allAccepted,
    },
  };
}

export async function getPolicyById(id: string, userId: string): Promise<PolicyWithStatus> {
  const policy = await docsRepo.findPolicyById(id);
  if (!policy) {
    throw new NotFoundError(`Policy with ID ${id} not found`);
  }

  const acceptances = await docsRepo.findUserAcceptances(userId);
  const acc = acceptances.find((a) => a.policyId === policy.id);
  const isAccepted = Boolean(acc && acc.policyVersion === policy.version);

  return {
    id: policy.id,
    title: policy.title,
    code: policy.code,
    category: policy.category,
    version: policy.version,
    summary: policy.summary,
    content: policy.content,
    isMandatory: policy.isMandatory,
    effectiveDate: policy.effectiveDate,
    createdAt: policy.createdAt,
    isAccepted,
    acceptedAt: acc ? acc.acceptedAt : null,
    acceptedVersion: acc ? acc.policyVersion : null,
  };
}

export async function acceptPolicy(
  policyId: string,
  user: { id: string; employeeId?: string | null },
  metadata: { version?: string; ipAddress?: string; userAgent?: string },
): Promise<PolicyWithStatus> {
  const policy = await docsRepo.findPolicyById(policyId);
  if (!policy) {
    throw new NotFoundError(`Policy with ID ${policyId} not found`);
  }

  const versionToAccept = metadata.version || policy.version;

  await docsRepo.recordAcceptance({
    policyId: policy.id,
    userId: user.id,
    employeeId: user.employeeId || null,
    policyVersion: versionToAccept,
    ipAddress: metadata.ipAddress || null,
    userAgent: metadata.userAgent || null,
  });

  return getPolicyById(policy.id, user.id);
}

export async function acceptAllPolicies(
  user: { id: string; employeeId?: string | null },
  metadata: { ipAddress?: string; userAgent?: string },
): Promise<UserComplianceOverview> {
  const overview = await getPoliciesForUser(user.id);
  const pendingPolicies = overview.policies.filter((p) => !p.isAccepted);

  if (pendingPolicies.length > 0) {
    const toInsert = pendingPolicies.map((p) => ({
      policyId: p.id,
      userId: user.id,
      employeeId: user.employeeId || null,
      policyVersion: p.version,
      ipAddress: metadata.ipAddress || null,
      userAgent: metadata.userAgent || null,
    }));

    await docsRepo.recordBulkAcceptance(toInsert);
  }

  return getPoliciesForUser(user.id);
}

export async function getCompanyComplianceStats() {
  return docsRepo.getComplianceStats();
}

export async function createPolicy(input: CreatePolicyInput) {
  const existing = await docsRepo.findPolicyByCode(input.code);
  if (existing) {
    throw new ConflictError(`A policy with code '${input.code}' already exists`);
  }

  return await docsRepo.insertPolicy({
    title: input.title,
    code: input.code,
    category: input.category,
    version: input.version || '1.0',
    summary: input.summary,
    content: input.content,
    isMandatory: input.isMandatory,
    effectiveDate: input.effectiveDate,
  });
}

export async function updatePolicy(id: string, input: UpdatePolicyInput) {
  const existing = await docsRepo.findPolicyById(id);
  if (!existing) {
    throw new NotFoundError(`Policy with ID '${id}' not found`);
  }

  if (input.code && input.code !== existing.code) {
    const withSameCode = await docsRepo.findPolicyByCode(input.code);
    if (withSameCode) {
      throw new ConflictError(`A policy with code '${input.code}' already exists`);
    }
  }

  const updated = await docsRepo.updatePolicy(id, input);
  return updated;
}

export async function deletePolicy(id: string) {
  const existing = await docsRepo.findPolicyById(id);
  if (!existing) {
    throw new NotFoundError(`Policy with ID '${id}' not found`);
  }

  await docsRepo.deletePolicy(id);
  return { success: true, message: `Policy '${existing.title}' deleted successfully` };
}

export async function getCompanyComplianceRoster() {
  return await docsRepo.getCompanyComplianceRoster();
}

