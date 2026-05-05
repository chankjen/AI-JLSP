# RBAC POLICY MATRIX - AI-JLSP
## Role → Module → Action Authority Grid

**Compliance Anchor:** Constitution of Kenya Art 47 (Fair Administrative Action), DPA Sec 28 (Lawful Basis, Purpose Limitation)

---

## 1. ROLES DEFINED

| Role ID | Role Name | Department | Approval Authority | DPA Consent Required |
|---------|-----------|------------|-------------------|-------------------|
| `ADV` | Advocate/Legal Practitioner | Private/Firm | Law Society | Explicit (Sec 22, DPA) |
| `TDR` | TDR Officer (IRO/ADR) | KRA | KRA Commissioner | Implicit (Employment) |
| `BRD_SEC` | Board Secretary | KRA Board | Board Chair | Implicit (Employment) |
| `LIT_CNS` | Litigation Counsel | Judiciary | Chief Registrar | Implicit (Employment) |
| `CZN` | Citizen / Self-Represented Litigant | Public | Self-consent | Explicit (Sec 22, DPA) |
| `ADMIN` | System Administrator | Judiciary/KRA | CIO / Commissioner | Implicit (Employment) |
| `DPO` | Data Protection Officer | Judiciary/KRA | Chief Secretary | Implicit (Employment) |

---

## 2. MODULES & FEATURES

| Module ID | Module Name | Business Purpose | Work Manual Anchor |
|-----------|------------|-----------------|-------------------|
| `CM` | Case Management | Intake, triage, routing, scheduling | Sec 2.1.8.x (Admin/Registry) |
| `REG` | Registry & Document Management | File storage, retrieval, versioning | Sec 2.1.8.x, 6.1.8 |
| `TDR` | Tax Dispute Resolution | Objection tracking, CRF automation, ADR | Sec 5.1.8 (Board), TPA Sec 51 |
| `CONV` | Conveyancing | Contract review, property verification | Sec 6.1.8–6.1.9 |
| `BOARD` | Board Services | Agenda, minutes, allowance, KIKAO sync | Sec 5.1.8, 10.1.10 |
| `AI_VAL` | AI Document Pre-Validation | Checklist, risk scoring, compliance alerts | Sec 51(3) TPA, Civil Procedure Rules |
| `DSEARCH` | Document Search & Precedent | Semantic search, eKLR, case law | Sec 7.1.8, 7.1.10 |
| `AUDIT` | Audit & Compliance | Access logs, DPA monitoring, breach alerts | DPA Sec 31, Constitution Art 47 |
| `SETTINGS` | User Settings & Profile | MFA, locale, preferences | DPA Sec 26 (Security) |
| `ADMIN_PANEL` | Administration | Role management, system config, keys | Constitution Art 47 |

---

## 3. ACTIONS

| Action ID | Action Name | Implications |
|-----------|------------|--------------|
| `CREATE` | Create new record | Creates immutable audit entry (DPA Sec 31) |
| `READ` | View/retrieve record | Triggers access log, counts toward DPIA (DPA Sec 35) |
| `UPDATE` | Modify record | Creates version history, hash chained (DPA Sec 31) |
| `DELETE` | Soft/hard delete | Soft-delete only (immutable audit trail); hard delete requires DPO approval |
| `APPROVE` | Approve/authorize action | Triggers final decision audit (Constitution Art 47) |
| `EXPORT` | Export/download data | Consent verification required (DPA Sec 22) |
| `AUDIT_READ` | Access audit logs | DPO/Admin only; access logged (DPA Sec 31) |

---

## 4. ROLE-MODULE-ACTION MATRIX

### 4.1 Advocate (ADV)

| Module | CREATE | READ | UPDATE | DELETE | APPROVE | EXPORT | AUDIT_READ |
|--------|--------|------|--------|--------|---------|--------|-----------|
| CM | Yes | Yes | Own | No | No | Yes | No |
| REG | Yes | Yes | Own | No | No | Yes | No |
| TDR | No | Yes | No | No | No | No | No |
| CONV | Yes | Yes | Own | No | No | Yes | No |
| BOARD | No | Client (if) | No | No | No | No | No |
| AI_VAL | Yes (Submit) | Yes | No | No | No | Yes | No |
| DSEARCH | Yes | Yes | No | No | No | Yes | No |
| AUDIT | No | Own (7 days) | No | No | No | Yes (Own) | No |
| SETTINGS | Yes | Yes | Yes (Own) | No | No | No | No |
| ADMIN_PANEL | No | No | No | No | No | No | No |

