'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
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

  const allTabs: TabItem[] = [
    {
      id: 'incidents',
      label: 'Mapa',
      icon: <FiCompass className="w-5 h-5" />
    },
    {
      id: 'stats',
      label: 'Estadísticas',
      icon: <FiActivity className="w-5 h-5" />
    },
    {
      id: 'communities',
      label: 'Comunidades',
      icon: <FiUsers className="w-5 h-5" />
    },
    {
      id: 'profile',
      label: session?.user?.role === 'admin' || session?.user?.role === 'editor' ? 'Admin' : 'Configuración',
      icon: session?.user?.role === 'admin' || session?.user?.role === 'editor' ?
        <FiCheckCircle className="w-5 h-5" /> : <FiSettings className="w-5 h-5" />,
      requiresAuth: true
    }
  ];

  // Filtrar tabs disponibles y verificar autenticación
  const visibleTabs = useMemo(() => {
    return allTabs.filter(tab => {
      // Verificar si el tab está en la lista de tabs disponibles (excepto profile que siempre se muestra si está autenticado)
      if (tab.id !== 'profile' && !availableTabs.includes(tab.id)) return false;

      // Si requiere autenticación, verificar que el usuario esté autenticado
      if (tab.requiresAuth && status !== 'authenticated') return false;

      return true;
    });
  }, [allTabs, availableTabs, status, session?.user?.role]);

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] md:hidden h-20">
      {/* Backdrop blur effect mejorado */}
      <div
        className="absolute inset-0 border-t"
        style={{
          background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.95) 0%, rgba(30, 41, 59, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          borderColor: 'rgba(139, 181, 255, 0.15)'
        }}
      />

      {/* Tab container */}
      <div className="relative px-3 py-3 h-full flex items-center">
        <div className="flex items-center justify-around w-full">
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className="relative flex flex-col items-center justify-center p-2 min-w-[65px] transition-all duration-300"
              >
                {/* Active indicator mejorado */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -top-1 left-1/2 w-10 h-1 rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, #8BB5FF 0%, #B5CCF4 100%)',
                        boxShadow: '0 0 8px rgba(139, 181, 255, 0.6)',
                        x: '-50%'
                      }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                        duration: 0.3
                      }}
                    />
                  )}
                </AnimatePresence>

                {/* Icon container mejorado */}
                <motion.div
                  className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300 relative overflow-hidden ${
                    isActive
                      ? 'text-[#B5CCF4]'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                  style={isActive ? {
                    background: 'linear-gradient(135deg, rgba(139, 181, 255, 0.15) 0%, rgba(181, 204, 244, 0.1) 100%)',
                    border: '1px solid rgba(139, 181, 255, 0.3)',
                    boxShadow: '0 4px 12px rgba(139, 181, 255, 0.1)'
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
                      ? 'text-[#B5CCF4] font-semibold'
                      : 'text-gray-500'
                  }`}
                  style={isActive ? {
                    textShadow: '0 0 4px rgba(181, 204, 244, 0.3)'
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
                    background: 'radial-gradient(circle, rgba(139, 181, 255, 0.2) 0%, transparent 70%)'
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
          background: 'rgba(30, 41, 59, 0.98)'
        }}
      />
    </div>
  );
};

export default MobileBottomTabs;
