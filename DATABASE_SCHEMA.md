# PeoplePay360: Database Schema Reference
**Target: Neon Serverless Postgres with Drizzle ORM**

> [!IMPORTANT]
> **SCHEMA SYNCHRONIZATION MANDATE:**
> Whenever any developer or agent modifies, adds, or deletes a table, column, enum, or constraint in `backend/src/db/schema.ts`, you **MUST** update this `DATABASE_SCHEMA.md` file in the exact same task/commit.
> Keeping this file in lockstep with the Drizzle schema ensures cross-agent and cross-team architectural consistency.

---

## Entity Relationship Overview

```
departments ──┬──< jobPositions
              ├──< employees ──┬──< users (auth & RBAC)
              │                ├──< contracts ──> salaryStructures ──< salaryRules
              │                ├──< attendance
              │                ├──< timeOffAllocations ──> timeOffTypes
              │                ├──< timeOffRequests   ──> timeOffTypes
              │                └──< payslips ──┬──> payruns
              │                                └──< payslipLines ──> salaryRules
              └──< workingSchedules ──< workingScheduleLines
```

---

## 1. Organization & Job Architecture

### `departments`
Stores organizational units and department hierarchy.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, default `gen_random_uuid()` | Unique department ID |
| `name` | `VARCHAR(100)` | `NOT NULL`, `UNIQUE` | Department title (e.g. Engineering) |
| `managerId` | `UUID` | Nullable | Employee ID of department head |
| `createdAt` | `TIMESTAMPTZ` | Default `now()` | Audit creation timestamp |

### `jobPositions`
Specific role titles associated with a department.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, default `gen_random_uuid()` | Unique job position ID |
| `title` | `VARCHAR(100)` | `NOT NULL` | Position title (e.g. SDE II) |
| `departmentId` | `UUID` | Foreign Key `departments.id` (`ON DELETE SET NULL`) | Parent department |
| `createdAt` | `TIMESTAMPTZ` | Default `now()` | Creation timestamp |

---

## 2. Working Schedules

### `working_schedules`
Defines working hour policies and schedule containers.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, default `gen_random_uuid()` | Unique schedule ID |
| `name` | `VARCHAR(100)` | `NOT NULL` | Schedule label (e.g. Standard 40h) |
| `weeklyHours` | `NUMERIC(5, 2)` | `NOT NULL`, default `40.00` | Calculated weekly total hours |
| `isActive` | `BOOLEAN` | `NOT NULL`, default `true` | Active status flag |
| `createdAt` | `TIMESTAMPTZ` | Default `now()` | Creation timestamp |

### `working_schedule_lines`
Individual daily time blocks within a schedule.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, default `gen_random_uuid()` | Unique schedule line ID |
| `scheduleId` | `UUID` | `NOT NULL`, FK `working_schedules.id` (`CASCADE`) | Parent schedule |
| `dayOfWeek` | `VARCHAR(15)` | `NOT NULL` | Monday, Tuesday, etc. |
| `startTime` | `TIME` | `NOT NULL`, default `09:00:00` | Planned shift start |
| `endTime` | `TIME` | `NOT NULL`, default `17:00:00` | Planned shift end |
| `breakMinutes` | `INTEGER` | `NOT NULL`, default `60` | Scheduled break duration in mins |

---

## 3. Employee Master & System Users

### `employees`
Central operational entity of the platform.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, default `gen_random_uuid()` | Unique employee ID |
| `firstName` | `VARCHAR(100)` | `NOT NULL` | First name |
| `lastName` | `VARCHAR(100)` | `NOT NULL` | Last name |
| `email` | `VARCHAR(150)` | `NOT NULL`, `UNIQUE` | Work email |
| `phone` | `VARCHAR(30)` | Nullable | Contact number |
| `departmentId` | `UUID` | FK `departments.id` (`SET NULL`) | Department binding |
| `jobPositionId` | `UUID` | FK `jobPositions.id` (`SET NULL`) | Job role binding |
| `managerId` | `UUID` | Nullable | Reporting manager employee ID |
| `workingScheduleId`| `UUID` | FK `working_schedules.id` (`SET NULL`) | Assigned schedule |
| `employmentStatus` | `VARCHAR(30)` | `NOT NULL`, default `'active'` | `active`, `onboarding`, `terminated` |
| `dateOfJoining` | `DATE` | `NOT NULL`, default `CURRENT_DATE` | Date hired |
| `dateOfBirth` | `DATE` | Nullable | Birth date |
| `gender` | `VARCHAR(20)` | Nullable | Gender identity |
| `identificationNumber` | `VARCHAR(50)` | Nullable | Government ID / SSN / Tax ID |
| `bankName` | `VARCHAR(100)` | Nullable | Payroll bank name |
| `bankAccountNumber` | `VARCHAR(50)` | Nullable | Bank account number |
| `bankRoutingCode` | `VARCHAR(50)` | Nullable | IFSC / Swift / Routing code |
| `avatarUrl` | `TEXT` | Nullable | Profile picture URL |
| `createdAt` | `TIMESTAMPTZ` | Default `now()` | Timestamp |
| `updatedAt` | `TIMESTAMPTZ` | Default `now()` | Timestamp |

