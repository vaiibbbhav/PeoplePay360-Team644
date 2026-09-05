# PeoplePay360 Database Schema

Comprehensive documentation of all database tables, columns, constraints, and relationships in the centralized PostgreSQL schema (`backend/src/db/schema.ts`).

---

## Entity Relationship Overview

```
departments ──┬──< jobPositions
              └──< workingSchedules ──< workingScheduleLines

users (canonical identity & auth) ──1:1── employees (HR operational extension)
                                            ├──< contracts ──> salaryStructures ──< salaryRules
                                            ├──< attendance
                                            ├──< timeOffAllocations ──> timeOffTypes
                                            ├──< timeOffRequests   ──> timeOffTypes
                                            └──< payslips ──┬──> payruns
                                                            └──< payslipLines ──> salaryRules
```

---

## 1. Organization & Job Architecture

### `departments`
- `id` (UUID, Primary Key, default random)
- `name` (VARCHAR(100), NOT NULL, UNIQUE)
- `manager_id` (UUID, nullable)
- `created_at` (TIMESTAMP WITH TIME ZONE, default now)

### `jobPositions`
- `id` (UUID, Primary Key, default random)
- `title` (VARCHAR(100), NOT NULL)
- `department_id` (UUID, references `departments.id` ON DELETE SET NULL)
- `created_at` (TIMESTAMP WITH TIME ZONE, default now)

---

## 2. Work Schedules

### `working_schedules`
- `id` (UUID, Primary Key, default random)
- `name` (VARCHAR(100), NOT NULL)
- `totalWeeklyHours` (NUMERIC(5, 2), NOT NULL, default '40.0')
- `created_at` (TIMESTAMP WITH TIME ZONE, default now)

### `working_schedule_lines`
- `id` (UUID, Primary Key, default random)
- `schedule_id` (UUID, NOT NULL, references `working_schedules.id` ON DELETE CASCADE)
- `dayOfWeek` (VARCHAR(20), NOT NULL)
- `startTime` (TIME, NOT NULL)
- `endTime` (TIME, NOT NULL)
- `breakDurationHours` (NUMERIC(4, 2), NOT NULL, default '1.0')

---

## 3. Users & Employees (Canonical Identity & Operational Extension)

### `users`
Canonical identity layer: authentication credentials, personal name, and Role-Based Access Control.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, default `gen_random_uuid()` | Unique user ID |
| `firstName` | `VARCHAR(100)` | `NOT NULL` | First name |
| `lastName` | `VARCHAR(100)` | `NOT NULL` | Last name |
| `email` | `VARCHAR(150)` | `NOT NULL`, `UNIQUE` | User work login email |
| `passwordHash` | `VARCHAR(255)` | `NOT NULL` | Bcrypt hashed password |
| `role` | `VARCHAR(50)` | `NOT NULL` | `Employee`, `HR Manager`, `HR Payroll User`, `HR Payroll Manager`, `Admin` |
| `isActive` | `BOOLEAN` | `NOT NULL`, default `true` | Account active status |
| `isEmailVerified` | `BOOLEAN` | `NOT NULL`, default `false` | Email verification status |
| `emailVerifiedAt` | `TIMESTAMPTZ` | Nullable | Email verification timestamp |
| `createdAt` | `TIMESTAMPTZ` | Default `now()` | Timestamp |
| `updatedAt` | `TIMESTAMPTZ` | Default `now()` | Timestamp |

### `employees`
HR operational extension for employment lifecycle, payroll bindings, and banking details.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, default `gen_random_uuid()` | Unique employee ID |
| `userId` | `UUID` | `NOT NULL`, `UNIQUE`, FK `users.id` (`CASCADE`) | Linked user identity account |
| `phone` | `VARCHAR(30)` | Nullable | Contact number |
| `departmentId` | `UUID` | FK `departments.id` (`SET NULL`) | Department binding |
| `jobPositionId` | `UUID` | FK `jobPositions.id` (`SET NULL`) | Job role binding |
| `managerId` | `UUID` | Nullable | Reporting manager employee ID |
| `workingScheduleId`| `UUID` | FK `working_schedules.id` (`SET NULL`) | Assigned schedule |
| `employmentStatus` | `VARCHAR(30)` | `NOT NULL`, default `'incomplete'` | `incomplete`, `active`, `on_leave`, `inactive`, `terminated` |
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

---

## 4. Contracts

