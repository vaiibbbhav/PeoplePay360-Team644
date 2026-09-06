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

// ── Admin System Administration & Access Hygiene Console ──

export type IncompleteEmployeeItem = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfJoining: string;
};

export type DeactivatedUserItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  updatedAt: string | null;
};

export type AdminAttention = {
  incompleteProfiles: {
    count: number;
    items: IncompleteEmployeeItem[];
  };
  deactivatedAccounts: {
    count30Days: number;
    totalCount: number;
    items: DeactivatedUserItem[];
  };
  unassignedRolesCount: number;
};

export type AdminAccessSnapshot = {
  totalActiveUsers: number;
  totalUsers: number;
  roleBreakdown: Record<string, number>;
  createdThisWeek: {
    count: number;
    sample: Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
      createdAt: string | null;
    }>;
  };
};

export type AdminAnomalies = {
  employeesWithoutContract: {
    count: number;
    items: Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      departmentName: string | null;
    }>;
  };
  draftPayruns: {
    count: number;
    items: Array<{
      id: string;
      name: string;
      periodStart: string;
      periodEnd: string;
      createdAt: string | null;
    }>;
  };
};

export type AdminActivityItem = {
  id: string;
  actorId: string | null;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type AdminOverviewResponse = {
  attention: AdminAttention;
  access: AdminAccessSnapshot;
  anomalies: AdminAnomalies;
  recentActivity: AdminActivityItem[];
};

const fetchAdminOverview = async (): Promise<AdminOverviewResponse> => {
  const { data } = await api.get<AdminOverviewResponse>('/reports/admin-overview');
  return data;
};

export const useAdminOverview = () => {
  return useQuery({
    queryKey: ['reports', 'admin-overview'],
    queryFn: fetchAdminOverview,
    staleTime: 15 * 1000,
  });
};

