import { NextFunction, Response } from 'express';
import { AuthRequest } from './auth';
import { checkPermission as checkPermissionService } from '../services/rbacService';
import { Action, Module } from '../../../shared';
import { ROLE_PERMISSIONS } from '../../../shared';

const PERMISSION_MAP: Record<string, { module: Module; action: Action }> = {
  view_cases: { module: 'case_management', action: 'read' },
  file_case: { module: 'case_management', action: 'create' },
  manage_documents: { module: 'case_management', action: 'update' },
  view_conveyancing: { module: 'conveyancing', action: 'read' },
  manage_conveyancing: { module: 'conveyancing', action: 'create' },
  verify_titles: { module: 'conveyancing', action: 'update' },
  view_tdr: { module: 'tax_dispute_resolution', action: 'read' },
  manage_tdr: { module: 'tax_dispute_resolution', action: 'create' },
  validate_objections: { module: 'tax_dispute_resolution', action: 'approve' },
  generate_crf: { module: 'tax_dispute_resolution', action: 'export' },
  view_board: { module: 'board_services', action: 'read' },
  manage_board: { module: 'board_services', action: 'create' },
  view_research: { module: 'document_search', action: 'read' },
  view_compliance: { module: 'audit', action: 'read' },
  manage_compliance: { module: 'audit', action: 'update' },
  manage_users: { module: 'admin_panel', action: 'update' },
  view_admin: { module: 'admin_panel', action: 'read' }
};

export function authorizeAction(module: Module, action: Action) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const permission = checkPermissionService(req.user.role, module, action);
    if (!permission.allowed) {
      return res.status(403).json({ error: 'Forbidden', reason: permission.reason });
    }

    res.locals.rbac = permission;
    return next();
  };
}

// Simple permission check for route middleware
export function checkPermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const mapping = PERMISSION_MAP[permission];
    if (!mapping) {
      return res.status(403).json({ error: 'Unknown permission' });
    }

    const rolePermissions = ROLE_PERMISSIONS[req.user.role];
    if (!rolePermissions) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const modulePermissions = rolePermissions.permissions[mapping.module];
    if (!modulePermissions) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const allowed = modulePermissions[mapping.action];
    if (allowed === true || allowed === 'conditional') {
      return next();
    }

    return res.status(403).json({ error: 'Insufficient permissions' });
  };
}
