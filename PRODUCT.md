# PeoplePay360: HR & Payroll
**An Integrated Human Resource and Payroll Operations Platform**

---

## 1. Executive Summary & Overview
Basic HR tools often isolate employee master records, attendance punches, leave balances, and salary computations. In real-world enterprise operations, these modules are intimately interdependent:
- An employee accumulates multiple contracts over time, but payroll must select and apply strictly the single contract active during the target payroll period.
- Standard working hours derive from an assigned Working Schedule, against which daily Attendance captures exceptions (lateness, missing punch-outs, manual overrides).
- Time Off balances decrement based on approved allocations and leave requests.
- Payruns synthesize all of this contextual data through configurable Salary Structures and ordered Salary Rules, computing itemized earnings, allowances, deductions, and net payouts with automatic anomaly detection.

**PeoplePay360** eliminates manual spreadsheet reconciliation by establishing an end-to-end operational flow:
$$\text{Employee Hub} \longleftrightarrow \text{Contracts \& Schedules} \longleftrightarrow \text{Attendance \& Leaves} \longleftrightarrow \text{Salary Rules} \longleftrightarrow \text{Payruns \& Payslips} \longleftrightarrow \text{Analytics}$$

---

## 2. Platform User Roles & Permissions (RBAC)

1. **Employee**
   - Self-service portal: view personal profile, contract terms, attendance logs, and remaining leave balances.
   - Clock in / clock out and submit Time Off requests.
   - View and download personal Payslips (PDF).
   - Zero administrative access to other employees or payroll parameters.

2. **HR Manager**
   - Full CRUD over Employee profiles, Contracts, Working Schedules, and Attendance records.
   - Approve, refuse, and allocate Time Off requests.
   - Perform attendance manual edits and review presence exceptions.
   - No access to payroll runs or salary rule execution.

3. **HR Payroll User**
   - Possesses all HR Manager permissions.
   - Create, read, and update access for Payruns and Payslips (initiate runs, trigger batch computations, mark paid).
   - Read-only access to Salary Structures and Salary Rules.

4. **HR Payroll Manager**
   - Full CRUD over the entire platform: Payruns, Payslips, Salary Structures, and Salary Rules.
   - Define custom rule formulas, percentage deductions, sequencing, and structural containers.
   - Oversee bulk email distribution of payslips and export audits.

5. **Admin**
   - Unrestricted system-wide control across all modules, database models, and user role assignments.

---

## 3. Core Modules Breakdown

### A. Employee Master Management
- **Central Operational Hub:** Kanban and List views with instant status filters (Active, Onboarding, Terminated).
- **Comprehensive Profile:** Department, Manager hierarchy, assigned Working Schedule, job position, identification, and bank routing details.
- **Smart Relations:** Direct contextual access to historical Contracts, Attendance records, and Leave Allocations.

### B. Contract Management
- **Historical Tracking:** Multi-contract lifecycle per employee; preserves draft, active, and expired agreements.
- **Period-Strict Validation:** Payroll strictly binds to the active contract matching the payrun's calendar dates. Concurrent active contracts are programmatically prevented.
- **Compensation Terms:** Wage amount, wage type (monthly, hourly), assigned Salary Structure, and working schedule binding.

### C. Working Schedules & Attendance
- **Flexible Weekly Patterns:** Defined by day of week, start time, end time, and break durations. Total weekly hours computed automatically.
- **Operational Attendance:** Real-time check-in, check-out, worked hours calculation, and status flagging (`Present`, `Late`, `Absent`, `Overtime`).
- **Manual Exception Reviews:** Authorized HR corrections with required audit notes (`is_manual_edit`).

### D. Time Off & Allocation Management
- **Configurable Leave Types:** Paid/unpaid flags, hour/day units, allocation requirement flags, and HR approval workflows.
- **Allocation Balances:** Tracks allocated, taken, and remaining quantities within validity date ranges.
- **Balance Consumption:** Approved leave requests automatically deduct from allocated balances and feed into payroll unpaid-absence calculations.

### E. Salary Structures & Rule Engine
- **Structural Containers:** Collections of rules (e.g., "Regular Full-Time Structure", "Executive Tier").
- **Ordered Rule Execution:** Evaluated in sequence order (Sequence 1: Basic $\rightarrow$ Sequence 2: Allowances $\rightarrow$ Sequence 3: Gross $\rightarrow$ Sequence 4: Deductions $\rightarrow$ Sequence 5: Net).
- **Flexible Computation Methods:**
  - `fixed`: Fixed numerical amounts.
  - `percentage`: Percentage of another rule's resulting code (e.g., PF = 12% of `BASIC`).
  - `formula`: Dynamic math expressions evaluated against contract wages and attendance metrics.

### F. Payrun Wizard & Payslip Processing
- **Two-Step Creation Wizard:**
  - *Step 1 (Scope):* Select target period (Start Date $\rightarrow$ End Date) and Salary Structure.
  - *Step 2 (Selection):* Filter and explicitly select eligible staff members.
- **Batch Processing Actions:** Compute $\rightarrow$ Review Warnings $\rightarrow$ Validate $\rightarrow$ Mark Paid $\rightarrow$ Send Payslips.
- **Automated Validation Warnings:** Flags missing bank accounts, zero worked days, overlapping payslips, or unapproved attendance exceptions before final validation.
- **Payslip Line Breakdown:** Detailed payslip rows for Basic, Allowances, Gross, Deductions, and Net.
- **PDF Generation & Bulk Delivery:** Printable PDF render and one-click bulk email transmission.

### G. Centralized Payroll Dashboard
- **Live Aggregated Metrics:** Real-time totals for Net Salary Paid, Payslips Generated, Average Salary, Approved Time Off, and Attendance Health.
- **Visual Analytics:** Salary Cost by Department and Monthly Net Salary Trends.
- **Interactive Filters:** Filter dashboards dynamically by Period, Department, and Employment Type.

---

## 4. End-to-End Operational Lifecycle
1. **Onboard Employee:** Create employee profile, assign department, manager, and working schedule.
2. **Bind Active Contract:** Set wage and assign salary structure for the upcoming calendar period.
3. **Capture Time & Leave:** Daily check-ins/outs recorded; leave requests submitted, reviewed, and deducted from allocations.
4. **Initiate Payrun:** HR Payroll officer opens wizard, picks period and structure, and selects participating employees.
5. **Compute & Audit:** System evaluates contracts, rules, and worked days; highlights validation warnings.
6. **Validate & Pay:** Payrun confirmed, marked paid, individual PDF payslips generated and emailed.
7. **Analyze:** Executive dashboard reflects updated departmental costs and attendance metrics.

---

## 5. UI Reference & Wireframes
- **Excalidraw Prototype:** [View Interactive Flow & Mockup](https://app.excalidraw.com/l/65VNwvy7c4X/17vHpCNFjex)
- **Editorial Monochrome Aesthetic:** High contrast, Playfair Display serif headlines, IBM Plex Sans body, and restrained violet (`#6A3FA0`) accenting.
