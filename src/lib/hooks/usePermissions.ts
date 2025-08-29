import { useSession } from 'next-auth/react';
import { 
  ROLES, 
  hasRequiredRole, 
  isRole, 
  PERMISSIONS,
  type Role,
  can as canUser
} from '@/lib/config/roles';

type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Hook to check user permissions in React components
 * @returns Object with permission checking utilities
 */
export function usePermissions() {
  const { data: session, status } = useSession();
  
  // Check if user has a specific role
  const hasRole = (requiredRoles: (Role | string)[]): boolean => {
    if (status !== 'authenticated' || !session?.user?.role) return false;
    return hasRequiredRole(session.user.role as Role, requiredRoles as Role[]);
  };

  // Check if user has a specific permission
  const can = (...permissions: (Permission | string)[]): boolean => {
    if (status !== 'authenticated' || !session?.user?.role) return false;
    return canUser(session.user.role as Role, ...permissions as Permission[]);
  };

  // Get all user permissions
  const getPermissions = (): Permission[] => {
    if (status !== 'authenticated' || !session?.user?.role) return [];
    
    // Use the role from the session, defaulting to 'default' if not set
    const userRole = session.user.role as Role || ROLES.DEFAULT;
    
    // Get permissions for the user's role
    const rolePermissions = [
      PERMISSIONS.INCIDENT_VIEW,
      PERMISSIONS.STATS_VIEW
    ];
    
    // Add role-specific permissions
    if (hasRequiredRole(userRole, [ROLES.ADMIN])) {
      return Object.values(PERMISSIONS);
    }
    
    if (hasRequiredRole(userRole, [ROLES.EDITOR])) {
      return [
        ...rolePermissions,
        PERMISSIONS.INCIDENT_UPDATE,
        PERMISSIONS.INCIDENT_VERIFY
      ];
    }
    
    if (hasRequiredRole(userRole, [ROLES.USER])) {
      return [...rolePermissions, PERMISSIONS.INCIDENT_CREATE];
    }
    
    return rolePermissions;
  };

  const userRole = session?.user?.role as Role | undefined;
  
  return {
    hasRole,
    can,
    getPermissions,
    isAdmin: userRole ? hasRequiredRole(userRole, [ROLES.ADMIN]) : false,
    isEditor: userRole ? hasRequiredRole(userRole, [ROLES.EDITOR, ROLES.ADMIN]) : false,
    isUser: userRole ? hasRequiredRole(userRole, [ROLES.USER, ROLES.EDITOR, ROLES.ADMIN]) : false,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
}
