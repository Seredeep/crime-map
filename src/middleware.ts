import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Definir rutas públicas ANTES de cualquier verificación
  const publicRoutes = [
    '/api/auth',
    '/api/register',
    '/api/user/onboarding',
    '/api/neighborhoods',
    '/api/geocode'
  ];

  const isPublicRoute = publicRoutes.some(route =>
    pathname.startsWith(route) || pathname === route
  );

  const isAuthPage = pathname.startsWith('/auth');
  const isOnboardingPage = pathname === '/onboarding' || pathname === '/onboarding/';

  // Permitir acceso a rutas públicas inmediatamente
  if (isPublicRoute || isAuthPage || isOnboardingPage) {
    return NextResponse.next();
  }

  // Para todas las demás rutas, verificar autenticación
  const token = await getToken({ req: request });

  // Si es una ruta de API y no hay token
  if (pathname.startsWith('/api') && !token) {
    return NextResponse.json(
      { success: false, message: 'No autorizado' },
      { status: 401 }
    );
  }

  // Si el usuario no está autenticado y no está en una página de auth
  if (!token && !isAuthPage) {
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Si el usuario está autenticado pero no ha completado el onboarding
  // Solo redirigir si no está ya en la página de onboarding
  if (token && token.onboarded === false && !isOnboardingPage && !isAuthPage) {
    console.log('🔀 Redirigiendo al onboarding:', {
      pathname,
      onboarded: token.onboarded,
      isOnboardingPage
    });
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // Si el usuario ya completó el onboarding y trata de acceder a la página de onboarding
  if (token && token.onboarded === true && isOnboardingPage) {
    console.log('🔀 Redirigiendo a la página principal desde onboarding');
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
