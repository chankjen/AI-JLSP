-- ============================================================================
-- PostgreSQL 15 Schema Initialization - AI-JLSP
-- DPA Sec 31 (Security), Constitution Art 47 (Fair Admin), Penal Code Sec 108-117 (Chain of Custody)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. USER & AUTHENTICATION TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) NOT NULL,
  department VARCHAR(100),
  phone_number VARCHAR(20),
  
  -- MFA (DPA Sec 26: Security)
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_secret VARCHAR(255),
  mfa_backup_codes TEXT[],
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  
  -- Consent Management (DPA Sec 22)
  consent_given BOOLEAN DEFAULT false,
  consent_timestamp TIMESTAMP WITH TIME ZONE,
  consent_version VARCHAR(20),
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  
  CONSTRAINT role_valid CHECK (role IN (
    'advocate', 'tdr_officer', 'board_secretary', 'litigation_counsel', 'citizen', 'admin', 'dpo'
  )),
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- ============================================================================
-- 1.1 CORE CASE MANAGEMENT & DOCUMENT SCHEMA
-- ============================================================================

CREATE TYPE case_type AS ENUM (
  'tax_objection',
  'litigation',
  'conveyancing',
  'board_matter',
  'registry',
  'other'
);

CREATE TYPE case_status AS ENUM (
  'draft',
  'submitted',
  'received',
  'in_review',
  'approved',
  'rejected',
  'closed',
  'escalated'
);

CREATE TYPE document_type AS ENUM (
  'cover_letter',
  'pleading',
  'evidence',
  'contract',
  'objection',
  'board_package',
  'dpa_consent',
  'ai_validation_report',
  'other'
);

CREATE TYPE deadline_status AS ENUM (
  'pending',
  'met',
  'missed',
  'escalated',
  'cancelled'
);

-- Case registry table for core workflows and statutory tracking
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_number VARCHAR(100) UNIQUE NOT NULL,
  case_type case_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  jurisdiction VARCHAR(255),
  filing_party_role VARCHAR(50) NOT NULL,
  priority VARCHAR(50) DEFAULT 'normal',
  status case_status NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP WITH TIME ZONE,
  is_confidential BOOLEAN DEFAULT false,
  is_sensitive BOOLEAN DEFAULT false,
  data_categories TEXT[] DEFAULT ARRAY['legal_document'],
  data_residency VARCHAR(2) DEFAULT 'KE',
  retention_until TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '7 years'
);

CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_type ON cases(case_type);
CREATE INDEX idx_cases_assigned_to ON cases(assigned_to);
CREATE INDEX idx_cases_created_by ON cases(created_by);
CREATE INDEX idx_cases_jurisdiction ON cases(jurisdiction);

-- Document registry for file metadata and DPA classification
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  storage_provider VARCHAR(100) NOT NULL DEFAULT 'local',
  storage_key VARCHAR(1024) NOT NULL,
  sha256_hash VARCHAR(64) NOT NULL,
  mimetype VARCHAR(127) NOT NULL,
  size_bytes INTEGER NOT NULL,
  page_count INTEGER,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  verified BOOLEAN DEFAULT false,
  validation_status VARCHAR(50) DEFAULT 'pending',
  is_sensitive BOOLEAN DEFAULT false,
  access_restriction VARCHAR(50) DEFAULT 'role_based',
  metadata JSONB DEFAULT '{}',
  data_residency VARCHAR(2) DEFAULT 'KE',
  retention_until TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '7 years'
);

CREATE INDEX idx_documents_case_id ON documents(case_id);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_verified ON documents(verified);

-- Deadline engine table for statutory and procedural deadlines
CREATE TABLE IF NOT EXISTS case_deadlines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  calculated_from TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status deadline_status NOT NULL DEFAULT 'pending',
  escalated_to UUID REFERENCES users(id),
  escalation_notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  data_residency VARCHAR(2) DEFAULT 'KE',
  retention_until TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '7 years'
);

CREATE INDEX idx_deadlines_case_id ON case_deadlines(case_id);
CREATE INDEX idx_deadlines_due_date ON case_deadlines(due_date);
CREATE INDEX idx_deadlines_status ON case_deadlines(status);
CREATE INDEX idx_deadlines_escalated_to ON case_deadlines(escalated_to);

