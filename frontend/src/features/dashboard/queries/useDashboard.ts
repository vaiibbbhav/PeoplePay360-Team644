import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';

export type DashboardKpis = {
  totalNetPaid: number;
  payslipsGenerated: number;
  averageSalary: number;
  approvedTimeOffDays: number;
  pendingTimeOffRequests: number;
  attendanceHealthScore: string;
};

export type DashboardAttendance = {
  present: number;
  late: number;
  absent: number;
  overtime: number;
  manualEdits: number;
};

export type DepartmentCost = {
  department: string;
  headcount: number;
  totalCost: number;
};

export type MonthlyTrend = {
  month: string;
  netSalary: number;
  grossSalary: number;
};

export type DashboardContractItem = {
  id: string;
  name: string;
  employee_id: string;
  employee_name?: string;
  wage: string | number;
  wage_type: string;
  status: string;
  start_date: string;
  end_date?: string | null;
};

export type DashboardScheduleItem = {
  id: string;
  name: string;
  weekly_hours: string | number;
  is_active: boolean;
};

export type DashboardContracts = {
  total: number;
  active: number;
  draft: number;
  expired: number;
  recent: DashboardContractItem[];
};

export type DashboardSchedules = {
  total: number;
  active: number;
  avgWeeklyHours: number;
  list: DashboardScheduleItem[];
};

export type DashboardOverviewResponse = {
  kpis: DashboardKpis;
  attendance: DashboardAttendance;
  contracts?: DashboardContracts;
  schedules?: DashboardSchedules;
  charts: {
    departmentBreakdown: DepartmentCost[];
    monthlyTrends: MonthlyTrend[];
  };
};

const fetchDashboardOverview = async (): Promise<DashboardOverviewResponse> => {
  const { data } = await api.get<DashboardOverviewResponse>('/reports/dashboard');
  return data;
};

export const useDashboardOverview = () => {
  return useQuery({
    queryKey: ['reports', 'dashboard'],
    queryFn: fetchDashboardOverview,
    staleTime: 60 * 1000,
  });
};
