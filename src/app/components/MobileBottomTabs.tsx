'use client';

import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import {
  FiActivity,
  FiCheckCircle,
  FiCompass,
  FiSettings,
  FiUsers
} from 'react-icons/fi';
interface MobileBottomTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onReportClick: () => void;
  status: string;
  availableTabs: string[];
}

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  requiresAuth?: boolean;
  adminOnly?: boolean;
}

const MobileBottomTabs = ({
  activeTab,
  onTabChange,
  onReportClick,
  status,
  availableTabs
}: MobileBottomTabsProps) => {
  const { data: session } = useSession();
  const t = useTranslations('Sidebar');
  const tNavbar = useTranslations('Navbar');

  const allTabs: TabItem[] = useMemo(() => [
    {
      id: 'incidents',
      label: t('map'),
      icon: <FiCompass className="w-5 h-5" />
    },
    {
      id: 'stats',
      label: t('stats'),
      icon: <FiActivity className="w-5 h-5" />
    },
    {
      id: 'communities',
      label: t('communities'),
      icon: <FiUsers className="w-5 h-5" />
    },
    {
      id: 'profile',
      label: session?.user?.role === 'admin' || session?.user?.role === 'editor' ? t('admin') : t('settings'),
      icon: session?.user?.role === 'admin' || session?.user?.role === 'editor' ?
        <FiCheckCircle className="w-5 h-5" /> : <FiSettings className="w-5 h-5" />,
      requiresAuth: true
    }
  ], [session?.user?.role, t]);

  // Filtrar tabs disponibles y verificar autenticación
  const visibleTabs = useMemo(() => {
    return allTabs.filter(tab => {
      // Verificar si el tab está en la lista de tabs disponibles (excepto profile que siempre se muestra si está autenticado)
      if (tab.id !== 'profile' && !availableTabs.includes(tab.id)) return false;

      // Si requiere autenticación, verificar que el usuario esté autenticado
      if (tab.requiresAuth && status !== 'authenticated') return false;

      return true;
    });
  }, [allTabs, availableTabs, status]);

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] md:hidden h-20">
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(20, 20, 20, 1) 0%, rgba(15, 15, 15, 1) 100%)',
          boxShadow: '0 1px 20px rgba(0, 0, 0, 0.5)'
        }}
      />

      {/* Tab container */}
      <div className="relative px-3 py-3 h-full flex items-center">
        <div className="flex items-center justify-around w-full">
          {visibleTabs.map((tab, index) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className="relative flex flex-col items-center justify-center p-2 min-w-[65px] transition-all duration-300"
              >
                {/* Active indicator mejorado con layoutId único */}
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute -top-1 left-1/2 w-10 h-1 rounded-full"
                  style={{
                    background: isActive ? 'linear-gradient(90deg, #FFFFFF 0%, #F3F4F6 100%)' : 'transparent',
                    boxShadow: isActive ? '0 0 8px rgba(255, 255, 255, 0.4)' : 'none',
                    x: '-50%'
                  }}
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    duration: 0.3
                  }}
                />

                {/* Icon container mejorado */}
                <motion.div
                  className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300 relative overflow-hidden ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                  style={isActive ? {
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(243, 244, 246, 0.1) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 4px 12px rgba(255, 255, 255, 0.1)'
                  } : {
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    scale: isActive ? 1.05 : 1,
                    y: isActive ? -2 : 0
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25
                  }}
                >
                  {tab.icon}

                  {/* Efecto de brillo para tab activo */}
                  {isActive && (
                    <div
                      className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent rounded-xl"
                    />
                  )}
                </motion.div>

                {/* Label mejorado */}
                <motion.span
                  className={`text-xs font-medium mt-1.5 transition-all duration-300 ${
                    isActive
                      ? 'text-white font-semibold'
                      : 'text-gray-500'
                  }`}
                  style={isActive ? {
                    textShadow: '0 0 4px rgba(255, 255, 255, 0.3)'
                  } : {}}
                  animate={{
                    opacity: isActive ? 1 : 0.8,
                    y: isActive ? -1 : 0
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {tab.label}
                </motion.span>

                {/* Ripple effect on tap mejorado */}
                <motion.div
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%)'
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  whileTap={{
                    scale: 1.3,
                    opacity: [0, 0.4, 0],
                    transition: { duration: 0.4 }
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Safe area padding for devices with home indicator */}
      <div
        className="h-safe-area-inset-bottom"
        style={{
          background: 'rgba(0, 0, 0, 0.98)'
        }}
      />
    </div>
  );
};

export default MobileBottomTabs;