-- Core query audit helper for case metadata changes
CREATE TABLE IF NOT EXISTS case_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  event_payload JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  data_residency VARCHAR(2) DEFAULT 'KE',
  retention_until TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '7 years'
);

CREATE INDEX idx_case_events_case_id ON case_events(case_id);
CREATE INDEX idx_case_events_event_type ON case_events(event_type);

-- ============================================================================
-- 2. AUDIT LOG TABLE (Immutable Hash Chain - Penal Code Sec 108-117)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- User Information
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  user_role VARCHAR(50) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  
  -- Action Details
  action_type VARCHAR(50) NOT NULL,
  module_id VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL,
  
  -- Change Details
  details JSONB NOT NULL DEFAULT '{}',
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  
  -- Request Context
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  
  -- DPA Compliance (Sec 22, 31)
  consent_id UUID,
  consent_verified BOOLEAN DEFAULT false,
  dpia_id UUID,
  
  -- Hash Chain (Penal Code Sec 108-117: Chain of Custody)
  hash_value VARCHAR(64) NOT NULL,
  previous_hash_value VARCHAR(64),
  previous_log_id UUID REFERENCES audit_log(id),
  hash_verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Data Sovereignty (DPA Sec 50)
  data_residency VARCHAR(2) DEFAULT 'KE',
  
  -- Encryption (DPA Sec 26)
  encrypted BOOLEAN DEFAULT true,
  encryption_key_version INTEGER DEFAULT 1,
  
  -- Severity & Review (Constitution Art 47)
  severity_level VARCHAR(20),
  requires_review BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Retention (DPA Sec 31: 7 years minimum)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  retention_until TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '7 years',
  is_immutable BOOLEAN DEFAULT true,
  
  CONSTRAINT action_valid CHECK (action_type IN ('create', 'read', 'update', 'delete', 'approve', 'export', 'audit_read')),
  CONSTRAINT status_valid CHECK (status IN ('success', 'failure', 'partial', 'escalated')),
  CONSTRAINT is_immutable_always_true CHECK (is_immutable = true),
  CONSTRAINT hash_length_valid CHECK (char_length(hash_value) = 64)
);

CREATE INDEX idx_audit_timestamp ON audit_log(timestamp DESC);
CREATE INDEX idx_audit_user_id ON audit_log(user_id, timestamp DESC);
CREATE INDEX idx_audit_action ON audit_log(action_type, timestamp DESC);
CREATE INDEX idx_audit_hash_chain ON audit_log(hash_value, previous_hash_value);
CREATE INDEX idx_audit_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_requires_review ON audit_log(requires_review) WHERE requires_review = true;

-- Prevent updates/deletes on audit_log (immutability enforcement)
CREATE RULE audit_log_immutable AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE RULE audit_log_no_delete AS ON DELETE TO audit_log DO INSTEAD NOTHING;

