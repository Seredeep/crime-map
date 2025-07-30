import { getToken } from 'next-auth/jwt';
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

// Crear el middleware de i18n
const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Definir rutas públicas que no requieren autenticación
  const publicRoutes = [
    '/api/auth',
    '/api/register',
    '/api/user/onboarding',
    '/api/neighborhoods',
    '/api/geocode'
  ];

  // Verificar si es una ruta pública (API)
  const isPublicApiRoute = publicRoutes.some(route =>
    pathname.startsWith(route) || pathname === route
  );

  // Si es una ruta de API pública, permitir acceso directo sin i18n
  if (isPublicApiRoute) {
    return NextResponse.next();
  }

  // Para rutas que no son API, aplicar primero el middleware de i18n
  if (!pathname.startsWith('/api')) {
    const intlResponse = intlMiddleware(request);

    // Si el middleware de i18n retorna una respuesta (redirect), retornarla
    if (intlResponse instanceof Response && intlResponse.status !== 200) {
      return intlResponse;
    }

    // Actualizar el pathname para incluir el locale
    const locale = request.nextUrl.pathname.split('/')[1];
    const pathnameWithoutLocale = request.nextUrl.pathname.slice(locale.length + 1) || '/';

    // Verificar rutas de autenticación con locale
    const isAuthPage = pathnameWithoutLocale.startsWith('/auth');
    const isOnboardingPage = pathnameWithoutLocale === '/onboarding' || pathnameWithoutLocale === '/onboarding/';

    // Si es página de auth u onboarding, permitir acceso
    if (isAuthPage || isOnboardingPage) {
      return intlResponse || NextResponse.next();
    }

    // Verificar autenticación para páginas protegidas
    const token = await getToken({ req: request });

    // Si no hay token y no está en página de auth, redirigir a signin
    if (!token && !isAuthPage) {
      const url = new URL(`/${locale}/auth/signin`, request.url);
      url.searchParams.set('callbackUrl', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Si está autenticado pero no ha completado onboarding
    if (token && token.onboarded === false && !isOnboardingPage && !isAuthPage) {
      console.log('🔀 Redirigiendo al onboarding:', {
        pathname: pathnameWithoutLocale,
        onboarded: token.onboarded,
        isOnboardingPage
      });
      return NextResponse.redirect(new URL(`/${locale}/onboarding`, request.url));
    }

    // Si ya completó onboarding y trata de acceder a onboarding
    if (token && token.onboarded === true && isOnboardingPage) {
      console.log('🔀 Redirigiendo a la página principal desde onboarding');
      return NextResponse.redirect(new URL(`/${locale}/`, request.url));
    }

    return intlResponse || NextResponse.next();
  }

  // Para rutas de API no públicas, verificar autenticación
  const token = await getToken({ req: request });
  if (!token) {
    return NextResponse.json(
      { success: false, message: 'No autorizado' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
