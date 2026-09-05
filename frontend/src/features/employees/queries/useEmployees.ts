import { useMutation, useQuery, useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';

export type EmploymentStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';

export type EmployeeListItem = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  department_id: string | null;
  department_name: string | null;
  job_position_id: string | null;
  job_position_title: string | null;
  manager_id: string | null;
  manager_name: string | null;
  working_schedule_id: string | null;
  working_schedule_name: string | null;
  employment_status: EmploymentStatus;
  date_of_joining: string;
  date_of_birth: string | null;
  gender: string | null;
  identification_number: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_routing_code: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type EmployeeHubDetails = EmployeeListItem & {
  weekly_hours?: string | null;
  smartCounts: {
    contracts: number;
    attendance: number;
    timeOff: number;
    payslips: number;
  };
};

export type EmployeeMetaOptions = {
  departments: Array<{ id: string; name: string }>;
  jobPositions: Array<{ id: string; title: string; departmentId: string | null }>;
  workingSchedules: Array<{ id: string; name: string; weeklyHours: string }>;
  managers: Array<{ id: string; name: string; email: string }>;
};

export type CreateEmployeeInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  departmentId?: string | null;
  jobPositionId?: string | null;
  managerId?: string | null;
  workingScheduleId?: string | null;
  employmentStatus?: EmploymentStatus;
  dateOfJoining?: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  identificationNumber?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankRoutingCode?: string | null;
  avatarUrl?: string | null;
};

export type UpdateEmployeeInput = Partial<CreateEmployeeInput>;

// 1. API Fetchers
const fetchEmployees = async (): Promise<EmployeeListItem[]> => {
  const { data } = await api.get<EmployeeListItem[]>('/employees');
  return data;
};

const fetchEmployeeHub = async (id: string): Promise<EmployeeHubDetails> => {
  const { data } = await api.get<EmployeeHubDetails>(`/employees/${id}/hub`);
  return data;
};

const fetchEmployeeMeta = async (): Promise<EmployeeMetaOptions> => {
  const { data } = await api.get<EmployeeMetaOptions>('/employees/meta');
  return data;
};

const createEmployeeApi = async (input: CreateEmployeeInput): Promise<EmployeeListItem> => {
  const { data } = await api.post<EmployeeListItem>('/employees', input);
  return data;
};

const updateEmployeeApi = async ({
  id,
  input,
}: {
  id: string;
  input: UpdateEmployeeInput;
}): Promise<EmployeeListItem> => {
  const { data } = await api.put<EmployeeListItem>(`/employees/${id}`, input);
  return data;
};

const deleteEmployeeApi = async (id: string): Promise<void> => {
  await api.delete(`/employees/${id}`);
};

// 2. Exported React Query Hooks
export const useEmployeesList = () => {
  return useQuery({
    queryKey: ['employees', 'list'],
    queryFn: fetchEmployees,
  });
};

export const useEmployeeHub = (id: string | undefined) => {
  return useQuery({
    queryKey: ['employees', 'hub', id],
    queryFn: () => fetchEmployeeHub(id!),
    enabled: !!id,
  });
};

export const useSuspenseEmployeeHub = (id: string) => {
  return useSuspenseQuery({
    queryKey: ['employees', 'hub', id],
    queryFn: () => fetchEmployeeHub(id),
  });
};

export const useEmployeeMeta = () => {
  return useQuery({
    queryKey: ['employees', 'meta'],
    queryFn: fetchEmployeeMeta,
    staleTime: 60 * 1000,
  });
};

export const useSuspenseEmployeeMeta = () => {
  return useSuspenseQuery({
    queryKey: ['employees', 'meta'],
    queryFn: fetchEmployeeMeta,
    staleTime: 60 * 1000,
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEmployeeApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateEmployeeApi,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees', 'hub', variables.id] });
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEmployeeApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export type EmployeePayslip = {
  id: string;
  payrun_id: string;
  period_start: string;
  period_end: string;
  worked_days: string;
  basic_salary: string;
  gross_salary: string;
  total_deductions: string;
  net_salary: string;
  status: 'draft' | 'computed' | 'validated' | 'paid';
  warnings: any[];
  created_at: string;
};

export const fetchEmployeePayslips = async (employeeId: string): Promise<EmployeePayslip[]> => {
  const response = await api.get<EmployeePayslip[]>(`/employees/${employeeId}/payslips`);
  return response.data;
};

export const useEmployeePayslips = (employeeId: string) => {
  return useQuery({
    queryKey: ['employees', employeeId, 'payslips'],
    queryFn: () => fetchEmployeePayslips(employeeId),
    enabled: Boolean(employeeId),
  });
};

export type EmployeeContract = {
  id: string;
  employee_id: string;
  name: string;
  wage: string;
  wage_type: string;
  salary_structure_id: string;
  salary_structure_name?: string | null;
  department_id?: string | null;
  job_position_id?: string | null;
  start_date: string;
  end_date?: string | null;
  status: 'draft' | 'active' | 'expired' | 'terminated';
  notes?: string | null;
  created_at?: string;
};

export const fetchEmployeeContracts = async (employeeId: string): Promise<EmployeeContract[]> => {
  const { data } = await api.get<EmployeeContract[]>('/contracts', { params: { employeeId } });
  return data;
};

export const useEmployeeContracts = (employeeId: string) => {
  return useQuery({
    queryKey: ['employees', employeeId, 'contracts'],
    queryFn: () => fetchEmployeeContracts(employeeId),
    enabled: Boolean(employeeId),
  });
};