**Audit Trigger:** Every CREATE, UPDATE, EXPORT → `advocate_action_log` (DPA Sec 22, 31)

---

### 4.2 TDR Officer (TDR)

| Module | CREATE | READ | UPDATE | DELETE | APPROVE | EXPORT | AUDIT_READ |
|--------|--------|------|--------|--------|---------|--------|-----------|
| CM | Yes | Yes | Yes | No | Yes | Yes | No |
| REG | Yes | Yes | Yes | No | Yes | Yes | No |
| TDR | Yes | Yes | Yes | No | Yes | Yes | No |
| CONV | No | Yes | No | No | No | No | No |
| BOARD | No | Yes | No | No | No | No | No |
| AI_VAL | Yes | Yes | No | No | Yes | Yes | No |
| DSEARCH | Yes | Yes | No | No | No | Yes | No |
| AUDIT | No | Own (30 days) | No | No | No | Yes (Own) | No |
| SETTINGS | Yes | Yes | Yes (Own) | No | No | No | No |
| ADMIN_PANEL | No | No | No | No | No | No | No |

**Audit Trigger:** Every APPROVE action → `tdr_approval_log` + immutable hash (DPA Sec 31, TPA Sec 51)

---

### 4.3 Board Secretary (BRD_SEC)

| Module | CREATE | READ | UPDATE | DELETE | APPROVE | EXPORT | AUDIT_READ |
|--------|--------|------|--------|--------|---------|--------|-----------|
| CM | No | Yes | No | No | No | No | No |
| REG | No | Yes | No | No | No | Yes | No |
| TDR | No | Yes | No | No | No | No | No |
| CONV | No | Yes | No | No | No | No | No |
| BOARD | Yes | Yes | Yes | No | Yes | Yes | No |
| AI_VAL | No | Yes | No | No | No | No | No |
| DSEARCH | Yes | Yes | No | No | No | Yes | No |
| AUDIT | No | Own (30 days) | No | No | No | Yes (Own) | No |
| SETTINGS | Yes | Yes | Yes (Own) | No | No | No | No |
| ADMIN_PANEL | No | No | No | No | No | No | No |

**Audit Trigger:** Board minutes, allowance actions → `board_decision_log` (Art 159, Constitution)

---

### 4.4 Litigation Counsel (LIT_CNS)

| Module | CREATE | READ | UPDATE | DELETE | APPROVE | EXPORT | AUDIT_READ |
|--------|--------|------|--------|--------|---------|--------|-----------|
| CM | Yes | Yes | Yes | No | Yes | Yes | No |
| REG | Yes | Yes | Yes | No | Yes | Yes | No |
| TDR | No | Yes | No | No | Yes | No | No |
| CONV | Can consult | Yes | Can advise | No | Can advise | Yes | No |
| BOARD | No | Can read | No | No | No | No | No |
| AI_VAL | Yes | Yes | No | No | Yes | Yes | No |
| DSEARCH | Yes | Yes | No | No | No | Yes | No |
| AUDIT | No | Own (90 days) | No | No | No | Yes (Own) | No |
| SETTINGS | Yes | Yes | Yes (Own) | No | No | No | No |
| ADMIN_PANEL | No | No | No | No | No | No | No |

**Audit Trigger:** Case approvals, litigation decisions → `counsel_approval_log` (Constitution Art 47)

---

### 4.5 Citizen / Self-Represented Litigant (CZN)

| Module | CREATE | READ | UPDATE | DELETE | APPROVE | EXPORT | AUDIT_READ |
|--------|--------|------|--------|--------|---------|--------|-----------|
| CM | File only | Own | Own (limited) | No | No | Own | No |
| REG | No | Own docs | No | No | No | Own | No |
| TDR | File obj | Own | Own (limited) | No | No | Own | No |
| CONV | No | Can view | No | No | No | No | No |
| BOARD | No | No | No | No | No | No | No |
| AI_VAL | No | Own (summary) | No | No | No | No | No |
| DSEARCH | Guided | Limited results | No | No | No | No | No |
| AUDIT | No | None | No | No | No | No | No |
| SETTINGS | Yes | Yes | Yes (Own) | Delete own | No | No | No |
| ADMIN_PANEL | No | No | No | No | No | No | No |

