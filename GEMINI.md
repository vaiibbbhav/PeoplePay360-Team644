# PeoplePay360 — Engineering Guidelines

**Stack**: TypeScript, Node.js + Express, Neon PostgreSQL, one deployable modular monolith with strict internal module boundaries.

These guidelines exist for one reason: a hackathon judge — or your own teammate at 2am — should be able to open any file and understand it in under a minute. Prefer boring, obvious code over clever code every time.


## Antigravity project instructions

This file is the project source of truth for implementation decisions. Keep the implementation aligned with the PeoplePay360 HR & Payroll hackathon specification supplied with this project.

- Use **TypeScript** throughout the backend. Do not create new `.js` source files.
- Use **Neon PostgreSQL** as the database. Use the Neon connection string from environment variables; never commit credentials or hardcode connection details.
- All backend HTTP API routes **must use the `/api` prefix**. Examples: `/api/employees`, `/api/contracts`, `/api/attendance`, `/api/time-off`, `/api/payruns`, `/api/payslips`, `/api/reports`.
- Keep the backend as a **single deployable modular monolith**. Organize code by business module, not by technical layer.
- Prefer real, working functionality over mockups. Configuration screens and dashboards must operate on live database records.
- Do not silently invent requirements that conflict with the project specification. When implementation choices are unspecified, choose the simplest maintainable option.

### Required project outcomes from the specification

The finished application must support the complete connected HR → attendance/time off → payroll → payslip → delivery flow. Employee records are the central hub, with Contracts and Working Schedules providing payroll context, Attendance and Time Off capturing day-to-day operations, Salary Structures and Salary Rules driving salary computation, and Payruns producing validated Payslips.

---

## 1. Project structure

Structure by **module** (business domain), not by technical layer. Each module owns its routes, business logic, and database access — this is what keeps the "modular" in modular monolith real, not just a diagram.

```
src/
  modules/
    hr/
      hr.routes.ts        # Express router — thin, just wires HTTP to service calls
      hr.service.ts        # business logic — no SQL here
      hr.repository.ts     # all SQL for this module lives here, nowhere else
      hr.validators.ts     # request-shape validation
    contracts/
      contracts.routes.ts
      contracts.service.ts
      contracts.repository.ts
      contracts.validators.ts
    attendance/
      ...
    timeoff/
      ...
    payroll/
      payroll.routes.ts
      payroll.service.ts
      payroll.repository.ts
      payroll.validators.ts
      rule-engine.ts        # salary rule evaluation, isolated — see §6
      payrun-worker.ts       # background job that computes a payrun
    reporting/
      ...
  shared/
    db.ts                  # single pg Pool instance, exported once
    errors.ts               # AppError classes (see §5)
    auth-middleware.ts       # authn + RBAC permission check
    async-handler.ts         # wraps async route handlers (see §4)
    queue.ts                 # job queue client (BullMQ / pg-boss)
  app.ts                    # Express app setup, mounts module routers
  server.ts                 # http.listen — nothing else
migrations/                 # one file per schema change, timestamped
tests/

```

**Rule: a module never imports another module's** **`repository.ts`** **directly.** If Payroll needs contract data, it calls `contracts.service.ts`'s exported function, not `contracts.repository.ts`'s SQL. This is the one rule that actually enforces the module boundary — everything else is convention, this one is checkable in code review.

---

## 2. Layering — keep each layer doing exactly one job

| Layer Job Must NOT contain  |                                                   |                                                                                               |
| --------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `*.routes.ts`               | Parse request → call service → send response      | Business logic, SQL, `try/catch` beyond the shared wrapper                                    |
| `*.service.ts`              | Business rules, orchestration across repositories | Raw SQL, `req`/`res` objects                                                                  |
| `*.repository.ts`           | SQL queries, nothing else                         | Business rules, validation                                                                    |
| `*.validators.ts`           | Shape/type checking on input                      | Business rules (e.g. "is this contract active" is a service concern, not a validator concern) |

