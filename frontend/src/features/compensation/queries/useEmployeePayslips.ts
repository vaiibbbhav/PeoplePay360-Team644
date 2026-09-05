import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';

export type PayslipLine = {
  id: string;
  payslipId: string;
  ruleId?: string | null;
  code: string;
  name: string;
  category: 'basic' | 'allowance' | 'gross' | 'deduction' | 'net' | string;
  sequence: number;
  amount: string | number;
};

export type EmployeePayslip = {
  id: string;
  payrun_id: string;
  payrun_name: string;
  employee_id: string;
  employee_name: string;
  employee_email: string;
  structure_id: string;
  structure_name: string;
  period_start: string;
  period_end: string;
  worked_days: string | number;
  basic_salary: string | number;
  gross_salary: string | number;
  total_deductions: string | number;
  net_salary: string | number;
  status: string;
  warnings?: Array<{ message: string; severity: string }> | null;
  created_at: string;
};

export type PayslipDetail = EmployeePayslip & {
  employee_phone?: string | null;
  identification_number?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_routing_code?: string | null;
  department_name?: string | null;
  job_position_title?: string | null;
  lines: PayslipLine[];
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
};

// 1. Private API Request functions
const fetchPayslipsApi = async (employeeId?: string): Promise<EmployeePayslip[]> => {
  const params = employeeId ? { employeeId } : {};
  const { data } = await api.get<EmployeePayslip[]>('/payslips', { params });
  return data;
};

const fetchPayslipByIdApi = async (id: string): Promise<PayslipDetail> => {
  const { data } = await api.get<PayslipDetail>(`/payslips/${id}`);
  return data;
};

const fetchContractsApi = async (employeeId?: string): Promise<EmployeeContract[]> => {
  const params = employeeId ? { employeeId } : {};
  const { data } = await api.get<EmployeeContract[]>('/contracts', { params });
  return data;
};

// 2. Exported React Query Hooks
export const useEmployeePayslips = (employeeId?: string) => {
  return useQuery({
    queryKey: ['payslips', employeeId || 'all'],
    queryFn: () => fetchPayslipsApi(employeeId),
    staleTime: 60 * 1000,
  });
};

export const useAllCompanyPayslips = (payrunId?: string) => {
  return useQuery({
    queryKey: ['payslips', 'company-all', payrunId || 'all'],
    queryFn: async () => {
      const params = payrunId ? { payrunId } : {};
      const { data } = await api.get<EmployeePayslip[]>('/payslips', { params });
      return data;
    },
    staleTime: 30 * 1000,
  });
};

export const usePayslipDetail = (id?: string | null) => {
  return useQuery({
    queryKey: ['payslip', id],
    queryFn: () => fetchPayslipByIdApi(id!),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
};

export const useEmployeeContracts = (employeeId?: string) => {
  return useQuery({
    queryKey: ['contracts', employeeId || 'all'],
    queryFn: () => fetchContractsApi(employeeId),
    staleTime: 60 * 1000,
  });
};
