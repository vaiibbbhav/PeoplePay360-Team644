# PeoplePay360 Database Schema (Neon PostgreSQL)

This document describes the schema architecture and table definitions in `src/db/schema.ts`.

---

## 1. Organizations & Work Schedules

- `departments`: `id (uuid, pk)`, `name (varchar 100, unique)`, `manager_id (uuid)`, `created_at (timestamptz)`
- `job_positions`: `id (uuid, pk)`, `title (varchar 100)`, `department_id (uuid, fk)`, `created_at (timestamptz)` (TS export: `jobPositions`)
- `working_schedules`: `id (uuid, pk)`, `name (varchar 100)`, `weekly_hours (numeric 5,2)`, `is_active (boolean)`, `created_at (timestamptz)`
- `working_schedule_lines`: `id (uuid, pk)`, `schedule_id (uuid, fk)`, `day_of_week (varchar 15)`, `start_time (time)`, `end_time (time)`, `break_minutes (int)`

---

## 2. Employees & Users

- `employees`: `id (uuid, pk)`, `employee_code (varchar 20, unique)`, `first_name (varchar 100)`, `last_name (varchar 100)`, `email (varchar 150, unique)`, `phone (varchar 30)`, `department_id (uuid, fk)`, `job_position_id (uuid, fk)`, `manager_id (uuid, fk)`, `working_schedule_id (uuid, fk)`, `employment_status (varchar 30)`, `date_of_joining (date)`, `date_of_birth (date)`, `gender (varchar 20)`, `identification_number (varchar 50)`, `bank_name (varchar 100)`, `bank_account_number (varchar 50)`, `bank_routing_code (varchar 50)`, `avatar_url (text)`, `created_at`, `updated_at`
- `users`: `id (uuid, pk)`, `email (varchar 150, unique)`, `password_hash (varchar 255)`, `role (varchar 50)`, `employee_id (uuid, fk)`, `is_active (boolean)`, `created_at`, `updated_at`

---

## 3. Contracts, Salary Structures & Rules

- `salary_structures`: `id (uuid, pk)`, `name (varchar 100)`, `code (varchar 50, unique)`, `description (text)`, `is_active (boolean)`, `created_at`, `updated_at`
- `salary_rules`: `id (uuid, pk)`, `structure_id (uuid, fk)`, `name (varchar 100)`, `code (varchar 50)`, `category (varchar 30)`, `sequence (int)`, `computation_method (varchar 20)`, `amount (numeric 12,2)`, `percentage_of_code (varchar 50)`, `percentage (numeric 6,2)`, `formula (text)`, `created_at`, `updated_at`, `CONSTRAINT uq_structure_rule_code UNIQUE (structure_id, code)`
- `contracts`: `id (uuid, pk)`, `employee_id (uuid, fk)`, `name (varchar 150)`, `wage (numeric 12,2)`, `wage_type (varchar 20)`, `salary_structure_id (uuid, fk)`, `working_schedule_id (uuid, fk)`, `department_id (uuid, fk)`, `job_position_id (uuid, fk)`, `start_date (date)`, `end_date (date)`, `status (varchar 30)`, `notes (text)`, `created_at`, `updated_at`

---

## 4. Attendance & Biometric Fingerprints

- `attendance`:
  - `id (uuid, pk)`
  - `employee_id (uuid, fk -> employees.id, on delete cascade)`
  - `date (date, not null)`
  - `check_in (timestamptz)`
  - `check_out (timestamptz)`
  - `worked_hours (numeric 5,2, default 0.0)`
  - `status (varchar 30, default 'Present')` - `Present`, `Late`, `Absent`, `Overtime`, `Half-day`
  - `exception_note (text)`
  - `is_manual_edit (boolean, default false)`
  - `created_at (timestamptz)`
  - `updated_at (timestamptz)`
  - `CONSTRAINT uq_attendance_emp_date UNIQUE (employee_id, date)`

- `fingerprint`:
  - `id (uuid, pk, default uuid_generate_v4() / gen_random_uuid())`
  - `employee_id (uuid, not null, unique, fk -> employees.id, on delete cascade)`
  - `encrypted_template (text, not null)`: Base64-encoded AES-256-GCM ciphertext of the OpenAFIS biometric template.
  - `iv (varchar 64, not null)`: Base64-encoded 12-byte secure random Initialization Vector.
  - `key_version (varchar 20, default 'v1')`: Key version for cryptographic rotation.
  - `created_at (timestamptz)`
  - `updated_at (timestamptz)`

---

## 5. Time Off

- `time_off_types`: `id (uuid, pk)`, `name (varchar 100, unique)`, `code (varchar 30, unique)`, `unit (varchar 10)`, `requires_allocation (boolean)`, `approval_type (varchar 30)`, `is_paid (boolean)`, `is_active (boolean)`, `created_at`
- `time_off_allocations`: `id (uuid, pk)`, `employee_id (uuid, fk)`, `time_off_type_id (uuid, fk)`, `allocated_amount (numeric 6,2)`, `taken_amount (numeric 6,2)`, `remaining_amount (numeric 6,2)`, `valid_from (date)`, `valid_to (date)`, `status (varchar 30)`, `approved_by (uuid, fk)`, `approved_at`, `created_at`
- `time_off_requests`: `id (uuid, pk)`, `employee_id (uuid, fk)`, `time_off_type_id (uuid, fk)`, `start_date (date)`, `end_date (date)`, `duration (numeric 6,2)`, `reason (text)`, `status (varchar 30)`, `approved_by (uuid, fk)`, `approved_at`, `refused_reason (text)`, `created_at`, `updated_at`

---

## 6. Payroll & Payslips

- `payruns`: `id (uuid, pk)`, `name (varchar 150)`, `salary_structure_id (uuid, fk)`, `period_start (date)`, `period_end (date)`, `status (varchar 30)`, `total_basic (numeric 14,2)`, `total_gross (numeric 14,2)`, `total_deductions (numeric 14,2)`, `total_net (numeric 14,2)`, `payslip_count (int)`, `warnings (jsonb)`, `notes (text)`, `created_at`, `updated_at`
- `payslips`: `id (uuid, pk)`, `payrun_id (uuid, fk)`, `employee_id (uuid, fk)`, `contract_id (uuid, fk)`, `structure_id (uuid, fk)`, `period_start (date)`, `period_end (date)`, `worked_days (numeric 5,2)`, `basic_salary (numeric 12,2)`, `gross_salary (numeric 12,2)`, `total_deductions (numeric 12,2)`, `net_salary (numeric 12,2)`, `status (varchar 30)`, `warnings (jsonb)`, `created_at`, `updated_at`, unique index on `(employee_id, period_start, period_end)` to prevent duplicate period payslips`
- `payslip_lines`: `id (uuid, pk)`, `payslip_id (uuid, fk)`, `rule_id (uuid, fk)`, `code (varchar 50)`, `name (varchar 100)`, `category (varchar 30)`, `sequence (int)`, `amount (numeric 12,2)`, `created_at`
