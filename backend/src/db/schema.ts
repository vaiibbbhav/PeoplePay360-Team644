import {
  pgTable,
  uuid,
  varchar,
  numeric,
  boolean,
  timestamp,
  date,
  time,
  integer,
  text,
  jsonb,
  uniqueIndex,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// 1. Departments & Job Positions
export const departments = pgTable('departments', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  managerId: uuid('manager_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const jobPositions = pgTable('jobPositions', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 100 }).notNull(),
  departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 2. Working Schedules
export const workingSchedules = pgTable('working_schedules', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  weeklyHours: numeric('weekly_hours', { precision: 5, scale: 2 }).notNull().default('40.0'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const workingScheduleLines = pgTable('working_schedule_lines', {
  id: uuid('id').defaultRandom().primaryKey(),
  scheduleId: uuid('schedule_id')
    .notNull()
    .references(() => workingSchedules.id, { onDelete: 'cascade' }),
  dayOfWeek: varchar('day_of_week', { length: 15 }).notNull(),
  startTime: time('start_time').notNull().default('09:00:00'),
  endTime: time('end_time').notNull().default('17:00:00'),
  breakMinutes: integer('break_minutes').notNull().default(60),
});

// 3. Users (Authentication & Canonical Identity)
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 150 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  isEmailVerified: boolean('is_email_verified').notNull().default(false),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 4. Employees (HR Operational Extension)
export const employees = pgTable(
  'employees',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    phone: varchar('phone', { length: 30 }),
    departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'set null' }),
    jobPositionId: uuid('job_position_id').references(() => jobPositions.id, {
      onDelete: 'set null',
    }),
    managerId: uuid('manager_id').references((): any => employees.id, { onDelete: 'set null' }),
    workingScheduleId: uuid('working_schedule_id').references(() => workingSchedules.id, {
      onDelete: 'set null',
    }),
    employmentStatus: varchar('employment_status', { length: 30 }).notNull().default('incomplete'),
    dateOfJoining: date('date_of_joining')
      .notNull()
      .default(sql`CURRENT_DATE`),
    dateOfBirth: date('date_of_birth'),
    gender: varchar('gender', { length: 20 }),
    identificationNumber: varchar('identification_number', { length: 50 }),
    location: varchar('location', { length: 150 }).default('Main Headquarters'),
    bankName: varchar('bank_name', { length: 100 }),
    bankAccountNumber: varchar('bank_account_number', { length: 50 }),
    bankRoutingCode: varchar('bank_routing_code', { length: 50 }),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_employees_department_id').on(table.departmentId),
    index('idx_employees_job_position_id').on(table.jobPositionId),
    index('idx_employees_manager_id').on(table.managerId),
    index('idx_employees_working_schedule_id').on(table.workingScheduleId),
  ],
);

// 5. Salary Structures & Rules
export const salaryStructures = pgTable('salary_structures', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const salaryRules = pgTable(
  'salary_rules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    structureId: uuid('structure_id')
      .notNull()
      .references(() => salaryStructures.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    category: varchar('category', { length: 30 }).notNull(),
    sequence: integer('sequence').notNull().default(1),
    computationMethod: varchar('computation_method', { length: 20 }).notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).default('0.0'),
    percentageOfCode: varchar('percentage_of_code', { length: 50 }),
    percentage: numeric('percentage', { precision: 6, scale: 2 }),
    formula: text('formula'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_structure_rule_code').on(table.structureId, table.code),
    index('idx_salary_rules_structure_id').on(table.structureId),
  ],
);

// 6. Contracts
export const contracts = pgTable(
  'contracts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 150 }).notNull(),
    wage: numeric('wage', { precision: 12, scale: 2 }).notNull(),
    wageType: varchar('wage_type', { length: 20 }).notNull().default('monthly'),
    salaryStructureId: uuid('salary_structure_id').references(() => salaryStructures.id, {
      onDelete: 'restrict',
    }),
    workingScheduleId: uuid('working_schedule_id').references(() => workingSchedules.id, {
      onDelete: 'set null',
    }),
    departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'set null' }),
    jobPositionId: uuid('job_position_id').references(() => jobPositions.id, {
      onDelete: 'set null',
    }),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    status: varchar('status', { length: 30 }).notNull().default('draft'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check(
      'contracts_date_order',
      sql`${table.endDate} IS NULL OR ${table.endDate} >= ${table.startDate}`,
    ),
    check(
      'contracts_status_check',
      sql`${table.status} IN ('draft', 'active', 'expired', 'cancelled')`,
    ),
    index('idx_contracts_emp_dates').on(
      table.employeeId,
      table.startDate,
      table.endDate,
      table.status,
    ),
    index('idx_contracts_salary_structure_id').on(table.salaryStructureId),
  ],
);

// 7. Attendance
export const attendance = pgTable(
  'attendance',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    checkIn: timestamp('check_in', { withTimezone: true }),
    checkOut: timestamp('check_out', { withTimezone: true }),
    workedHours: numeric('worked_hours', { precision: 5, scale: 2 }).default('0.0'),
    status: varchar('status', { length: 30 }).notNull().default('Present'),
    exceptionNote: text('exception_note'),
    isManualEdit: boolean('is_manual_edit').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_attendance_emp_date').on(table.employeeId, table.date),
    check(
      'attendance_time_order',
      sql`${table.checkOut} IS NULL OR ${table.checkIn} IS NULL OR ${table.checkOut} >= ${table.checkIn}`,
    ),
    index('idx_attendance_employee_id').on(table.employeeId),
    index('idx_attendance_date').on(table.date),
  ],
);