-- ============================================================================
-- 3. DPA CONSENT RECORDS TABLE (Sec 22: Explicit Consent Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS dpa_consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Consent Details
  consent_type VARCHAR(50) NOT NULL,
  consent_given BOOLEAN NOT NULL,
  consent_timestamp TIMESTAMP WITH TIME ZONE,
  consent_version VARCHAR(20),
  consent_expiry TIMESTAMP WITH TIME ZONE,
  
  -- Withdrawal (Sec 23)
  withdrawn_at TIMESTAMP WITH TIME ZONE,
  withdrawal_reason TEXT,
  
  -- Proof & Method
  consent_method VARCHAR(50) NOT NULL,
  consent_proof_hash VARCHAR(64),
  consent_document_id UUID,
  
  -- Audit
  recorded_by UUID REFERENCES users(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT consent_type_valid CHECK (consent_type IN 
    ('data_processing', 'ai_analysis', 'export', 'cross_border', 'marketing')
  ),
  CONSTRAINT consent_method_valid CHECK (consent_method IN 
    ('email_confirmation', 'in_app', 'digital_signature', 'legal_basis_employment')
  )
);

CREATE INDEX idx_consent_user_id ON dpa_consent_records(user_id, consent_type);
CREATE INDEX idx_consent_active ON dpa_consent_records(user_id, withdrawn_at) WHERE withdrawn_at IS NULL;
CREATE INDEX idx_consent_expiry ON dpa_consent_records(consent_expiry) WHERE consent_expiry > CURRENT_TIMESTAMP;

-- ============================================================================
-- 4. DPIA (Data Protection Impact Assessment) TABLE (DPA Sec 35)
-- ============================================================================

CREATE TABLE IF NOT EXISTS dpia_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL REFERENCES users(id),
  
  -- DPIA Details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  data_categories TEXT[] NOT NULL,
  risk_level VARCHAR(20) NOT NULL,
  
  -- Mitigation Measures
  measures_taken TEXT[] NOT NULL,
  mitigation_score INTEGER,  -- 0-100
  
  -- Review & Signoff
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES users(id),
  findings TEXT,
  approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Retention (7 years minimum)
  retention_until TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '7 years',
  
  CONSTRAINT risk_level_valid CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT mitigation_score_range CHECK (mitigation_score >= 0 AND mitigation_score <= 100)
);

CREATE INDEX idx_dpia_risk_level ON dpia_records(risk_level);
CREATE INDEX idx_dpia_approved ON dpia_records(approved);
CREATE INDEX idx_dpia_created_by ON dpia_records(created_by);

-- ============================================================================
-- 5. BREACH NOTIFICATION TABLE (DPA Sec 33-34)
-- ============================================================================

CREATE TABLE IF NOT EXISTS breach_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discovered_at TIMESTAMP WITH TIME ZONE NOT NULL,
  discovered_by UUID NOT NULL REFERENCES users(id),
  
  -- Breach Details
  breach_type VARCHAR(50) NOT NULL,
  affected_data_categories TEXT[],
  estimated_affected_records INTEGER,
  
  -- DPA Notification Timeline (Sec 33-34)
  notification_sent_at TIMESTAMP WITH TIME ZONE,
  notification_recipients TEXT[],
  notification_method VARCHAR(50),
  
  -- Investigation
  root_cause TEXT,
  mitigation_actions TEXT[],
  preventive_measures TEXT[],
  internal_investigation_complete BOOLEAN DEFAULT false,
  investigation_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- DPO Sign-off
  signed_by UUID REFERENCES users(id),
  signed_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status VARCHAR(20) NOT NULL,  -- open, under_investigation, resolved
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT breach_type_valid CHECK (breach_type IN 
    ('unauthorized_access', 'data_loss', 'encryption_failure', 'other')
  ),
  CONSTRAINT status_valid CHECK (status IN ('open', 'under_investigation', 'resolved'))
);

CREATE INDEX idx_breach_status ON breach_notifications(status);
CREATE INDEX idx_breach_discovered_at ON breach_notifications(discovered_at DESC);
CREATE INDEX idx_breach_sign_off ON breach_notifications(signed_by);

-- ============================================================================
-- 6. ACCESS LOG TABLE (Read-Only Audit Trail - DPA Sec 31)
-- ============================================================================

CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  user_role VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(255),
  access_method VARCHAR(50),
  access_duration_seconds INTEGER,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  -- DPIA Counter (Auto-triggers if >10K records/month)
  records_accessed INTEGER DEFAULT 1,
  
  -- Data Governance
  data_residency VARCHAR(2) DEFAULT 'KE',
  
  CONSTRAINT access_method_valid CHECK (access_method IN ('api', 'ui', 'export', 'report'))
);

CREATE INDEX idx_access_timestamp ON access_logs(timestamp DESC);
CREATE INDEX idx_access_user_id ON access_logs(user_id, timestamp DESC);
CREATE INDEX idx_access_resource ON access_logs(resource_type, resource_id);
CREATE INDEX idx_access_monthly ON access_logs(user_id, DATE_TRUNC('month', timestamp));

