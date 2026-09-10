import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';

export type PayrunStatus = 'draft' | 'computed' | 'validated' | 'paid';

export type PayrunItem = {
  id: string;
  name: string;
  salary_structure_id: string;
  salary_structure_name: string;
  period_start: string;
  period_end: string;
  status: PayrunStatus;
  total_basic: string | number;
  total_gross: string | number;
  total_deductions: string | number;
  total_net: string | number;
  payslip_count: number;
  warnings?: Array<{ employeeId: string; message: string; severity: string }> | null;
  notes?: string | null;
  created_at: string;
  payslips?: PayslipSummary[];
};

export type PayslipSummary = {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_email: string;
  net_salary: string | number;
  gross_salary: string | number;
  basic_salary: string | number;
  total_deductions: string | number;
  worked_days: string | number;
  status: string;
  warnings?: Array<{ message: string; severity: string }> | null;
};

export type SalaryStructure = {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean;
};

export type EligibleEmployee = {
  employee: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    department_name?: string | null;
    job_position_title?: string | null;
  };
  hasActiveContract: boolean;
  activeContract?: {
    id: string;
    name: string;
    wage: string | number;
    wage_type: string;
  } | null;
  hasBankDetails: boolean;
  eligible: boolean;
};

export type CreatePayrunPayload = {
  name: string;
  salaryStructureId: string;
  periodStart: string;
  periodEnd: string;
  employeeIds: string[];
  notes?: string;
};

// API call functions
const fetchPayrunsApi = async (): Promise<PayrunItem[]> => {
  const { data } = await api.get<PayrunItem[]>('/payroll/payruns');
  return data;
};

const fetchPayrunByIdApi = async (id: string): Promise<PayrunItem> => {
  const { data } = await api.get<PayrunItem>(`/payroll/payruns/${id}`);
  return data;
};

const fetchSalaryStructuresApi = async (): Promise<SalaryStructure[]> => {
  const { data } = await api.get<SalaryStructure[]>('/payroll/structures');
  return data;
};

const fetchEligibleEmployeesApi = async (
  periodStart: string,
  periodEnd: string,
): Promise<EligibleEmployee[]> => {
  const { data } = await api.get<EligibleEmployee[]>('/payroll/wizard/eligible-employees', {
    params: { periodStart, periodEnd },
  });
  return data;
};

const createPayrunApi = async (payload: CreatePayrunPayload): Promise<PayrunItem> => {
  const { data } = await api.post<PayrunItem>('/payroll/payruns', payload);
  return data;
};

const validatePayrunApi = async (id: string): Promise<PayrunItem> => {
  const { data } = await api.post<PayrunItem>(`/payroll/payruns/${id}/validate`);
  return data;
};

const markPayrunPaidApi = async (id: string): Promise<PayrunItem> => {
  const { data } = await api.post<PayrunItem>(`/payroll/payruns/${id}/mark-paid`);
  return data;
};

// Exported React Query hooks
export const usePayrunsList = () => {
  return useQuery({
    queryKey: ['payruns'],
    queryFn: fetchPayrunsApi,
    staleTime: 60 * 1000,
  });
};

export const usePayrunById = (id?: string | null) => {
  return useQuery({
    queryKey: ['payrun', id],
    queryFn: () => fetchPayrunByIdApi(id!),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });
};

export const useSalaryStructures = () => {
  return useQuery({
    queryKey: ['salary-structures'],
    queryFn: fetchSalaryStructuresApi,
    staleTime: 5 * 60 * 1000,
  });
};

export const useEligibleEmployees = (periodStart?: string, periodEnd?: string) => {
  return useQuery({
    queryKey: ['eligible-employees', periodStart, periodEnd],
    queryFn: () => fetchEligibleEmployeesApi(periodStart!, periodEnd!),
    enabled: Boolean(periodStart && periodEnd),
    staleTime: 60 * 1000,
  });
};

export const useCreatePayrun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPayrunApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
    },
  });
};

export const useValidatePayrun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: validatePayrunApi,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      queryClient.invalidateQueries({ queryKey: ['payrun', id] });
    },
  });
};

export const useMarkPayrunPaid = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markPayrunPaidApi,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      queryClient.invalidateQueries({ queryKey: ['payrun', id] });
    },
  });
};

const sendPayslipsApi = async (
  id: string,
): Promise<{ sent: number; failed: number; total: number }> => {
  const { data } = await api.post<{ sent: number; failed: number; total: number }>(
    `/payroll/payruns/${id}/send-payslips`,
  );
  return data;
};

export const useSendPayslips = () => {
  return useMutation({
    mutationFn: sendPayslipsApi,
  });
};