// 7b. Fingerprint
export const fingerprint = pgTable('fingerprint', {
  id: uuid('id').defaultRandom().primaryKey(),
  employeeId: uuid('employee_id')
    .notNull()
    .unique()
    .references(() => employees.id, { onDelete: 'cascade' }),
  encrytedTemplate: text('encryted_template').notNull(),
  iv: varchar('iv', { length: 64 }).notNull(),
  keyVersion: varchar('key_version', { length: 20 }).notNull().default('v1'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 8. Time Off Types, Allocations, and Requests
export const timeOffTypes = pgTable('time_off_types', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  code: varchar('code', { length: 30 }).notNull().unique(),
  unit: varchar('unit', { length: 10 }).notNull().default('days'),
  requiresAllocation: boolean('requires_allocation').notNull().default(true),
  approvalType: varchar('approval_type', { length: 30 }).notNull().default('hr_only'),
  isPaid: boolean('is_paid').notNull().default(true),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const timeOffAllocations = pgTable(
  'time_off_allocations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    timeOffTypeId: uuid('time_off_type_id')
      .notNull()
      .references(() => timeOffTypes.id, { onDelete: 'cascade' }),
    allocatedAmount: numeric('allocated_amount', { precision: 6, scale: 2 }).notNull(),
    takenAmount: numeric('taken_amount', { precision: 6, scale: 2 }).notNull().default('0.0'),
    remainingAmount: numeric('remaining_amount', { precision: 6, scale: 2 }).notNull(),
    validFrom: date('valid_from').notNull(),
    validTo: date('valid_to').notNull(),
    status: varchar('status', { length: 30 }).notNull().default('draft'),
    approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_time_off_allocations_employee_id').on(table.employeeId),
    index('idx_time_off_allocations_type_id').on(table.timeOffTypeId),
    index('idx_time_off_allocations_status').on(table.status),
  ],
);

export const timeOffRequests = pgTable(
  'time_off_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    timeOffTypeId: uuid('time_off_type_id')
      .notNull()
      .references(() => timeOffTypes.id, { onDelete: 'cascade' }),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    duration: numeric('duration', { precision: 6, scale: 2 }).notNull(),
    reason: text('reason'),
    status: varchar('status', { length: 30 }).notNull().default('pending'),
    approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    refusedReason: text('refused_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check('time_off_requests_date_order', sql`${table.endDate} >= ${table.startDate}`),
    check(
      'time_off_requests_status_check',
      sql`${table.status} IN ('pending', 'approved', 'refused', 'cancelled')`,
    ),
    check('time_off_requests_duration_positive', sql`${table.duration} > 0`),
    index('idx_time_off_requests_employee_id').on(table.employeeId),
    index('idx_time_off_requests_type_id').on(table.timeOffTypeId),
    index('idx_time_off_requests_status').on(table.status),
  ],
);

// 9. Payruns & Payslips
export const payruns = pgTable(
  'payruns',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 150 }).notNull(),
    salaryStructureId: uuid('salary_structure_id')
      .notNull()
      .references(() => salaryStructures.id, { onDelete: 'restrict' }),
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    status: varchar('status', { length: 30 }).notNull().default('draft'),
    totalBasic: numeric('total_basic', { precision: 14, scale: 2 }).default('0.0'),
    totalGross: numeric('total_gross', { precision: 14, scale: 2 }).default('0.0'),
    totalDeductions: numeric('total_deductions', { precision: 14, scale: 2 }).default('0.0'),
    totalNet: numeric('total_net', { precision: 14, scale: 2 }).default('0.0'),
    payslipCount: integer('payslip_count').default(0),
    warnings: jsonb('warnings').default(sql`'[]'::jsonb`),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check('payruns_date_order', sql`${table.periodEnd} >= ${table.periodStart}`),
    check(
      'payruns_status_check',
      sql`${table.status} IN ('draft', 'computed', 'validated', 'paid', 'sent')`,
    ),
    index('idx_payruns_period').on(table.periodStart, table.periodEnd),
    index('idx_payruns_status').on(table.status),
  ],
);

