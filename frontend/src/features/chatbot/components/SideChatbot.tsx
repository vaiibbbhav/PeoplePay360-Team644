import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  X,
  RotateCcw,
  Send,
  Bot,
  User,
  ArrowRight,
  TrendingUp,
  Clock,
  DollarSign,
  Shield,
  Building,
  ChevronRight,
  Loader2,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Check,
  Ban,
} from 'lucide-react';
import {
  useChatbotSendMessage,
  useChatbotSuggestions,
  useChatbotExecuteAction,
  type ChatMessage,
  type ActionProposal,
  type ExecuteActionResult,
} from '../queries/useChatbot';
import { useCurrentUser } from '@/features/auth/queries/useAuth';

type SideChatbotProps = {
  isOpen: boolean;
  onClose: () => void;
};

// Simple clean Markdown / Structured content formatter
const FormattedContent: React.FC<{ content: string; onNavigate: (url: string) => void }> = ({
  content,
  onNavigate,
}) => {
  const lines = content.split('\n');

  return (
    <div className="space-y-1.5 leading-relaxed text-xs text-ink">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Headers
        if (trimmed.startsWith('### ')) {
          return (
            <h4
              key={idx}
              className="font-serif font-bold text-sm tracking-tight text-ink mt-2 mb-1 flex items-center gap-1.5"
            >
              {trimmed.replace('### ', '')}
            </h4>
          );
        }

        // Bullet point
        if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const bulletText = trimmed.replace(/^[•\-\*]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="text-accent text-[10px] leading-4">•</span>
              <span className="flex-1">{renderInlineFormatting(bulletText, onNavigate)}</span>
            </div>
          );
        }

        // Italic/Quote note
        if (trimmed.startsWith('*') && trimmed.endsWith('*')) {
          return (
            <p
              key={idx}
              className="text-[11px] italic text-ink-soft bg-bg/50 px-2 py-1 rounded border-l-2 border-accent"
            >
              {trimmed.slice(1, -1)}
            </p>
          );
        }

        return <p key={idx}>{renderInlineFormatting(trimmed, onNavigate)}</p>;
      })}
    </div>
  );
};

// Helper for inline bold, code, and markdown links
function renderInlineFormatting(
  text: string,
  onNavigate: (url: string) => void,
): React.ReactNode[] {
  // Regex to match **bold**, `code`, and [link](url)
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-bg-raised border border-line text-accent font-medium"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, label, url] = linkMatch;
      return (
        <button
          key={index}
          type="button"
          onClick={() => onNavigate(url)}
          className="inline-flex items-center gap-0.5 text-accent font-medium hover:underline cursor-pointer"
        >
          {label}
          <ArrowRight className="w-3 h-3 inline" />
        </button>
      );
    }
    return part;
  });
}

type ActionProposalCardProps = {
  proposal: ActionProposal;
  onExecuteSuccess?: (result: ExecuteActionResult) => void;
};

