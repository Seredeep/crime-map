'use client';

import { motion } from 'framer-motion';
import { FiList, FiUser, FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

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

  // Configuración de la navbar según el tab activo
  const getNavbarConfig = () => {
    switch (activeTab) {
      case 'incidents':
        return {
          title: 'Claridad',
          leftAction: {
            icon: <FiList className="w-6 h-6" />,
            onClick: onFiltersClick,
            label: 'Filtros'
          },
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
      className="fixed top-0 left-0 right-0 z-[130] md:hidden bg-[#040910] backdrop-blur-lg  shadow-lg"
    >
      <div className="flex items-center justify-between h-16 px-4">

        {/* Centro - Título */}
        <motion.h1
          key={config.title}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="font-manrope text-2xl font-semibold text-[#B5CCF4] "
          style={{
            textShadow: '0 0 12px rgba(140,200,255,0.8))'
          }}
        >

          {config.title}
        </motion.h1>

        {/* Lado derecho - Controles */}
        <div className="flex items-center space-x-2">
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
        className="absolute bottom-0 left-0 h-0.5 "
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
    </motion.nav>
  );
};

export default MobileDynamicNavbar;
