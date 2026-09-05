import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import type { UserRole } from '@/features/auth/queries/useAuth';

export type UserItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    employmentStatus: string;
  } | null;
};

export type EmployeeOption = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeNumber?: string;
  hasUserAccount?: boolean;
};

export type CreateUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  isActive?: boolean;
};

export type UpdateUserInput = {
  firstName?: string;
  lastName?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
};

export type UserQueryParams = {
  search?: string;
  role?: string;
  isActive?: boolean;
};

// Fetchers
const fetchUsers = async (params?: UserQueryParams): Promise<UserItem[]> => {
  const { data } = await api.get<any>('/users', { params });
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.users)) return data.users;
  return [];
};

const fetchEmployeeOptions = async (): Promise<EmployeeOption[]> => {
  const { data } = await api.get<any>('/users/employees-options');
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.employees)) return data.employees;
  return [];
};

const createUserApi = async (input: CreateUserInput): Promise<UserItem> => {
  const { data } = await api.post<any>('/users', input);
  return data?.user ?? data;
};

const updateUserApi = async ({
  id,
  input,
}: {
  id: string;
  input: UpdateUserInput;
}): Promise<UserItem> => {
  const { data } = await api.put<any>(`/users/${id}`, input);
  return data?.user ?? data;
};

const deleteUserApi = async (id: string): Promise<void> => {
  await api.delete(`/users/${id}`);
};

// React Query Hooks
export const useUsersList = (params?: UserQueryParams) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => fetchUsers(params),
    staleTime: 30 * 1000,
  });
};

export const useEmployeeOptions = () => {
  return useQuery({
    queryKey: ['users', 'employees-options'],
    queryFn: fetchEmployeeOptions,
    staleTime: 60 * 1000,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUserApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUserApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUserApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
