// ============================================================================
// Permissions Definitions - AI-JLSP
// Constitution Art 47 (Fair Admin), DPA Sec 28 (Lawful Basis)
// ============================================================================

import { Action } from '../types/rbac';

export const ACTIONS: Record<Action, { name: string; description: string; severity: 'low' | 'medium' | 'high' | 'critical' }> = {
  create: {
    name: 'Create',
    description: 'Create new record (immutable audit entry per DPA Sec 31)',
    severity: 'medium'
  },
  read: {
    name: 'Read',
    description: 'View/retrieve record (triggers access log, counts toward DPIA)',
    severity: 'low'
  },
  update: {
    name: 'Update',
    description: 'Modify record (creates version history, hash-chained per DPA Sec 31)',
    severity: 'high'
  },
  delete: {
    name: 'Delete',
    description: 'Soft or hard delete (soft-delete only unless DPO approved)',
    severity: 'critical'
  },
  approve: {
    name: 'Approve',
    description: 'Authorize/sign-off action (triggers final decision audit per Art 47)',
    severity: 'critical'
  },
  export: {
    name: 'Export',
    description: 'Export/download data (consent verification required, DPA Sec 22)',
    severity: 'high'
  },
  audit_read: {
    name: 'Audit Read',
    description: 'Access audit logs (DPO/Admin only; access itself is logged)',
    severity: 'high'
  }
};

// Action → Log Entry Requirement
export const ACTION_AUDIT_REQUIREMENTS: Record<Action, {
  logRequired: boolean;
  hashChainRequired: boolean;
  consentRequired: boolean;
  dpiaTrigger: boolean;
  requiresMFA: boolean;
}> = {
  create: {
    logRequired: true,
    hashChainRequired: true,
    consentRequired: false,
    dpiaTrigger: true,
    requiresMFA: false
  },
  read: {
    logRequired: true,
    hashChainRequired: false,
    consentRequired: false,
    dpiaTrigger: true,
    requiresMFA: false
  },
  update: {
    logRequired: true,
    hashChainRequired: true,
    consentRequired: false,
    dpiaTrigger: true,
    requiresMFA: true
  },
  delete: {
    logRequired: true,
    hashChainRequired: true,
    consentRequired: false,
    dpiaTrigger: true,
    requiresMFA: true
  },
  approve: {
    logRequired: true,
    hashChainRequired: true,
    consentRequired: false,
    dpiaTrigger: false,
    requiresMFA: true
  },
  export: {
    logRequired: true,
    hashChainRequired: true,
    consentRequired: true,  // DPA Sec 22
    dpiaTrigger: true,
    requiresMFA: true
  },
  audit_read: {
    logRequired: true,
    hashChainRequired: true,
    consentRequired: false,
    dpiaTrigger: false,
    requiresMFA: true
  }
};

// Rate Limiting Per Action (DPA Sec 25: Data Minimization)
export const ACTION_RATE_LIMITS = {
  create: {
    perHour: 1000,
    perDay: 10000,
    burstWindow: 60  // seconds
  },
  read: {
    perHour: 10000,
    perDay: 100000,
    burstWindow: 10
  },
  update: {
    perHour: 500,
    perDay: 5000,
    burstWindow: 120
  },
  delete: {
    perHour: 50,
    perDay: 500,
    burstWindow: 600
  },
  approve: {
    perHour: 50,
    perDay: 500,
    burstWindow: 300
  },
  export: {
    perHour: 100,
    perDay: 1000,
    burstWindow: 300
  },
  audit_read: {
    perHour: 1000,
    perDay: 10000,
    burstWindow: 60
  }
};

// Resource-Specific Permissions (DPA Sec 50: Data Sovereignty)
export const RESOURCE_PERMISSIONS = {
  personal_data: {
    allowExternalTransfer: false,  // Kenya-hosted only
    requiresConsentForProcessing: true,  // DPA Sec 22
    requiresDPIA: true,  // DPA Sec 35
    retentionDays: 2555  // 7 years
  },
  sensitive_legal_documents: {
    allowExternalTransfer: false,
    requiresConsentForProcessing: false,  // Employment basis
    requiresDPIA: true,
    retentionDays: 3650  // 10 years minimum
  },
  audit_logs: {
    allowExternalTransfer: false,
    requiresConsentForProcessing: false,
    requiresDPIA: false,
    retentionDays: 2555,  // 7 years (DPA Sec 31)
    immutable: true,
    hashChained: true
  },
  dpia_records: {
    allowExternalTransfer: false,
    requiresConsentForProcessing: false,
    requiresDPIA: false,
    retentionDays: 2555,  // 7 years
    immutable: true
  }
};

// Approval Chain Per Action
export const APPROVAL_CHAIN: Record<Action | string, string[]> = {
  approve: ['user', 'supervisor_or_dpo'],
  delete: ['user', 'admin_or_dpo'],
  export_bulk: ['user', 'officer', 'dpo'],  // >100 records
  ai_override: ['user', 'litigation_counsel_or_admin'],
  breach_notification: ['dpo', 'commissioner'],
  system_config_change: ['admin', 'commissioner']
};

// Escalation Rules (Constitution Art 47: Fair Admin)
export const ESCALATION_RULES = {
  bulk_data_access: {
    threshold: 10000,  // DPIA auto-trigger
    escalateTo: 'dpo',
    requiresApproval: true
  },
  repeated_failed_auth: {
    threshold: 5,
    escalateTo: 'admin',
    requiresApproval: false,
    consequence: 'account_lock_15min'
  },
  rbac_violation: {
    threshold: 1,
    escalateTo: 'admin',
    requiresApproval: false,
    consequence: 'flag_for_review'
  },
  data_export_request: {
    threshold: 1,
    escalateTo: 'dpo',
    requiresApproval: true,
    timelineHours: 24
  },
  breach_detection: {
    threshold: 1,
    escalateTo: 'dpo',
    requiresApproval: false,
    notifyDataSubjects: true
  }
};

// Conditional Permission Criteria
export const CONDITIONAL_CRITERIA = {
  update_own_record: (userId: string, resourceUserId: string) => userId === resourceUserId,
  read_own_record: (userId: string, resourceUserId: string) => userId === resourceUserId,
  delete_soft_only: () => true,  // All deletes are soft unless DPO override
  export_with_consent: (consentTokens: string[], resourceId: string) => {
    return consentTokens.includes(`export_${resourceId}`);
  },
  approve_if_supervisor: (userId: string, supervisorIds: string[]) => {
    return supervisorIds.includes(userId);
  },
  ai_override_if_counsel: (userRole: string) => {
    return ['litigation_counsel', 'admin', 'dpo'].includes(userRole);
  }
};