**Audit Trigger:** Filing, updates, exports → `citizen_action_log` (DPA Sec 22, Constitution Art 47)

---

### 4.6 Administrator (ADMIN)

| Module | CREATE | READ | UPDATE | DELETE | APPROVE | EXPORT | AUDIT_READ |
|--------|--------|------|--------|--------|---------|--------|-----------|
| CM | Yes | Yes | Yes | Yes (soft) | Yes | Yes | No |
| REG | Yes | Yes | Yes | Yes (soft) | Yes | Yes | No |
| TDR | Yes | Yes | Yes | Yes (soft) | Yes | Yes | No |
| CONV | Yes | Yes | Yes | Yes (soft) | Yes | Yes | No |
| BOARD | Yes | Yes | Yes | Yes (soft) | Yes | Yes | No |
| AI_VAL | Yes | Yes | Yes | No | Yes | Yes | No |
| DSEARCH | Yes | Yes | Yes | No | Yes | Yes | No |
| AUDIT | No | Yes (full) | No | No | No | Yes (full) | **Yes (full)** |
| SETTINGS | Yes | Yes | Yes | Yes | Yes | Yes | No |
| ADMIN_PANEL | Yes | Yes | Yes | Yes (soft) | Yes | Yes | No |

**Audit Trigger:** All ADMIN actions → `admin_action_log` + elevated trail (Constitution Art 47)

---

### 4.7 Data Protection Officer (DPO)

| Module | CREATE | READ | UPDATE | DELETE | APPROVE | EXPORT | AUDIT_READ |
|--------|--------|------|--------|--------|---------|--------|-----------|
| CM | No | Yes (DPIA) | No | Hard-delete OK | No | Yes (Reports) | **Yes (full)** |
| REG | No | Yes (DPIA) | No | Hard-delete OK | No | Yes (Reports) | **Yes (full)** |
| TDR | No | Yes (DPIA) | No | Hard-delete OK | No | Yes (Reports) | **Yes (full)** |
| CONV | No | Yes (DPIA) | No | Hard-delete OK | No | Yes (Reports) | **Yes (full)** |
| BOARD | No | Yes (DPIA) | No | Hard-delete OK | No | Yes (Reports) | **Yes (full)** |
| AI_VAL | No | Yes (audit) | No | No | No | Yes (Reports) | **Yes (full)** |
| DSEARCH | No | Yes (DPIA) | No | No | No | Yes (Reports) | **Yes (full)** |
| AUDIT | No | Yes (full access) | No | No | Breach escalation | Yes (full reports) | **Yes (full)** |
| SETTINGS | No | Yes | No | No | No | No | **Yes (full)** |
| ADMIN_PANEL | No | Yes (audit) | No | No | No | Yes (Reports) | **Yes (full)** |

**Audit Trigger:** DPO actions → `dpo_audit_log` + encrypted storage (DPA Sec 31, Constitution Art 47)

---

## 5. AUDIT TRAIL STRUCTURE (DPA Sec 31, Constitution Art 47)

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  user_id UUID NOT NULL,
  user_role VARCHAR(20) NOT NULL,
  module_id VARCHAR(20) NOT NULL,
  action_type VARCHAR(20) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  status ENUM ('success', 'failure') NOT NULL,
  details JSONB NOT NULL,
  ip_address INET,
  user_agent TEXT,
  
  -- DPA Sec 31: Immutability
  hash_value VARCHAR(64) NOT NULL,  -- SHA-256 of (prev_hash || this_row)
  prev_hash_id UUID REFERENCES audit_log(id),
  
  -- DPA Sec 22: Consent Tracking
  consent_id UUID,
  dpia_completed BOOLEAN,
  
  -- Data Sovereignty (DPA Sec 50)
  data_residency VARCHAR(2) DEFAULT 'KE',
  
  -- Encryption
  encrypted BOOLEAN DEFAULT true,
  encryption_key_version INT,
  
  CONSTRAINT audit_immutable CHECK (is_immutable = true)
);