### `users`
Authentication credentials and Role-Based Access Control.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, default `gen_random_uuid()` | Unique user ID |
| `email` | `VARCHAR(150)` | `NOT NULL`, `UNIQUE` | User login email |
| `passwordHash` | `VARCHAR(255)` | `NOT NULL` | Bcrypt hashed password |
| `role` | `VARCHAR(50)` | `NOT NULL` | `Employee`, `HR Manager`, `HR Payroll User`, `HR Payroll Manager`, `Admin` |
| `employeeId` | `UUID` | FK `employees.id` (`SET NULL`) | Optional link to employee profile |
| `isActive` | `BOOLEAN` | `NOT NULL`, default `true` | Account active status |
| `createdAt` | `TIMESTAMPTZ` | Default `now()` | Timestamp |
| `updatedAt` | `TIMESTAMPTZ` | Default `now()` | Timestamp |


---

## 4. Compensation: Contracts & Salary Rules

### `salary_structures`
Containers grouping collections of salary calculation rules.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, default `gen_random_uuid()` | Unique structure ID |
| `name` | `VARCHAR(100)` | `NOT NULL` | Structure name (e.g. Standard Salaried) |
| `code` | `VARCHAR(50)` | `NOT NULL`, `UNIQUE` | Short code (e.g. `REG_SAL`) |
| `description` | `TEXT` | Nullable | Contextual details |
| `isActive` | `BOOLEAN` | `NOT NULL`, default `true` | Active status |
| `createdAt` | `TIMESTAMPTZ` | Default `now()` | Timestamp |
| `updatedAt` | `TIMESTAMPTZ` | Default `now()` | Timestamp |

### `salary_rules`
Atomic computational logic applied sequentially to compute payslips.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, default `gen_random_uuid()` | Unique rule ID |
| `structureId` | `UUID` | `NOT NULL`, FK `salary_structures.id` (`CASCADE`) | Parent structure |
| `name` | `VARCHAR(100)` | `NOT NULL` | Rule title (e.g. Basic Salary) |
| `code` | `VARCHAR(50)` | `NOT NULL` | Reference code (e.g. `BASIC`, `HRA`, `PF`) |
| `category` | `VARCHAR(30)` | `NOT NULL` | `basic`, `allowance`, `gross`, `deduction`, `net` |
| `sequence` | `INTEGER` | `NOT NULL`, default `1` | Execution priority order |
| `computationMethod` | `VARCHAR(20)` | `NOT NULL` | `fixed`, `percentage`, `formula` |
| `amount` | `NUMERIC(12, 2)` | Default `0.00` | Fixed amount (if fixed method) |
| `percentageOfCode` | `VARCHAR(50)` | Nullable | Target rule code (if percentage) |
| `percentage` | `NUMERIC(6, 2)` | Nullable | Percentage value (e.g. `12.00` for 12%) |
| `formula` | `TEXT` | Nullable | JavaScript/math expression (if formula) |
| `createdAt` | `TIMESTAMPTZ` | Default `now()` | Timestamp |
| `updatedAt` | `TIMESTAMPTZ` | Default `now()` | Timestamp |

### `contracts`
Employment terms and compensation agreement per employee.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, default `gen_random_uuid()` | Unique contract ID |
| `employeeId` | `UUID` | `NOT NULL`, FK `employees.id` (`CASCADE`) | Contract owner |
| `name` | `VARCHAR(150)` | `NOT NULL` | Contract reference name |
| `wage` | `NUMERIC(12, 2)` | `NOT NULL` | Base contractual compensation |
| `wageType` | `VARCHAR(20)` | `NOT NULL`, default `'monthly'` | `monthly`, `hourly`, `annual` |
| `salaryStructureId` | `UUID` | FK `salary_structures.id` (`RESTRICT`) | Bound salary structure |
| `workingScheduleId` | `UUID` | FK `working_schedules.id` (`SET NULL`) | Schedule override |
| `departmentId` | `UUID` | FK `departments.id` (`SET NULL`) | Department override |
| `jobPositionId` | `UUID` | FK `jobPositions.id` (`SET NULL`) | Position override |
| `startDate` | `DATE` | `NOT NULL` | Valid from date |
| `endDate` | `DATE` | Nullable | Expiration date |
| `status` | `VARCHAR(30)` | `NOT NULL`, default `'draft'` | `draft`, `active`, `expired`, `cancelled` |
| `notes` | `TEXT` | Nullable | Internal remarks |
| `createdAt` | `TIMESTAMPTZ` | Default `now()` | Timestamp |
| `updatedAt` | `TIMESTAMPTZ` | Default `now()` | Timestamp |

