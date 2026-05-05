// ============================================================================
// RBAC Types - AI-JLSP
// Constitution Art 47 (Fair Admin), DPA Sec 28 (Lawful Basis)
// ============================================================================

export type UserRole = 
  | 'advocate'
  | 'tdr_officer'
  | 'board_secretary'
  | 'litigation_counsel'
  | 'citizen'
  | 'admin'
  | 'dpo';

export type Module =
  | 'case_management'
  | 'registry'
  | 'tax_dispute_resolution'
  | 'conveyancing'
  | 'board_services'
  | 'ai_validation'
  | 'document_search'
  | 'audit'
  | 'settings'
  | 'admin_panel';

export type Action = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'approve'
  | 'export'
  | 'audit_read';

export interface RBACPolicy {
  role: UserRole;
  module: Module;
  actions: Action[];
  dataScope?: 'own' | 'team' | 'department' | 'all';
  resourceFilter?: Record<string, any>;
}

export interface RBACContext {
  userId: string;
  role: UserRole;
  department?: string;
  email: string;
  mfaVerified: boolean;
  consentTokens?: string[]; // DPA Sec 22 consent tokens
}

export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
  requiresApproval?: boolean;
  requiresConsent?: boolean;
  dataScope?: 'own' | 'team' | 'department' | 'all';
}

export interface RolePermission {
  role: UserRole;
  permissions: {
    [key in Module]?: {
      [key in Action]?: boolean | 'conditional';
    };
  };
}

// ============================================================================
// User & Authentication
// ============================================================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string;
  phoneNumber?: string;
  mfaEnabled: boolean;
  mfaSecret?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // DPA Sec 22: Consent tracking
  consentGiven?: boolean;
  consentTimestamp?: Date;
  consentVersion?: string;
}

export interface JWTPayload {
  sub: string; // user ID
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
  mfaVerified: boolean;
  consentTokens?: string[]; // For DPA tracking
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

// ============================================================================
// Request Context & Security
// ============================================================================

export interface RequestContext {
  userId: string;
  role: UserRole;
  token: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  sessionId: string;
  mfaVerified: boolean;
  consentTokens?: string[];
}

export interface DataAccessRequest {
  userId: string;
  role: UserRole;
  module: Module;
  action: Action;
  resourceId?: string;
  resourceType?: string;
  filters?: Record<string, any>;
  context: RequestContext;
}
