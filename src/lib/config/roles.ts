/**
 * User roles and their associated permissions
 */

export const ROLES = {
  DEFAULT: 'default',
  USER: 'user',
  EDITOR: 'editor',
  ADMIN: 'admin',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const ROLE_PERMISSIONS = {
  [ROLES.DEFAULT]: {
  },
  [ROLES.USER]: {
    canViewIncidentDetails: true,
    canViewStatistics: true,
    canReportIncidents: true,
  },
  [ROLES.EDITOR]: {
    canUpdateIncidentStatus: true,
    canViewIncidentDetails: true,
    canViewStatistics: true,
    canReportIncidents: true,
  },
  [ROLES.ADMIN]: {
    canUpdateIncidentStatus: true,
    canViewIncidentDetails: true,
    canViewStatistics: true,
    canManageUsers: true,
    canDeleteIncidents: true,
    canReportIncidents: true,
  },
} as const;

export const REQUIRED_ROLES = {
  UPDATE_INCIDENT_STATUS: [ROLES.EDITOR, ROLES.ADMIN],
  MANAGE_USERS: [ROLES.ADMIN],
  DELETE_INCIDENTS: [ROLES.ADMIN],
  VIEW_INCIDENTS: [ROLES.USER, ROLES.EDITOR, ROLES.ADMIN],
  REPORT_INCIDENTS: [ROLES.USER, ROLES.EDITOR, ROLES.ADMIN],
} as const;

/**
 * Check if a user has the required role for a specific action
 */
export function hasRequiredRole(userRole: Role | undefined, requiredRoles: Role[]): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userRole: Role | undefined, permission: keyof typeof ROLE_PERMISSIONS[typeof ROLES[keyof typeof ROLES]]): boolean {
  if (!userRole) return false;
  return ROLE_PERMISSIONS[userRole]?.[permission] || false;
}

/**
 * Get the default role for new users
 */
export function getDefaultRole(): Role {
  return ROLES.EDITOR;
}
