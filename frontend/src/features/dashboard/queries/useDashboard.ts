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

export type DashboardOverviewResponse = {
  kpis: DashboardKpis;
  attendance: DashboardAttendance;
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
