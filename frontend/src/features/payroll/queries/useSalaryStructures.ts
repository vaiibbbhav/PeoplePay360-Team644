import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';

// --- Types ---

export type SalaryRuleCategory = 'basic' | 'allowance' | 'gross' | 'deduction' | 'net' | 'other';
export type ComputationMethod = 'fixed' | 'percentage' | 'formula';

export type SalaryRule = {
  id: string;
  structure_id: string;
  code: string;
  name: string;
  category: SalaryRuleCategory;
  sequence: number;
  computation_method: ComputationMethod;
  amount: number;
  percentage_of_code?: string | null;
  percentage?: number | null;
  formula?: string | null;
  is_active: boolean;
};

export type SalaryStructure = {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean;
};

export type SalaryStructureDetail = SalaryStructure & {
  rules: SalaryRule[];
};

export type CreateSalaryStructureInput = {
  name: string;
  code: string;
  description?: string;
};

export type CreateSalaryRuleInput = {
  structureId: string;
  code: string;
  name: string;
  category: SalaryRuleCategory;
  sequence: number;
  computationMethod: ComputationMethod;
  amount: number;
  percentageOfCode?: string;
  percentage?: number;
  formula?: string;
};

// --- API Calls ---

const fetchStructuresApi = async (): Promise<SalaryStructure[]> => {
  const { data } = await api.get<SalaryStructure[]>('/payroll/structures');
  return data;
};

const fetchStructureDetailApi = async (id: string): Promise<SalaryStructureDetail> => {
  const { data } = await api.get<SalaryStructureDetail>(`/payroll/structures/${id}`);
  return data;
};

const createStructureApi = async (input: CreateSalaryStructureInput): Promise<SalaryStructure> => {
  const { data } = await api.post<SalaryStructure>('/payroll/structures', input);
  return data;
};

const createRuleApi = async (input: CreateSalaryRuleInput): Promise<SalaryRule> => {
  const { data } = await api.post<SalaryRule>('/payroll/rules', input);
  return data;
};

// --- Hooks ---

export const useSalaryStructuresList = () => {
  return useQuery({
    queryKey: ['salary-structures'],
    queryFn: fetchStructuresApi,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSalaryStructureDetail = (id?: string | null) => {
  return useQuery({
    queryKey: ['salary-structure', id],
    queryFn: () => fetchStructureDetailApi(id!),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
};

export const useCreateSalaryStructure = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createStructureApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-structures'] });
    },
  });
};

export const useCreateSalaryRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRuleApi,
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['salary-structure', vars.structureId] });
      queryClient.invalidateQueries({ queryKey: ['salary-structures'] });
    },
  });
};
