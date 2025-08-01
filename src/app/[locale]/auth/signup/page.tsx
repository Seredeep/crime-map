'use client';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignUp() {
  const router = useRouter();
  const t = useTranslations('Auth');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [redirectCountdown, setRedirectCountdown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reiniciamos los mensajes
    setError('');
    setSuccess('');

    // Validación básica
    if (!email || !password || !confirmPassword) {
      setError(t('pleaseCompleteFields'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordsDontMatch'));
      return;
    }

    if (password.length < 8) {
      setError(t('passwordTooShort'));
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('registrationError'));
      }

      // Registro exitoso
      setSuccess(data.message || t('registrationSuccess'));
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      // Iniciar contador de redirección
      setRedirectCountdown(3);
      const countdownInterval = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            router.push('/auth/signin');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: Error | unknown) {
      setError(error instanceof Error ? error.message : t('unexpectedError'));
    } finally {
      setLoading(false);
    }
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
              {t('signUpTitle')}
            </h2>
            <p className="text-gray-400 text-sm">
              {t('signUpSubtitle')}
            </p>
          </div>

          {/* Mensajes de estado */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-300 text-center rounded-xl animate-pulse">
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 text-green-300 text-center rounded-xl">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">{success}</span>
                </div>
                {redirectCountdown > 0 && (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="flex items-center space-x-2 text-xs text-green-400">
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>{t('redirectingToLogin', { countdown: redirectCountdown })}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push('/auth/signin')}
                      className="text-xs text-orange-400 hover:text-orange-300 underline transition-colors"
                    >
                      {t('goNow')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Aviso de aprobación */}
          <div className="mb-4 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 text-yellow-300 text-center rounded-xl">
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">
                {t('approvalNotice')}
              </span>
            </div>
          </div>

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
                    autoComplete="new-password"
                    required
                    className="appearance-none relative block w-full pl-12 pr-4 py-4 border border-gray-700 bg-gray-800/50 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-300 sm:text-sm group-hover:border-gray-600"
                    placeholder={t('passwordMinPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Confirmar contraseña */}
              <div className="group">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2 group-focus-within:text-orange-400 transition-colors">
                  {t('confirmPassword')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className={`h-5 w-5 transition-all duration-300 ${
                      confirmPassword ? 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]' : 'text-gray-400 blur-sm group-focus-within:text-orange-400 group-focus-within:blur-none'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="appearance-none relative block w-full pl-12 pr-4 py-4 border border-gray-700 bg-gray-800/50 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-300 sm:text-sm group-hover:border-gray-600"
                    placeholder={t('confirmPasswordPlaceholder')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  boxShadow: '0 0 20px rgba(234, 88, 12, 0.3)',
                }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{t('creatingAccount')}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span>{t('createAccount')}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Enlace de login */}
          <div className="text-center mt-8 pt-6 border-t border-gray-800">
            <p className="text-sm text-gray-400">
              {t('alreadyHaveAccount')}{' '}
              <Link
                href="/auth/signin"
                className="font-medium text-orange-400 hover:text-orange-300 transition-colors duration-200 hover:underline"
              >
                {t('signInHere')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