-- ============================================================================
-- 7. AI DECISION LOG TABLE (Constitution Art 47: Human-in-the-Loop)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_decision_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- AI Model Details
  model_version VARCHAR(50) NOT NULL,
  model_name VARCHAR(100) NOT NULL,
  
  -- Input & Output
  input_document_id VARCHAR(255),
  input_document_type VARCHAR(50),
  input_document_hash VARCHAR(64),
  
  output_classification VARCHAR(100),
  output_confidence DECIMAL(3,2),
  output_reasoning TEXT,
  output_recommended_action TEXT,
  
  -- Human Review (Art 47: mandatory for high-risk decisions)
  human_review_required BOOLEAN,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_outcome VARCHAR(20),
  
  -- Audit & Consent
  audit_log_id UUID REFERENCES audit_log(id),
  consent_verified BOOLEAN,
  
  -- DPA Compliance
  data_residency VARCHAR(2) DEFAULT 'KE',
  
  CONSTRAINT confidence_range CHECK (output_confidence >= 0 AND output_confidence <= 1),
  CONSTRAINT review_outcome_valid CHECK (review_outcome IN ('approved', 'rejected', 'modified', NULL))
);

CREATE INDEX idx_ai_timestamp ON ai_decision_logs(timestamp DESC);
CREATE INDEX idx_ai_confidence ON ai_decision_logs(output_confidence);
CREATE INDEX idx_ai_requires_review ON ai_decision_logs(human_review_required) WHERE human_review_required = true;
CREATE INDEX idx_ai_document ON ai_decision_logs(input_document_id);

-- ============================================================================
-- 8. RBAC VIOLATION ALERTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS rbac_violation_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  user_id UUID REFERENCES users(id),
  user_role VARCHAR(50),
  attempted_module VARCHAR(50),
  attempted_action VARCHAR(50),
  
  ip_address INET,
  user_agent TEXT,
  
  severity VARCHAR(20),
  flagged_for VARCHAR(50),
  
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution TEXT,
  
  CONSTRAINT severity_valid CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT flagged_for_valid CHECK (flagged_for IN ('logging', 'admin_review', 'dpo_escalation'))
);

CREATE INDEX idx_violation_user ON rbac_violation_alerts(user_id, timestamp DESC);
CREATE INDEX idx_violation_severity ON rbac_violation_alerts(severity);
CREATE INDEX idx_violation_resolved ON rbac_violation_alerts(resolved) WHERE resolved = false;

-- ============================================================================
-- TRIGGERS & FUNCTIONS (Created after all tables)
-- ============================================================================

-- Trigger function to maintain updated_at timestamps for audited tables
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to build the immutable hash chain for audit_log entries
CREATE OR REPLACE FUNCTION audit_log_compute_hash_chain()
RETURNS TRIGGER AS $$
DECLARE
  previous_record RECORD;
  raw_string TEXT;
BEGIN
  SELECT id, hash_value
  INTO previous_record
  FROM audit_log
  ORDER BY timestamp DESC, id DESC
  LIMIT 1;

  IF previous_record IS NOT NULL THEN
    NEW.previous_log_id := previous_record.id;
    NEW.previous_hash_value := previous_record.hash_value;
  ELSE
    NEW.previous_log_id := NULL;
    NEW.previous_hash_value := NULL;
  END IF;

  raw_string :=
    COALESCE(NEW.user_id::text, '') || '|' ||
    COALESCE(NEW.user_role, '') || '|' ||
    COALESCE(NEW.user_email, '') || '|' ||
    COALESCE(NEW.action_type, '') || '|' ||
    COALESCE(NEW.module_id, '') || '|' ||
    COALESCE(NEW.resource_type, '') || '|' ||
    COALESCE(NEW.resource_id, '') || '|' ||
    COALESCE(NEW.status, '') || '|' ||
    COALESCE(NEW.details::text, '') || '|' ||
    COALESCE(NEW.old_values::text, '') || '|' ||
    COALESCE(NEW.new_values::text, '') || '|' ||
    COALESCE(NEW.reason, '') || '|' ||
    COALESCE(NEW.previous_hash_value, '');

  NEW.hash_value := encode(digest(raw_string, 'sha256'), 'hex');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generic domain-audit trigger for tracked tables
