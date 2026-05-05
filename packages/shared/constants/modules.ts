// ============================================================================
// Module Definitions - AI-JLSP
// ============================================================================

import { Module } from '../types/rbac';

export const MODULES: Record<Module, { name: string; description: string; category: string }> = {
  case_management: {
    name: 'Case Management',
    description: 'Intake, triage, routing, scheduling, case lifecycle management',
    category: 'core'
  },
  registry: {
    name: 'Registry & Document Management',
    description: 'File storage, document versioning, retrieval, archival',
    category: 'core'
  },
  tax_dispute_resolution: {
    name: 'Tax Dispute Resolution',
    description: 'Objection tracking, CRF automation, ADR coordination (TPA Sec 51)',
    category: 'specialized'
  },
  conveyancing: {
    name: 'Conveyancing & Property Transactions',
    description: 'Contract review, property verification, Ardhi Sasa integration',
    category: 'specialized'
  },
  board_services: {
    name: 'Board Services',
    description: 'Agenda generation, minutes drafting, allowance processing, KIKAO sync',
    category: 'specialized'
  },
  ai_validation: {
    name: 'AI Document Pre-Validation',
    description: 'RAG-powered checklist, risk scoring, compliance alerts (Legal-BERT-KE)',
    category: 'ai'
  },
  document_search: {
    name: 'Document Search & Precedent',
    description: 'Semantic search, eKLR integration, case law retrieval',
    category: 'ai'
  },
  audit: {
    name: 'Audit & Compliance',
    description: 'Access logs, DPA monitoring, breach alerts, immutable audit trails',
    category: 'governance'
  },
  settings: {
    name: 'User Settings & Profile',
    description: 'MFA setup, locale preferences, password management',
    category: 'account'
  },
  admin_panel: {
    name: 'Administration',
    description: 'Role management, system configuration, encryption keys, integrations',
    category: 'admin'
  }
};

export const MODULE_CATEGORIES = {
  core: 'Core Legal Services',
  specialized: 'Specialized Practice Areas',
  ai: 'AI-Powered Features',
  governance: 'Compliance & Governance',
  account: 'Account Management',
  admin: 'System Administration'
};

export const MODULE_DEPENDENCIES: Record<Module, Module[]> = {
  case_management: ['registry', 'audit'],
  registry: ['audit'],
  tax_dispute_resolution: ['case_management', 'registry', 'ai_validation', 'audit'],
  conveyancing: ['registry', 'document_search', 'audit'],
  board_services: ['registry', 'document_search', 'audit'],
  ai_validation: ['registry', 'document_search', 'audit'],
  document_search: ['registry', 'audit'],
  audit: [],
  settings: ['audit'],
  admin_panel: ['audit']
};

// DPA Sec 35: DPIA Risk Assessment Per Module
export const MODULE_DPIA_RISK: Record<Module, 'low' | 'medium' | 'high'> = {
  case_management: 'high',         // High volume personal data
  registry: 'high',                // Sensitive legal documents
  tax_dispute_resolution: 'medium', // Structured processing
  conveyancing: 'high',            // Property owner data
  board_services: 'medium',        // Limited PII scope
  ai_validation: 'high',           // AI processing (Art 22, GDPR equivalent)
  document_search: 'medium',       // Read-only search
  audit: 'medium',                 // Audit trail review
  settings: 'low',                 // User preferences
  admin_panel: 'medium'            // System configuration
};

// Module → Work Procedure Manual sections
export const MODULE_WORK_MANUAL_ANCHORS: Record<Module, string[]> = {
  case_management: ['Sec 2.1.8.x (Admin/Registry)', 'Sec 2.1.8.1 (Smart Triage)'],
  registry: ['Sec 2.1.8.x (Admin/Registry)', 'Sec 6.1.8 (Conveyancing Registry)'],
  tax_dispute_resolution: ['Sec 5.1.8 (Board Prep)', 'TPA Sec 51 (Objection Process)'],
  conveyancing: ['Sec 6.1.8–6.1.9 (Conveyancing)', 'Land Act (Property Verification)'],
  board_services: ['Sec 5.1.8 (Board Prep)', 'Sec 10.1.10 (TDR Objections)'],
  ai_validation: ['Sec 51(3) TPA', 'Civil Procedure Rules (Pre-Filing)'],
  document_search: ['Sec 7.1.8 (Semantic Search)', 'Sec 7.1.10 (Knowledge Base)'],
  audit: ['DPA Sec 31 (Security)', 'Constitution Art 47 (Fair Admin)'],
  settings: ['DPA Sec 26 (Security)', 'Constitution Art 31 (Privacy)'],
  admin_panel: ['Constitution Art 47 (Fair Admin)', 'DPA Sec 28 (Lawful Basis)']
};
