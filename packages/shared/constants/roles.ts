// ============================================================================
// Role Definitions - AI-JLSP
// Constitution Art 47 (Fair Admin), DPA Sec 28 (Lawful Basis)
// ============================================================================

import { UserRole, RolePermission, Module, Action } from '../types/rbac';

export const ROLES: Record<UserRole, { name: string; department: string; description: string }> = {
  advocate: {
    name: 'Advocate / Legal Practitioner',
    department: 'Private / Firm',
    description: 'Legal professional representing clients in litigation and dispute resolution'
  },
  tdr_officer: {
    name: 'TDR Officer (IRO/ADR)',
    department: 'KRA',
    description: 'Tax Dispute Resolution officer processing objections and ADR cases'
  },
  board_secretary: {
    name: 'Board Secretary',
    department: 'KRA Board',
    description: 'Administrative lead coordinating board meetings, minutes, and decisions'
  },
  litigation_counsel: {
    name: 'Litigation Counsel',
    department: 'Judiciary',
    description: 'Senior judicial officer managing case progression and legal decisions'
  },
  citizen: {
    name: 'Citizen / Self-Represented Litigant',
    department: 'Public',
    description: 'Member of public accessing justice services without representation'
  },
  admin: {
    name: 'System Administrator',
    department: 'Judiciary / KRA IT',
    description: 'System administrator managing users, roles, and platform configuration'
  },
  dpo: {
    name: 'Data Protection Officer',
    department: 'Judiciary / KRA',
    description: 'DPA compliance officer monitoring data protection, breaches, and DPIA'
  }
};

export const ROLE_HIERARCHY: UserRole[] = [
  'dpo',           // Highest - Full system visibility
  'admin',         // System management
  'litigation_counsel',
  'board_secretary',
  'tdr_officer',
  'advocate',
  'citizen'        // Lowest - Own data only
];

