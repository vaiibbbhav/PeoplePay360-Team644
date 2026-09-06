import { GoogleGenAI } from '@google/genai';
import * as chatbotRepo from './chatbot.repository';
import * as timeoffService from '../timeoff/timeoff.service';
import { ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors';
import type { ChatMessageInput, ExecuteActionInput } from './chatbot.validators';
import type { AuthUser } from '../../shared/auth-middleware';

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

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// ==========================================
// 1. GUARDRAILS: FILTER OUT BS / OUT-OF-SCOPE
// ==========================================

const OFF_TOPIC_PATTERNS = [
  // Coding / Tech irrelevant to HR
  /\b(write|create|code|debug|build)\b.*\b(python|javascript|c\+\+|java|game|bot|script|html|css|react)\b/i,
  /\b(fibonacci|bubble sort|binary search|leetcode|hacker rank)\b/i,
  // Creative fiction / poetry / entertainment
  /\b(write|compose|generate)\b.*\b(poem|poetry|song|lyrics|story|joke|riddle|fairy tale|essay)\b/i,
  /\b(tell me a joke|sing a song|entertain me)\b/i,
  // General trivia / recipes / math / science
  /\b(recipe|how to bake|how to cook|ingredients for)\b/i,
  /\b(who is the president|capital of|weather in|sports score|world cup|super bowl)\b/i,
  /\b(crypto|bitcoin|ethereum|stock market prediction)\b/i,
  /\b(horoscope|astrology|zodiac)\b/i,
  // Jailbreak / prompt injection
  /\b(ignore (all )?previous instructions|bypass (all )?(guardrails|filters)|system prompt|dan mode|jailbreak|unrestricted mode)\b/i,
];

function checkGuardrails(
  query: string,
  user: AuthUser,
): { passed: boolean; refusal?: ChatbotResponse } {
  const normalized = query.trim().toLowerCase();

  // 1. Jailbreak / Prompt Injection Check
  if (
    normalized.includes('ignore previous instructions') ||
    normalized.includes('system prompt') ||
    normalized.includes('bypass guardrail') ||
    normalized.includes('dan mode') ||
    normalized.includes('jailbreak')
  ) {
    return {
      passed: false,
      refusal: {
        reply: `### 🛡️ Security Guardrail Triggered\n\nI am the **PeoplePay360 HR & Payroll Assistant**. I operate under strict operational boundaries and cannot bypass system security policies or disclose raw system instructions.\n\nPlease let me know how I can assist with **Human Resources, Attendance, Leaves, Payroll, or Policies**.`,
        actionLinks: [{ label: 'Go to Dashboard', url: '/dashboard' }],
        suggestedFollowUps: [
          'Give me quick insights',
          'Summarize latest payrun status',
          'What is our leave policy?',
        ],
      },
    };
  }

  // 2. Off-topic / BS Query Check
  for (const pattern of OFF_TOPIC_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        passed: false,
        refusal: {
          reply: `### 🛡️ Out of Scope Query\n\nI am dedicated exclusively to **PeoplePay360 HR & Payroll Intelligence**.\n\nI cannot assist with general trivia, creative writing, external coding tasks, or topics outside of human resources and workforce management.\n\n**Topics I can help you with:**\n• ⚡ **Executive Insights:** Headcount, attendance rate, pending approvals\n• 💰 **Payroll Operations:** Latest payruns, payslips, net pay, salary rules\n• ⏱️ **Time & Attendance:** Shifts, late check-ins, overtime, kiosk records\n• 🌴 **Time Off & Leaves:** Leave requests, balance allocations, sick leave policy\n• 📜 **Contracts & Compliance:** Contract renewals, mandatory company policies\n• 👥 **Workforce Directory:** Employee details, positions, departments`,
          actionLinks: [
            { label: 'View Dashboard', url: '/dashboard' },
            { label: 'Browse Employees', url: '/employees' },
            { label: 'Inspect Payruns', url: '/payruns' },
          ],
          suggestedFollowUps: [
            'Give me quick insights',
            'How is attendance health today?',
            'What is our sick leave policy?',
            'Summarize latest payrun status',
          ],
        },
      };
    }
  }

  // 3. Confidentiality Guardrail for standard Employees
  if (
    user.role === 'Employee' &&
    (normalized.includes('all salaries') ||
      normalized.includes('everyone salary') ||
      normalized.includes('company salary cost') ||
      normalized.includes('total company payroll') ||
      normalized.includes('other employee salary'))
  ) {
    return {
      passed: false,
      refusal: {
        reply: `### 🔒 Privacy & Access Restriction\n\nCompany-wide compensation data and other employees' financial records are strictly confidential and restricted to HR and Payroll administrators.\n\nYou can review your personal salary details and download your monthly payslips in your **Compensation Hub**.`,
        actionLinks: [{ label: 'Go to My Compensation', url: '/compensation' }],
        suggestedFollowUps: [
          'How is my salary calculated?',
          'What is our leave policy?',
          'What are standard working hours?',
        ],
      },
    };
  }

  return { passed: true };
}

// ==========================================
// 2. GEMINI LLM LAYER WITH LIVE RAG CONTEXT
// ==========================================

