import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isOnboardingPage = request.nextUrl.pathname === '/onboarding';
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  const isPublicApiRoute = request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname === '/api/register' ||
    request.nextUrl.pathname === '/api/user/onboarding' ||
    request.nextUrl.pathname === '/api/neighborhoods';

  // Permitir acceso a rutas públicas
  if (isPublicApiRoute || isAuthPage || isOnboardingPage) {
    return NextResponse.next();
  }

  if (isApiRoute && !token) {
    return NextResponse.json(
      { success: false, message: 'No autorizado' },
      { status: 401 }
    );
  }

  // Si el usuario no está autenticado y no está en una página de auth
  if (!token && !isAuthPage) {
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Si el usuario está autenticado pero no ha completado el onboarding
  if (token && token.onboarded === false && !isOnboardingPage && !isAuthPage) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // Si el usuario ya completó el onboarding y trata de acceder a la página de onboarding
  if (token && token.onboarded === true && isOnboardingPage) {
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
