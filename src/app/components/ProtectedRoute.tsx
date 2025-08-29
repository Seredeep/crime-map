'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { ROLES } from '@/lib/config/roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Required roles to access the route */
  allowedRoles?: (keyof typeof ROLES)[];
  /** Required permissions to access the route */
  requiredPermissions?: string[];
  /** Whether to show a loading state while checking permissions */
  showLoading?: boolean;
  /** Custom unauthorized component */
  unauthorizedComponent?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
  requiredPermissions = [],
  showLoading = true,
  unauthorizedComponent,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('Auth');
  const { 
    hasRole, 
    can, 
    isAuthenticated, 
    isLoading 
  } = usePermissions();

  // Redirect to signin if not authenticated (except for onboarding)
  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/onboarding') {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  // Allow access to onboarding page
  if (pathname === '/onboarding') {
    return <>{children}</>;
  }

  // Show loading state if needed
  if ((isLoading && showLoading) || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Check if user has required roles
  const hasRequiredRole = allowedRoles.length === 0 || hasRole(allowedRoles);
  
  // Check if user has required permissions
  const hasRequiredPermissions = requiredPermissions.length === 0 || 
    requiredPermissions.every(permission => can(permission as any));

  // If user doesn't have required roles or permissions
  if (!hasRequiredRole || !hasRequiredPermissions) {
    if (unauthorizedComponent) {
      return <>{unauthorizedComponent}</>;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold text-white mb-4">{t('accessDenied')}</h2>
          <div className="p-4 bg-yellow-500 text-white rounded-md">
            {t('accessDeniedError')}
          </div>
        </div>
      </div>
    );
  }

  // If we get here, the user is authenticated and has the required roles/permissions
  return <>{children}</>;

};

export default ProtectedRoute;
