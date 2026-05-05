import { ROLE_PERMISSIONS } from '../../../shared/constants/roles';
import { Action, Module, PermissionCheck, UserRole } from '../../../shared/types/rbac';

export function checkPermission(role: UserRole, module: Module, action: Action): PermissionCheck {
  const roleConfig = ROLE_PERMISSIONS[role];
  if (!roleConfig) {
    return { allowed: false, reason: 'Role not recognized' };
  }

  const modulePermissions = roleConfig.permissions[module];
  if (!modulePermissions) {
    return { allowed: false, reason: 'Module access is not configured for this role' };
  }

  const allowed = modulePermissions[action];
  if (allowed === true) {
    return { allowed: true };
  }

  if (allowed === 'conditional') {
    return {
      allowed: true,
      reason: 'Conditional access granted; business logic must enforce resource constraints',
      requiresApproval: true,
      dataScope: 'own'
    };
  }

  return { allowed: false, reason: 'Action not allowed for this role' };
}

export function listAllowedActions(role: UserRole) {
  const roleConfig = ROLE_PERMISSIONS[role];
  if (!roleConfig) {
    return [];
  }

  return Object.entries(roleConfig.permissions).map(([moduleName, actions]) => ({
    module: moduleName,
    actions: Object.entries(actions ?? {})
      .filter(([, value]) => value === true || value === 'conditional')
      .map(([action]) => action)
  }));
}
