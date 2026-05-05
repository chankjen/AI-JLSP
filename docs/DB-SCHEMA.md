# AI-JLSP Core Database Schema

## Overview
This document describes the core PostgreSQL schema for AI-JLSP, including DPA-compliant audit logging and domain entities for case management.

## Core Domain Tables

1. `cases`
   - Primary reference for legal matters and workflows.
   - Tracks `case_number`, `case_type`, `status`, `jurisdiction`, `created_by`, `assigned_to`.
   - Includes `is_confidential`, `is_sensitive`, `data_categories`, `data_residency`, and `retention_until` for DPA compliance.

2. `documents`
   - Stores document metadata rather than raw content.
   - Includes `storage_provider`, `storage_key`, `sha256_hash`, `mimetype`, `size_bytes`, and `uploaded_by`.
   - Tracks DPA fields: `is_sensitive`, `access_restriction`, `metadata`, `data_residency`, and `retention_until`.

3. `case_deadlines`
   - Models statutory/procedural deadlines and escalation paths.
   - Supports `due_date`, `status`, `escalated_to`, `reminder_sent`, and residency metadata.

4. `case_events`
   - Captures workflow and metadata events for cases.
   - Designed as an audit helper for domain-specific changes.

## DPA and Compliance Tables

- `audit_log`
  - Immutable record of user actions with a cryptographic hash chain.
  - Includes `user_id`, `user_role`, `user_email`, `action_type`, `resource_type`, `details`, `old_values`, `new_values`.
  - Stores DPA-specific fields: `consent_id`, `consent_verified`, `dpia_id`, `ip_address`, `user_agent`, and `session_id`.

- `dpa_consent_records`
  - Tracks consent requests and responses in accordance with Kenya's Data Protection Act.

- `dpia_records`
  - Records DPIA assessments for high-risk processing, including AI legal decision-making.

- `breach_notifications`
  - Logs incidents, notifications, and containment actions for security breaches.

- `access_logs`
  - Records user access to protected resources and high-risk operations.

- `ai_decision_logs`
  - Tracks AI-generated recommendations and audit evidence for explainability and model governance.

- `rbac_violation_alerts`
  - Detects and stores role-based access violations and policy exceptions.

## Key Compliance Design Patterns

- Data residency is enforced with `data_residency VARCHAR(2) DEFAULT 'KE'` on core tables.
- Retention policy is surfaced with `retention_until` timestamps and can be extended in the application layer.
- Sensitive and confidential records are explicitly flagged with boolean columns.
- Audit chain integrity is supported by `hash_value` and `previous_hash_value` in `audit_log`.
- Core domain changes are expected to be logged in `audit_log` by the application or by database triggers.

## Notes

- The PostgreSQL schema file is located at `infrastructure/init-scripts/postgres-init.sql`.
- This design is intentionally modular: domain tables are separated from compliance and audit tables, while all references remain linked by UUIDs.
