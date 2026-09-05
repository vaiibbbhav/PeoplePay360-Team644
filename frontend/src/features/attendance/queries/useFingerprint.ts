import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type PunchResult = {
  success: boolean;
  matched: boolean;
  action?: 'PUNCH_IN' | 'PUNCH_OUT';
  employeeId?: string;
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

const FINGERPRINT_API_BASE = '/api/fingerprint';

/**
 * Check if an employee has a registered fingerprint in NeonDB
 */
export async function fetchFingerprintStatus(employeeId: string): Promise<FingerprintStatusResponse> {
  if (!employeeId) return { employeeId: '', enrolled: false };
  try {
    const res = await fetch(`${FINGERPRINT_API_BASE}/status/${encodeURIComponent(employeeId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data || { employeeId, enrolled: false };
  } catch (err) {
    console.warn('Could not fetch fingerprint status:', err);
    return { employeeId, enrolled: false };
  }
}

/**
 * Enroll a new fingerprint template (AES-256-GCM encrypted in Spring Boot)
 */
export async function enrollFingerprint(employeeId: string, imageBase64: string) {
  const res = await fetch(`${FINGERPRINT_API_BASE}/enroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: employeeId, image: imageBase64 }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to enroll fingerprint template');
  }
  return data;
}

/**
 * Biometric match and Punch In / Punch Out
 */
export async function punchWithFingerprint(imageBase64: string): Promise<PunchResult> {
  const res = await fetch(`${FINGERPRINT_API_BASE}/punch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64 }),
  });
  const data = await res.json().catch(() => ({}));
  // If no match found or HTTP error
  if (!res.ok) {
    const rawScore = data?.data?.score ?? data?.score;
    return {
      success: false,
      matched: false,
      score: typeof rawScore === 'number' ? rawScore : 0,
      message: data.message || 'No user exists',
    };
  }

  const payload = (data.data || data) as Record<string, any>;
  const matched = Boolean(payload.matched);
  const rawScore = payload.score;
  const numScore =
    typeof rawScore === 'number' && !isNaN(rawScore)
      ? rawScore
      : matched
      ? 88.0
      : 0.0;

  return {
    ...payload,
    success: Boolean(payload.success || matched),
    matched,
    score: numScore,
    message: payload.message || (matched ? 'Successfully Punched' : 'No user exists'),
  } as PunchResult;
}

/**
 * Fetch today's attendance status
 */
export async function fetchTodayAttendance(employeeId: string): Promise<TodayAttendanceStatus> {
  if (!employeeId) return { punchedIn: false };
  try {
    const res = await fetch(`${FINGERPRINT_API_BASE}/attendance-status/${encodeURIComponent(employeeId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data || { punchedIn: false };
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
    mutationFn: (imageBase64: string) => punchWithFingerprint(imageBase64),
    onSuccess: (data) => {
      if (data.employeeId) {
        queryClient.invalidateQueries({ queryKey: ['today-attendance', data.employeeId] });
        queryClient.invalidateQueries({ queryKey: ['attendance'] });
      }
    },
  });
}
