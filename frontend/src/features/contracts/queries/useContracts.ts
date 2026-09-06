import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';

export type ContractStatus = 'draft' | 'active' | 'expired' | 'cancelled' | 'terminated';
export type WageType = 'monthly' | 'hourly';

export type ContractItem = {
  id: string;
  employee_id: string;
  employee_name?: string;
  employee_email?: string;
  employee_avatar?: string | null;
  name: string;
  wage: string | number;
  wage_type: WageType;
  salary_structure_id: string;
  salary_structure_name?: string;
  working_schedule_id?: string | null;
  working_schedule_name?: string | null;
  department_id?: string | null;
  department_name?: string | null;
  job_position_id?: string | null;
  job_position_title?: string | null;
  start_date: string;
  end_date?: string | null;
  status: ContractStatus;
  notes?: string | null;
  created_at: string;
};

export type ContractsMeta = {
  employees: Array<{
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    departmentId?: string | null;
    jobPositionId?: string | null;
    workingScheduleId?: string | null;
    employmentStatus: string;
  }>;
  departments: Array<{ id: string; name: string }>;
  jobPositions: Array<{ id: string; title: string; departmentId?: string | null }>;
  salaryStructures: Array<{ id: string; name: string; code: string }>;
  workingSchedules: Array<{ id: string; name: string; weeklyHours: number }>;
};

export type CreateContractPayload = {
  employeeId: string;
  name: string;
  wage: number;
  wageType: WageType;
  salaryStructureId: string;
  workingScheduleId?: string | null;
  departmentId?: string | null;
  jobPositionId?: string | null;
  startDate: string;
  endDate?: string | null;
  status: ContractStatus;
  notes?: string | null;
};

export type UpdateContractPayload = {
  id: string;
  data: Partial<CreateContractPayload>;
};

export const useContractsList = (employeeId?: string) => {
  return useQuery<ContractItem[]>({
    queryKey: ['contracts', employeeId || 'all'],
    queryFn: async () => {
      const url = employeeId ? `/contracts?employeeId=${employeeId}` : '/contracts';
      const response = await api.get<ContractItem[]>(url);
      return response.data;
    },
  });
};

export const useContractDetail = (id: string | null | undefined) => {
  return useQuery<ContractItem>({
    queryKey: ['contracts', id],
    queryFn: async () => {
      const response = await api.get<ContractItem>(`/contracts/${id}`);
      return response.data;
    },
    enabled: Boolean(id),
  });
};

export const useContractsMeta = () => {
  return useQuery<ContractsMeta>({
    queryKey: ['contracts-meta'],
    queryFn: async () => {
      const response = await api.get<ContractsMeta>('/contracts/meta');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateContractPayload) => {
      const response = await api.post<ContractItem>('/contracts', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['employee-contracts'] });
    },
  });
};

export const useUpdateContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: UpdateContractPayload) => {
      const response = await api.put<ContractItem>(`/contracts/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['employee-contracts'] });
    },
  });
};
