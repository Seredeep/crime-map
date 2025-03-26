'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Si la autenticación ha terminado de cargar y no hay sesión
    if (status === 'unauthenticated') {
      // Guardamos la ruta actual para redirigir después del login
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  // Mientras se verifica la sesión, mostramos un indicador de carga
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <p className="mt-2 text-white">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si el usuario está autenticado, mostramos el contenido protegido
  if (status === 'authenticated') {
    return <>{children}</>;
  }

  // Este return es solo para TypeScript, nunca se ejecuta realmente
  // debido al redireccionamiento en el useEffect
  return null;
} 