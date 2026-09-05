# Odoo Hackathon 2026 — Technical Review

### Project: **PeoplePay360 — HR & Payroll**

### Team: **Team644**

I reviewed the submitted source across the backend, frontend, database schema/migrations, authentication/RBAC, payroll engine, attendance/time-off workflows, tests, and project structure.

**Overall assessment:** The project is architecturally ambitious and visually polished, with a notably good modular backend structure and a reasonably complete HR/payroll workflow. However, there are **critical security and correctness issues** that materially reduce its readiness for an onsite round—particularly the fact that most business APIs are exposed without authentication/authorization and the payroll formula engine executes dynamically generated JavaScript.

One additional limitation during review: the repository does not contain installed backend dependencies, so the backend test suite could not be executed (`vitest: not found`). The frontend build also could not complete because the available environment lacked the required Vite/Node type packages. Therefore, the scores below are primarily based on static source-code review plus the available test/code artifacts.

---

## 1. Coding Standards — **7/10**

### Detailed Feedback

**Strengths**

* The backend has a clear and consistent module naming convention: `*.routes.ts`, `*.service.ts`, `*.repository.ts`, and `*.validators.ts`.
* TypeScript is used throughout both frontend and backend.
* The backend generally follows a sensible service → repository separation.
* Functions such as `getActiveContractForPeriod`, `computePayslipLines`, `evaluateRule`, and `roundToTwoDecimals` have reasonably clear responsibilities.
* There are useful comments around important areas such as RBAC permissions, payroll rule execution, and authentication.
* The project includes dedicated convention/design documents such as `BACKEND_CONVENTIONS.md`, `FRONTEND_CONVENTIONS.md`, and design documentation.
* Prettier and Oxlint are configured.

**Weaknesses**

* There is significant use of weak typing such as `Record<string, any>` throughout repositories and services. This removes much of the safety benefit of TypeScript.
* `any` appears in several frontend error handlers and reporting code.
* The same concepts are represented using different naming conventions. For example, database-facing values alternate between camelCase and snake_case representations.
* Some comments describe behavior that does not accurately reflect the implementation. The rule-engine test says it evaluates formulas "without eval()", while the implementation uses `new Function()`, which is effectively dynamic code execution.
* There are remnants of the Vite starter styling/assets and CSS variables that do not appear to belong to the final application.
* The frontend contains multiple older/duplicate page paths and naming patterns, suggesting some incomplete cleanup after architectural changes.
* The project contains both `package-lock.json` and pnpm lockfiles in the backend, indicating inconsistent package-manager conventions.

---

## 2. Logic — **5/10**

### Detailed Feedback

**Strengths**

* The project models a meaningful HR lifecycle: employee → contract → attendance/time-off → salary rules → payrun → payslip.
* Contract overlap checking is implemented for active contracts.
* Payrun state transitions have reasonable basic controls:

  * computed → validated
  * validated → paid
* Duplicate payslip detection exists.
* Leave approval performs a transactional balance deduction through `executeApproveRequestTx`.
* The salary rule engine supports fixed, percentage, and formula-based rules and executes them in sequence.
* Validation schemas cover many basic input constraints.

**Weaknesses**

* **Payroll calculations contain important business-logic shortcuts.** When an employee has no attendance records, the implementation defaults worked days to `22`:

  > `const effectiveWorkedDays = workedDays > 0 ? workedDays : 22;`

  This means an employee with zero recorded attendance can receive a full-period payroll calculation.
* `totalPeriodDays` is hard-coded to `22`, rather than being derived from the actual payroll period or working schedule.
* The declared product workflow says time-off should feed into payroll calculations, but `createPayrunWizard()` does not actually incorporate approved leave/unpaid leave into the salary calculation.
* `wageType` supports both `monthly` and `hourly`, but the payroll calculation effectively treats the wage as a generic salary amount rather than implementing distinct hourly/monthly calculation behavior.
* Payroll warnings are generated, but a missing contract still results in a payslip object with a fake all-zero UUID:

  > `00000000-0000-0000-0000-000000000000`
* Payrun creation checks for duplicate payslips before inserting them, but the duplicate prevention is not fully represented as a database-level uniqueness constraint across employee + period. This leaves a race-condition window.
* `createAllocation()` validates date ordering but does not appear to enforce all relevant balance/date consistency rules at the database level.
* Attendance lateness is hard-coded to **09:30**, despite the system having working schedules with configurable start times.
* Attendance calculations use JavaScript local time, which creates timezone sensitivity for a payroll/attendance system.
* The project description claims broader workflows such as bulk email distribution and richer payroll auditing, but corresponding implementation appears incomplete or absent.

