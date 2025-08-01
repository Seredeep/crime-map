'use client';

import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('Auth');

  useEffect(() => {
    if (status === 'unauthenticated' && pathname !== '/onboarding') {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  // Si estamos en la página de onboarding, permitimos el acceso
  if (pathname === '/onboarding') {
    return <>{children}</>;
  }

  // Mientras se verifica la sesión, mostramos un indicador de carga
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <p className="mt-2 text-white">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Si no hay sesión, no mostramos nada mientras se redirige
  if (!session) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold text-white mb-4">{t('accessDenied')}</h2>
          <div className="p-4 bg-red-500 text-white rounded-md">
            {t('noPermissions')}
          </div>
        </div>
      </div>
    );
  }

  if (!session.user.enabled) {
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

  return <>{children}</>;
};

export default ProtectedRoute;
