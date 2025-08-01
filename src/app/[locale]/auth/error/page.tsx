'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { useTranslations } from 'next-intl';

function ErrorContent() {
  const searchParams = useSearchParams();
  const t = useTranslations('Auth');
  const error = searchParams.get('error') || 'Default';

  const errorMessages: Record<string, string> = {
    'Configuration': t('configurationError'),
    'AccessDenied': t('accessDeniedError'),
    'Verification': t('verificationError'),
    'Default': t('defaultAuthError'),
    'ACCOUNT_PENDING_APPROVAL': t('accessDeniedError')
  };

  const errorMessage = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            {t('authErrorTitle')}
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
            {t('backToHome')}
          </Link>
          <Link
            href="/auth/signin"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {t('signIn')}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorFallback() {
  const t = useTranslations('Auth');
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-lg shadow-lg">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <h2 className="text-center text-xl font-bold text-white">{t('loading')}</h2>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<ErrorFallback />}>
      <ErrorContent />
    </Suspense>
  );
} 