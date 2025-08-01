'use client';

import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');
  const t = useTranslations('Auth');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación básica
    if (!email || !password) {
      setErrorMsg(t('pleaseCompleteFields'));
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setErrorMsg(result.error);
        setLoading(false);
        return;
      }

      // Si el inicio de sesión es exitoso, redirigimos al usuario
      router.push(callbackUrl);
    } catch (error) {
      console.error('Error durante el inicio de sesión:', error);
      setErrorMsg(t('unexpectedError'));
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden">

      <div className="max-w-md w-full relative z-10">
        <div className="bg-gray-900/80 p-8 rounded-2xl shadow-2xl border border-gray-800/50">
          {/* Logo y Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-2">
              <Image
                src="/icons/clari.svg"
                alt="Claridad Logo"
                width={180}
                height={180}
                className="h-28 w-28 object-contain"
                priority
              />
            </div>
            <h2 className="text-2xl font-semibold text-gray-100 mb-2">
              {t('signInTitle')}
            </h2>
            <p className="text-gray-400 text-sm">
              {t('signInSubtitle')}
            </p>
          </div>
                    {/* Mensajes de estado */}
          {(error || errorMsg) && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 text-red-300 text-center rounded-xl animate-pulse">
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{error === 'CredentialsSignin'
                  ? t('invalidCredentials')
                  : error === 'AccessDenied'
                  ? t('accountPending')
                  : errorMsg || t('signInError')}</span>
              </div>
            </div>
          )}

          {/* Formulario */}
          <form className="space-y-6" onSubmit={handleSubmit} autoComplete="on">
            <div className="space-y-4">
              {/* Email */}
              <div className="group">
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2 group-focus-within:text-orange-400 transition-colors">
                  {t('email')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className={`h-5 w-5 transition-all duration-300 ${
                      email ? 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]' : 'text-gray-400 blur-sm group-focus-within:text-orange-400 group-focus-within:blur-none'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    required
                    className="appearance-none relative block w-full pl-12 pr-4 py-4 border border-gray-700 bg-gray-800/50 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-300 sm:text-sm group-hover:border-gray-600"
                    placeholder={t('emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div className="group">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2 group-focus-within:text-orange-400 transition-colors">
                  {t('password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className={`h-5 w-5 transition-all duration-300 ${
                      password ? 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]' : 'text-gray-400 blur-sm group-focus-within:text-orange-400 group-focus-within:blur-none'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="appearance-none relative block w-full pl-12 pr-4 py-4 border border-gray-700 bg-gray-800/50 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-300 sm:text-sm group-hover:border-gray-600"
                    placeholder={t('passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Botón de envío */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                )}
                {t('signInButton')}
              </button>
            </div>
        </form>

          {/* Separador */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700/50"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-900/80 text-gray-400">{t('orContinueWith')}</span>
            </div>
          </div>

          {/* Botón de Google */}
          <div>
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex justify-center py-4 px-4 border border-gray-700/50 rounded-xl shadow-sm text-sm font-medium text-white bg-gray-800/50 hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                  <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                  <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                </g>
              </svg>
              {t('continueWithGoogle')}
            </button>
          </div>
        </div>

        {/* Enlace de registro */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-400">
            {t('noAccount')}{' '}
            <Link href="/auth/signup" className="font-medium text-orange-400 hover:text-orange-300 transition-colors duration-200">
              {t('registerHere')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function SignInFallback() {
  const t = useTranslations('Auth');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-md w-full relative z-10">
        <div className="bg-gray-900/80 p-8 rounded-2xl shadow-2xl border border-gray-800/50">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-2">
              <Image
                src="/icons/clari.svg"
                alt="Claridad Logo"
                width={180}
                height={180}
                className="h-28 w-28 object-contain"
                priority
              />
            </div>
            <h2 className="text-2xl font-semibold text-gray-100 mb-2">
              {t('loading')}
            </h2>
            <div className="flex justify-center mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInForm />
    </Suspense>
  );
}
