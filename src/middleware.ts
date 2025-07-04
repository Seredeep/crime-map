// src/middleware.ts
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

// ───────── CONFIG ───────────────────────────
const authPages = ['/login', '/register'];       // ajusta si usas otras
const apiRouteExempt = '/api/device/alert';      // ← botón de pánico
// ─────────────────────────────────────────────

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /* 1. Dejar pasar la ruta del botón TAL CUAL */
  if (pathname === apiRouteExempt) {
    return NextResponse.next();
  }

  /* 2. Permitir páginas públicas sin sesión */
  if (authPages.includes(pathname)) {
    return NextResponse.next();
  }

  /* 3. Para todo lo demás, exige token (NextAuth) */
  const token = await getToken({ req });
  if (!token) {
    // Si es API → 401; si es página → redirect a /login
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      );
    }

    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/* Opcional: limitar a rutas concretas
export const config = {
  matcher: ['/((?!_next/).*)'],   // protege todo salvo archivos estáticos
};
*/
