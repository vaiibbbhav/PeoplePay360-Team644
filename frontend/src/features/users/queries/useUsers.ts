import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import type { UserRole } from '@/features/auth/queries/useAuth';

export interface UserItem {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  employeeId: string | null;
  createdAt: string;
  updatedAt: string;
  employee: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    workEmail: string;
    department: {
      id: string;
      name: string;
    } | null;
  } | null;
}

export interface EmployeeOption {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  jobTitle: string;
  departmentName: string | null;
  hasUserAccount: boolean;
}

export interface CreateUserInput {
  email: string;
  password: string;
  role: UserRole;
  employeeId?: string | null;
  isActive?: boolean;
}

export interface UpdateUserInput {
  password?: string;
  role?: UserRole;
  employeeId?: string | null;
  isActive?: boolean;
}

export interface UserQueryParams {
  search?: string;
  role?: string;
  isActive?: boolean;
}

// Fetchers
const fetchUsers = async (params?: UserQueryParams): Promise<UserItem[]> => {
  const { data } = await api.get<{ users: UserItem[] }>('/users', { params });
  return data.users;
};

const fetchEmployeeOptions = async (): Promise<EmployeeOption[]> => {
  const { data } = await api.get<{ employees: EmployeeOption[] }>('/users/employees-options');
  return data.employees;
};

const createUserApi = async (input: CreateUserInput): Promise<UserItem> => {
  const { data } = await api.post<{ user: UserItem }>('/users', input);
  return data.user;
};

const updateUserApi = async ({
  id,
  input,
}: {
  id: string;
  input: UpdateUserInput;
}): Promise<UserItem> => {
  const { data } = await api.put<{ user: UserItem }>(`/users/${id}`, input);
  return data.user;
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