### `contracts`
- `id` (UUID, Primary Key, default random)
- `employee_id` (UUID, NOT NULL, references `employees.id` ON DELETE CASCADE)
- `name` (VARCHAR(150), NOT NULL)
- `wage` (NUMERIC(12, 2), NOT NULL)
- `wage_type` (VARCHAR(20), NOT NULL, default 'monthly')
- `salary_structure_id` (UUID, references `salary_structures.id` ON DELETE RESTRICT)
- `working_schedule_id` (UUID, references `working_schedules.id` ON DELETE SET NULL)
- `department_id` (UUID, references `departments.id` ON DELETE SET NULL)
- `job_position_id` (UUID, references `jobPositions.id` ON DELETE SET NULL)
- `start_date` (DATE, NOT NULL)
- `end_date` (DATE)
- `status` (VARCHAR(30), NOT NULL, default 'draft')
- `notes` (TEXT)
- `created_at` (TIMESTAMP WITH TIME ZONE, default now)
- `updated_at` (TIMESTAMP WITH TIME ZONE, default now)

---

## 5. Attendance & Biometrics

### `attendance`
- `id` (UUID, Primary Key, default random)
- `employee_id` (UUID, NOT NULL, references `employees.id` ON DELETE CASCADE)
- `check_in` (TIMESTAMP WITH TIME ZONE, NOT NULL)
- `check_out` (TIMESTAMP WITH TIME ZONE)
- `worked_hours` (NUMERIC(5, 2))
- `status` (VARCHAR(30), NOT NULL, default 'present')
- `is_manual_edit` (BOOLEAN, NOT NULL, default false)
- `created_at` (TIMESTAMP WITH TIME ZONE, default now)
- `updated_at` (TIMESTAMP WITH TIME ZONE, default now)

### `fingerprint`
- `id` (UUID, Primary Key, default random)
- `employee_id` (UUID, NOT NULL, references `employees.id` ON DELETE CASCADE)
- `encryted_template` (TEXT, NOT NULL)
- `created_at` (TIMESTAMP WITH TIME ZONE, default now)
- `updated_at` (TIMESTAMP WITH TIME ZONE, default now)

---

## 6. Time Off

### `time_off_types`
- `id` (UUID, Primary Key, default random)
- `name` (VARCHAR(100), NOT NULL)
- `unit` (VARCHAR(20), NOT NULL, default 'days')
- `requires_allocation` (BOOLEAN, NOT NULL, default true)
- `approval_workflow` (VARCHAR(50), NOT NULL, default 'manager_only')
- `payroll_integration` (BOOLEAN, NOT NULL, default true)
- `created_at` (TIMESTAMP WITH TIME ZONE, default now)

### `time_off_allocations`
- `id` (UUID, Primary Key, default random)
- `employee_id` (UUID, NOT NULL, references `employees.id` ON DELETE CASCADE)
- `type_id` (UUID, NOT NULL, references `time_off_types.id` ON DELETE RESTRICT)
- `days_allocated` (NUMERIC(5, 2), NOT NULL)
- `days_remaining` (NUMERIC(5, 2), NOT NULL)
- `valid_from` (DATE, NOT NULL)
- `valid_to` (DATE, NOT NULL)
- `status` (VARCHAR(30), NOT NULL, default 'draft')
- `created_at` (TIMESTAMP WITH TIME ZONE, default now)

### `time_off_requests`
- `id` (UUID, Primary Key, default random)
- `employee_id` (UUID, NOT NULL, references `employees.id` ON DELETE CASCADE)
- `type_id` (UUID, NOT NULL, references `time_off_types.id` ON DELETE RESTRICT)
- `start_date` (DATE, NOT NULL)
- `end_date` (DATE, NOT NULL)
- `duration` (NUMERIC(5, 2), NOT NULL)
- `status` (VARCHAR(30), NOT NULL, default 'pending')
- `reason` (TEXT)
- `created_at` (TIMESTAMP WITH TIME ZONE, default now)
- `updated_at` (TIMESTAMP WITH TIME ZONE, default now)

---

## 7. Payroll & Salary Rules

### `salary_structures`
- `id` (UUID, Primary Key, default random)
- `name` (VARCHAR(150), NOT NULL)
- `code` (VARCHAR(50), NOT NULL, UNIQUE)
- `is_active` (BOOLEAN, NOT NULL, default true)
- `created_at` (TIMESTAMP WITH TIME ZONE, default now)

### `salary_rules`
- `id` (UUID, Primary Key, default random)
- `structure_id` (UUID, NOT NULL, references `salary_structures.id` ON DELETE CASCADE)
- `code` (VARCHAR(50), NOT NULL)
- `name` (VARCHAR(150), NOT NULL)
- `category` (VARCHAR(30), NOT NULL) — 'basic', 'allowance', 'gross', 'deduction', 'net'
- `sequence` (INTEGER, NOT NULL)
- `computation_method` (VARCHAR(30), NOT NULL) — 'fixed', 'percentage', 'formula'
- `amount` (NUMERIC(12, 2), default '0.0')
- `percentage_of_code` (VARCHAR(50))
- `percentage` (NUMERIC(6, 3))
- `formula` (TEXT)
- `created_at` (TIMESTAMP WITH TIME ZONE, default now)