---

## 3. Modularity — **8/10**

### Detailed Feedback

**Strengths**

* This is one of the stronger aspects of the submission.
* The backend is organized into domain modules:

  * `auth`
  * `users`
  * `hr`
  * `contracts`
  * `attendance`
  * `timeoff`
  * `payroll`
  * `reporting`
  * `documents`
* Most modules have clear separation between routes, validation, services, repositories, and controllers.
* The payroll rule engine is isolated into its own module.
* Shared infrastructure such as database access, authentication middleware, error handling, formatting, and migration utilities is centralized.
* The frontend uses feature-oriented organization, for example:

  * `features/employees`
  * `features/compensation`
  * `features/documents`
  * `features/organization`
  * `features/auth`
* React Query hooks isolate API/query concerns reasonably well.
* Database transactions are used in important multi-write operations such as payrun creation and leave approval.

**Weaknesses**

* Some services are doing too much orchestration. `createPayrunWizard()` is particularly large and coordinates employee retrieval, contracts, attendance, warnings, payroll calculations, and persistence.
* `Record<string, unknown>`/`Record<string, any>` crosses module boundaries instead of strongly typed DTOs.
* The routing architecture has duplicate aliases:

  * `/api/payroll/...`
  * `/api/payruns`
  * `/api/payslips`
  * `/api/salary-structures`

  This increases API surface complexity.
* There are duplicated/legacy frontend pages such as `src/pages/EmployeeDashboardPage.tsx` alongside feature-based employee pages.
* Some controller/service boundaries are inconsistent: certain modules have controllers while others put route logic directly into route files.

---

## 4. Database Design — **5/10**

### Detailed Feedback

**Strengths**

* PostgreSQL is an appropriate database choice for an HR/payroll system.
* UUID primary keys are consistently used.
* Foreign-key relationships are extensively modeled.
* Several useful constraints exist:

  * unique employee email
  * unique user email
  * unique salary structure code
  * unique attendance employee/date
  * unique payslip employee/payrun
  * unique policy acceptance version
* Foreign-key deletion behavior is thoughtfully specified in many places.
* There is an index on contracts intended to accelerate period-based contract lookup.
* Drizzle provides parameterized query construction rather than raw string concatenation for normal database access.
* Multi-step writes use transactions in critical places.

**Weaknesses**

* **The migration/schema state is inconsistent.** The SQL migration defines `job_positions`, while the Drizzle schema declares `pgTable('jobPositions', ...)`. This is a significant schema synchronization risk.
* The `users` migration does not contain the `is_active` column even though the Drizzle schema requires it.
* The migration set does not appear to fully represent all tables in the current Drizzle schema, including the fingerprint table.
* The database documentation describes fields that do not completely match the actual implementation.
* Several important business constraints exist only in application code rather than database constraints.
* Active contract overlap is checked in application code and is susceptible to concurrent requests.
* Payroll duplicate prevention similarly relies heavily on application-level checks.
* Several high-volume query paths lack obvious supporting indexes beyond primary/unique indexes.
* `departments.manager_id` and `employees.manager_id` are modeled in the database schema without corresponding foreign-key declarations in the Drizzle schema.
* Sensitive employee information such as bank account information is stored directly without an evident additional data-protection layer.
* `fingerprint.encryted_template` is also misspelled at the schema level, which is a maintainability/data-contract issue.

---

## 5. Frontend Design — **8/10**

### Detailed Feedback

**Strengths**

* The frontend is visually considerably stronger than a typical hackathon CRUD application.
* The design system is clearly documented and consistently attempts to use design tokens.
* The editorial monochrome/violet aesthetic gives the application a recognizable visual identity.
* Feature-oriented React structure is good.
* Components such as employee profiles, compensation views, organization charts, attendance views, policy views, and payroll tables indicate substantial UI coverage.
* React Query is used for server state rather than manually duplicating API state throughout components.
* Responsive CSS patterns are present.
* There is explicit consideration of reduced-motion preferences.
* Form fields generally use labels and semantic controls.
* The organization chart is implemented as a dedicated component structure rather than one giant page.

**Weaknesses**