async function callGeminiWithContext(
  input: ChatMessageInput,
  user: AuthUser,
): Promise<ChatbotResponse | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null; // Fallback to built-in live database engine if no key provided
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Fetch fresh live DB data to supply into Gemini's RAG context
    const [snap, depts, pendingLeaves, payruns, policies] = await Promise.all([
      chatbotRepo.getHRQuickSnapshot(),
      chatbotRepo.getDepartmentSummary(),
      chatbotRepo.getPendingLeaveRequestsWithDetails(5),
      chatbotRepo.getRecentPayruns(3),
      chatbotRepo.getAllPolicies(),
    ]);

    const totalAttendance = snap.attendanceToday.total;
    const presentRate =
      totalAttendance > 0
        ? Math.round(
            ((snap.attendanceToday.present + snap.attendanceToday.overtime) / totalAttendance) * 100,
          )
        : 100;

    const deptText = depts
      .slice(0, 5)
      .map((d) => `${d.departmentName}: ${d.employeeCount} staff (Budget: ${formatCurrency(Number(d.totalWages))})`)
      .join('; ');

    const payrunText = payruns
      .map((p) => `${p.name} [${p.status.toUpperCase()}]: Net ${formatCurrency(parseFloat(p.totalNet || '0'))}, ${p.payslipCount} payslips, ${p.warningsCount} warnings`)
      .join('; ');

    const leavesText =
      pendingLeaves.length > 0
        ? pendingLeaves
            .map(
              (r) =>
                `Request UUID: "${r.requestId}" | Employee: ${r.firstName} ${r.lastName} (${r.employeeCode || 'EMP'}) | Type: ${r.leaveType} | Duration: ${r.duration} days (${r.startDate} to ${r.endDate}) | Reason: "${r.reason || 'Personal'}"`,
            )
            .join(';\n')
        : 'None';

    const policyText = policies
      .slice(0, 6)
      .map((p) => `${p.title} (${p.category}, ${p.isMandatory ? 'Mandatory' : 'Optional'}): ${p.summary}`)
      .join('; ');

    const systemInstruction = `
You are the official PeoplePay360 AI Assistant, an expert HR & Payroll Intelligence co-pilot embedded directly into the PeoplePay360 platform.

STRICT GUARDRAIL POLICIES:
1. You ONLY answer questions related to Human Resources, Payroll, Compensation, Time & Attendance, Working Schedules, Time Off / Leaves, Company Policies, Contracts, Org Structure, and Employee Directory.
2. If the user asks anything unrelated to HR, payroll, or PeoplePay360 (e.g. recipes, creative writing, video games, jokes, coding non-HR tasks, general trivia, politics, sports), POLITELY REFUSE and state your designated HR & Payroll scope.
3. User Role: "${user.role}". Email: "${user.email}".
4. Privacy Guardrail: If user is "Employee", do NOT disclose company-wide payroll sums or other colleagues' wages. Direct them to their own Compensation Hub.
5. Always answer with real facts using the live database snapshot below. Never invent fake stats.

CURRENT LIVE DATABASE STATE (NEON POSTGRESQL):
- Active Headcount: ${snap.headcount.activeEmployees} active / ${snap.headcount.totalEmployees} registered (${snap.headcount.incompleteProfiles} incomplete).
- Attendance Health: ${presentRate}% present today (${snap.attendanceToday.present} present, ${snap.attendanceToday.late} late arrivals, ${snap.attendanceToday.absent} absent, ${snap.attendanceToday.overtime} overtime, ${snap.attendanceToday.manualEdits} manual adjustments). Shift starts at 09:00 AM (15-min grace threshold).
- Contracts: ${snap.contracts.activeContracts} active, ${snap.contracts.draftContracts} draft, ${snap.contracts.expiringWithin30Days} expiring in 30 days.
- Leaves: ${snap.timeOff.pendingRequests} pending requests awaiting manager action. ${snap.timeOff.approvedDaysThisMonth} days approved this cycle. Recent pending: [
${leavesText}
].
- Recent Payruns: [${payrunText}].
- Departments: [${deptText}].
- Published Policies: [${policyText}].

AGENTIC ACTIONS & WORKFLOW:
- You have the agentic capability to propose approving pending employee leave requests on behalf of HR.
- If the user (with an HR role) asks to approve a leave (e.g. "Approve Shreya's leave" or "Approve Aarav's request"), find the matching pending request from the live data and include "actionProposal" in your JSON response.
- CRITICAL: The "requestId" field MUST be the exact 36-character Request UUID from the pending leaves list (e.g. "a7c22a13-de8d-42d3-858a-e42d840d4592"). Do not use employee codes for requestId.
  "actionProposal": {
    "actionType": "APPROVE_LEAVE",
    "title": "Approve [Leave Type]",
    "description": "Approving will deduct [duration] from employee balance and mark status as Approved.",
    "requestId": "[exact Request UUID from pending leaves list]",
    "employeeName": "[Employee Name]",
    "employeeCode": "[Employee Code]",
    "leaveType": "[Leave Type]",
    "duration": "[Duration]",
    "dates": "[Start Date] to [End Date]",
    "reason": "[Reason]",
    "requiresConfirmation": true
  }
- ALWAYS require explicit user confirmation before any action executes.

OUTPUT FORMAT REQUIREMENTS:
You MUST respond with a valid JSON object matching this schema:
{
  "reply": "Rich markdown text with headers (###), bold numbers, and bullet points.",
  "actionProposal": { ...optional ActionProposal object if proposing an approval... },
  "metricCards": [
    { "label": "Short label", "value": "Key metric or number", "subtext": "Brief explanation", "badge": "Short badge" }
  ],
  "actionLinks": [
    { "label": "Button text", "url": "/path (e.g. /dashboard, /payruns, /time-off, /attendance, /employees, /contracts, /documents, /salary-structures)" }
  ],
  "suggestedFollowUps": ["Follow-up question 1", "Follow-up question 2", "Follow-up question 3"]
}
`;

    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    // Format conversation history
    const contents: any[] = [];
    if (input.history && input.history.length > 0) {
      for (const h of input.history.slice(-4)) {
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: input.message }],
    });

    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const textOutput = response.text?.trim() || '';
    if (textOutput) {
      try {
        const parsed = JSON.parse(textOutput);

        const sanitizeProposal = (p: any): ActionProposal | undefined => {
          if (!p || typeof p !== 'object') return undefined;

          // Match against live pending leaves in DB
          const matched = pendingLeaves.find(
            (l) =>
              (p.requestId && l.requestId.toLowerCase() === String(p.requestId).toLowerCase()) ||
              (p.employeeCode && l.employeeCode && l.employeeCode.toLowerCase() === String(p.employeeCode).toLowerCase()) ||
              (p.employeeName && `${l.firstName} ${l.lastName}`.toLowerCase().includes(String(p.employeeName).toLowerCase())) ||
              (p.employeeName && String(p.employeeName).toLowerCase().includes(l.firstName.toLowerCase())),
          );

          if (matched) {
            return {
              actionType: 'APPROVE_LEAVE',
              title: p.title || `Approve ${matched.leaveType}`,
              description:
                p.description ||
                `Approving will deduct ${matched.duration} day(s) from employee balance and mark status as Approved.`,
              requestId: matched.requestId, // GUARANTEED VALID DATABASE UUID
              employeeName: `${matched.firstName} ${matched.lastName}`,
              employeeCode: matched.employeeCode || p.employeeCode || undefined,
              leaveType: matched.leaveType,
              duration: `${matched.duration} day(s)`,
              dates: `${matched.startDate} to ${matched.endDate}`,
              reason: matched.reason || p.reason || 'Personal reasons',
              requiresConfirmation: true,
            };
          }

          if (p.requestId && typeof p.requestId === 'string' && p.requestId.length >= 8) {
            return {
              actionType: 'APPROVE_LEAVE',
              title: p.title || 'Approve Leave Request',
              description: p.description || 'Approving will deduct days from employee balance.',
              requestId: String(p.requestId),
              employeeName: p.employeeName || 'Employee',
              employeeCode: p.employeeCode,
              leaveType: p.leaveType || 'Leave',
              duration: p.duration || '1 day(s)',
              dates: p.dates || 'Selected period',
              reason: p.reason || 'Personal',
              requiresConfirmation: true,
            };
          }

          return undefined;
        };

        const singleProposal = sanitizeProposal(parsed.actionProposal);
        const proposalList = Array.isArray(parsed.actionProposals)
          ? (parsed.actionProposals.map(sanitizeProposal).filter(Boolean) as ActionProposal[])
          : undefined;

        return {
          reply: parsed.reply || textOutput,
          actionProposal: singleProposal,
          actionProposals: proposalList && proposalList.length > 0 ? proposalList : undefined,
          metricCards: Array.isArray(parsed.metricCards) ? parsed.metricCards : undefined,
          actionLinks: Array.isArray(parsed.actionLinks) ? parsed.actionLinks : undefined,
          suggestedFollowUps: Array.isArray(parsed.suggestedFollowUps)
            ? parsed.suggestedFollowUps
            : undefined,
          provider: 'gemini',
        };
      } catch {
        return {
          reply: textOutput,
          provider: 'gemini',
          suggestedFollowUps: [
            'Give me quick insights',
            'Summarize latest payrun status',
            'How is attendance health today?',
          ],
        };
      }
    }

    return null;
  } catch (err) {
    console.warn('Gemini API call failed or encountered rate limit, using live database engine:', err);
    return null;
  }
}