### `payruns`
- `id` (UUID, Primary Key, default random)
- `name` (VARCHAR(150), NOT NULL)
- `structure_id` (UUID, NOT NULL, references `salary_structures.id` ON DELETE RESTRICT)
- `period_start` (DATE, NOT NULL)
- `period_end` (DATE, NOT NULL)
- `status` (VARCHAR(30), NOT NULL, default 'draft') — 'draft', 'computed', 'validated', 'paid', 'sent'
- `total_basic` (NUMERIC(14, 2), NOT NULL, default '0.0')
- `total_gross` (NUMERIC(14, 2), NOT NULL, default '0.0')
- `total_deductions` (NUMERIC(14, 2), NOT NULL, default '0.0')
- `total_net` (NUMERIC(14, 2), NOT NULL, default '0.0')
- `warnings` (JSONB, default '[]')
- `created_at` (TIMESTAMP WITH TIME ZONE, default now)
- `updated_at` (TIMESTAMP WITH TIME ZONE, default now)

### `payslips`
- `id` (UUID, Primary Key, default random)
- `payrun_id` (UUID, NOT NULL, references `payruns.id` ON DELETE CASCADE)
- `employee_id` (UUID, NOT NULL, references `employees.id` ON DELETE CASCADE)
- `contract_id` (UUID, NOT NULL, references `contracts.id` ON DELETE RESTRICT)
- `structure_id` (UUID, NOT NULL, references `salary_structures.id` ON DELETE RESTRICT)
- `period_start` (DATE, NOT NULL)
- `period_end` (DATE, NOT NULL)
- `worked_days` (NUMERIC(5, 2), NOT NULL, default '22.0')
- `basic_salary` (NUMERIC(12, 2), NOT NULL, default '0.0')
- `gross_salary` (NUMERIC(12, 2), NOT NULL, default '0.0')
- `total_deductions` (NUMERIC(12, 2), NOT NULL, default '0.0')
- `net_salary` (NUMERIC(12, 2), NOT NULL, default '0.0')
- `status` (VARCHAR(30), NOT NULL, default 'draft')
- `warnings` (JSONB, default '[]')
- `created_at` (TIMESTAMP WITH TIME ZONE, default now)
- `updated_at` (TIMESTAMP WITH TIME ZONE, default now)

### `payslip_lines`
- `id` (UUID, Primary Key, default random)
- `payslip_id` (UUID, NOT NULL, references `payslips.id` ON DELETE CASCADE)
- `rule_id` (UUID, references `salary_rules.id` ON DELETE SET NULL)
- `code` (VARCHAR(50), NOT NULL)
- `name` (VARCHAR(100), NOT NULL)
- `category` (VARCHAR(30), NOT NULL)
- `sequence` (INTEGER, NOT NULL)
- `amount` (NUMERIC(12, 2), NOT NULL)
- `created_at` (TIMESTAMP WITH TIME ZONE, default now)

---

## 8. Company Policies & Document Compliance

### `company_policies`
- `id` (UUID, Primary Key, default random)
- `title` (VARCHAR(255), NOT NULL)
- `code` (VARCHAR(60), NOT NULL, UNIQUE)
- `category` (VARCHAR(50), NOT NULL) — 'compliance', 'security', 'workplace', 'hr'
- `version` (VARCHAR(20), NOT NULL, default '1.0')
- `summary` (TEXT, NOT NULL)
- `content` (TEXT, NOT NULL)
- `is_mandatory` (BOOLEAN, NOT NULL, default true)
- `effective_date` (DATE)
- `created_at` (TIMESTAMP WITH TIME ZONE, default now)
- `updated_at` (TIMESTAMP WITH TIME ZONE, default now)

### `policy_acceptances`
- `id` (UUID, Primary Key, default random)
- `policy_id` (UUID, NOT NULL, references `company_policies.id` ON DELETE CASCADE)
- `user_id` (UUID, NOT NULL, references `users.id` ON DELETE CASCADE)
- `employee_id` (UUID, references `employees.id` ON DELETE SET NULL)
- `policy_version` (VARCHAR(20), NOT NULL)
- `accepted_at` (TIMESTAMP WITH TIME ZONE, default now)
- `ip_address` (VARCHAR(50))
- `user_agent` (TEXT)
- **Constraint**: `UNIQUE(policy_id, user_id, policy_version)`
