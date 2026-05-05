// ============================================================================
// Audit & Compliance Types - AI-JLSP
// DPA Sec 31 (Security), Constitution Art 47 (Fair Admin)
// ============================================================================

export type AuditAction = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'approve'
  | 'export'
  | 'verify'
  | 'override'
  | 'breach_notification'
  | 'dpia_initiate'
  | 'dpia_complete';

export type AuditStatus = 'success' | 'failure' | 'partial' | 'escalated';

export type ResourceType =
  | 'case'
  | 'document'
  | 'user'
  | 'role'
  | 'consent'
  | 'dpia'
  | 'breach'
  | 'audit_log';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userRole: string;
  userEmail: string;
  
  // Action Details
  action: AuditAction;
  status: AuditStatus;
  module: string;
  resourceType: ResourceType;
  resourceId: string;
  
  // Details (DPA Sec 31)
  details: {
    changesSummary?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    reason?: string;
    approverIds?: string[];
  };
  
  // Request Context
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  
  // DPA Compliance (Sec 22, 31)
  consentId?: string;
  consentVerified?: boolean;
  dpiaId?: string;
  
  // Hash Chain (Penal Code Sec 108-117: Chain of Custody)
  hashValue: string; // SHA-256
  previousHashValue?: string;
  
  // Data Governance
  dataResidency: 'KE'; // Kenya only (DPA Sec 50)
  encrypted: boolean;
  encryptionKeyVersion: number;
  
  // Severity for escalation (Constitution Art 47)
  severityLevel?: 'low' | 'medium' | 'high' | 'critical';
  requiresReview?: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
}

export interface DPAConsentRecord {
  id: string;
  userId: string;
  userEmail: string;
  
  // DPA Sec 22: Explicit Consent
  consentType: 'data_processing' | 'ai_analysis' | 'export' | 'cross_border';
  consentGiven: boolean;
  consentTimestamp: Date;
  consentVersion: string;
  consentExpiry: Date;
  
  // Withdrawal (DPA Sec 23)
  withdrawnAt?: Date;
  withdrawalReason?: string;
  
  // Proof
  consentMethod: 'email_confirmation' | 'in_app' | 'digital_signature';
  consentProof: string; // Hash of consent document
  
  // Audit (DPA Sec 31)
  ipAddress: string;
  userAgent: string;
  recordedBy: string;
}

export interface DPIARecord {
  id: string;
  createdAt: Date;
  createdBy: string;
  
  // DPIA Details (DPA Sec 35)
  title: string;
  description: string;
  dataCategories: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  // Mitigation Measures
  measuresTaken: string[];
  mitigationScore: number; // 0-100
  
  // Review & Signoff
  completedAt?: Date;
  completedBy?: string;
  findings: string;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  
  // Retention (7 years minimal)
  retentionUntil: Date;
}

export interface BreachNotification {
  id: string;
  discoveredAt: Date;
  discoveredBy: string;
  
  // Breach Details
  breachType: 'unauthorized_access' | 'data_loss' | 'encryption_failure' | 'other';
  affectedDataCategories: string[];
  estimatedAffectedRecords: number;
  
  // DPA Sec 33-34: Notification Timeline
  notificationSentAt: Date;
  notificationRecipients: string[]; // Data subjects, Commissioner
  notificationMethod: 'email' | 'sms' | 'sms_plus' | 'official_notice';
  
  // Investigation
  rootCause: string;
  mitigationActions: string[];
  preventiveMeasures: string[];
  
  // Signed by DPO (DPA Sec 34)
  signedBy: string;
  signedAt: Date;
}

export interface AccessLog {
  id: string;
  timestamp: Date;
  userId: string;
  userRole: string;
  
  // Access Details
  resourceType: ResourceType;
  resourceId: string;
  accessMethod: 'api' | 'ui' | 'export' | 'report';
  accessDuration?: number; // seconds
  
  // Context
  ipAddress: string;
  userAgent: string;
  
  // DPIA Counter (Auto-triggers >10K records/month)
  recordsAccessed: number;
  
  // For DPA monitoring
  dataResidency: 'KE';
}

export interface AIDecisionLog {
  id: string;
  timestamp: Date;
  
  // AI Model Details
  modelVersion: string;
  modelName: string;
  
  // Input & Output
  input: {
    documentId: string;
    documentType: string;
    documentHash: string;
  };
  
  output: {
    classification: string;
    confidence: number;
    reasoning: string; // Explainability (Constitution Art 47)
    recommendedAction: string;
  };
  
  // Human Review (Art 47: human-in-the-loop)
  humanReviewRequired: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewOutcome?: 'approved' | 'rejected' | 'modified';
  
  // Audit Trail
  auditLogId: string;
  consentVerified: boolean;
}

export interface RBACViolationAlert {
  id: string;
  timestamp: Date;
  
  // Violation Details
  userId: string;
  userRole: string;
  attemptedModule: string;
  attemptedAction: string;
  
  // Context
  ipAddress: string;
  userAgent: string;
  
  // Escalation
  severity: 'low' | 'medium' | 'high' | 'critical';
  flaggedFor: 'logging' | 'admin_review' | 'dpo_escalation';
  
  // Resolution
  resolved: boolean;
  resolvedAt?: Date;
  resolution?: string;
}

// ============================================================================
// Type Guards
// ============================================================================

export const isAuditAction = (value: any): value is AuditAction => {
  return [
    'create', 'read', 'update', 'delete', 'approve', 'export',
    'verify', 'override', 'breach_notification', 'dpia_initiate', 'dpia_complete'
  ].includes(value);
};

export const isResourceType = (value: any): value is ResourceType => {
  return [
    'case', 'document', 'user', 'role', 'consent', 'dpia', 'breach', 'audit_log'
  ].includes(value);
};