CREATE OR REPLACE FUNCTION domain_audit_log_trigger()
RETURNS TRIGGER AS $$
DECLARE
  audit_action TEXT := lower(TG_OP);
  resource_id_text TEXT;
  old_json JSONB;
  new_json JSONB;
  user_identity UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    resource_id_text := COALESCE(NEW.id::text, NEW.case_number, NEW.email, NEW.storage_key);
    new_json := to_jsonb(NEW);
    old_json := NULL;
    user_identity := COALESCE(NEW.created_by, NEW.uploaded_by, NEW.user_id, NEW.reviewed_by, NEW.assigned_to, NEW.updated_by);
  ELSIF TG_OP = 'UPDATE' THEN
    resource_id_text := COALESCE(NEW.id::text, NEW.case_number, NEW.email, NEW.storage_key);
    new_json := to_jsonb(NEW);
    old_json := to_jsonb(OLD);
    user_identity := COALESCE(NEW.updated_by, NEW.created_by, NEW.uploaded_by, NEW.user_id, NEW.reviewed_by, OLD.updated_by, OLD.created_by);
  ELSE
    resource_id_text := COALESCE(OLD.id::text, OLD.case_number, OLD.email, OLD.storage_key);
    new_json := NULL;
    old_json := to_jsonb(OLD);
    user_identity := COALESCE(OLD.updated_by, OLD.created_by, OLD.uploaded_by, OLD.user_id, OLD.reviewed_by);
  END IF;

  INSERT INTO audit_log (
    user_id,
    action_type,
    module_id,
    resource_type,
    resource_id,
    status,
    details,
    old_values,
    new_values,
    data_residency
  ) VALUES (
    user_identity,
    audit_action,
    TG_TABLE_NAME,
    TG_TABLE_NAME,
    resource_id_text,
    'success',
    jsonb_build_object('operation', TG_OP, 'table', TG_TABLE_NAME),
    old_json,
    new_json,
    COALESCE(NEW.data_residency, OLD.data_residency, 'KE')
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach timestamp and audit chain triggers
CREATE TRIGGER trg_set_updated_at_users
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER trg_set_updated_at_cases
BEFORE UPDATE ON cases
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER trg_set_updated_at_breach_notifications
BEFORE UPDATE ON breach_notifications
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER trg_audit_log_hash_chain
BEFORE INSERT ON audit_log
FOR EACH ROW EXECUTE FUNCTION audit_log_compute_hash_chain();

-- Attach domain audit logging to key tables
CREATE TRIGGER trg_audit_cases
AFTER INSERT OR UPDATE OR DELETE ON cases
FOR EACH ROW EXECUTE FUNCTION domain_audit_log_trigger();

CREATE TRIGGER trg_audit_documents
AFTER INSERT OR UPDATE OR DELETE ON documents
FOR EACH ROW EXECUTE FUNCTION domain_audit_log_trigger();

CREATE TRIGGER trg_audit_case_deadlines
AFTER INSERT OR UPDATE OR DELETE ON case_deadlines
FOR EACH ROW EXECUTE FUNCTION domain_audit_log_trigger();

CREATE TRIGGER trg_audit_case_events
AFTER INSERT OR UPDATE OR DELETE ON case_events
FOR EACH ROW EXECUTE FUNCTION domain_audit_log_trigger();

CREATE TRIGGER trg_audit_dpa_consent
AFTER INSERT OR UPDATE OR DELETE ON dpa_consent_records
FOR EACH ROW EXECUTE FUNCTION domain_audit_log_trigger();

CREATE TRIGGER trg_audit_dpia_records
AFTER INSERT OR UPDATE OR DELETE ON dpia_records
FOR EACH ROW EXECUTE FUNCTION domain_audit_log_trigger();

CREATE TRIGGER trg_audit_breach_notifications
AFTER INSERT OR UPDATE OR DELETE ON breach_notifications
FOR EACH ROW EXECUTE FUNCTION domain_audit_log_trigger();

CREATE TRIGGER trg_audit_ai_decision_logs
AFTER INSERT OR UPDATE OR DELETE ON ai_decision_logs
FOR EACH ROW EXECUTE FUNCTION domain_audit_log_trigger();

CREATE TRIGGER trg_audit_rbac_violation_alerts
AFTER INSERT OR UPDATE OR DELETE ON rbac_violation_alerts
FOR EACH ROW EXECUTE FUNCTION domain_audit_log_trigger();

-- ============================================================================
-- 9. GRANTS & SECURITY
-- ============================================================================

-- DPA Sec 26: Encryption at rest via pgcrypto
ALTER TABLE users ALTER COLUMN password_hash SET DATA TYPE BYTEA USING pgp_sym_encrypt(password_hash, 'ENCRYPTION_KEY');

-- Immutability constraints (already defined on audit_log table)

-- ============================================================================
-- 10. VIEWS FOR COMPLIANCE REPORTING
-- ============================================================================

-- Compliance Dashboard: Monthly DPIA Trigger Report
CREATE OR REPLACE VIEW monthly_dpia_triggers AS
SELECT 
  user_id,
  DATE_TRUNC('month', timestamp) AS month,
  COUNT(*) as total_reads,
  COUNT(DISTINCT resource_id) as unique_resources
FROM access_logs
WHERE access_method = 'read'
GROUP BY user_id, DATE_TRUNC('month', timestamp)
HAVING COUNT(*) > 10000
ORDER BY total_reads DESC;

-- Audit Trail Verification View
CREATE OR REPLACE VIEW audit_chain_verification AS
SELECT 
  id,
  timestamp,
  hash_value,
  previous_hash_value,
  CASE 
    WHEN hash_verified_at IS NOT NULL THEN 'verified'
    ELSE 'pending'
  END as verification_status
FROM audit_log
ORDER BY timestamp DESC;

-- Breach Risk Dashboard
CREATE OR REPLACE VIEW active_breach_risks AS
SELECT 
  b.id,
  b.discovered_at,
  b.breach_type,
  b.estimated_affected_records,
  b.status,
  u.email as discovered_by
FROM breach_notifications b
LEFT JOIN users u ON b.discovered_by = u.id
WHERE b.status IN ('open', 'under_investigation')
ORDER BY b.discovered_at DESC;

-- DPA Consent Compliance Report
CREATE OR REPLACE VIEW consent_compliance_report AS
SELECT 
  u.email,
  COUNT(CASE WHEN dcr.consent_given THEN 1 END) as consents_given,
  COUNT(CASE WHEN dcr.withdrawn_at IS NOT NULL THEN 1 END) as consents_withdrawn,
  MAX(dcr.consent_timestamp) as last_consent_date
FROM users u
LEFT JOIN dpa_consent_records dcr ON u.id = dcr.user_id
WHERE u.consent_required = true
GROUP BY u.email
ORDER BY u.email;

-- RBAC Violation Report
CREATE OR REPLACE VIEW rbac_violations_report AS
SELECT 
  user_role,
  attempted_module,
  attempted_action,
  severity,
  COUNT(*) as violation_count,
  MAX(timestamp) as last_violation
FROM rbac_violation_alerts
GROUP BY user_role, attempted_module, attempted_action, severity
ORDER BY violation_count DESC;

-- ============================================================================
-- INITIAL DATA SEED
-- ============================================================================

-- Create admin user (password must be hashed in application layer)
INSERT INTO users (email, first_name, last_name, role, is_active, consent_given, password_hash)
VALUES ('admin@judiciary.go.ke', 'System', 'Administrator', 'admin', true, true, '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjYQmHqXaUe') -- password: admin123
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, is_active, consent_given, password_hash)
VALUES ('dpo@judiciary.go.ke', 'Data Protection', 'Officer', 'dpo', true, true, '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjYQmHqXaUe') -- password: admin123
ON CONFLICT (email) DO NOTHING;

-- Logging success
\echo 'AI-JLSP PostgreSQL schema initialization complete.'
\echo 'Audit log immutability enforced via triggers and constraints.'
\echo 'DPA Sec 31 compliance: 7-year retention enabled.'
\echo 'Constitution Art 47: Fair admin action audit trail activated.'
