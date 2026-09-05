import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { publicApi, api } from '@/api/apiClient';

export type UserRole =
  'Employee' | 'HR Manager' | 'HR Payroll User' | 'HR Payroll Manager' | 'Admin';

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  isEmailVerified?: boolean;
  employeeId?: string | null;
  employee?: {
    id: string;
    employmentStatus?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthResponse = {
  user: User;
  token: string;
};

// 1. Private API Request functions
// Public endpoints use publicApi
const loginApi = async (input: LoginInput): Promise<AuthResponse> => {
  const { data } = await publicApi.post<AuthResponse>('/auth/login', input);
  return data;
};

// Protected endpoints use api
const getMeApi = async (): Promise<User> => {
  const { data } = await api.get<User>('/auth/me');
  return data;
};

const logoutApi = async (): Promise<void> => {
  await api.post('/auth/logout');
};

const resendVerificationApi = async (
  email: string,
): Promise<{ success: boolean; message: string }> => {
  const { data } = await publicApi.post<{ success: boolean; message: string }>(
    '/auth/resend-verification',
    { email },
  );
  return data;
};

// 2. Exported React Query Hooks
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getMeApi,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};

export const useLoginMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data.user);
    },
  });
};

export const useResendVerificationMutation = () => {
  return useMutation({
    mutationFn: resendVerificationApi,
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return async () => {
    try {
      await logoutApi();
    } catch {
      // ignore
    }
    queryClient.clear();
    window.location.href = '/login';
  };
};