* `App.tsx` exposes all application routes directly without frontend route guards.
* There are numerous duplicate route aliases such as `/documents`, `/policies`, `/employee/docs`, and `/employee/documents`.
* `App.css` still contains substantial Vite starter/template CSS and references variables such as `--border` that do not align with the newer token system.
* Some user interactions rely on native `alert()` rather than a consistent application notification system.
* Error handling uses `any` in several components.
* There are signs of unfinished starter assets (`vite.svg`, `react.svg`) remaining in the application.
* The frontend build could not be completed in the supplied execution environment because required packages/types were unavailable, so runtime UI correctness could not be fully verified.

---

## 6. Performance — **6/10**

### Detailed Feedback

**Strengths**

* React Query provides caching and deduplication for server-state requests.
* The Axios client uses a single-flight refresh promise, avoiding multiple simultaneous refresh operations.
* Reporting queries use parallel execution through `Promise.all()`.
* Database queries generally use targeted projections and joins rather than retrieving entire related tables indiscriminately.
* Payroll writes are grouped inside a database transaction.

**Weaknesses**

* **There is a clear N+1 query pattern in payroll eligibility/calculation.**

  `getEligibleEmployeesForPeriod()` loops through every employee and performs a contract lookup for each employee.
* `createPayrunWizard()` similarly performs multiple database/service calls per employee:

  * employee lookup
  * contract lookup
  * payslip lookup
  * attendance lookup

  This can become expensive with hundreds or thousands of employees.
* `getPoliciesForUser()` retrieves all policies and all acceptances for a user rather than making a more targeted joined query.
* There is no evident pagination on major employee, attendance, contract, payslip, or request listing endpoints.
* Reporting queries aggregate across potentially large tables without visible date/tenant filtering or pagination.
* No meaningful backend caching layer is evident.
* There is no evident rate limiting middleware in the Express application despite frontend handling for HTTP 429 responses.
* Asset cleanup/bundling optimization is not particularly mature.

---

## 7. Scalability — **6/10**

### Detailed Feedback

**Strengths**

* The backend is a modular monolith, which is a sensible architecture for the scope of the application.
* Services and repositories provide reasonable boundaries for future extraction or refactoring.
* PostgreSQL connection pooling is configured with a maximum pool size.
* Stateless JWT authentication is conceptually compatible with horizontal application scaling.
* React Query reduces unnecessary repeated client requests.
* Database transactions provide consistency for multi-record operations.

**Weaknesses**

* Payroll processing is fundamentally sequential at the employee level and makes multiple database calls per employee, limiting scalability as employee counts grow.
* There is no asynchronous job/queue architecture for expensive operations such as payroll computation, PDF generation, or bulk delivery.
* No distributed caching or shared session mechanism is present; JWT avoids session-state requirements, but other infrastructure needed for scale is absent.
* Reporting directly queries operational tables, which can become expensive as attendance/payroll history grows.
* There is no obvious multi-tenant/company isolation model in the schema.
* The current architecture assumes a relatively small organizational dataset.
* Database indexes and query patterns are not yet mature enough for a large enterprise HR/payroll deployment.
* No explicit audit/event architecture exists for highly sensitive operations such as salary changes, payroll validation, or employee record modification.

---

## 8. Security — **2/10**

### Detailed Feedback

This is the **largest concern in the submission**.

**Strengths**

* Passwords are hashed with bcrypt rather than stored in plaintext.
* JWT authentication is implemented.
* HTTP-only cookies are used for browser authentication.
* Cookie `secure` mode is enabled in production.
* Zod validation is present on many write endpoints.
* There is a defined RBAC permission model.
* Admin user management is protected by `authenticateToken` + `requireRole(['Admin'])`.
* Database operations use Drizzle's parameterized query construction.
* Generic login failure messages are used for incorrect credentials.

**Weaknesses**

* **Most business API routes are not authenticated at all.**

  Authentication middleware is explicitly applied to `auth/me`, `users`, and `documents`, but routes for employees, contracts, attendance, time-off, payroll, and reporting do not have `authenticateToken` protection.

  The route scan shows authentication middleware being applied to only a small subset of modules.

  Consequently, endpoints handling highly sensitive information—including employee records, salary information, payslips, attendance, contracts, and payroll—can be reached without the intended RBAC layer.
