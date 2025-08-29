/**
 * User roles and their associated permissions
 * 
 * This file defines the role-based access control (RBAC) system for the application.
 * It includes role definitions, permission mappings, and utility functions for access control.
 */

// Define available roles as a const object for type safety
export const ROLES = {
  DEFAULT: 'default',
  USER: 'user',
  EDITOR: 'editor',
  ADMIN: 'admin',
} as const;

// Create a type from the ROLES object
export type Role = typeof ROLES[keyof typeof ROLES];

// Define all possible permissions in the system
export const PERMISSIONS = {
  // Incident-related permissions
  INCIDENT_VIEW: 'incident:view',
  INCIDENT_CREATE: 'incident:create',
  INCIDENT_UPDATE: 'incident:update',
  INCIDENT_DELETE: 'incident:delete',
  INCIDENT_VERIFY: 'incident:verify',
  
  // User-related permissions
  USER_VIEW: 'user:view',
  USER_MANAGE: 'user:manage',
  
  // Statistics and reporting
  STATS_VIEW: 'stats:view',
  
  // System settings
  SETTINGS_MANAGE: 'settings:manage',
} as const;

type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Map roles to their permissions
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.DEFAULT]: [
    PERMISSIONS.INCIDENT_VIEW,
  ],
  
  [ROLES.USER]: [
    PERMISSIONS.INCIDENT_VIEW,
    PERMISSIONS.INCIDENT_CREATE,
    PERMISSIONS.STATS_VIEW,
  ],
  
  [ROLES.EDITOR]: [
    PERMISSIONS.INCIDENT_VIEW,
    PERMISSIONS.INCIDENT_UPDATE,
    PERMISSIONS.INCIDENT_VERIFY,
    PERMISSIONS.STATS_VIEW,
  ],
  
  [ROLES.ADMIN]: Object.values(PERMISSIONS), // Admins get all permissions
};

// Map actions to required roles
export const REQUIRED_ROLES = {
  // Incident actions
  INCIDENT_VIEW: [ROLES.USER, ROLES.EDITOR, ROLES.ADMIN],
  INCIDENT_CREATE: [ROLES.USER, ROLES.EDITOR, ROLES.ADMIN],
  INCIDENT_UPDATE: [ROLES.EDITOR, ROLES.ADMIN],
  INCIDENT_DELETE: [ROLES.ADMIN],
  INCIDENT_VERIFY: [ROLES.EDITOR, ROLES.ADMIN],
  
  // User management
  USER_VIEW: [ROLES.ADMIN],
  USER_MANAGE: [ROLES.ADMIN],
  
  // System actions
  STATS_VIEW: [ROLES.USER, ROLES.EDITOR, ROLES.ADMIN],
  SETTINGS_MANAGE: [ROLES.ADMIN],
} as const;

/**
 * Type guard to check if a string is a valid role
 */
export function isRole(role: string): role is Role {
  return Object.values(ROLES).includes(role as Role);
}

/**
 * Check if a user has the required role for a specific action
 * @param userRole The user's role to check
 * @param requiredRoles Array of roles that are allowed
 * @returns boolean indicating if the user has the required role
 */
export function hasRequiredRole(userRole: Role | undefined, requiredRoles: readonly Role[]): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}

/**
 * Check if a user has a specific permission
 * @param userRole The user's role to check
 * @param permission The permission to verify
 * @returns boolean indicating if the user has the permission
 */
export function hasPermission(userRole: Role | undefined, permission: Permission): boolean {
  if (!userRole) return false;
  const userPermissions = ROLE_PERMISSIONS[userRole] || [];
  return userPermissions.includes(permission);
}

/**
 * Get all permissions for a specific role
 * @param role The role to get permissions for
 * @returns Array of permissions for the role
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return [...ROLE_PERMISSIONS[role] || []];
}

/**
 * Get the default role for new users
 * @returns The default role
 */
export function getDefaultRole(): Role {
  return ROLES.USER; // Changed from EDITOR to USER for better security by default
}

/**
 * Check if a user can perform an action based on required permissions
 * @param userRole The user's role
 * @param requiredPermissions Array of permissions that would allow the action
 * @returns boolean indicating if the user has any of the required permissions
 */
export function can(userRole: Role | undefined, ...requiredPermissions: Permission[]): boolean {
  if (!userRole) return false;
  const userPermissions = getPermissionsForRole(userRole);
  return requiredPermissions.some(permission => userPermissions.includes(permission));
}
