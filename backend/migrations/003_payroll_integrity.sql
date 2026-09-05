-- Enforce payroll and workflow invariants at the database boundary.
CREATE UNIQUE INDEX IF NOT EXISTS uq_payslips_employee_period
  ON payslips (employee_id, period_start, period_end);

DO $$ BEGIN
  ALTER TABLE contracts ADD CONSTRAINT contracts_date_order
    CHECK (end_date IS NULL OR end_date >= start_date);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE contracts ADD CONSTRAINT contracts_status_check
    CHECK (status IN ('draft', 'active', 'expired', 'cancelled'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE time_off_requests ADD CONSTRAINT time_off_requests_date_order
    CHECK (end_date >= start_date);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE time_off_requests ADD CONSTRAINT time_off_requests_status_check
    CHECK (status IN ('pending', 'approved', 'refused', 'cancelled'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE time_off_requests ADD CONSTRAINT time_off_requests_duration_positive
    CHECK (duration > 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE payruns ADD CONSTRAINT payruns_date_order
    CHECK (period_end >= period_start);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE payruns ADD CONSTRAINT payruns_status_check
    CHECK (status IN ('draft', 'computed', 'validated', 'paid', 'sent'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE payslips ADD CONSTRAINT payslips_date_order
    CHECK (period_end >= period_start);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE payslips ADD CONSTRAINT payslips_status_check
    CHECK (status IN ('draft', 'validated', 'paid'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE attendance ADD CONSTRAINT attendance_time_order
    CHECK (check_out IS NULL OR check_in IS NULL OR check_out >= check_in);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
