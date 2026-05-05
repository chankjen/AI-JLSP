import { NextFunction, Response } from 'express';
import { AuthRequest } from './auth';
import { checkPermission } from '../services/rbacService';
import { Action, Module } from '../../../shared/types/rbac';

export function authorizeAction(module: Module, action: Action) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const permission = checkPermission(req.user.role, module, action);
    if (!permission.allowed) {
      return res.status(403).json({ error: 'Forbidden', reason: permission.reason });
    }

    res.locals.rbac = permission;
    return next();
  };
}
