import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';

export type Policy = {
  id: string;
  title: string;
  code: string;
  category: 'compliance' | 'security' | 'workplace' | 'hr' | string;
  version: string;
  summary: string;
  content: string;
  isMandatory: boolean;
  effectiveDate: string | null;
  createdAt: string | null;
  isAccepted: boolean;
  acceptedAt: string | null;
  acceptedVersion: string | null;
};

export type ComplianceStats = {
  total: number;
  acceptedCount: number;
  pendingCount: number;
  mandatoryCount: number;
  mandatoryPendingCount: number;
  compliancePercentage: number;
  allAccepted: boolean;
};

export type UserComplianceOverview = {
  policies: Policy[];
  stats: ComplianceStats;
};

export type CompanyComplianceStats = {
  totalPolicies: number;
  totalUsers: number;
  totalAcceptances: number;
};

export type CompanyComplianceRosterItem = {
  policyId: string;
  title: string;
  code: string;
  version: string;
  category: string;
  isMandatory: boolean;
  acceptedCount: number;
  totalUsers: number;
  complianceRate: number;
};

export type CreatePolicyPayload = {
  title: string;
  code: string;
  category: string;
  version?: string;
  summary: string;
  content: string;
  isMandatory?: boolean;
  effectiveDate?: string | null;
};

export type UpdatePolicyPayload = {
  id: string;
  data: Partial<CreatePolicyPayload>;
};

// API Functions
export async function fetchUserDocuments(): Promise<UserComplianceOverview> {
  const res = await api.get<UserComplianceOverview>('/documents');
  return res.data;
}

export async function createPolicy(payload: CreatePolicyPayload): Promise<Policy> {
  const res = await api.post<Policy>('/documents', payload);
  return res.data;
}

export async function updatePolicy(id: string, payload: Partial<CreatePolicyPayload>): Promise<Policy> {
  const res = await api.put<Policy>(`/documents/${id}`, payload);
  return res.data;
}

export async function deletePolicy(id: string): Promise<{ success: boolean; message: string }> {
  const res = await api.delete<{ success: boolean; message: string }>(`/documents/${id}`);
  return res.data;
}

export async function fetchCompanyComplianceRoster(): Promise<CompanyComplianceRosterItem[]> {
  const res = await api.get<CompanyComplianceRosterItem[]>('/documents/admin/compliance');
  return res.data;
}

export async function fetchDocumentById(id: string): Promise<Policy> {
  const res = await api.get<Policy>(`/documents/${id}`);
  return res.data;
}

export async function acceptDocument(id: string, policyVersion: string): Promise<Policy> {
  const res = await api.post<Policy>(`/documents/${id}/accept`, { policyVersion });
  return res.data;
}

export async function acceptAllDocuments(): Promise<UserComplianceOverview> {
  const res = await api.post<UserComplianceOverview>('/documents/accept-all', {});
  return res.data;
}

export async function fetchComplianceStats(): Promise<CompanyComplianceStats> {
  const res = await api.get<CompanyComplianceStats>('/documents/stats');
  return res.data;
}

// React Query Hooks
export function useUserDocuments() {
  return useQuery({
    queryKey: ['user-documents'],
    queryFn: fetchUserDocuments,
    staleTime: 1000 * 60 * 5, // 5 mins
  });
}

export function useDocumentDetail(id: string | null) {
  return useQuery({
    queryKey: ['document-detail', id],
    queryFn: () => fetchDocumentById(id!),
    enabled: Boolean(id),
  });
}

export function useAcceptDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: string }) => acceptDocument(id, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-detail'] });
    },
  });
}

export function useAcceptAllDocuments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acceptAllDocuments,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-detail'] });
    },
  });
}

export function useCompanyComplianceStats() {
  return useQuery({
    queryKey: ['company-compliance-stats'],
    queryFn: fetchComplianceStats,
  });
}

export function useCompanyComplianceRoster() {
  return useQuery({
    queryKey: ['company-compliance-roster'],
    queryFn: fetchCompanyComplianceRoster,
  });
}

export function useCreatePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePolicyPayload) => createPolicy(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-documents'] });
      queryClient.invalidateQueries({ queryKey: ['company-compliance-stats'] });
      queryClient.invalidateQueries({ queryKey: ['company-compliance-roster'] });
    },
  });
}

export function useUpdatePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: UpdatePolicyPayload) => updatePolicy(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-detail'] });
      queryClient.invalidateQueries({ queryKey: ['company-compliance-stats'] });
      queryClient.invalidateQueries({ queryKey: ['company-compliance-roster'] });
    },
  });
}

export function useDeletePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePolicy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-documents'] });
      queryClient.invalidateQueries({ queryKey: ['company-compliance-stats'] });
      queryClient.invalidateQueries({ queryKey: ['company-compliance-roster'] });
    },
  });
}