export const ROLE_PERMISSIONS: Record<UserRole, RolePermission> = {
  advocate: {
    role: 'advocate',
    permissions: {
      case_management: {
        create: true,
        read: true,
        update: 'conditional',
        delete: false,
        approve: false,
        export: true,
        audit_read: false
      },
      registry: {
        create: true,
        read: true,
        update: 'conditional',
        delete: false,
        approve: false,
        export: true,
        audit_read: false
      },
      tax_dispute_resolution: {
        create: false,
        read: true,
        update: false,
        delete: false,
        approve: false,
        export: false,
        audit_read: false
      },
      conveyancing: {
        create: true,
        read: true,
        update: 'conditional',
        delete: false,
        approve: false,
        export: true,
        audit_read: false
      },
      board_services: {
        read: 'conditional'
      },
      ai_validation: {
        create: true,
        read: true,
        update: false,
        delete: false,
        export: true,
        audit_read: false
      },
      document_search: {
        create: true,
        read: true,
        update: false,
        delete: false,
        export: true,
        audit_read: false
      },
      audit: {
        read: 'conditional' // Own records only
      },
      settings: {
        create: true,
        read: true,
        update: true,
        delete: false,
        audit_read: false
      }
    }
  },

  tdr_officer: {
    role: 'tdr_officer',
    permissions: {
      case_management: {
        create: true,
        read: true,
        update: true,
        delete: false,
        approve: true,
        export: true,
        audit_read: false
      },
      registry: {
        create: true,
        read: true,
        update: true,
        delete: false,
        approve: true,
        export: true,
        audit_read: false
      },
      tax_dispute_resolution: {
        create: true,
        read: true,
        update: true,
        delete: false,
        approve: true,
        export: true,
        audit_read: false
      },
      conveyancing: {
        read: true
      },
      board_services: {
        read: true
      },
      ai_validation: {
        create: true,
        read: true,
        update: false,
        delete: false,
        approve: true,
        export: true,
        audit_read: false
      },
      document_search: {
        create: true,
        read: true,
        update: false,
        delete: false,
        export: true,
        audit_read: false
      },
      audit: {
        read: 'conditional' // 30 days
      },
      settings: {
        create: true,
        read: true,
        update: true,
        delete: false,
        audit_read: false
      }
    }
  },

  board_secretary: {
    role: 'board_secretary',
    permissions: {
      case_management: {
        read: true
      },
      registry: {
        read: true,
        export: true
      },
      tax_dispute_resolution: {
        read: true
      },
      conveyancing: {
        read: true
      },
      board_services: {
        create: true,
        read: true,
        update: true,
        delete: false,
        approve: true,
        export: true,
        audit_read: false
      },
      ai_validation: {
        read: true
      },
      document_search: {
        create: true,
        read: true,
        update: false,
        delete: false,
        export: true,
        audit_read: false
      },
      audit: {
        read: 'conditional' // 30 days
      },
      settings: {
        create: true,
        read: true,
        update: true,
        delete: false,
        audit_read: false
      }
    }
  },

  litigation_counsel: {
    role: 'litigation_counsel',
    permissions: {
      case_management: {
        create: true,
        read: true,
        update: true,
        delete: false,
        approve: true,
        export: true,
        audit_read: false
      },
      registry: {
        create: true,
        read: true,
        update: true,
        delete: false,
        approve: true,
        export: true,
        audit_read: false
      },
      tax_dispute_resolution: {
        read: true,
        approve: 'conditional'
      },
      conveyancing: {
        read: true,
        update: 'conditional'
      },
      board_services: {
        read: 'conditional'
      },
      ai_validation: {
        create: true,
        read: true,
        update: false,
        delete: false,
        approve: true,
        export: true,
        audit_read: false
      },
      document_search: {
        create: true,
        read: true,
        update: false,
        delete: false,
        export: true,
        audit_read: false
      },
      audit: {
        read: 'conditional' // 90 days
      },
      settings: {
        create: true,
        read: true,
        update: true,
        delete: false,
        audit_read: false
      }
    }
  },

  citizen: {
    role: 'citizen',
    permissions: {
      case_management: {
        create: 'conditional', // File own case
        read: 'conditional',   // Own records
        update: 'conditional', // Limited
        delete: false,
        approve: false,
        export: 'conditional',
        audit_read: false
      },
      registry: {
        read: 'conditional', // Own docs
        export: 'conditional'
      },
      tax_dispute_resolution: {
        create: 'conditional', // File objection
        read: 'conditional',
        update: 'conditional',
        delete: false,
        export: 'conditional',
        audit_read: false
      },
      conveyancing: {
        read: 'conditional'
      },
      board_services: {
        read: false
      },
      ai_validation: {
        read: 'conditional' // Summary only
      },
      document_search: {
        read: 'conditional' // Guided, limited results
      },
      settings: {
        create: true,
        read: true,
        update: true,
        delete: 'conditional', // Own account
        audit_read: false
      }
    }
  },

  admin: {
    role: 'admin',
    permissions: {
      case_management: {
        create: true,
        read: true,
        update: true,
        delete: 'conditional', // Soft-delete only
        approve: true,
        export: true,
        audit_read: false
      },
      registry: {
        create: true,
        read: true,
        update: true,
        delete: 'conditional',
        approve: true,
        export: true,
        audit_read: false
      },
      tax_dispute_resolution: {
        create: true,
        read: true,
        update: true,
        delete: 'conditional',
        approve: true,
        export: true,
        audit_read: false
      },
      conveyancing: {
        create: true,
        read: true,
        update: true,
        delete: 'conditional',
        approve: true,
        export: true,
        audit_read: false
      },
      board_services: {
        create: true,
        read: true,
        update: true,
        delete: 'conditional',
        approve: true,
        export: true,
        audit_read: false
      },
      ai_validation: {
        create: true,
        read: true,
        update: true,
        delete: false,
        approve: true,
        export: true,
        audit_read: false
      },
      document_search: {
        create: true,
        read: true,
        update: true,
        delete: false,
        approve: true,
        export: true,
        audit_read: false
      },
      audit: {
        read: true,       // Summary only
        export: true,
        audit_read: false // No access to DPO-level audit
      },
      settings: {
        create: true,
        read: true,
        update: true,
        delete: true,
        approve: true,
        export: true,
        audit_read: false
      },
      admin_panel: {
        create: true,
        read: true,
        update: true,
        delete: 'conditional',
        approve: true,
        export: true,
        audit_read: false
      }
    }
  },

  dpo: {
    role: 'dpo',
    permissions: {
      case_management: {
        read: true,
        delete: 'conditional', // Hard delete with audit
        export: true,
        audit_read: true
      },
      registry: {
        read: true,
        delete: 'conditional',
        export: true,
        audit_read: true
      },
      tax_dispute_resolution: {
        read: true,
        delete: 'conditional',
        export: true,
        audit_read: true
      },
      conveyancing: {
        read: true,
        delete: 'conditional',
        export: true,
        audit_read: true
      },
      board_services: {
        read: true,
        delete: 'conditional',
        export: true,
        audit_read: true
      },
      ai_validation: {
        read: true,
        delete: false,
        export: true,
        audit_read: true
      },
      document_search: {
        read: true,
        delete: false,
        export: true,
        audit_read: true
      },
      audit: {
        read: true,       // FULL access
        delete: false,
        export: true,
        audit_read: true  // FULL audit trail
      },
      settings: {
        read: true,
        export: true,
        audit_read: true
      },
      admin_panel: {
        read: true,
        export: true,
        audit_read: true
      }
    }
  }
};
