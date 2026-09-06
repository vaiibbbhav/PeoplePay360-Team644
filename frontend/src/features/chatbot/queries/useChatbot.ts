import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';

export type MetricCard = {
  label: string;
  value: string | number;
  subtext?: string;
  badge?: string;
};

export type ActionLink = {
  label: string;
  url: string;
};

export type ActionProposal = {
  actionType: 'APPROVE_LEAVE';
  title: string;
  description: string;
  requestId: string;
  employeeName: string;
  employeeCode?: string;
  leaveType: string;
  duration: string;
  dates: string;
  reason?: string;
  requiresConfirmation: boolean;
  status?: 'pending' | 'executing' | 'executed' | 'cancelled';
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metricCards?: MetricCard[];
  actionLinks?: ActionLink[];
  suggestedFollowUps?: string[];
  actionProposal?: ActionProposal;
  actionProposals?: ActionProposal[];
};

export type SendMessagePayload = {
  message: string;
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  context?: string;
};

export type ExecuteActionPayload = {
  action: 'APPROVE_LEAVE';
  payload: {
    requestId: string;
  };
};

export type ExecuteActionResult = {
  success: boolean;
  message: string;
  requestId: string;
  employeeName: string;
  leaveType: string;
  duration: string;
  approvedAt: string;
  approvedBy: string;
};

export type ChatbotResponse = {
  reply: string;
  metricCards?: MetricCard[];
  actionLinks?: ActionLink[];
  suggestedFollowUps?: string[];
  actionProposal?: ActionProposal;
  actionProposals?: ActionProposal[];
  provider?: 'gemini' | 'builtin-db';
};

export type QuickInsightsSnapshot = {
  headcount: {
    totalEmployees: number;
    activeEmployees: number;
    incompleteProfiles: number;
  };
  contracts: {
    activeContracts: number;
    draftContracts: number;
    expiringWithin30Days: number;
  };
  latestPayrun: {
    id: string | null;
    name: string | null;
    period: string | null;
    status: string | null;
    totalNet: number;
    payslipCount: number;
    warningCount: number;
  } | null;
  attendanceToday: {
    present: number;
    late: number;
    absent: number;
    overtime: number;
    manualEdits: number;
    total: number;
  };
  timeOff: {
    pendingRequests: number;
    approvedDaysThisMonth: number;
  };
  policies: {
    totalPolicies: number;
    mandatoryPolicies: number;
  };
};

export type DepartmentInsight = {
  departmentId: string;
  departmentName: string;
  employeeCount: number;
  totalWages: string | number;
};

export type PendingLeaveInsight = {
  requestId: string;
  employeeId: string;
  employeeCode: string | null;
  firstName: string;
  lastName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  duration: string;
  reason: string | null;
  status: string;
};

export type QuickInsightsData = {
  snapshot: QuickInsightsSnapshot;
  departments: DepartmentInsight[];
  pendingLeaves: PendingLeaveInsight[];
  requestedBy: string;
  role: string;
};

// --- API Calls ---

const sendChatMessage = async (payload: SendMessagePayload): Promise<ChatbotResponse> => {
  const { data } = await api.post<ChatbotResponse>('/chatbot/message', payload);
  return data;
};

const getQuickInsights = async (): Promise<QuickInsightsData> => {
  const { data } = await api.get<QuickInsightsData>('/chatbot/insights');
  return data;
};

const getSuggestions = async (): Promise<string[]> => {
  const { data } = await api.get<{ suggestions: string[] }>('/chatbot/suggestions');
  return data.suggestions || [];
};

// --- React Query Hooks ---

export const useChatbotSendMessage = () => {
  return useMutation({
    mutationFn: sendChatMessage,
  });
};

export const useChatbotQuickInsights = (enabled = true) => {
  return useQuery({
    queryKey: ['chatbot', 'insights'],
    queryFn: getQuickInsights,
    staleTime: 30000,
    enabled,
  });
};

export const useChatbotSuggestions = () => {
  return useQuery({
    queryKey: ['chatbot', 'suggestions'],
    queryFn: getSuggestions,
    staleTime: 60000,
  });
};

const executeChatbotAction = async (
  payload: ExecuteActionPayload,
): Promise<ExecuteActionResult> => {
  const { data } = await api.post<ExecuteActionResult>('/chatbot/action', payload);
  return data;
};

export const useChatbotExecuteAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: executeChatbotAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeoff'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['chatbot'] });
    },
  });
};

