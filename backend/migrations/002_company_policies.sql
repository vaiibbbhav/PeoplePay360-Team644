-- 002_company_policies.sql
-- Create company_policies and policy_acceptances tables

CREATE TABLE IF NOT EXISTS company_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    code VARCHAR(60) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT true,
    effective_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS policy_acceptances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES company_policies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    policy_version VARCHAR(20) NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address VARCHAR(50),
    user_agent TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS policy_user_version_idx 
ON policy_acceptances (policy_id, user_id, policy_version);
