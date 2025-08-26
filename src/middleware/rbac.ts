import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { ROLES, hasRequiredRole, isRole } from '@/lib/config/roles';

// Route to role mapping
const routePermissions = {
  '^/api/admin/': [ROLES.ADMIN],
  '^/api/incidents/verify': [ROLES.EDITOR, ROLES.ADMIN],
  '^/api/incidents/\\w+/status': [ROLES.EDITOR, ROLES.ADMIN],
  '^/api/incidents': [ROLES.USER, ROLES.EDITOR, ROLES.ADMIN],
  '^/api/profile': [ROLES.USER, ROLES.EDITOR, ROLES.ADMIN],
} as const;

export async function rbacMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip non-API and public routes
  if (!pathname.startsWith('/api') || 
      ['/api/auth', '/api/register', '/api/health'].some(r => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });
  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Authentication required' },
      { status: 401 }
    );
  }

  const userRole = token.role as string;
  if (!isRole(userRole)) {
    return NextResponse.json(
      { success: false, message: 'Invalid user role' },
      { status: 403 }
    );
  }

  // Find matching route pattern
  const requiredRoles = Object.entries(routePermissions).find(([pattern]) => 
    new RegExp(pattern).test(pathname)
  )?.[1] || [ROLES.USER];

  if (!hasRequiredRole(userRole, requiredRoles)) {
    return NextResponse.json(
      { success: false, message: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  return NextResponse.next();
}