// ==========================================
// 3. BUILT-IN LIVE DATABASE ENGINE (FALLBACK)
// ==========================================

export async function processUserMessage(
  input: ChatMessageInput,
  user: AuthUser,
): Promise<ChatbotResponse> {
  // Step 1: Run Guardrail Checks First!
  const guardrailCheck = checkGuardrails(input.message, user);
  if (!guardrailCheck.passed && guardrailCheck.refusal) {
    return guardrailCheck.refusal;
  }

  // Step 2: Try Gemini LLM Layer (if GEMINI_API_KEY is configured)
  const geminiResponse = await callGeminiWithContext(input, user);
  if (geminiResponse) {
    return geminiResponse;
  }

  // Step 3: Built-in Live Database Engine (100% reliable deterministic fallback)
  return generateDeterministicDbResponse(input, user);
}

async function generateDeterministicDbResponse(
  input: ChatMessageInput,
  user: AuthUser,
): Promise<ChatbotResponse> {
  const text = input.message.toLowerCase().trim();
  const isHR =
    user.role === 'Admin' ||
    user.role === 'HR Manager' ||
    user.role === 'HR Payroll Manager' ||
    user.role === 'HR Payroll User';

  // 0. AGENTIC ACTION: LEAVE APPROVAL REQUEST
  if (
    text.includes('approve') ||
    text.includes('grant leave') ||
    text.includes('accept leave') ||
    (text.includes('approval') && (text.includes('leave') || text.includes('request') || text.includes('time off')))
  ) {
    if (!isHR) {
      return {
        reply: `### ⚠️ Authorization Notice\n\nOnly **HR Managers** and administrators have authority to approve time-off requests on behalf of the organization.\n\nAs an employee, please submit your leave request through the Time Off page so your reporting manager or HR can review it.`,
        actionLinks: [{ label: 'Go to Time Off Requests', url: '/time-off' }],
        suggestedFollowUps: [
          'What is our company leave policy?',
          'How do I request time off?',
        ],
        provider: 'builtin-db',
      };
    }

    // Extract search target (e.g. "approve leave for Shreya" -> "shreya")
    const searchTarget = text
      .replace(/approve\s+(leave\s+(for\s+)?)?/gi, '')
      .replace(/can you approve\s+/gi, '')
      .replace(/please approve\s+/gi, '')
      .replace(/leave for\s+/gi, '')
      .replace(/request\s+/gi, '')
      .replace(/'s leave/gi, '')
      .replace(/pending\s+/gi, '')
      .trim();

    let matches: Awaited<ReturnType<typeof chatbotRepo.findPendingLeaveBySearch>> = [];
    if (searchTarget.length >= 2) {
      matches = await chatbotRepo.findPendingLeaveBySearch(searchTarget, 3);
    }

    // If no specific employee matched or query was general ("approve pending leaves", "approve leave")
    if (matches.length === 0) {
      const allPending = await chatbotRepo.getPendingLeaveRequestsWithDetails(4);
      if (allPending.length === 0) {
        return {
          reply: `### ✅ All Clear: No Pending Leave Requests\n\nThere are currently no pending leave requests awaiting approval in the database!`,
          actionLinks: [{ label: 'View Time Off Hub', url: '/time-off' }],
          suggestedFollowUps: [
            'Give me quick insights',
            'How is attendance health today?',
          ],
          provider: 'builtin-db',
        };
      }

      const proposals: ActionProposal[] = allPending.map((r) => ({
        actionType: 'APPROVE_LEAVE',
        title: `Approve ${r.leaveType}`,
        description: `Approving will deduct ${r.duration} day(s) from employee balance and mark request as Approved.`,
        requestId: r.requestId,
        employeeName: `${r.firstName} ${r.lastName}`,
        employeeCode: r.employeeCode || undefined,
        leaveType: r.leaveType,
        duration: `${r.duration} day(s)`,
        dates: `${r.startDate} to ${r.endDate}`,
        reason: r.reason || 'Personal reasons',
        requiresConfirmation: true,
      }));

      return {
        reply: `### 🌴 Pending Leave Requests Awaiting Action\n\nI found **${allPending.length}** pending time-off request(s). Which one would you like to approve? Review the details below and click **Confirm & Approve** to execute on behalf of HR:`,
        actionProposals: proposals,
        actionLinks: [{ label: 'Manage All Requests', url: '/time-off' }],
        suggestedFollowUps: [
          'Give me quick insights',
          'How is attendance health today?',
        ],
        provider: 'builtin-db',
      };
    }

    // Specific match found
    const target = matches[0];
    const proposal: ActionProposal = {
      actionType: 'APPROVE_LEAVE',
      title: `Approve ${target.leaveType}`,
      description: `Approving will deduct ${target.duration} day(s) from employee balance and update status to Approved.`,
      requestId: target.requestId,
      employeeName: `${target.firstName} ${target.lastName}`,
      employeeCode: target.employeeCode || undefined,
      leaveType: target.leaveType,
      duration: `${target.duration} day(s)`,
      dates: `${target.startDate} to ${target.endDate}`,
      reason: target.reason || 'Personal reasons',
      requiresConfirmation: true,
    };

    return {
      reply: `### ⚠️ Confirmation Required: Approve Time Off\n\nI located the pending request for **${target.firstName} ${target.lastName}** (\`${target.employeeCode || 'EMP'}\`).\n\nAs an agentic action on behalf of HR, please confirm the approval below before I update the database:`,
      actionProposal: proposal,
      actionLinks: [{ label: 'View in Time Off Hub', url: '/time-off' }],
      suggestedFollowUps: [
        'Show all pending leave requests',
        'Give me quick insights',
      ],
      provider: 'builtin-db',
    };
  }

  // 1. QUICK INSIGHTS / EXECUTIVE SUMMARY
  if (
    text.includes('quick insight') ||
    text.includes('summary') ||
    text.includes('summarise') ||
    text.includes('overview') ||
    text.includes('briefing') ||
    text.includes('how is everything') ||
    text.includes('status report') ||
    (text.includes('insights') && !text.includes('department'))
  ) {
    const [snap, deptList] = await Promise.all([
      chatbotRepo.getHRQuickSnapshot(),
      chatbotRepo.getDepartmentSummary(),
    ]);

    const totalAttendance = snap.attendanceToday.total;
    const presentRate =
      totalAttendance > 0
        ? Math.round(
            ((snap.attendanceToday.present + snap.attendanceToday.overtime) / totalAttendance) * 100,
          )
        : 100;

    const cards: MetricCard[] = [
      {
        label: 'Active Workforce',
        value: snap.headcount.activeEmployees,
        subtext: `Total: ${snap.headcount.totalEmployees} staff`,
        badge: `${snap.headcount.incompleteProfiles} incomplete`,
      },
      {
        label: 'Attendance Health',
        value: `${presentRate}%`,
        subtext: `${snap.attendanceToday.present} present, ${snap.attendanceToday.late} late`,
      },
      {
        label: 'Pending Leaves',
        value: snap.timeOff.pendingRequests,
        subtext: `${snap.timeOff.approvedDaysThisMonth} days approved this mo.`,
        badge: snap.timeOff.pendingRequests > 0 ? 'Needs Action' : 'All Clear',
      },
      {
        label: 'Active Contracts',
        value: snap.contracts.activeContracts,
        subtext: `${snap.contracts.expiringWithin30Days} expiring soon`,
      },
    ];

    let payrunInfo = 'No payrun processed yet.';
    if (snap.latestPayrun) {
      cards.push({
        label: 'Latest Payrun',
        value: formatCurrency(snap.latestPayrun.totalNet),
        subtext: `${snap.latestPayrun.name} (${snap.latestPayrun.status})`,
        badge: snap.latestPayrun.status || undefined,
      });
      const statusText = (snap.latestPayrun.status || 'unknown').toUpperCase();
      payrunInfo = `**${snap.latestPayrun.name}** is currently in \`${statusText}\` status with **${formatCurrency(snap.latestPayrun.totalNet)}** total net pay across **${snap.latestPayrun.payslipCount}** payslips (${snap.latestPayrun.warningCount} warnings).`;
    }

    const topDepts = deptList
      .slice(0, 4)
      .map((d) => `• **${d.departmentName}**: ${d.employeeCount} employees (${formatCurrency(Number(d.totalWages))} total wages)`)
      .join('\n');

    const reply = `### 📊 PeoplePay360 Executive Briefing

Here is the live operational snapshot across all core modules:

- **👥 Workforce:** **${snap.headcount.activeEmployees}** active employees out of ${snap.headcount.totalEmployees} registered. ${snap.headcount.incompleteProfiles > 0 ? `⚠️ *${snap.headcount.incompleteProfiles} profiles require completion.*` : '✅ All profiles up to date.'}
- **⏱️ Attendance Today:** **${presentRate}%** present rate. **${snap.attendanceToday.present}** on duty, **${snap.attendanceToday.late}** late arrivals, **${snap.attendanceToday.absent}** absent, and **${snap.attendanceToday.manualEdits}** manual overrides.
- **🌴 Leave Approvals:** **${snap.timeOff.pendingRequests}** pending time-off requests require manager review. Total approved leave this period is **${snap.timeOff.approvedDaysThisMonth}** days.
- **💰 Payroll & Payrun:** ${payrunInfo}
- **📜 Contracts:** **${snap.contracts.activeContracts}** active contracts. **${snap.contracts.expiringWithin30Days}** contract(s) expiring within the next 30 days.

**Top Departments by Headcount:**
${topDepts}
`;

    return {
      reply,
      metricCards: cards,
      actionLinks: [
        { label: 'View Dashboard', url: '/dashboard' },
        { label: 'Review Leave Requests', url: '/time-off' },
        { label: 'Inspect Payruns', url: '/payruns' },
      ],
      suggestedFollowUps: [
        'Summarize payroll status',
        'How is attendance health today?',
        'Show pending leave requests',
        'Check expiring contracts',
      ],
      provider: 'builtin-db',
    };
  }

  // 2. PAYROLL & COMPENSATION QUERIES
  if (
    text.includes('payroll') ||
    text.includes('payrun') ||
    text.includes('payslip') ||
    text.includes('net salary') ||
    text.includes('gross salary') ||
    text.includes('compensation') ||
    text.includes('wage')
  ) {
    if (!isHR && (text.includes('total') || text.includes('company') || text.includes('cost'))) {
      return {
        reply: `### 🔒 Confidential Payroll Access\n\nCompany-wide payroll expenditures are restricted to authorized HR and Payroll administrators.\n\nAs an employee, you can view your personal compensation details, salary structure, and monthly payslips directly in your **Compensation Hub**.`,
        actionLinks: [{ label: 'Go to Compensation Hub', url: '/compensation' }],
        suggestedFollowUps: [
          'How is my salary calculated?',
          'What are standard tax deductions?',
          'What is our leave policy?',
        ],
        provider: 'builtin-db',
      };
    }

    const payruns = await chatbotRepo.getRecentPayruns(4);
    if (payruns.length === 0) {
      return {
        reply: `### 💰 Payroll Operations Overview\n\nNo payruns have been executed yet in the database. You can initiate a new payrun using the two-step wizard.`,
        actionLinks: [{ label: 'Create First Payrun', url: '/payruns' }],
        provider: 'builtin-db',
      };
    }

    const latest = payruns[0];
    const cards: MetricCard[] = [
      {
        label: 'Latest Payrun',
        value: latest.name,
        subtext: `Period: ${latest.periodStart} to ${latest.periodEnd}`,
        badge: latest.status,
      },
      {
        label: 'Total Net Paid',
        value: formatCurrency(parseFloat(latest.totalNet || '0')),
        subtext: `Gross: ${formatCurrency(parseFloat(latest.totalGross || '0'))}`,
      },
      {
        label: 'Payslips',
        value: latest.payslipCount ?? 0,
        subtext: `${latest.warningsCount} validation warning(s)`,
        badge: latest.warningsCount > 0 ? 'Review Warnings' : 'Clean Run',
      },
    ];

    const runList = payruns
      .map(
        (p) =>
          `• **${p.name}** (\`${p.status.toUpperCase()}\`): Net ${formatCurrency(parseFloat(p.totalNet || '0'))} | ${p.payslipCount} payslips | ${p.warningsCount} warnings`,
      )
      .join('\n');

    const reply = `### 💰 Payroll & Payrun Intelligence

The most recent payrun is **${latest.name}** in status \`${latest.status.toUpperCase()}\`.

- **Period:** ${latest.periodStart} to ${latest.periodEnd}
- **Total Net Disbursement:** **${formatCurrency(parseFloat(latest.totalNet || '0'))}**
- **Total Gross Pay:** ${formatCurrency(parseFloat(latest.totalGross || '0'))}
- **Payslips Generated:** **${latest.payslipCount}** employees
- **Validation Warnings:** **${latest.warningsCount}** (such as missing bank details or inactive contracts)

**Recent Payrun History:**
${runList}

*Next Step:* If the payrun is in \`computed\` status, validate warnings before clicking **Mark Paid** and executing **Send Payslips**.`;

    return {
      reply,
      metricCards: cards,
      actionLinks: [
        { label: 'Manage Payruns', url: '/payruns' },
        { label: 'View All Payslips', url: '/payslips' },
        { label: 'Salary Structures', url: '/salary-structures' },
      ],
      suggestedFollowUps: [
        'How are salary deductions calculated?',
        'Give me quick insights',
        'Show pending leave requests',
      ],
      provider: 'builtin-db',
    };
  }

  // 3. ATTENDANCE & WORKING HOURS QUERIES
  if (
    text.includes('attendance') ||
    text.includes('absent') ||
    text.includes('late') ||
    text.includes('check in') ||
    text.includes('check out') ||
    text.includes('overtime') ||
    text.includes('clock')
  ) {
    const snap = await chatbotRepo.getHRQuickSnapshot();
    const att = snap.attendanceToday;
    const total = att.total;
    const presentRate =
      total > 0 ? Math.round(((att.present + att.overtime) / total) * 100) : 100;

    const cards: MetricCard[] = [
      {
        label: 'Present Rate',
        value: `${presentRate}%`,
        subtext: `${att.present} on-time check-ins`,
      },
      {
        label: 'Late Check-ins',
        value: att.late,
        subtext: 'Flagged by work schedule',
        badge: att.late > 0 ? 'Attention' : 'Normal',
      },
      {
        label: 'Absences',
        value: att.absent,
        subtext: 'Without approved leave',
      },
      {
        label: 'Manual Overrides',
        value: att.manualEdits,
        subtext: 'Audited manual edits',
      },
    ];

    const reply = `### ⏱️ Attendance Health & Compliance

Here is the current attendance status across the organization:

- **Overall Attendance Health:** **${presentRate}%**
- **Present:** **${att.present}** employees checked in on time
- **Late Arrivals:** **${att.late}** employees checked in after their scheduled shift start
- **Overtime:** **${att.overtime}** employees logged overtime hours
- **Absences:** **${att.absent}** marked absent
- **Manual Adjustments:** **${att.manualEdits}** manual corrections recorded

*Policy Note:* Standard shift begins at **09:00 AM** with a 15-minute grace threshold. Check-ins after 09:15 AM are automatically categorized as **Late**. Unapproved absences impact payrun worked-days calculation.`;

    return {
      reply,
      metricCards: cards,
      actionLinks: [
        { label: 'View Attendance Records', url: '/attendance' },
        { label: 'Open Kiosk Terminal', url: '/attendance/terminal' },
      ],
      suggestedFollowUps: [
        'Show pending leave requests',
        'What is our attendance policy?',
        'Give me quick insights',
      ],
      provider: 'builtin-db',
    };
  }

  // 4. TIME OFF & LEAVES QUERIES
  if (
    !text.includes('policy') &&
    (text.includes('leave') ||
      text.includes('time off') ||
      text.includes('vacation') ||
      text.includes('holiday') ||
      text.includes('sick') ||
      text.includes('pto'))
  ) {
    const pendingRequests = await chatbotRepo.getPendingLeaveRequestsWithDetails(5);
    const snap = await chatbotRepo.getHRQuickSnapshot();

    const cards: MetricCard[] = [
      {
        label: 'Pending Approvals',
        value: snap.timeOff.pendingRequests,
        subtext: 'Awaiting manager action',
        badge: snap.timeOff.pendingRequests > 0 ? 'Urgent' : 'Up to Date',
      },
      {
        label: 'Approved Days',
        value: snap.timeOff.approvedDaysThisMonth,
        subtext: 'Consumed this cycle',
      },
    ];

    let pendingList = '✅ *No pending leave requests at this moment!*';
    if (pendingRequests.length > 0) {
      pendingList = pendingRequests
        .map(
          (r) =>
            `• **${r.firstName} ${r.lastName}** (\`${r.employeeCode || 'EMP'}\`): ${r.leaveType} for **${r.duration} day(s)** (${r.startDate} to ${r.endDate})\n  *Reason:* "${r.reason || 'Personal reasons'}"`,
        )
        .join('\n');
    }

    const reply = `### 🌴 Time Off & Leave Status

- **Pending Approvals:** **${snap.timeOff.pendingRequests}** request(s) waiting for HR / Manager action.
- **Approved Days (Cycle):** **${snap.timeOff.approvedDaysThisMonth}** days allocated and consumed.

**Recent Pending Requests:**
${pendingList}

*Policy Highlight:* Paid Annual Leave requires at least 48 hours advance submission. Sick leaves exceeding 2 consecutive days require a medical certificate upload upon return.`;

    const proposals: ActionProposal[] | undefined =
      isHR && pendingRequests.length > 0
        ? pendingRequests.slice(0, 3).map((r) => ({
            actionType: 'APPROVE_LEAVE' as const,
            title: `Approve ${r.leaveType}`,
            description: `Approving will deduct ${r.duration} day(s) from employee balance and mark status as Approved.`,
            requestId: r.requestId,
            employeeName: `${r.firstName} ${r.lastName}`,
            employeeCode: r.employeeCode || undefined,
            leaveType: r.leaveType,
            duration: `${r.duration} day(s)`,
            dates: `${r.startDate} to ${r.endDate}`,
            reason: r.reason || 'Personal reasons',
            requiresConfirmation: true,
          }))
        : undefined;

    return {
      reply,
      metricCards: cards,
      actionProposals: proposals,
      actionLinks: [
        { label: 'Manage Time Off Requests', url: '/time-off' },
      ],
      suggestedFollowUps: [
        'What is our sick leave policy?',
        'How is attendance health today?',
        'Give me quick insights',
      ],
      provider: 'builtin-db',
    };
  }

  // 5. CONTRACTS & WORK SCHEDULES
  if (
    text.includes('contract') ||
    text.includes('expiring') ||
    text.includes('schedule') ||
    text.includes('probation')
  ) {
    const snap = await chatbotRepo.getHRQuickSnapshot();
    const c = snap.contracts;

    const cards: MetricCard[] = [
      {
        label: 'Active Contracts',
        value: c.activeContracts,
        subtext: 'Currently binding',
      },
      {
        label: 'Draft Contracts',
        value: c.draftContracts,
        subtext: 'Needs activation',
      },
      {
        label: 'Expiring (30 Days)',
        value: c.expiringWithin30Days,
        subtext: 'Requires renewal review',
        badge: c.expiringWithin30Days > 0 ? 'Attention' : 'None',
      },
    ];

    const reply = `### 📜 Contracts & Scheduling Intelligence

- **Active Contracts:** **${c.activeContracts}** active contracts tied to payroll.
- **Draft Contracts:** **${c.draftContracts}** in draft status (must be activated before included in payruns).
- **Expiring Soon:** **${c.expiringWithin30Days}** contract(s) expiring within the next 30 days.

*Compliance Rule:* Each employee must have exactly **one active contract** for a given payroll period. Concurrent active contracts are blocked by database constraints.`;

    return {
      reply,
      metricCards: cards,
      actionLinks: [
        { label: 'Review Contracts', url: '/contracts' },
        { label: 'Manage Schedules', url: '/schedules' },
      ],
      suggestedFollowUps: [
        'Show department headcount and salary costs',
        'Summarize payroll status',
        'Give me quick insights',
      ],
      provider: 'builtin-db',
    };
  }

  // 6. DEPARTMENT & WORKFORCE BREAKDOWN
  if (
    text.includes('department') ||
    text.includes('headcount') ||
    text.includes('workforce') ||
    text.includes('team') ||
    text.includes('org')
  ) {
    const depts = await chatbotRepo.getDepartmentSummary();
    const snap = await chatbotRepo.getHRQuickSnapshot();

    const deptRows = depts
      .map(
        (d) =>
          `• **${d.departmentName}**: **${d.employeeCount}** employees | Budget: ${formatCurrency(Number(d.totalWages))}`,
      )
      .join('\n');

    const reply = `### 🏢 Organization & Department Breakdown

- **Total Staff Registered:** **${snap.headcount.totalEmployees}**
- **Active Employees:** **${snap.headcount.activeEmployees}**
- **Incomplete Onboarding:** **${snap.headcount.incompleteProfiles}**

**Department Headcounts & Salary Commitments:**
${deptRows}
`;

    return {
      reply,
      actionLinks: [
        { label: 'View Org Chart', url: '/organization' },
        { label: 'Team Directory', url: '/employees' },
      ],
      suggestedFollowUps: [
        'Summarize payroll status',
        'Check expiring contracts',
        'Give me quick insights',
      ],
      provider: 'builtin-db',
    };
  }

  // 7. EMPLOYEE SEARCH / LOOKUP
  if (
    text.startsWith('who is') ||
    text.startsWith('find employee') ||
    text.startsWith('search employee') ||
    text.startsWith('tell me about') ||
    text.includes('emp-')
  ) {
    const cleanTerm = text
      .replace('who is', '')
      .replace('find employee', '')
      .replace('search employee', '')
      .replace('tell me about', '')
      .trim();

    if (cleanTerm.length >= 2) {
      const results = await chatbotRepo.searchEmployees(cleanTerm, 3);
      if (results.length > 0) {
        const empDetails = results
          .map(
            (e) =>
              `• **${e.firstName} ${e.lastName}** (\`${e.employeeCode || 'N/A'}\`)\n  - **Role:** ${e.position || 'Specialist'} (${e.department || 'General'})\n  - **Email:** ${e.email}\n  - **Status:** \`${e.status.toUpperCase()}\` | Joined: ${e.dateOfJoining || 'N/A'}\n  - **Location:** ${e.location || 'Headquarters'}`,
          )
          .join('\n\n');

        return {
          reply: `### 👤 Employee Lookup Results\n\nFound matching records for *"${cleanTerm}"*:\n\n${empDetails}`,
          actionLinks: [{ label: 'Open Employee Directory', url: '/employees' }],
          suggestedFollowUps: [
            'Give me quick insights',
            'Show pending leave requests',
          ],
          provider: 'builtin-db',
        };
      }
    }
  }

  // 8. POLICIES & COMPLIANCE
  if (
    text.includes('policy') ||
    text.includes('policies') ||
    text.includes('compliance') ||
    text.includes('code of conduct') ||
    text.includes('remote') ||
    text.includes('wfh') ||
    text.includes('notice') ||
    text.includes('benefits')
  ) {
    const policies = await chatbotRepo.getAllPolicies();
    if (policies.length > 0) {
      const matching = policies.filter((p) => {
        const fullText = `${p.title} ${p.summary} ${p.category} ${p.content}`.toLowerCase();
        if (text.includes('leave') && fullText.includes('leave')) return true;
        if (text.includes('sick') && fullText.includes('sick')) return true;
        if (text.includes('remote') && (fullText.includes('remote') || fullText.includes('wfh'))) return true;
        if (text.includes('conduct') && fullText.includes('conduct')) return true;
        return false;
      });

      const selected = matching.length > 0 ? matching : policies.slice(0, 5);
      const policyList = selected
        .map(
          (p) =>
            `• **${p.title}** (\`${p.code}\` - ${p.category.toUpperCase()}):\n  ${p.summary} ${p.isMandatory ? '*(Mandatory)*' : ''}`,
        )
        .join('\n\n');

      return {
        reply: `### 📑 Company Policies & Guidelines

Here is the policy information from our official compliance handbook:

${policyList}

All employees can view full policy texts and digitally acknowledge required documents in the **Documents Hub**.`,
        actionLinks: [{ label: 'Read Full Documents & Policies', url: '/documents' }],
        suggestedFollowUps: [
          'What is our sick leave policy?',
          'How is salary calculated?',
          'Give me quick insights',
        ],
        provider: 'builtin-db',
      };
    }
  }

  // 9. SALARY RULES & COMPUTATION EXPLANATION
  if (
    text.includes('how is salary') ||
    text.includes('salary rule') ||
    text.includes('deduction') ||
    text.includes('pf') ||
    text.includes('provident fund') ||
    text.includes('tax') ||
    text.includes('allowance') ||
    text.includes('gross') ||
    text.includes('basic')
  ) {
    return {
      reply: `### 🧮 Salary Structure & Rule Engine in PeoplePay360

Salaries in PeoplePay360 are computed in an ordered 5-stage sequential sequence:

1. **Basic Salary (\`BASIC\`):** Base contract wage (typically 50% of total wage package).
2. **Allowances (\`HRA\`, \`DA\`, \`SPECIAL\`):**
   - *House Rent Allowance (HRA):* 40%–50% of Basic.
   - *Special / Travel Allowance:* Remainder of contract wage.
3. **Gross Salary (\`GROSS\`):** Sum of Basic + all Allowances.
4. **Statutory Deductions (\`PF\`, \`PT\`, \`TDS\`):**
   - *Provident Fund (PF):* 12% of Basic salary capped per statutory limits.
   - *Professional Tax (PT):* Slab-based deduction (e.g. ₹200/mo).
   - *Income Tax (TDS):* Deducted based on annual taxable income slab.
5. **Net Salary (\`NET\`):** \`GROSS - Total Deductions\`, factoring worked days and unpaid leaves.

*Rule Evaluation:* Salary rules are sequenced so subsequent percentages calculate dynamically off previous lines!`,
      actionLinks: [
        { label: 'View Salary Structures', url: '/salary-structures' },
        { label: 'View Payruns', url: '/payruns' },
      ],
      suggestedFollowUps: [
        'Summarize latest payrun status',
        'What is our leave policy?',
        'Give me quick insights',
      ],
      provider: 'builtin-db',
    };
  }

  // 10. DEFAULT / GENERAL HELP
  return {
    reply: `### 👋 PeoplePay360 HR AI Assistant

I am your connected HR & Payroll co-pilot, wired directly to live operational data.

Here are things you can ask me:
- **⚡ Executive Insights:** *"Give me quick insights"* or *"Summarise company status"*
- **💰 Payroll & Payruns:** *"Summarize payroll status"* or *"What was the total net pay this month?"*
- **⏱️ Attendance Health:** *"How is attendance today?"* or *"Who is late or absent?"*
- **🌴 Time Off & Leaves:** *"Show pending leave requests"* or *"What is our sick leave policy?"*
- **📜 Contracts & Compliance:** *"Are there any expiring contracts?"* or *"What are our company policies?"*
- **👤 Employee Directory:** *"Who is in Engineering?"* or *"Tell me about EMP-001"*
- **🧮 Salary Engine:** *"How is net salary computed?"*

What would you like to explore?`,
    actionLinks: [
      { label: 'Dashboard', url: '/dashboard' },
      { label: 'Employees', url: '/employees' },
      { label: 'Payruns', url: '/payruns' },
    ],
    suggestedFollowUps: [
      'Give me quick insights',
      'Summarize payroll status',
      'How is attendance health today?',
      'Show pending leave requests',
    ],
    provider: 'builtin-db',
  };
}

export async function getQuickInsights(user: AuthUser) {
  const [snapshot, departments, pendingLeaves] = await Promise.all([
    chatbotRepo.getHRQuickSnapshot(),
    chatbotRepo.getDepartmentSummary(),
    chatbotRepo.getPendingLeaveRequestsWithDetails(5),
  ]);

  return {
    snapshot,
    departments,
    pendingLeaves,
    requestedBy: user.email,
    role: user.role,
  };
}

export function getSuggestions(user: AuthUser): string[] {
  const isHR =
    user.role === 'Admin' ||
    user.role === 'HR Manager' ||
    user.role === 'HR Payroll Manager' ||
    user.role === 'HR Payroll User';

  if (isHR) {
    return [
      '⚡ Give me quick HR & payroll insights',
      '💰 Summarize latest payrun status',
      '⏱️ How is attendance health today?',
      '🌴 Show pending leave requests awaiting approval',
      '📜 Are there any expiring contracts?',
      '🏢 Show department headcount and salary costs',
      '📑 What is our sick leave and probation policy?',
    ];
  }

  return [
    '📑 What is our company leave policy?',
    '💼 How is my salary and net pay calculated?',
    '⏱️ What are the standard working hours?',
    '🌴 How do I request time off?',
    '📄 Where can I download my payslip?',
  ];
}

export async function executeAction(
  input: ExecuteActionInput,
  user: AuthUser,
): Promise<{
  success: boolean;
  message: string;
  requestId: string;
  employeeName: string;
  leaveType: string;
  duration: string;
  approvedAt: string;
  approvedBy: string;
}> {
  if (
    user.role !== 'Admin' &&
    user.role !== 'HR Manager' &&
    user.role !== 'HR Payroll Manager' &&
    user.role !== 'HR Payroll User'
  ) {
    throw new ForbiddenError('Only HR Managers and Administrators can approve employee leaves.');
  }

  if (input.action === 'APPROVE_LEAVE') {
    const rawTarget = input.payload.requestId.trim();

    // 1. Direct ID lookup
    let request = await chatbotRepo.findPendingLeaveById(rawTarget);

    // 2. Fallback search (by employee code like 'EMP-3', name, or partial ID)
    if (!request) {
      const searchMatches = await chatbotRepo.findPendingLeaveBySearch(rawTarget, 1);
      if (searchMatches.length > 0) {
        request = searchMatches[0];
      }
    }

    if (!request) {
      throw new NotFoundError(
        'Pending leave request not found or has already been approved/cancelled.',
      );
    }

    // Call timeoffService to execute the real transactional leave approval and balance deduction
    await timeoffService.approveRequest(request.requestId, user.id);

    return {
      success: true,
      message: `Successfully approved ${request.leaveType} for ${request.firstName} ${request.lastName} (${request.duration} days).`,
      requestId: request.requestId,
      employeeName: `${request.firstName} ${request.lastName}`,
      leaveType: request.leaveType,
      duration: `${request.duration} day(s)`,
      approvedAt: new Date().toISOString(),
      approvedBy: user.email,
    };
  }

  throw new ValidationError(`Unsupported action type: ${input.action}`);
}

