import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';

export type AttendanceRecord = {
  id: string;
  employee_id: string;
  employee_name?: string;
  employee_email?: string;
  date: string; // YYYY-MM-DD
  check_in: string | null;
  check_out: string | null;
  worked_hours: string | number;
  status: 'Present' | 'Late' | 'Absent' | 'Half-Day' | string;
  exception_note: string | null;
  is_manual_edit: boolean;
  created_at: string;
  updated_at: string;
};

export type FingerprintRecord = {
  id: string;
  employee_id: string;
  encrypted_template: string;
  encryted_template?: string;
  created_at?: string;
  updated_at?: string;
};

type AttendanceFilterParams = {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
};

// 1. API Functions
const getAttendanceApi = async (params?: AttendanceFilterParams): Promise<AttendanceRecord[]> => {
  try {
    const { data } = await api.get<AttendanceRecord[]>('/attendance', { params });
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const LOCAL_STORAGE_FP_KEY = 'peoplepay_employee_fingerprint_';

const getFingerprintApi = async (employeeId: string): Promise<FingerprintRecord | null> => {
  const saved = localStorage.getItem(LOCAL_STORAGE_FP_KEY + employeeId);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  return {
    id: 'fp-client-001',
    employee_id: employeeId,
    encrypted_template: 'FP_SHA256_a9c4b78e12d45ef88902bca4710398f5960d7c3b2e1a',
    encryted_template: 'FP_SHA256_a9c4b78e12d45ef88902bca4710398f5960d7c3b2e1a',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

const updateFingerprintApi = async (payload: {
  employeeId: string;
  encryptedTemplate?: string;
  encrytedTemplate?: string;
}): Promise<FingerprintRecord> => {
  const tmpl = payload.encryptedTemplate || payload.encrytedTemplate || 'AES-256-GCM';
  const record: FingerprintRecord = {
    id: `fp-${Date.now()}`,
    employee_id: payload.employeeId,
    encrypted_template: tmpl,
    encryted_template: tmpl,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  localStorage.setItem(LOCAL_STORAGE_FP_KEY + payload.employeeId, JSON.stringify(record));
  return record;
};

const checkInApi = async (payload: {
  employeeId: string;
  checkIn: string;
}): Promise<AttendanceRecord> => {
  const { data } = await api.post<AttendanceRecord>('/attendance/check-in', payload);
  return data;
};

const checkOutApi = async (payload: {
  employeeId: string;
  checkOut: string;
}): Promise<AttendanceRecord> => {
  const { data } = await api.post<AttendanceRecord>('/attendance/check-out', payload);
  return data;
};

export type SaveManualAttendancePayload = {
  id?: string;
  employeeId: string;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  workedHours?: number;
  status: 'Present' | 'Late' | 'Absent' | 'Overtime' | 'Half-day' | string;
  exceptionNote?: string | null;
};

// 2. Exported React Query Hooks
export const useAttendanceList = (params?: AttendanceFilterParams) => {
  return useQuery({
    queryKey: ['attendance', params?.employeeId, params?.startDate, params?.endDate],
    queryFn: () => getAttendanceApi(params),
    staleTime: 60 * 1000,
  });
};

export const useFingerprint = (employeeId?: string) => {
  return useQuery({
    queryKey: ['fingerprint', employeeId],
    queryFn: () => getFingerprintApi(employeeId || 'emp-001'),
    enabled: Boolean(employeeId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateFingerprint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFingerprintApi,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fingerprint', variables.employeeId] });
    },
  });
};

export const useCheckIn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: checkInApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
};

export const useCheckOut = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: checkOutApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
};

export const useSaveManualAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SaveManualAttendancePayload) => {
      const { data } = await api.post<AttendanceRecord>('/attendance/manual', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
    },
  });
};

export const useDeleteAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/attendance/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
    },
  });
};
