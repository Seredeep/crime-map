'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { signOut, useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect } from 'react';
import { FiInfo, FiLogIn, FiLogOut, FiSettings, FiShield, FiUser, FiX } from 'react-icons/fi';

interface MobileSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileSettingsPanel = ({ isOpen, onClose }: MobileSettingsPanelProps) => {
  const { data: session, status } = useSession();
  const t = useTranslations('Settings');
  const authT = useTranslations('Auth');

  // Prevenir scroll del body cuando el panel está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const menuItems = [
    ...(status === 'authenticated'
      ? [
          {
            icon: <FiUser className="w-5 h-5" />,
            label: t('myProfile'),
            href: '/profile',
            description: t('viewEditPersonalInfo')
          }
        ]
      : []
    ),
    {
      icon: <FiSettings className="w-5 h-5" />,
      label: t('settings'),
      href: '/settings',
      description: t('appPreferences')
    },
    {
      icon: <FiInfo className="w-5 h-5" />,
      label: t('about'),
      href: '/about',
      description: t('aboutCrimeMap')
    },
    {
      icon: <FiShield className="w-5 h-5" />,
      label: t('privacy'),
      href: '/privacy',
      description: t('privacyPolicy')
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
            onClick={onClose}
          />

          {/* Panel deslizante desde la derecha */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 200,
              duration: 0.4
            }}
            className="fixed right-0 top-0 h-full w-[100%] max-w-sm bg-gray-900/98 backdrop-blur-lg border-l border-gray-700/50 z-[250] md:hidden shadow-2xl"
          >
            {/* Header del panel */}
            <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 z-10">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <FiUser className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      {status === 'authenticated' ? 'Mi Cuenta' : 'Configuración'}
                    </h2>
                    {status === 'authenticated' && session?.user?.email && (
                      <p className="text-sm text-gray-400">{session.user.email}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all duration-200"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido del panel */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Información del usuario */}
              {status === 'authenticated' && (
                <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <FiUser className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">
                        {session?.user?.name || 'Usuario'}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {session?.user?.role === 'admin' ? 'Administrador' :
                         session?.user?.role === 'editor' ? 'Editor' : 'Usuario'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Opciones del menú */}
              <div className="space-y-2">
                {menuItems.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-gray-800/30 hover:bg-gray-700/50 text-gray-300 hover:text-white transition-all duration-200 border border-gray-700/30 hover:border-gray-600/50"
                    >
                      <div className="p-2 bg-gray-700/50 rounded-lg">
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.label}</h4>
                        <p className="text-xs text-gray-500">{item.description}</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Footer con acciones de autenticación */}
            <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700/50 p-4">
              {status === 'authenticated' ? (
                <button
                  onClick={() => {
                    signOut({ callbackUrl: '/' });
                    onClose();
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg transition-all duration-200 border border-red-600/30"
                >
                  <FiLogOut className="w-5 h-5" />
                  <span className="font-medium">{t('logout')}</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/auth/signin"
                    onClick={onClose}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200"
                  >
                    <FiLogIn className="w-5 h-5" />
                    <span className="font-medium">{authT('signIn')}</span>
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={onClose}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded-lg transition-all duration-200 border border-gray-600/50"
                  >
                    <FiUser className="w-5 h-5" />
                    <span className="font-medium">{authT('signUp')}</span>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileSettingsPanel;