* The defined `ROLE_PERMISSIONS` map is therefore largely unused for the majority of the application.
* Employee self-service isolation is not enforced server-side. For example, attendance accepts an arbitrary `employeeId` from the request body.
* Payslip retrieval accepts arbitrary IDs without checking that the requesting employee owns the payslip or that the user's role permits access.
* Employee endpoints accept arbitrary employee IDs without enforcing self-access restrictions.
* **The payroll formula engine uses `new Function()` on formula input.**

  The relevant implementation dynamically constructs and executes JavaScript:
  `new Function(\`return (${expression})`)()`

  This is a serious code-execution/security concern when formulas originate from administrators or stored data.
* The JWT secret has an insecure hard-coded fallback value. If the environment variable is missing, the application uses a predictable secret.
* JWTs have a relatively long seven-day lifetime and there is no evident token revocation mechanism.
* There is no visible login rate limiting/brute-force protection in the backend.
* No CSRF strategy is evident for the cookie-authenticated API.
* `x-forwarded-for` is trusted directly for policy acceptance IP logging without an evident trusted-proxy configuration.
* Sensitive database credentials were present in the submitted backend environment file. Even if intended for hackathon deployment, inclusion of actual credentials in a submitted source archive is a major security hygiene problem.
* Security headers such as Helmet are not configured.
* There is no evident audit logging for privileged HR/payroll actions.
* The frontend's lack of route guards is secondary to the backend issue, but it reinforces the access-control weakness.

**Security verdict:** For an HR/payroll system containing bank details, salary information, attendance, and identity information, these are critical issues rather than minor hardening gaps.

---

## 9. Usability — **8/10**

### Detailed Feedback

**Strengths**

* The product has a coherent end-to-end HR workflow rather than being a collection of disconnected CRUD pages.
* The employee profile/hub concept is particularly strong from a workflow perspective.
* Payroll has a recognizable compute → review → validate → paid lifecycle.
* The payrun wizard provides a logical multi-step workflow.
* Policy compliance has dedicated status indicators and acceptance flows.
* Attendance has dedicated check-in/check-out interactions and historical views.
* Organization visualization provides a useful alternative to purely tabular employee management.
* Error messages are generally human-readable, for example:

  * invalid leave balance
  * duplicate payslip detection
  * inactive account
  * invalid contract dates
* The UI design system creates strong consistency across modules.

**Weaknesses**

* Several workflows rely on browser `alert()` messages, which feels inconsistent with the otherwise polished interface.
* Some backend errors expose technical concepts such as permission identifiers directly to users.
* There are multiple duplicate URLs for the same feature, which can make navigation and information architecture less predictable.
* The frontend does not appear to enforce role-aware navigation consistently.
* Some documented product capabilities do not appear fully implemented, particularly bulk payslip delivery and some payroll/audit functionality.
* The absence of backend authorization means the application's visible UX security model can differ substantially from the actual API security model.

---

# Score Summary

|         # | Attribute        |     Score |
| --------: | ---------------- | --------: |
|         1 | Coding Standards |  **7/10** |
|         2 | Logic            |  **5/10** |
|         3 | Modularity       |  **8/10** |
|         4 | Database Design  |  **5/10** |
|         5 | Frontend Design  |  **8/10** |
|         6 | Performance      |  **6/10** |
|         7 | Scalability      |  **6/10** |
|         8 | Security         |  **2/10** |
|         9 | Usability        |  **8/10** |
| **Total** |                  | **55/90** |

### Normalized score: **61.1%**

## Onsite Selection Assessment

**Ranking recommendation: ❌ Do not select for the Top 300 in its current state.**

The project has several qualities that would make it **visually and architecturally competitive** in a large hackathon pool: strong UI, good modularization, substantial feature breadth, a configurable payroll-rule concept, and a reasonably thoughtful data model.

However, the **security failure is severe enough to outweigh those strengths**. In particular, an HR/payroll system exposing employee and payroll APIs without consistent authentication/authorization is a fundamental architectural defect. The dynamic `new Function()` payroll evaluator is another critical concern because payroll formulas are directly associated with financial computation.

### Reviewer conclusion

**What makes it competitive:**
**Frontend + modular architecture + breadth of HR/payroll functionality**

**What prevents Top-300 selection:**
**Critical API authorization gaps + unsafe payroll formula execution + schema/migration inconsistency + significant payroll logic shortcuts**

**Final score: 55/90 — 61.1%**

If the 4,000-project pool is being evaluated strictly on **production-readiness and technical correctness**, I would place this **below the Top-300 cutoff** despite its strong presentation and feature breadth.