export const payslips = pgTable(
  'payslips',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    payrunId: uuid('payrun_id')
      .notNull()
      .references(() => payruns.id, { onDelete: 'cascade' }),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    contractId: uuid('contract_id')
      .notNull()
      .references(() => contracts.id, { onDelete: 'restrict' }),
    structureId: uuid('structure_id')
      .notNull()
      .references(() => salaryStructures.id, { onDelete: 'restrict' }),
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    workedDays: numeric('worked_days', { precision: 5, scale: 2 }).notNull().default('22.0'),
    basicSalary: numeric('basic_salary', { precision: 12, scale: 2 }).notNull().default('0.0'),
    grossSalary: numeric('gross_salary', { precision: 12, scale: 2 }).notNull().default('0.0'),
    totalDeductions: numeric('total_deductions', { precision: 12, scale: 2 })
      .notNull()
      .default('0.0'),
    netSalary: numeric('net_salary', { precision: 12, scale: 2 }).notNull().default('0.0'),
    status: varchar('status', { length: 30 }).notNull().default('draft'),
    warnings: jsonb('warnings').default(sql`'[]'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_payslips_employee_period').on(
      table.employeeId,
      table.periodStart,
      table.periodEnd,
    ),
    check('payslips_date_order', sql`${table.periodEnd} >= ${table.periodStart}`),
    check('payslips_status_check', sql`${table.status} IN ('draft', 'validated', 'paid')`),
    index('idx_payslips_payrun_id').on(table.payrunId),
    index('idx_payslips_employee_id').on(table.employeeId),
  ],
);

export const payslipLines = pgTable(
  'payslip_lines',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    payslipId: uuid('payslip_id')
      .notNull()
      .references(() => payslips.id, { onDelete: 'cascade' }),
    ruleId: uuid('rule_id').references(() => salaryRules.id, { onDelete: 'set null' }),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    category: varchar('category', { length: 30 }).notNull(),
    sequence: integer('sequence').notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_payslip_lines_payslip_id').on(table.payslipId),
    index('idx_payslip_lines_rule_id').on(table.ruleId),
  ],
);

// 12. Company Policies & Document Compliance
export const companyPolicies = pgTable('company_policies', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  code: varchar('code', { length: 60 }).notNull().unique(),
  category: varchar('category', { length: 50 }).notNull(), // 'compliance', 'security', 'workplace', 'hr'
  version: varchar('version', { length: 20 }).notNull().default('1.0'),
  summary: text('summary').notNull(),
  content: text('content').notNull(),
  isMandatory: boolean('is_mandatory').notNull().default(true),
  effectiveDate: date('effective_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const policyAcceptances = pgTable(
  'policy_acceptances',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    policyId: uuid('policy_id')
      .notNull()
      .references(() => companyPolicies.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'set null' }),
    policyVersion: varchar('policy_version', { length: 20 }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }).defaultNow(),
    ipAddress: varchar('ip_address', { length: 50 }),
    userAgent: text('user_agent'),
  },
  (table) => [
    uniqueIndex('policy_user_version_idx').on(table.policyId, table.userId, table.policyVersion),
    index('idx_policy_acceptances_employee_id').on(table.employeeId),
    index('idx_policy_acceptances_policy_id').on(table.policyId),
  ],
);
