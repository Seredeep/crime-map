'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FiMap, FiBarChart2, FiUsers, FiAlertTriangle, FiList, FiUser, FiHome } from 'react-icons/fi';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

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
      icon: <FiMap className="w-5 h-5" /> 
    },
    { 
      id: 'stats', 
      label: 'Stats', 
      icon: <FiBarChart2 className="w-5 h-5" /> 
    },
    { 
      id: 'communities', 
      label: 'Comunidad', 
      icon: <FiUsers className="w-5 h-5" /> 
    },
    { 
      id: 'queue', 
      label: 'Cola', 
      icon: <FiList className="w-5 h-5" />,
      requiresAuth: true 
    }
  ];

  // Filtrar tabs disponibles y verificar autenticación
  const visibleTabs = useMemo(() => {
    return allTabs.filter(tab => {
      // Verificar si el tab está en la lista de tabs disponibles
      if (!availableTabs.includes(tab.id)) return false;
      
      // Si requiere autenticación, verificar que el usuario esté autenticado
      if (tab.requiresAuth && status !== 'authenticated') return false;
      
      return true;
    });
  }, [availableTabs, status]);

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] md:hidden h-20">
      {/* Backdrop blur effect */}
      <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-lg border-t border-gray-700/50" />
      
      {/* Tab container */}
      <div className="relative px-2 py-3 h-full flex items-center">
        <div className="flex items-center justify-around w-full">
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className="relative flex flex-col items-center justify-center p-2 min-w-[60px] transition-all duration-200"
              >
                {/* Active indicator */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -top-1 left-1/2 w-8 h-1 bg-blue-500 rounded-full"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 500, 
                        damping: 30,
                        duration: 0.2 
                      }}
                      style={{ x: '-50%' }}
                    />
                  )}
                </AnimatePresence>

                {/* Icon container */}
                <motion.div
                  className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                  }`}
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
                </motion.div>

                {/* Label */}
                <motion.span
                  className={`text-xs font-medium mt-1 transition-all duration-200 ${
                    isActive 
                      ? 'text-blue-400' 
                      : 'text-gray-500'
                  }`}
                  animate={{ 
                    opacity: isActive ? 1 : 0.8,
                    y: isActive ? -1 : 0
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {tab.label}
                </motion.span>

                {/* Ripple effect on tap */}
                <motion.div
                  className="absolute inset-0 rounded-xl bg-blue-500/10"
                  initial={{ scale: 0, opacity: 0 }}
                  whileTap={{ 
                    scale: 1.2, 
                    opacity: [0, 0.3, 0],
                    transition: { duration: 0.3 }
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Safe area padding for devices with home indicator */}
      <div className="h-safe-area-inset-bottom bg-gray-900/80" />
    </div>
  );
};

export default MobileBottomTabs; 