A route handler should be readable as a summary of what happens, not how:

```ts
// hr/hr.routes.ts
router.post('/employees', asyncHandler(async (req, res) => {
  validateCreateEmployee(req.body);
  const employee = await hrService.createEmployee(req.body, req.user);
  res.status(201).json(employee);
}));

```

If a route handler is doing more than "validate → call service → respond", the logic belongs in the service, not the route.

---

## 3. Style rules — no complex or clever code

This is a direct project requirement, not a style preference. Concretely:

- **No one-liner chains.** If a line combines more than two `.map/.filter/.reduce`, split it into named intermediate variables. A judge reading `payslipLines.reduce((a,l)=>a+(l.category==='deduction'?-l.amount:l.amount),0)` has to decode it; `sumByCategory(payslipLines)` does not.
- **No clever regex, no bit tricks, no destructuring more than one level deep.** If you need a comment to explain *what* a line does (not *why*), rewrite the line instead.
- **Prefer** **`async/await`** **over** **`.then()`** **chains**, and never mix the two in the same function.
- **No more than 3 levels of nesting** (`if` inside `if` inside a loop is the ceiling). Use early returns to flatten:
  ```ts
  // Good
  function assertActiveContract(contract) {
    if (!contract) throw new NotFoundError('No contract found for this period');
    if (contract.status !== 'active') throw new ValidationError('Contract is not active');
    return contract;
  }

  ```
- **Functions do one thing.** If a function name needs "and" to describe it (`computeAndSavePayslip`), split it into two functions and have the caller call both.
- **No premature abstraction.** Don't build a generic plugin system for salary rules "in case we need more computation types later" — three `if/else if/else` branches for `fixed`/`percentage`/`formula` (§6) is correct and readable; a strategy-pattern class hierarchy for three cases is not.
- **Comments explain** ***why*****, not** ***what*****.** `// PT is calculated on gross, not basic, per statutory rule` is useful. `// loop through employees` is not — delete it.

---

## 4. Error handling — one pattern, used everywhere

Don't scatter `try/catch` through every route. Wrap every async route handler once, and centralize error responses in one Express error middleware:

```ts
// shared/async-handler.ts
import type { RequestHandler } from 'express';

const asyncHandler = (fn: RequestHandler): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export { asyncHandler };

```

```ts
// shared/errors.ts
class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

class ValidationError extends AppError {
  constructor(message: string) { super(message, 400); }
}

class NotFoundError extends AppError {
  constructor(message: string) { super(message, 404); }
}

class ForbiddenError extends AppError {
  constructor(message: string) { super(message, 403); }
}

class ConflictError extends AppError {
  constructor(message: string) { super(message, 409); }
} // e.g. overlapping contract

export { AppError, ValidationError, NotFoundError, ForbiddenError, ConflictError };

```

```ts
// app.ts — single error-handling middleware, last in the chain
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  if (status === 500) console.error(err); // only log unexpected errors
  res.status(status).json({ error: err.message });
});

```

Services `throw` typed errors; routes never `try/catch` at all — `asyncHandler` and the middleware handle it. This is the single biggest redundancy eliminator in an Express codebase: without it, every route reinvents its own error-response shape.

---

## 5. Database access