---

## 5. Operations: Attendance & Time Off

### `attendance`
Daily presence punches and worked hours logs.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, default `gen_random_uuid()` | Unique record ID |
| `employeeId` | `UUID` | `NOT NULL`, FK `employees.id` (`CASCADE`) | Employee punch owner |
| `date` | `DATE` | `NOT NULL` | Work date |
| `checkIn` | `TIMESTAMPTZ` | Nullable | Check-in timestamp |
| `checkOut` | `TIMESTAMPTZ` | Nullable | Check-out timestamp |
| `workedHours` | `NUMERIC(5, 2)` | Default `0.00` | Net worked hours |
| `status` | `VARCHAR(30)` | `NOT NULL`, default `'Present'` | `Present`, `Late`, `Absent`, `Half-Day` |
| `exceptionNote` | `TEXT` | Nullable | Reason for anomaly / override |
| `isManualEdit` | `BOOLEAN` | `NOT NULL`, default `false` | True if corrected by HR |
| `createdAt` | `TIMESTAMPTZ` | Default `now()` | Timestamp |
| `updatedAt` | `TIMESTAMPTZ` | Default `now()` | Timestamp |

### `time_off_types`
Leave policies (Paid Time Off, Sick Leave, Unpaid Leave).
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, default `gen_random_uuid()` | Unique leave type ID |
| `name` | `VARCHAR(100)` | `NOT NULL`, `UNIQUE` | Type name (e.g. Annual Leave) |
| `code` | `VARCHAR(30)` | `NOT NULL`, `UNIQUE` | Code (e.g. `AL`, `SL`) |
| `unit` | `VARCHAR(10)` | `NOT NULL`, default `'days'` | `'days'` or `'hours'` |
| `requiresAllocation` | `BOOLEAN`| `NOT NULL`, default `true` | Must have pre-granted balance |
| `approvalType` | `VARCHAR(30)` | `NOT NULL`, default `'hr_only'` | Approval hierarchy |
| `isPaid` | `BOOLEAN` | `NOT NULL`, default `true` | Affects payroll deduction |
| `isActive` | `BOOLEAN` | `NOT NULL`, default `true` | Active status |
| `createdAt` | `TIMESTAMPTZ` | Default `now()` | Timestamp |

### `time_off_allocations`
Accrued and granted balances per employee per leave type.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, default `gen_random_uuid()` | Unique allocation ID |
| `employeeId` | `UUID` | `NOT NULL`, FK `employees.id` (`CASCADE`) | Employee |
| `timeOffTypeId` | `UUID` | `NOT NULL`, FK `time_off_types.id` (`CASCADE`) | Bound leave type |
| `allocatedAmount` | `NUMERIC(6, 2)` | `NOT NULL` | Total units granted |
| `takenAmount` | `NUMERIC(6, 2)` | `NOT NULL`, default `0.00` | Total units consumed |
| `remainingAmount` | `NUMERIC(6, 2)` | `NOT NULL` | Current usable balance |
| `validFrom` | `DATE` | `NOT NULL` | Validity start |
| `validTo` | `DATE` | `NOT NULL` | Validity expiration |
| `status` | `VARCHAR(30)` | `NOT NULL`, default `'draft'` | `draft`, `approved`, `refused` |
| `approvedBy` | `UUID` | FK `users.id` (`SET NULL`) | Approver ID |
| `approvedAt` | `TIMESTAMPTZ` | Nullable | Timestamp |
| `createdAt` | `TIMESTAMPTZ` | Default `now()` | Timestamp |

### `time_off_requests`
Individual employee leave applications and review states.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, default `gen_random_uuid()` | Unique request ID |
| `employeeId` | `UUID` | `NOT NULL`, FK `employees.id` (`CASCADE`) | Requesting employee |
| `timeOffTypeId` | `UUID` | `NOT NULL`, FK `time_off_types.id` (`CASCADE`) | Requested leave type |
| `startDate` | `DATE` | `NOT NULL` | Leave start |
| `endDate` | `DATE` | `NOT NULL` | Leave end |
| `duration` | `NUMERIC(6, 2)` | `NOT NULL` | Days/hours requested |
| `reason` | `TEXT` | Nullable | Employee justification |
| `status` | `VARCHAR(30)` | `NOT NULL`, default `'pending'` | `pending`, `approved`, `refused` |
| `approvedBy` | `UUID` | FK `users.id` (`SET NULL`) | Reviewing manager ID |
| `approvedAt` | `TIMESTAMPTZ` | Nullable | Timestamp |
| `refusedReason` | `TEXT` | Nullable | Rejection rationale |
| `createdAt` | `TIMESTAMPTZ` | Default `now()` | Timestamp |
| `updatedAt` | `TIMESTAMPTZ` | Default `now()` | Timestamp |

