import { ROLES, PERMISSIONS, type Role } from '@/lib/config/roles';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

/**
 * Type for user session with role information
 */
export interface UserSession {
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: Role;
    enabled: boolean;
  };
}

/**
 * Get the current user session with type safety
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  
  // Ensure the user has a valid role
  const userRole = session.user.role as Role || ROLES.DEFAULT;
  
  return {
    ...session,
    user: {
      ...session.user,
      role: userRole,
      enabled: session.user.enabled ?? true
    }
  } as UserSession;
}

/**
 * Check if the current user has the required role (server-side)
 * @param requiredRoles Array of roles that are allowed
 * @returns boolean indicating if the user has the required role
 */
export async function userHasRole(requiredRoles: (Role | string)[]): Promise<boolean> {
  const session = await getCurrentUser();
  const userRole = session?.user?.role;
  if (!userRole) return false;
  
  return requiredRoles.some(role => 
    userRole.toLowerCase() === role.toString().toLowerCase()
  );
}

/**
 * Check if the current user has the required permissions (server-side)
 * @param requiredPermissions Array of permissions to check
 * @returns boolean indicating if the user has all required permissions
 */
export async function userCan(requiredPermissions: (keyof typeof PERMISSIONS)[]): Promise<boolean> {
  const session = await getCurrentUser();
  if (!session?.user?.role) return false;
  
  // Admins have all permissions
  if (session.user.role === ROLES.ADMIN) return true;
  
  // Map of role to their permissions
  const rolePermissions: Record<Role, (keyof typeof PERMISSIONS)[]> = {
    [ROLES.ADMIN]: Object.keys(PERMISSIONS) as (keyof typeof PERMISSIONS)[],
    [ROLES.EDITOR]: [
      'INCIDENT_VIEW',
      'INCIDENT_UPDATE',
      'INCIDENT_VERIFY',
      'STATS_VIEW',
    ] as (keyof typeof PERMISSIONS)[],
    [ROLES.USER]: [
      'INCIDENT_VIEW',
      'INCIDENT_CREATE',
      'STATS_VIEW',
    ] as (keyof typeof PERMISSIONS)[],
    [ROLES.DEFAULT]: [
      'INCIDENT_VIEW',
    ] as (keyof typeof PERMISSIONS)[],
  };
  
  const userPermissions = rolePermissions[session.user.role as Role] || [];
  return requiredPermissions.every(permission => 
    userPermissions.includes(permission)
  );
}

/**
 * Middleware to protect API routes with role-based access control
 * @param handler The API route handler
 * @param options Configuration options
 * @returns Protected API route handler
 */
export function withPermissions(
  handler: (req: any, res: any) => Promise<any> | any,
  options: {
    allowedRoles?: (Role | string)[];
    requiredPermissions?: (keyof typeof PERMISSIONS)[];
  } = {}
) {
  return async function protectedHandler(req: any, res: any) {
    // Skip permission checks for OPTIONS requests
    if (req.method === 'OPTIONS') {
      return handler(req, res);
    }
    
    const session = await getCurrentUser();
    
    // Check if user is authenticated
    if (!session?.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    // Check if user account is enabled
    if (!session.user.enabled) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account has been disabled' 
      });
    }
    
    // Check role-based access
    if (options.allowedRoles?.length) {
      const hasRole = await userHasRole(options.allowedRoles);
      if (!hasRole) {
        return res.status(403).json({ 
          success: false, 
          message: 'Insufficient permissions' 
        });
      }
    }
    
    // Check specific permissions
    if (options.requiredPermissions?.length) {
      const hasPermission = await userCan(options.requiredPermissions);
      if (!hasPermission) {
        return res.status(403).json({ 
          success: false, 
          message: 'Insufficient permissions' 
        });
      }
    }
    
    // User has required permissions, proceed to the handler
    return handler(req, res);
  };
}