- **One shared** **`pg.Pool`**, created once in `shared/db.ts`, imported everywhere. Never create a new pool per request or per module.
- **Always parameterized queries.** No string concatenation into SQL, ever — this isn't just a style rule, it's the SQL-injection line.
- **Transactions for anything touching more than one table.** Payslip + payslip lines, time-off approval + allocation update — these must commit or roll back together:
  ```ts
  // payroll/payroll.repository.ts
  async function savePayslip(client: PoolClient, payslip: Payslip, lines: PayslipLine[]) {
    const { rows: [saved] } = await client.query(
      `INSERT INTO payslips (payrun_id, employee_id, contract_id, structure_id, period_start, period_end, worked_days)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [payslip.payrunId, payslip.employeeId, payslip.contractId, payslip.structureId, payslip.periodStart, payslip.periodEnd, payslip.workedDays]
    );
    for (const line of lines) {
      await client.query(
        `INSERT INTO payslip_lines (payslip_id, rule_id, code, name, category, sequence, amount)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [saved.id, line.ruleId, line.code, line.name, line.category, line.sequence, line.amount]
      );
    }
    return saved.id;
  }

  ```
  The caller manages the transaction boundary (`BEGIN`/`COMMIT`/`ROLLBACK`), the repository function just runs on whatever client it's handed — this lets the same function be reused inside a bigger multi-step transaction later without changing it.
- **Let the database enforce what it can.** The non-overlapping-contract constraint and the leave-balance trigger from `schema.sql` mean your service code doesn't need to re-implement that validation — catch the specific Postgres error code and translate it to a `ConflictError`, don't duplicate the check in TypeScript first.

---

## 6. The salary rule engine — keep it boring on purpose

This is the most "interesting" part of the system and exactly where over-engineering temptation is highest. Resist it:

```ts
// payroll/rule-engine.ts
type ComputationMethod = 'fixed' | 'percentage' | 'formula';

interface SalaryRule {
  code: string;
  name: string;
  category: string;
  sequence: number;
  computationMethod: ComputationMethod;
  amount: number;
  percentageOfCode?: string;
  percentage?: number;
  formula?: string;
}

interface RuleContext {
  results?: Record<string, number>;
  [key: string]: unknown;
}

interface PayslipLine {
  code: string;
  name: string;
  category: string;
  sequence: number;
  amount: number;
}

function evaluateRule(rule: SalaryRule, context: RuleContext): number {
  switch (rule.computationMethod) {
    case 'fixed':
      return rule.amount;
    case 'percentage':
      return (context.results[rule.percentageOfCode] || 0) * (rule.percentage / 100);
    case 'formula':
      return evaluateFormula(rule.formula, context);
    default:
      throw new AppError(`Unknown computation method: ${rule.computationMethod}`, 500);
  }
}

function computePayslipLines(rules: SalaryRule[], context: RuleContext): PayslipLine[] {
  const results: Record<string, number> = {};
  const lines: PayslipLine[] = [];
  for (const rule of rules) { // rules must already be sorted by sequence
    const amount = evaluateRule(rule, { ...context, results });
    results[rule.code] = amount;
    lines.push({ code: rule.code, name: rule.name, category: rule.category, sequence: rule.sequence, amount });
  }
  return lines;
}

export { computePayslipLines };

```

No formula-parsing library, no `eval()`, no DSL compiler for a hackathon. `evaluateFormula` can be a small, explicit parser (see the HLD's restricted grammar) — a few dozen lines, testable in isolation, not a general-purpose expression engine.

---

## 7. Avoiding redundancy — concrete checks, not just "DRY"

Redundancy in this codebase shows up in specific, predictable places. Check for these before a PR is "done":

- **Validation logic duplicated between frontend and backend is fine** (defense in depth) — but duplicated *within* the backend (the same date-range check written in two services) is not. Put it in `shared/` once.
- **RBAC checks repeated per-route.** Don't write `if (req.user.role !== 'admin') throw ...` in ten route files. Declare the required permission once per route and let one middleware check it:
  ```ts
  router.post('/payruns', requirePermission('payroll.payrun.create'), asyncHandler(createPayrun));

  ```
- **The same SQL** **`SELECT`** **shape written in two repositories.** If HR and Payroll both need "employee + department + active contract", that's one function in `contracts.service.ts` that Payroll calls — not two separate queries maintained in two places.
- **Response-shaping logic duplicated across routes** (e.g. formatting money, dates). One `shared/formatters.ts`, imported everywhere.

---

## 8. Naming

- Files: `kebab-case.ts`. Functions/variables: `camelCase`. Classes/error types: `PascalCase`.
- Repository functions read like SQL intent: `findActiveContractForPeriod`, `insertPayslip`, `updateAllocationBalance` — not `getData`, `process`, `handle`.
- Boolean variables/functions read as a question: `isContractActive`, `hasBlockingWarnings`.

---

## 9. What to skip, deliberately, for a hackathon timeline

Being disciplined about *scope*, not just code style, is part of "good quality without being redundant":

- Skip a full test suite; write focused tests only for the rule engine (§6) and the contract-overlap/leave-balance database constraints — these are the two places a silent bug would be embarrassing in the live demo.
- Skip API versioning, skip a GraphQL layer, skip a custom ORM — plain `pg` with parameterized queries is enough and easier to reason about under time pressure.
- Skip building your own auth from scratch — a well-known JWT middleware pattern is fine; don't hand-roll session management.

---


## 9. API conventions

- Every HTTP API endpoint is under **`/api`**.
- Keep route paths resource-oriented and predictable, e.g. `/api/employees`, `/api/contracts`, `/api/attendance`, `/api/time-off`, `/api/payruns`, `/api/payslips`, `/api/salary-structures`, `/api/salary-rules`, `/api/reports`.
- Route files should only parse/validate input, call services, and shape HTTP responses.
- Do not put business logic or SQL in route handlers.
- Keep authentication/authorization middleware centralized and enforce RBAC server-side.


## 10. Hackathon requirements and deliverables

Implement the following requirements from the PeoplePay360 HR & Payroll specification. These are acceptance criteria, not optional UI ideas.

### Core modules and operational features

**Employees**
- Employee master management with **Kanban, List, and Form** views.
- Capture department, manager, working schedule, job position, employment status, identity/role information.
- Employee Form is the operational hub with direct/smart-button navigation to related Contracts, Attendance, Time Off, and Allocations.

**Contracts**
- Historical contracts linked to employees.
- Contract List shows dates, wages, status, and clearly highlights the active contract.
- Contract Form captures duration, department, position, wage, and salary structure.
- Payroll must select only the contract applicable to the selected payroll period and prevent concurrent active contracts.

**Working Schedules**
- List and Form views.
- Weekly pattern with Day, Start Time, End Time, and Break.
- Calculate total weekly hours automatically.
- Assign schedules to employees or contracts.

**Attendance**
- Global access and access from an Employee Form.
- Record Check In, Check Out, Worked Hours, and Status.
- Support manual corrections for authorized users.
- Handle attendance exceptions and preserve data for reporting/dashboard use.

**Time Off**
- Main navigation containing Requests, Allocations, and configurable Time Off Types.
- Time Off Types define unit (days/hours), allocation requirements, approval workflow, and payroll integration.
- Allocations track taken, remaining, and validity periods; approval is required before an allocation becomes available.
- Approved allocation-based leave requests automatically deduct from the applicable balance.
- Request List shows Employee, Type, Dates, Duration, and Status.
- Request Form supports approval/refusal.

**Salary Structures**
- Structures are containers for ordered Salary Rules.
- List/Form views expose associated rule count, employee count, and active status.
- Form manages included rules and execution sequence.
- Payruns select the Salary Structure that determines which rules are applied.

**Salary Rules**
- List/Form views for Name, Code, Category, Sequence, and computation configuration.
- Support categories including **Basic, Allowances, Gross, Deductions, and Net salary**.
- Process rules in sequence so later rules can depend on earlier results.
- Support fixed amounts, percentages, and formulas.
- Salary Rules must actively drive Payslip generation; they must not be static configuration screens.

**Payruns**
- Creating a Payrun uses a **two-step wizard**:
  1. Select Salary Structure and Period.
  2. Filter/select eligible employees.
- Do not create the Payrun before the employee-selection step is completed.
- Processing actions: **Compute, Validate, Mark Paid, Send Payslips**.
- Show run name, structure, period, status, and payslip summary.
- Surface warnings such as missing bank details, duplicate payslips, incomplete employee data, and contract attention items before finalization.
- Preserve finalized/paid Payruns as historical records.

**Payslips**
- Accessible from Payruns and a dedicated Payslips list.
- Show Employee, Structure, Pay Run, Period, Status, Worked Days.
- Show computation breakdown for Basic, Allowances, Deductions, Gross, and Net.
- Computation must use the applicable period contract plus the Payrun's selected Salary Structure.
- Support individual printable PDF generation.

**Payslip delivery**
- Individual **Payslip PDF** generation.
- Parent Payrun supports **bulk email distribution** of payslips to employees.

**Payroll Dashboard**
- Must use **live system data**, not static/mock charts.
- Filters: **Period, Department, Employee Type**.
- KPI cards should include Total Net Salary Paid, Payslips Generated, Average Salary, Approved Time Off, and Attendance Health.
- Charts: Salary Cost by Department and Monthly Net Salary Trends using historical data.
- Operational alerts for payroll status, missing required information, duplicate payslips, and contract attention items.
- Attendance/Time Off overview should include presence, overtime, approved days, pending requests, leave balances, and attendance exceptions such as Present, Late, Absent, Overtime, missing check-outs, manual edits, and attendance coverage.
- Department breakdown combines headcount with total salary expenditure.
- Dashboard aggregates Employees, Contracts, Payroll, Attendance, and Time Off.

### Roles and authorization

Implement role-based access matching the specification:

| Role | Required access |
|---|---|
| **Employee** | View own employee details, attendance, and leave balances; create own attendance entries and Time Off Requests; no HR/payroll administration access |
| **HR Manager** | Full CRUD for Employees, Attendance, Contracts, Working Schedules, and Time Off; approve/refuse Time Off Requests; no payroll access |
| **HR Payroll User** | All HR Manager permissions + Create/Read/Update Payruns and Payslips; read-only Salary Structures and Salary Rules |
| **HR Payroll Manager** | All HR Payroll User permissions + full CRUD Payruns, Payslips, Salary Structures, and Salary Rules; full HR/payroll configuration control |
| **Admin** | Full access to all modules/models; user management, role assignment, permission updates, complete system administration |

Enforce these permissions on the backend as well as in the UI. Do not rely on frontend hiding alone.

### Business logic that must be real

Do not hardcode values where the specification requires actual logic. At minimum:
- Period-based contract selection.
- Prevention/detection of concurrent active contracts.
- Working-schedule total-hour calculation.
- Leave allocation, approval, balance consumption, and validity-period handling.
- Ordered Salary Rule evaluation with dependencies.
- Payroll warnings and validation before finalization.
- Duplicate-payroll/payslip detection.
- Live dashboard aggregation.
- Historical payroll preservation.

### Required end-to-end demonstration scenarios

The system must be populated with **representative employee, contract, time, salary, and payroll data** and be ready for a **five-minute live demonstration**.

The demo must visibly support at least two end-to-end scenarios, such as:
1. **Employee → applicable contract → attendance/time context → Payrun → computed Payslip → PDF/delivery.**
2. **Leave allocation → employee Time Off Request → approval → balance consumption.**

### Final deliverables

The project deliverables explicitly required by the specification are:

1. **Functional platform** — a fully operational HR and payroll system populated with representative employee, contract, time, salary, and payroll data.
2. **Live demonstration** — a five-minute walkthrough showing two end-to-end scenarios.
3. **Future roadmap** — a brief summary of enhancements/extensions the team would prioritize with additional development time.

The finished implementation should make each of these deliverables easy to demonstrate from the running application.

## 11. Before every commit

- [ ] No `console.log` left in service/repository code (route-level request logging via middleware is fine).
- [ ] No raw SQL outside a `*.repository.ts` file.
- [ ] No route handler with business logic in it.
- [ ] No function longer than \~40 lines — if it's longer, it's doing more than one thing.
- [ ] No duplicated validation, RBAC check, or SQL shape that already exists elsewhere in the codebase.