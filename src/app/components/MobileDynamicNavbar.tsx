'use client';

import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

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
  const { status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Configuración de la navbar según el tab activo
  const getNavbarConfig = () => {
    switch (activeTab) {
      case 'incidents':
        return {
          title: 'Claridad',
          leftAction: null,
          showThemeToggle: true
        };
      case 'stats':
        return {
          title: 'Claridad',
          leftAction: null,
          showThemeToggle: true
        };
      case 'communities':
        return {
          title: 'Claridad',
          leftAction: null,
          showThemeToggle: true
        };
      case 'report':
        return {
          title: 'Claridad',
          leftAction: null,
          showThemeToggle: false
        };
      case 'queue':
        return {
          title: 'Claridad',
          leftAction: null,
          showThemeToggle: true
        };
      default:
        return {
          title: 'Claridad',
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
      className="fixed top-0 left-0 right-0 z-[130] md:hidden bg-[#040910] backdrop-blur-lg shadow-lg"
    >
      <div className="flex items-center justify-between h-16 px-4">
        {/* Lado izquierdo - Logo de Claridad */}
        <div className="flex items-center space-x-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="ml-2 font-manrope text-xl font-semibold text-[#B5CCF4]">
              Claridad
            </span>
          </motion.div>

        </div>

        {/* Lado derecho - Vacío por ahora */}
        <div className="flex items-center space-x-2">
          {/* Espacio reservado para futuros botones */}
        </div>
      </div>

      {/* Indicador de progreso/estado */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5"
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
    </motion.nav>
  );
};

export default MobileDynamicNavbar;
