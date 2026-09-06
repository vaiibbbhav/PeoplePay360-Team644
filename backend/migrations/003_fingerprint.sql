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

-- Ensure both encrypted_template and encryted_template exist and remain synchronized
-- for backward/forward compatibility across Drizzle Studio, Java service, and legacy queries
ALTER TABLE fingerprint ADD COLUMN IF NOT EXISTS encrypted_template TEXT;
ALTER TABLE fingerprint ADD COLUMN IF NOT EXISTS encryted_template TEXT;

UPDATE fingerprint 
SET encryted_template = encrypted_template 
WHERE encryted_template IS NULL AND encrypted_template IS NOT NULL;

UPDATE fingerprint 
SET encrypted_template = encryted_template 
WHERE encrypted_template IS NULL AND encryted_template IS NOT NULL;

CREATE OR REPLACE FUNCTION sync_fingerprint_template()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.encrypted_template IS NOT NULL AND (NEW.encryted_template IS NULL OR NEW.encryted_template <> NEW.encrypted_template) THEN
        NEW.encryted_template := NEW.encrypted_template;
    ELSIF NEW.encryted_template IS NOT NULL AND (NEW.encrypted_template IS NULL OR NEW.encrypted_template <> NEW.encryted_template) THEN
        NEW.encrypted_template := NEW.encryted_template;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_fingerprint_template ON fingerprint;
CREATE TRIGGER trg_sync_fingerprint_template
BEFORE INSERT OR UPDATE ON fingerprint
FOR EACH ROW
EXECUTE FUNCTION sync_fingerprint_template();