---

## 6. Payroll: Batches & Payslips

### `payruns`
Payroll processing batches defined by period and structure.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, default `gen_random_uuid()` | Unique payrun ID |
| `name` | `VARCHAR(150)` | `NOT NULL` | Batch name (e.g. October 2026 Run) |
| `salaryStructureId`| `UUID` | `NOT NULL`, FK `salary_structures.id` (`RESTRICT`) | Structure |
| `periodStart` | `DATE` | `NOT NULL` | Pay cycle start |
| `periodEnd` | `DATE` | `NOT NULL` | Pay cycle end |
| `status` | `VARCHAR(30)` | `NOT NULL`, default `'draft'` | `draft`, `computed`, `validated`, `paid` |
| `totalBasic` | `NUMERIC(14, 2)` | Default `0.00` | Aggregate basic sum |
| `totalGross` | `NUMERIC(14, 2)` | Default `0.00` | Aggregate gross sum |
| `totalDeductions` | `NUMERIC(14, 2)` | Default `0.00` | Aggregate deduction sum |
| `totalNet` | `NUMERIC(14, 2)` | Default `0.00` | Total net payout |
| `payslipCount` | `INTEGER` | Default `0` | Number of payslips in batch |
| `warnings` | `JSONB` | Default `'[]'::jsonb` | Validation anomalies list |
| `notes` | `TEXT` | Nullable | Batch notes |
| `createdAt` | `TIMESTAMPTZ` | Default `now()` | Timestamp |
| `updatedAt` | `TIMESTAMPTZ` | Default `now()` | Timestamp |

### `payslips`
Individual employee compensation settlement for a payrun.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, default `gen_random_uuid()` | Unique payslip ID |
| `payrunId` | `UUID` | `NOT NULL`, FK `payruns.id` (`CASCADE`) | Parent payrun batch |
| `employeeId` | `UUID` | `NOT NULL`, FK `employees.id` (`CASCADE`) | Target employee |
| `contractId` | `UUID` | `NOT NULL`, FK `contracts.id` (`RESTRICT`) | Applicable active contract |
| `structureId` | `UUID` | `NOT NULL`, FK `salary_structures.id` (`RESTRICT`) | Structure applied |
| `periodStart` | `DATE` | `NOT NULL` | Start date |
| `periodEnd` | `DATE` | `NOT NULL` | End date |
| `workedDays` | `NUMERIC(5, 2)` | `NOT NULL`, default `22.00` | Attended/payable days |
| `basicSalary` | `NUMERIC(12, 2)` | `NOT NULL`, default `0.00` | Basic calculated |
| `grossSalary` | `NUMERIC(12, 2)` | `NOT NULL`, default `0.00` | Gross calculated |
| `totalDeductions` | `NUMERIC(12, 2)`| `NOT NULL`, default `0.00` | Deductions sum |
| `netSalary` | `NUMERIC(12, 2)` | `NOT NULL`, default `0.00` | Final net payable |
| `status` | `VARCHAR(30)` | `NOT NULL`, default `'draft'` | `draft`, `computed`, `paid` |
| `warnings` | `JSONB` | Default `'[]'::jsonb` | Employee specific warnings |
| `createdAt` | `TIMESTAMPTZ` | Default `now()` | Timestamp |
| `updatedAt` | `TIMESTAMPTZ` | Default `now()` | Timestamp |

### `payslip_lines`
Itemized salary computation lines backing a payslip.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, default `gen_random_uuid()` | Unique line ID |
| `payslipId` | `UUID` | `NOT NULL`, FK `payslips.id` (`CASCADE`) | Parent payslip |
| `ruleId` | `UUID` | FK `salary_rules.id` (`SET NULL`) | Originating salary rule |
| `code` | `VARCHAR(50)` | `NOT NULL` | Rule code (e.g. `BASIC`, `PF`) |
| `name` | `VARCHAR(100)` | `NOT NULL` | Rule title |
| `category` | `VARCHAR(30)` | `NOT NULL` | Component category |
| `sequence` | `INTEGER` | `NOT NULL` | Execution sequence order |
| `amount` | `NUMERIC(12, 2)` | `NOT NULL` | Computed line amount |
| `createdAt` | `TIMESTAMPTZ` | Default `now()` | Timestamp |
