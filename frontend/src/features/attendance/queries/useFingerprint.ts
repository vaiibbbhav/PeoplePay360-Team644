import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type PunchResult = {
  success: boolean;
  matched: boolean;
  action?: 'PUNCH_IN' | 'PUNCH_OUT';
  employeeId?: string;
  employeeCode?: string;
  employeeName?: string;
  employeeEmail?: string;
  status?: string;
  checkIn?: string | null;
  checkOut?: string | null;
  time?: string;
  announcement?: string;
  workedHours?: number | string;
  message?: string;
  score?: number;
};

export type FingerprintStatusResponse = {
  employeeId: string;
  enrolled: boolean;
};

export type TodayAttendanceStatus = {
  employeeId?: string;
  hasFingerprint?: boolean;
  punchedIn: boolean;
  checkIn?: string | null;
  checkOut?: string | null;
  workedHours?: number | string;
  status?: string;
};

import { fingerprintApi } from '@/api/apiClient';

/**
 * Check if an employee has a registered fingerprint in NeonDB
 */
export async function fetchFingerprintStatus(
  employeeId: string,
): Promise<FingerprintStatusResponse> {
  if (!employeeId) return { employeeId: '', enrolled: false };
  try {
    const res = await fingerprintApi.get(`/status/${encodeURIComponent(employeeId)}`);
    return res.data?.data || { employeeId, enrolled: false };
  } catch (err) {
    console.warn('Could not fetch fingerprint status:', err);
    return { employeeId, enrolled: false };
  }
}

/**
 * Enroll a new fingerprint template (AES-256-GCM encrypted in Spring Boot)
 */
export async function enrollFingerprint(employeeId: string, imageBase64: string) {
  const res = await fingerprintApi.post('/enroll', { id: employeeId, image: imageBase64 });
  const data = res.data;
  if (!data?.success) {
    throw new Error(data?.message || 'Failed to enroll fingerprint template');
  }
  return data;
}

export type PunchFingerprintParams = {
  imageBase64: string;
  employeeCode?: string;
};

type PunchApiPayload = Partial<PunchResult> & {
  employee_name?: string;
};

/**
 * Biometric match and Punch In / Punch Out
 * When employeeCode is provided, performs direct 1:1 biometric verification.
 */
export async function punchWithFingerprint(
  params: string | PunchFingerprintParams,
): Promise<PunchResult> {
  const imageBase64 = typeof params === 'string' ? params : params.imageBase64;
  const employeeCode = typeof params === 'object' ? params.employeeCode?.trim() : undefined;

  try {
    const res = await fingerprintApi.post('/punch', {
      image: imageBase64,
      employeeCode: employeeCode || undefined,
    });
    const payload = (res.data?.data ?? res.data) as PunchApiPayload;
    const employeeName = payload.employeeName ?? payload.employee_name;
    const matched = Boolean(payload.matched);

    console.info('[Fingerprint punch] Resolved response', {
      action: payload.action,
      employeeCode: payload.employeeCode,
      employeeId: payload.employeeId,
      employeeName,
      matched,
    });
    const rawScore = payload?.score;
    const numScore =
      typeof rawScore === 'number' && !isNaN(rawScore) ? rawScore : matched ? 88.0 : 0.0;

    return {
      ...payload,
      employeeName,
      success: Boolean(payload.success || matched),
      matched,
      score: numScore,
      message: payload?.message || (matched ? 'Successfully Punched' : 'No user exists'),
    } as PunchResult;
  } catch (err: any) {
    const data = err?.response?.data;
    const rawScore = data?.data?.score ?? data?.score;
    return {
      success: false,
      matched: false,
      score: typeof rawScore === 'number' ? rawScore : 0,
      message: data?.message || 'No user exists',
    };
  }
}

/**
 * Fetch today's attendance status
 */
export async function fetchTodayAttendance(employeeId: string): Promise<TodayAttendanceStatus> {
  if (!employeeId) return { punchedIn: false };
  try {
    const res = await fingerprintApi.get(`/attendance-status/${encodeURIComponent(employeeId)}`);
    return res.data?.data || { punchedIn: false };
  } catch {
    return { punchedIn: false };
  }
}

// React Query Hooks
export function useFingerprintStatus(employeeId?: string) {
  return useQuery({
    queryKey: ['fingerprint-status', employeeId],
    queryFn: () => fetchFingerprintStatus(employeeId || ''),
    enabled: Boolean(employeeId),
    staleTime: 30 * 1000,
  });
}

export function useTodayAttendance(employeeId?: string) {
  return useQuery({
    queryKey: ['today-attendance', employeeId],
    queryFn: () => fetchTodayAttendance(employeeId || ''),
    enabled: Boolean(employeeId),
    refetchInterval: 15 * 1000,
  });
}

export function useEnrollFingerprint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, imageBase64 }: { employeeId: string; imageBase64: string }) =>
      enrollFingerprint(employeeId, imageBase64),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fingerprint-status', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['fingerprint', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['today-attendance', variables.employeeId] });
    },
  });
}

export function usePunchFingerprint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: string | PunchFingerprintParams) => punchWithFingerprint(params),
    onSuccess: (data) => {
      if (data.employeeId) {
        queryClient.invalidateQueries({ queryKey: ['today-attendance', data.employeeId] });
        queryClient.invalidateQueries({ queryKey: ['attendance'] });
      }
    },
  });
}
