import { getToken } from 'next-auth/jwt';
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { rbacMiddleware } from './middleware/rbac';

// Crear el middleware de i18n
const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/api/auth',
    '/api/register',
    '/api/user/onboarding',
    '/api/neighborhoods',
    '/api/geocode'
  ];

  // Check if it's a public route (API)
  const isPublicApiRoute = publicRoutes.some(route =>
    pathname.startsWith(route) || pathname === route
  );

  // If it's a public API route, allow direct access without i18n
  if (isPublicApiRoute) {
    return NextResponse.next();
  }

  // Redirect root to /en/ by default
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/en/', request.url));
  }

  // Para rutas que no son API, aplicar primero el middleware de i18n
  if (!pathname.startsWith('/api')) {
    const intlResponse = intlMiddleware(request);

    // Si el middleware de i18n retorna una respuesta (redirect), retornarla
    if (intlResponse instanceof Response && intlResponse.status !== 200) {
      return intlResponse as NextResponse;
    }

    // Detectar correctamente el locale del pathname
    // Si el primer segmento NO es un locale soportado, usar defaultLocale
    const segments = request.nextUrl.pathname.split('/');
    const firstSegment = segments[1] || '';
    const supportedLocales = routing.locales as readonly string[];
    const hasValidLocale = supportedLocales.includes(firstSegment);
    const locale = hasValidLocale ? firstSegment : routing.defaultLocale;
    const pathnameWithoutLocale = hasValidLocale
      ? request.nextUrl.pathname.slice(firstSegment.length + 1) || '/'
      : request.nextUrl.pathname;

    // Check authentication routes with locale
    const isAuthPage = pathnameWithoutLocale.startsWith('/auth');
    const isOnboardingPage = pathnameWithoutLocale === '/onboarding' || pathnameWithoutLocale === '/onboarding/';

    // If it's auth or onboarding page, allow access
    if (isAuthPage || isOnboardingPage) {
      return (intlResponse as NextResponse) || NextResponse.next();
    }

    // Check authentication for protected pages
    const token = await getToken({ req: request });

    // If no token and not on auth page, redirect to signin
    if (!token && !isAuthPage) {
      const url = new URL(`/${locale}/auth/signin`, request.url);
      url.searchParams.set('callbackUrl', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // If authenticated but hasn't completed onboarding
    if (token && (token as any).onboarded === false && !isOnboardingPage && !isAuthPage) {
      console.log('🔀 Redirigiendo al onboarding:', {
        pathname: pathnameWithoutLocale,
        onboarded: (token as any).onboarded,
        isOnboardingPage
      });
      return NextResponse.redirect(new URL(`/${locale}/onboarding`, request.url));
    }

    // Si ya completó onboarding y trata de acceder a onboarding
    if (token && (token as any).onboarded === true && isOnboardingPage) {
      console.log('🔀 Redirecting to main page from onboarding');
      return NextResponse.redirect(new URL(`/${locale}/`, request.url));
    }

    return (intlResponse as NextResponse) || NextResponse.next();
  }

  // Apply RBAC middleware for API routes
  return rbacMiddleware(request);
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
