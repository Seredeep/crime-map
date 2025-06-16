'use client';

import { motion } from 'framer-motion';
import { FiList, FiUser, FiSettings, FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface MobileDynamicNavbarProps {
  activeTab: string;
  onFiltersClick?: () => void;
  onSettingsClick?: () => void;
}

const MobileDynamicNavbar = ({ 
  activeTab, 
  onFiltersClick,
  onSettingsClick 
}: MobileDynamicNavbarProps) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  // Configuración de la navbar según el tab activo
  const getNavbarConfig = () => {
    switch (activeTab) {
      case 'incidents':
        return {
          title: 'Crime Map',
          leftAction: {
            icon: <FiList className="w-6 h-6" />,
            onClick: onFiltersClick,
            label: 'Filtros'
          },
          showThemeToggle: true
        };
      case 'stats':
        return {
          title: 'Estadísticas',
          leftAction: null,
          showThemeToggle: true
        };
      case 'communities':
        return {
          title: 'Comunidad',
          leftAction: null,
          showThemeToggle: true
        };
      case 'report':
        return {
          title: 'Reportar',
          leftAction: null,
          showThemeToggle: false
        };
      case 'queue':
        return {
          title: 'Cola de Revisión',
          leftAction: null,
          showThemeToggle: true
        };
      default:
        return {
          title: 'Crime Map',
          leftAction: null,
          showThemeToggle: true
        };
    }
  };

  const config = getNavbarConfig();

  if (!mounted) return null;

  return (
    <motion.nav 
      initial={{ y: -64 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed top-0 left-0 right-0 z-[130] md:hidden bg-gray-900/95 backdrop-blur-lg border-b border-gray-700/50 shadow-lg"
    >
      <div className="flex items-center justify-between h-16 px-4">
        {/* Lado izquierdo - Acción contextual o logo */}
        <div className="flex items-center">
          {config.leftAction ? (
            <motion.button
              onClick={config.leftAction.onClick}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300 transition-all duration-200"
              aria-label={config.leftAction.label}
            >
              {config.leftAction.icon}
            </motion.button>
          ) : (
            <Link href="/" className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
          )}
        </div>

        {/* Centro - Título */}
        <motion.h1 
          key={config.title}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-lg font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent"
        >
          {config.title}
        </motion.h1>

        {/* Lado derecho - Controles */}
        <div className="flex items-center space-x-2">
          {/* Toggle de tema */}
          {config.showThemeToggle && (
            <motion.button
              onClick={toggleTheme}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-full text-blue-400 hover:bg-blue-900/40 hover:text-blue-300 transition-all duration-200"
              aria-label="Cambiar tema"
            >
              {theme === 'dark' ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
            </motion.button>
          )}

          {/* Botón de configuración/usuario */}
          <motion.button
            onClick={onSettingsClick}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-full bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 hover:text-white transition-all duration-200"
            aria-label="Configuración"
          >
            <FiUser className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Indicador de progreso/estado */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600"
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
    </motion.nav>
  );
};

export default MobileDynamicNavbar; 