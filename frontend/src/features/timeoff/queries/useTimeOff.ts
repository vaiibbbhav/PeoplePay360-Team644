import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';

export type TimeOffType = {
  id: string;
  name: string;
  code: string;
  unit: 'days' | 'hours';
  requiresAllocation: boolean;
  approvalType: string;
  isPaid: boolean;
  isActive: boolean;
  createdAt?: string;
};

export type TimeOffAllocation = {
  id: string;
  employee_id: string;
  employee_name?: string;
  employee_email?: string;
  employee_avatar?: string | null;
  time_off_type_id: string;
  type_name: string;
  type_unit: string;
  allocated_amount: string;
  taken_amount: string;
  remaining_amount: string;
  valid_from: string;
  valid_to: string;
  status: 'draft' | 'approved' | 'refused';
  approved_by?: string | null;
  approved_at?: string | null;
  created_at: string;
};

export type TimeOffRequest = {
  id: string;
  employee_id: string;
  employee_name?: string;
  employee_email?: string;
  employee_avatar?: string | null;
  time_off_type_id: string;
  type_name: string;
  type_unit: string;
  start_date: string;
  end_date: string;
  duration: string;
  reason?: string | null;
  status: 'pending' | 'approved' | 'refused';
  approved_by?: string | null;
  approved_at?: string | null;
  refused_reason?: string | null;
  created_at: string;
};

export type CreateTimeOffRequestPayload = {
  employeeId: string;
  timeOffTypeId: string;
  startDate: string;
  endDate: string;
  duration: number;
  reason?: string;
};

export type CreateAllocationPayload = {
  employeeId: string;
  timeOffTypeId: string;
  allocatedAmount: number;
  validFrom: string;
  validTo: string;
};

export const useTimeOffTypes = () => {
  return useQuery<TimeOffType[]>({
    queryKey: ['timeoff', 'types'],
    queryFn: async () => {
      const res = await api.get<TimeOffType[]>('/time-off/types');
      return res.data;
    },
  });
};

export const useTimeOffAllocations = (employeeId?: string) => {
  return useQuery<TimeOffAllocation[]>({
    queryKey: ['timeoff', 'allocations', employeeId],
    queryFn: async () => {
      const res = await api.get<TimeOffAllocation[]>('/time-off/allocations', {
        params: employeeId ? { employeeId } : undefined,
      });
      return res.data;
    },
  });
};

export const useTimeOffRequests = (employeeId?: string) => {
  return useQuery<TimeOffRequest[]>({
    queryKey: ['timeoff', 'requests', employeeId],
    queryFn: async () => {
      const res = await api.get<TimeOffRequest[]>('/time-off/requests', {
        params: employeeId ? { employeeId } : undefined,
      });
      return res.data;
    },
  });
};

export const useCreateTimeOffRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTimeOffRequestPayload) => {
      const res = await api.post<TimeOffRequest>('/time-off/requests', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeoff', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['timeoff', 'allocations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useApproveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/time-off/requests/${id}/approve`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeoff', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['timeoff', 'allocations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useRefuseRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const res = await api.post(`/time-off/requests/${id}/refuse`, { reason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeoff', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useCreateAllocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateAllocationPayload) => {
      const res = await api.post<TimeOffAllocation>('/time-off/allocations', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeoff', 'allocations'] });
    },
  });
};

export const useApproveAllocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/time-off/allocations/${id}/approve`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeoff', 'allocations'] });
    },
  });
};