const ActionProposalCard: React.FC<ActionProposalCardProps> = ({ proposal, onExecuteSuccess }) => {
  const [actionState, setActionState] = useState<
    'pending' | 'executing' | 'executed' | 'cancelled' | 'error'
  >('pending');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ExecuteActionResult | null>(null);

  const executeActionMutation = useChatbotExecuteAction();

  const handleConfirm = () => {
    setActionState('executing');
    setErrorMessage(null);

    executeActionMutation.mutate(
      {
        action: 'APPROVE_LEAVE',
        payload: { requestId: proposal.requestId },
      },
      {
        onSuccess: (data) => {
          setActionState('executed');
          setResult(data);
          onExecuteSuccess?.(data);
        },
        onError: (err: any) => {
          setActionState('error');
          const rawError =
            err?.response?.data?.error || err?.response?.data?.message || err?.message;
          let cleanMsg = 'Failed to approve leave request.';
          if (typeof rawError === 'string') {
            try {
              const parsed = JSON.parse(rawError);
              if (Array.isArray(parsed) && parsed[0]?.message) {
                cleanMsg = parsed[0].message;
              } else {
                cleanMsg = rawError;
              }
            } catch {
              cleanMsg = rawError;
            }
          }
          setErrorMessage(cleanMsg);
        },
      },
    );
  };

  const handleCancel = () => {
    setActionState('cancelled');
  };

  return (
    <div className="border border-line rounded-xl bg-bg overflow-hidden text-xs my-1 transition-all">
      {/* Card Header */}
      <div className="px-3 py-2.5 bg-bg-raised border-b border-line flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
            <CalendarCheck className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="font-serif font-bold text-xs text-ink truncate block">
              {proposal.title}
            </span>
            <span className="text-[10px] text-ink-soft truncate block">Agentic HR Action</span>
          </div>
        </div>

        <div>
          {actionState === 'pending' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              Needs Confirmation
            </span>
          )}
          {actionState === 'executing' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              Processing
            </span>
          )}
          {actionState === 'executed' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-medium">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Approved
            </span>
          )}
          {actionState === 'cancelled' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-ink-soft/10 text-ink-soft border border-line">
              Cancelled
            </span>
          )}
          {actionState === 'error' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
              Error
            </span>
          )}
        </div>
      </div>

      {/* Details Table */}
      <div className="p-3 space-y-2.5">
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-bg-raised/50 p-2 rounded-lg border border-line">
            <span className="text-[10px] uppercase font-semibold text-ink-soft tracking-wider block mb-0.5">
              Employee
            </span>
            <span className="font-medium text-ink truncate block">{proposal.employeeName}</span>
            {proposal.employeeCode && (
              <span className="text-[10px] font-mono text-ink-soft">{proposal.employeeCode}</span>
            )}
          </div>

          <div className="bg-bg-raised/50 p-2 rounded-lg border border-line">
            <span className="text-[10px] uppercase font-semibold text-ink-soft tracking-wider block mb-0.5">
              Duration & Type
            </span>
            <span className="font-medium text-ink block">{proposal.duration}</span>
            <span className="text-[10px] text-ink-soft truncate block">{proposal.leaveType}</span>
          </div>

          <div className="col-span-2 bg-bg-raised/50 p-2 rounded-lg border border-line">
            <span className="text-[10px] uppercase font-semibold text-ink-soft tracking-wider block mb-0.5">
              Period / Dates
            </span>
            <span className="font-mono text-[11px] text-ink">{proposal.dates}</span>
          </div>

          {proposal.reason && (
            <div className="col-span-2 bg-bg-raised/50 p-2 rounded-lg border border-line">
              <span className="text-[10px] uppercase font-semibold text-ink-soft tracking-wider block mb-0.5">
                Reason
              </span>
              <span className="text-ink italic text-[11px]">"{proposal.reason}"</span>
            </div>
          )}
        </div>

        {/* Audit Notice */}
        <p className="text-[11px] text-ink-soft bg-accent/5 px-2.5 py-1.5 rounded-lg border border-accent/15 leading-relaxed">
          {proposal.description}
        </p>

        {/* Interactive Actions / States */}
        {actionState === 'pending' && (
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={executeActionMutation.isPending}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-accent-ink font-semibold text-xs hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirm & Approve</span>
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={executeActionMutation.isPending}
              className="px-3 py-2 rounded-lg border border-line bg-bg hover:bg-bg-raised text-ink-soft hover:text-ink text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        )}

        {actionState === 'executing' && (
          <div className="flex items-center justify-center gap-2 py-2 text-xs text-ink-soft bg-bg-raised rounded-lg border border-line">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
            <span>Updating database & deducting leave balance...</span>
          </div>
        )}

        {actionState === 'executed' && (
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-ink space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Leave Approved on Behalf of HR</span>
            </div>
            <p className="text-[11px] text-ink-soft leading-relaxed">
              Deducted {result?.duration || proposal.duration} from {proposal.employeeName}'s
              balance. Request status updated to <strong>Approved</strong>.
            </p>
            {result?.approvedBy && (
              <div className="text-[10px] font-mono text-ink-soft/70 pt-0.5">
                Authorized by: {result.approvedBy}
              </div>
            )}
          </div>
        )}

        {actionState === 'cancelled' && (
          <div className="p-2 rounded-lg bg-bg-raised border border-line text-xs text-ink-soft flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Ban className="w-3.5 h-3.5" />
              <span>Approval cancelled.</span>
            </div>
            <button
              type="button"
              onClick={() => setActionState('pending')}
              className="text-accent hover:underline text-[11px] font-medium cursor-pointer"
            >
              Reopen
            </button>
          </div>
        )}

        {actionState === 'error' && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-400 space-y-2">
            <div className="flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage || 'Failed to execute leave approval.'}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleConfirm}
                className="px-2.5 py-1 rounded bg-rose-600 text-white font-medium text-[11px] hover:opacity-90 cursor-pointer"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-2 py-1 rounded border border-line bg-bg text-ink-soft text-[11px] hover:bg-bg-raised cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const SideChatbot: React.FC<SideChatbotProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const { data: serverSuggestions = [] } = useChatbotSuggestions();
  const sendMessageMutation = useChatbotSendMessage();

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'welcome-msg',
        role: 'assistant',
        content: `### 👋 PeoplePay360 HR Assistant\n\nI am connected to your live operational database. Ask me anything about:\n• **Quick Insights** across all workforce domains\n• **Payroll status & latest payruns**\n• **Today's attendance health & late check-ins**\n• **Pending leave requests & leave policies**\n• **Expiring contracts & department headcounts**\n\nSelect a prompt below or type your query:`,
        timestamp: new Date().toISOString(),
        suggestedFollowUps: [
          '⚡ Give me quick HR & payroll insights',
          '💰 Summarize latest payrun status',
          '⏱️ How is attendance health today?',
          '🌴 Show pending leave requests awaiting approval',
        ],
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Sync role-tailored suggestions from server when available
  useEffect(() => {
    if (serverSuggestions.length > 0) {
      setMessages((prev) => {
        if (prev.length === 1 && prev[0].id === 'welcome-msg') {
          return [{ ...prev[0], suggestedFollowUps: serverSuggestions }];
        }
        return prev;
      });
    }
  }, [serverSuggestions]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, sendMessageMutation.isPending]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || sendMessageMutation.isPending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage('');

    // Prepare history for backend
    const historyPayload = newMessages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    sendMessageMutation.mutate(
      {
        message: text,
        history: historyPayload,
      },
      {
        onSuccess: (res) => {
          const assistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: res.reply,
            timestamp: new Date().toISOString(),
            metricCards: res.metricCards,
            actionLinks: res.actionLinks,
            suggestedFollowUps: res.suggestedFollowUps,
            actionProposal: res.actionProposal,
            actionProposals: res.actionProposals,
          };
          setMessages((prev) => [...prev, assistantMessage]);
        },
        onError: (err: any) => {
          const errorMessage: ChatMessage = {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: `⚠️ **Unable to process query**: ${err?.response?.data?.error || err.message || 'An unexpected error occurred. Please try again.'}`,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        },
      },
    );
  };

  const handleActionSuccessMessage = (res: ExecuteActionResult) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `system-confirm-${Date.now()}`,
        role: 'assistant',
        content: `### ✅ Leave Approved on Behalf of HR\n\nI have successfully executed the approval for **${res.employeeName}**:\n• **Leave Type:** ${res.leaveType}\n• **Duration:** ${res.duration}\n• **Authorized By:** \`${res.approvedBy}\`\n• **Timestamp:** ${new Date(res.approvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n\nThe employee's remaining leave balance has been deducted in real time, and the request status is now marked \`approved\`.`,
        timestamp: new Date().toISOString(),
        actionLinks: [
          { label: 'View in Time Off Hub', url: '/time-off' },
          { label: 'Check Dashboard', url: '/dashboard' },
        ],
        suggestedFollowUps: [
          '⚡ Give me quick insights',
          '🌴 Show pending leave requests',
          '⏱️ How is attendance health today?',
        ],
      },
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: `### 🔄 History Cleared\n\nHow can I help you with PeoplePay360 right now?`,
        timestamp: new Date().toISOString(),
        suggestedFollowUps: [
          '⚡ Give me quick HR & payroll insights',
          '💰 Summarize latest payrun status',
          '⏱️ How is attendance health today?',
        ],
      },
    ]);
  };

  const handleNavigate = (url: string) => {
    navigate(url);
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const quickActionChips = [
    { label: '⚡ Insights', query: 'Give me quick insights', icon: TrendingUp },
    {
      label: '🌴 Approve Leaves',
      query: 'Show pending leave requests awaiting approval',
      icon: CalendarCheck,
    },
    { label: '💰 Payroll', query: 'Summarize latest payrun status', icon: DollarSign },
    { label: '⏱️ Attendance', query: 'How is attendance health today?', icon: Clock },
    { label: '📜 Contracts', query: 'Are there any expiring contracts?', icon: Shield },
    {
      label: '🏢 Departments',
      query: 'Show department headcount and salary costs',
      icon: Building,
    },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay on mobile */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 lg:hidden transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Sidebar Drawer */}
      <aside
        aria-label="HR AI Assistant"
        className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-bg border-l border-line z-50 flex flex-col transition-transform duration-300 ease-out font-sans"
      >
        {/* Header */}
        <div className="h-16 border-b border-line px-4 flex items-center justify-between bg-bg-raised/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-sm text-ink truncate">
                  HR AI Assistant
                </span>
                {/* <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live DB
                </span> */}
              </div>
              <span className="text-[11px] text-ink-soft truncate block">
                {user?.role ? `${user.role} mode` : 'Intelligence co-pilot'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleClearHistory}
              title="Reset Conversation"
              className="p-1.5 rounded-lg border border-line bg-bg hover:bg-bg-raised text-ink-soft hover:text-ink transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close Assistant (Esc)"
              className="p-1.5 rounded-lg border border-line bg-bg hover:bg-bg-raised text-ink-soft hover:text-ink transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Action Chips Bar */}
        <div className="border-b border-line px-3 py-2 bg-bg flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {quickActionChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => handleSend(chip.query)}
              disabled={sendMessageMutation.isPending}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border border-line bg-bg-raised hover:bg-accent hover:text-accent-ink hover:border-accent text-ink transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              <chip.icon className="w-3 h-3 opacity-70" />
              <span>{chip.label}</span>
            </button>
          ))}
        </div>

        {/* Chat Messages List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-accent text-accent-ink flex items-center justify-center shrink-0 text-xs mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className={`max-w-[85%] space-y-2.5 ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Message Bubble */}
                  <div
                    className={`rounded-xl p-3 text-xs ${
                      isUser
                        ? 'bg-accent text-accent-ink rounded-tr-xs'
                        : 'bg-bg-raised border border-line text-ink rounded-tl-xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    ) : (
                      <FormattedContent content={msg.content} onNavigate={handleNavigate} />
                    )}
                  </div>

                  {/* Visual Metric Cards (if any) */}
                  {msg.metricCards && msg.metricCards.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 w-full">
                      {msg.metricCards.map((card, cIdx) => (
                        <div
                          key={cIdx}
                          className="border border-line rounded-lg bg-bg p-2.5 flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] uppercase font-semibold text-ink-soft tracking-wider truncate">
                              {card.label}
                            </span>
                            {card.badge && (
                              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-accent-soft text-accent truncate">
                                {card.badge}
                              </span>
                            )}
                          </div>
                          <div className="font-serif font-bold text-base text-ink tracking-tight">
                            {card.value}
                          </div>
                          {card.subtext && (
                            <div className="text-[10px] text-ink-soft mt-0.5 truncate">
                              {card.subtext}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Interactive Agentic Action Proposals (e.g. Leave Approval) */}
                  {msg.actionProposal && (
                    <div className="w-full pt-1">
                      <ActionProposalCard
                        proposal={msg.actionProposal}
                        onExecuteSuccess={handleActionSuccessMessage}
                      />
                    </div>
                  )}

                  {msg.actionProposals && msg.actionProposals.length > 0 && (
                    <div className="w-full space-y-2 pt-1">
                      {msg.actionProposals.map((prop, pIdx) => (
                        <ActionProposalCard
                          key={prop.requestId || pIdx}
                          proposal={prop}
                          onExecuteSuccess={handleActionSuccessMessage}
                        />
                      ))}
                    </div>
                  )}

                  {/* Interactive Action Deep Links */}
                  {msg.actionLinks && msg.actionLinks.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {msg.actionLinks.map((action, aIdx) => (
                        <button
                          key={aIdx}
                          type="button"
                          onClick={() => handleNavigate(action.url)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md border border-line bg-bg hover:bg-bg-raised text-accent hover:border-accent transition-colors cursor-pointer"
                        >
                          <span>{action.label}</span>
                          <ChevronRight className="w-3 h-3 text-ink-soft" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Suggested follow-up prompt chips */}
                  {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-semibold text-ink-soft/70 uppercase tracking-wider block">
                        Suggested Follow-ups
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestedFollowUps.map((prompt, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => handleSend(prompt)}
                            disabled={sendMessageMutation.isPending}
                            className="text-[11px] text-left px-2 py-1 rounded border border-line bg-bg hover:bg-bg-raised text-ink transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-full bg-bg-raised border border-line text-ink flex items-center justify-center shrink-0 text-xs mt-0.5">
                    <User className="w-3.5 h-3.5 text-ink-soft" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Assistant Typing / Loading State */}
          {sendMessageMutation.isPending && (
            <div className="flex gap-2.5 items-center text-ink-soft text-xs">
              <div className="w-7 h-7 rounded-full bg-accent text-accent-ink flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-bg-raised border border-line rounded-xl px-3.5 py-2.5 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                <span className="text-[11px]">Analyzing live records...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Composer */}
        <div className="p-3 border-t border-line bg-bg-raised/70 shrink-0 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-end gap-2"
          >
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about HR, payroll, leaves, or policy..."
                rows={2}
                disabled={sendMessageMutation.isPending}
                className="w-full resize-none rounded-lg border border-line bg-bg px-3 py-2 text-xs text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={!inputMessage.trim() || sendMessageMutation.isPending}
              className="h-10 px-3.5 rounded-lg bg-accent text-accent-ink font-medium text-xs flex items-center justify-center gap-1.5 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </form>

          <div className="flex items-center justify-between text-[10px] text-ink-soft/70 px-1">
            <span>Press Enter ↵ to send • Shift+Enter for newline</span>
            <span className="font-mono">⌘J / Ctrl+J</span>
          </div>
        </div>
      </aside>
    </>
  );
};
