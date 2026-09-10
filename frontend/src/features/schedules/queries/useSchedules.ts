import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';

export type ScheduleLineItem = {
  id?: string;
  scheduleId?: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string;
  endTime: string;
  breakMinutes: number;
};

export type ScheduleItem = {
  id: string;
  name: string;
  weeklyHours: number;
  isActive: boolean;
  createdAt: string;
  employeeCount: number;
  activeContractCount?: number;
  lines: ScheduleLineItem[];
};

export type CreateSchedulePayload = {
  name: string;
  isActive?: boolean;
  lines: Array<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    breakMinutes: number;
  }>;
};

export type UpdateSchedulePayload = {
  id: string;
  data: Partial<CreateSchedulePayload>;
};

export const useSchedulesList = () => {
  return useQuery<ScheduleItem[]>({
    queryKey: ['schedules'],
    queryFn: async () => {
      const response = await api.get<ScheduleItem[]>('/schedules');
      return response.data;
    },
  });
};

export const useScheduleDetail = (id: string | null | undefined) => {
  return useQuery<ScheduleItem>({
    queryKey: ['schedules', id],
    queryFn: async () => {
      const response = await api.get<ScheduleItem>(`/schedules/${id}`);
      return response.data;
    },
    enabled: Boolean(id),
  });
};

export const useCreateSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateSchedulePayload) => {
      const response = await api.post<ScheduleItem>('/schedules', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
};

export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: UpdateSchedulePayload) => {
      const response = await api.put<ScheduleItem>(`/schedules/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
};

export const useDeleteSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<{ success: boolean; message: string }>(`/schedules/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
};
