-- 003_fingerprint.sql
-- Neon PostgreSQL migration for biometric fingerprint enrollment

CREATE TABLE IF NOT EXISTS fingerprint (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
    encrypted_template TEXT NOT NULL,
    iv VARCHAR(64) NOT NULL,
    key_version VARCHAR(20) NOT NULL DEFAULT 'v1',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fingerprint_employee ON fingerprint(employee_id);
