'use client';

import { usePathname, useRouter } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { useTransition } from 'react';

interface LanguageSelectorProps {
  className?: string;
}

export default function LanguageSelector({ className = '' }: LanguageSelectorProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLanguageChange = (newLocale: 'es' | 'en') => {
    if (newLocale === locale) return;

    startTransition(() => {
      // Las funciones de navegación de next-intl manejan automáticamente los locales
      router.replace(pathname, { locale: newLocale });
    });
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2 bg-gray-800/50 backdrop-blur-sm rounded-lg p-2 border border-gray-700/50">
        <button
          onClick={() => handleLanguageChange('es')}
          disabled={isPending}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
            locale === 'es'
              ? 'bg-blue-500 text-white shadow-md'
              : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
          } ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          🇪🇸 ES
        </button>

        <div className="w-px h-6 bg-gray-600"></div>

        <button
          onClick={() => handleLanguageChange('en')}
          disabled={isPending}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
            locale === 'en'
              ? 'bg-blue-500 text-white shadow-md'
              : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
          } ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          🇺🇸 EN
        </button>
      </div>

      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/30 backdrop-blur-sm rounded-lg">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
