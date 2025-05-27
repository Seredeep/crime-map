'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LogsView from '@/app/components/LogsView';
import { ROLES, hasRequiredRole, Role } from '@/lib/config/roles';

export default function LogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirigir si no hay sesión o si el usuario no es admin
  if (status === 'unauthenticated') {
    router.push('/auth/signin?callbackUrl=/admin/logs');
    return null;
  }

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

  if (!session || !hasRequiredRole(session.user.role as Role, [ROLES.ADMIN])) {
    router.push('/');
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Registro de Actividad</h1>
        <LogsView />
      </div>
    </main>
  );
} 