CREATE INDEX idx_audit_user_timestamp ON audit_log(user_id, timestamp DESC);
CREATE INDEX idx_audit_hash_chain ON audit_log(hash_value, prev_hash_id);
```

---

## 6. ENFORCEMENT & ESCALATION

| Scenario | Action | Enforcement | Escalation |
|----------|--------|------------|-----------|
| Advocate tries to APPROVE TDR case | DENY | Log + warn (RBAC Level: strict) | Flag for Admin review |
| Citizen exports >1000 records | WARN | Consent check + throttle | Breach event → DPO |
| ADMIN deletes core registry record | DENY (soft-delete only) | Log incident | DPO mandatory review |
| DPO hard-deletes DPIA record | ALLOW + LOG | Creates `dpo_deletion_audit` | Notify Commissioner |
| Batch export >100 records without consent | BLOCK | Trigger consent flow (DPA Sec 22) | Send consent email, set 7-day window |

---

## 7. COMPLIANCE MAPPING

| Requirement | Implementation | RBAC Enforcement |
|-----------|-----------------|------------------|
| **Constitution Art 47** (Fair Admin Action) | All decisions logged + human-reviewable | APPROVE action tied to official role |
| **Constitution Art 31** (Privacy Right) | Role restricts READ to own/relevant data | READ filtered by `user_id` + `data_scope` |
| **DPA Sec 22** (Consent) | Explicit consent for EXPORT, AI processing | EXPORT + AI_VAL actions require consent token |
| **DPA Sec 25-27** (Lawful Basis) | Employment/legal obligation for staff; explicit for public | Consent table linked to `audit_log` |
| **DPA Sec 31** (Security) | Hash-chained immutable logs, AES-256 | All UPDATE/DELETE soft-only; log encryption |
| **DPA Sec 35** (DPIA) | Auto-trigger if READ >10K records/month | `READ` action increments monthly counter |
| **DPA Sec 50** (Data Sovereignty) | Kenya-hosted only; no cross-border transfer | `data_residency = 'KE'` enforced in schema |
| **Penal Code Sec 108–117** | Chain-of-custody integrity via hash chaining | `hash_value` + `prev_hash_id` prevent tampering |

---

## 8. ROLE-BASED DASHBOARD LAYOUT

| Role | Dashboard Widgets | Data Scope |
|------|------------------|-----------|
| **Advocate** | My Cases, Deadlines, AI Pre-Validation Results, Research | Own + firm clients |
| **TDR Officer** | Objection Queue, CRF Automation, ADR Suitability, Approvals | Assigned objections |
| **Board Secretary** | Agenda Builder, Minutes Tracker, Allowance Processing | Board records |
| **Litigation Counsel** | Case Pipeline, Litigation Analytics, Approvals | Assigned + supervised cases |
| **Citizen** | My Files, File Now, Track Status, Plain Language Summaries | Own records |
| **Admin** | System Health, User Management, Audit Logs (summary) | All (no data content) |
| **DPO** | DPIA Reports, Breach Monitor, Consent Tracker, Full Audit Logs | All (full audit scope) |

---

## 9. TESTING SCENARIOS

### Test 1: Role Boundary
**Actor:** Advocate | **Action:** Try to READ TDR officer's objection queue
**Expected:** 403 Forbidden + audit log entry + incident flag

### Test 2: Module Restriction
**Actor:** Board Secretary | **Action:** Try to APPROVE case in CM module
**Expected:** 403 Forbidden + log + escalation to Admin

### Test 3: Consent Flow
**Actor:** Citizen | **Action:** EXPORT 5000 records without consent
**Expected:** Block + trigger consent email + set 7-day window + audit entry

### Test 4: Hash Chain Integrity
**Action:** Manually modify `audit_log` row hash value
**Expected:** Hash verification fails on next READ → breach alert → DPO notification

### Test 5: Admin Soft-Delete Only
**Actor:** Admin | **Action:** Hard-delete registry record
**Expected:** DENY + log + escalate to DPO

---

## 10. REVISION HISTORY

| Version | Date | Changes | Approved By |
|---------|------|---------|-------------|
| 1.0 | 2026-05-04 | Initial RBAC matrix | Legal Tech Division |
| — | — | — | — |
