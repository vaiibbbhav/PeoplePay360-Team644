import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';

// 1. Domain Types
export type TimeOffType = {
  id: string;
  name: string;
  code: string;
  unit: 'days' | 'hours' | string;
  requiresAllocation: boolean;
  approvalType: 'hr_only' | 'manager_and_hr' | 'auto' | string;
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
  department_name?: string;
  time_off_type_id: string;
  type_name: string;
  type_unit: string;
  is_paid?: boolean;
  allocated_amount: string | number;
  taken_amount: string | number;
  remaining_amount: string | number;
  valid_from: string;
  valid_to: string;
  status: 'draft' | 'approved' | 'refused' | string;
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
  department_id?: string | null;
  department_name?: string | null;
  job_position_title?: string | null;
  manager_id?: string | null;
  time_off_type_id: string;
  type_name: string;
  type_code?: string;
  type_unit: string;
  is_paid?: boolean;
  requires_allocation?: boolean;
  start_date: string;
  end_date: string;
  duration: string | number;
  reason?: string | null;
  status: 'pending' | 'approved' | 'refused' | 'cancelled' | string;
  approved_by?: string | null;
  approved_at?: string | null;
  refused_reason?: string | null;
  created_at: string;
  updated_at?: string;
};

export type LeaveBalanceItem = {
  typeId: string;
  typeName: string;
  typeCode: string;
  unit: string;
  requiresAllocation: boolean;
  isPaid: boolean;
  allocated: number;
  taken: number;
  remaining: number;
  hasActiveAllocation: boolean;
};

export type TimeOffMeta = {
  isManager: boolean;
  employeeId: string | null;
  role: string;
};

export type CreateLeaveRequestPayload = {
  employeeId: string;
  timeOffTypeId: string;
  startDate: string;
  endDate: string;
  duration: number;
  reason?: string | null;
};

export type CreateTimeOffRequestPayload = CreateLeaveRequestPayload;

export type CreateAllocationPayload = {
  employeeId: string;
  timeOffTypeId: string;
  allocatedAmount: number;
  validFrom: string;
  validTo: string;
};

export type CreateTimeOffTypePayload = {
  name: string;
  code: string;
  unit: 'days' | 'hours';
  requiresAllocation: boolean;
  approvalType: 'hr_only' | 'manager_and_hr' | 'auto';
  isPaid: boolean;
  isActive: boolean;
};

// 2. React Query Hooks

