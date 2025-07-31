'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const errorMessages: Record<string, string> = {
  'Configuration': 'Error de configuración en el servidor.',
  'AccessDenied': 'Tu cuenta está pendiente de aprobación por un administrador.',
  'Verification': 'El enlace de verificación ha expirado o ya ha sido utilizado.',
  'Default': 'Ha ocurrido un error durante la autenticación.'
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Default';

  const errorMessage = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Error de Autenticación
          </h2>
          <div className="mt-4 p-4 bg-red-500 text-white rounded-md">
            {errorMessage}
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Volver al Inicio
          </Link>
          <Link
            href="/auth/signin"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#00e381] hover:bg-[#4fd691] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00e381]"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-lg shadow-lg">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00e381]"></div>
          </div>
          <h2 className="text-center text-xl font-bold text-white">Cargando...</h2>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