export const useTimeOffMeta = () => {
  return useQuery<TimeOffMeta>({
    queryKey: ['timeoff', 'meta'],
    queryFn: async () => {
      const { data } = await api.get<TimeOffMeta>('/time-off/meta');
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useLeaveBalances = (employeeId?: string) => {
  return useQuery<LeaveBalanceItem[]>({
    queryKey: ['timeoff', 'balances', employeeId],
    queryFn: async () => {
      const params = employeeId ? { employeeId } : {};
      const { data } = await api.get<LeaveBalanceItem[]>('/time-off/balances', { params });
      return data;
    },
    staleTime: 60 * 1000,
  });
};

export const useTimeOffTypes = () => {
  return useQuery<TimeOffType[]>({
    queryKey: ['timeoff', 'types'],
    queryFn: async () => {
      try {
        const { data } = await api.get<TimeOffType[]>('/time-off/types');
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('Could not fetch time off types from API, using defaults:', err);
      }
      return [
        {
          id: 'tot-annual-001',
          name: 'Paid Annual Vacation',
          code: 'ANNUAL',
          unit: 'days',
          requiresAllocation: true,
          approvalType: 'manager_and_hr',
          isPaid: true,
          isActive: true,
        },
        {
          id: 'tot-sick-002',
          name: 'Sick & Medical Leave',
          code: 'SICK',
          unit: 'days',
          requiresAllocation: true,
          approvalType: 'hr_only',
          isPaid: true,
          isActive: true,
        },
        {
          id: 'tot-casual-003',
          name: 'Casual / Personal Leave',
          code: 'CASUAL',
          unit: 'days',
          requiresAllocation: true,
          approvalType: 'manager_and_hr',
          isPaid: true,
          isActive: true,
        },
        {
          id: 'tot-parental-004',
          name: 'Parental Leave',
          code: 'PARENTAL',
          unit: 'days',
          requiresAllocation: true,
          approvalType: 'hr_only',
          isPaid: true,
          isActive: true,
        },
        {
          id: 'tot-unpaid-005',
          name: 'Unpaid Leave (LWP)',
          code: 'UNPAID',
          unit: 'days',
          requiresAllocation: false,
          approvalType: 'manager_and_hr',
          isPaid: false,
          isActive: true,
        },
      ];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useTimeOffAllocations = (employeeId?: string) => {
  return useQuery<TimeOffAllocation[]>({
    queryKey: ['timeoff', 'allocations', employeeId],
    queryFn: async () => {
      const params = employeeId ? { employeeId } : {};
      const { data } = await api.get<TimeOffAllocation[]>('/time-off/allocations', { params });
      return data;
    },
    staleTime: 60 * 1000,
  });
};

export type TimeOffRequestFilters =
  | string
  | {
      scope?: 'team' | 'self' | 'all';
      employeeId?: string;
      status?: string;
    };

export const useTimeOffRequests = (filters?: TimeOffRequestFilters) => {
  const params = typeof filters === 'string' ? { employeeId: filters } : filters;

  return useQuery<TimeOffRequest[]>({
    queryKey: [
      'timeoff',
      'requests',
      typeof filters === 'object' ? filters?.scope : undefined,
      typeof filters === 'object' ? filters?.employeeId : filters,
      typeof filters === 'object' ? filters?.status : undefined,
    ],
    queryFn: async () => {
      const { data } = await api.get<TimeOffRequest[]>('/time-off/requests', { params });
      return data;
    },
    staleTime: 30 * 1000,
  });
};

export const useTeamLeaveRequests = () => {
  return useQuery<TimeOffRequest[]>({
    queryKey: ['timeoff', 'requests', 'team'],
    queryFn: async () => {
      const { data } = await api.get<TimeOffRequest[]>('/time-off/requests', {
        params: { scope: 'team' },
      });
      return data;
    },
    staleTime: 30 * 1000,
  });
};

export const useCreateLeaveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateLeaveRequestPayload) => {
      const { data } = await api.post<TimeOffRequest>('/time-off/requests', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeoff'] });
    },
  });
};

export const useCreateTimeOffRequest = useCreateLeaveRequest;

export const useApproveLeaveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      const { data } = await api.post(`/time-off/requests/${requestId}/approve`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeoff'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useApproveRequest = useApproveLeaveRequest;

export const useRefuseLeaveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { requestId?: string; id?: string; reason?: string }) => {
      const targetId = args.requestId || args.id;
      const { data } = await api.post(`/time-off/requests/${targetId}/refuse`, {
        reason: args.reason,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeoff'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useRefuseRequest = useRefuseLeaveRequest;

export const useCreateAllocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateAllocationPayload) => {
      const { data } = await api.post<TimeOffAllocation>('/time-off/allocations', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeoff', 'allocations'] });
      queryClient.invalidateQueries({ queryKey: ['timeoff', 'balances'] });
    },
  });
};

export const useApproveAllocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (allocationId: string) => {
      const { data } = await api.post(`/time-off/allocations/${allocationId}/approve`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeoff', 'allocations'] });
      queryClient.invalidateQueries({ queryKey: ['timeoff', 'balances'] });
    },
  });
};

export const useCreateTimeOffType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTimeOffTypePayload) => {
      const { data } = await api.post<TimeOffType>('/time-off/types', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeoff', 'types'] });
    },
  });
};
