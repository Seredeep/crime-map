'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { signOut, useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FiAlertTriangle, FiBarChart2, FiChevronLeft, FiList, FiLogOut, FiMap, FiMessageCircle, FiSettings, FiUser, FiUsers } from 'react-icons/fi';
import ClaridadLogo from './ClaridadLogo';

interface SidebarProps {
  activeTab: string;
  onTabChangeAction: (tabId: string) => void;
  onReportClickAction: () => void;
  status: string;
  availableTabs: string[];
  onCollapseChange?: (isCollapsed: boolean) => void;
  onIncidentSelect?: (incidentId: string) => void;
}

interface Incident {
  id: string;
  title: string;
  type: string;
  status: string;
  date: string;
  location: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action?: () => void;
}

// Datos de ejemplo para incidentes recientes
const sampleIncidents: Incident[] = [
  {
    id: '1',
    title: 'Robo en calle principal',
    type: 'robbery',
    status: 'reported',
    date: '2023-05-15',
    location: 'Calle Principal 123'
  },
  {
    id: '2',
    title: 'Vandalismo en parque',
    type: 'vandalism',
    status: 'investigating',
    date: '2023-05-14',
    location: 'Parque Central'
  },
  {
    id: '3',
    title: 'Accidente de tráfico',
    type: 'accident',
    status: 'resolved',
    date: '2023-05-13',
    location: 'Avenida Norte 45'
  },
];

const Sidebar = ({
  activeTab,
  onTabChangeAction,
  onReportClickAction,
  status,
  availableTabs,
  onCollapseChange,
  onIncidentSelect
}: SidebarProps) => {
  // Start with sidebar collapsed by default
  const [collapsed, setCollapsed] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { data: session } = useSession();
  const t = useTranslations('Sidebar');
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Detectar si es mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const menuItems: MenuItem[] = [
    { id: 'incidents', label: t('map'), icon: <FiMap className="w-6 h-6 flex-shrink-0" /> },
    { id: 'stats', label: t('stats'), icon: <FiBarChart2 className="w-6 h-6 flex-shrink-0" /> },
    { id: 'communities', label: t('communities'), icon: <FiUsers className="w-6 h-6 flex-shrink-0" /> },
    { id: 'report', label: t('report'), icon: <FiAlertTriangle className="w-6 h-6 flex-shrink-0" /> },
    { id: 'queue', label: t('queue'), icon: <FiList className="w-6 h-6 flex-shrink-0" /> },
  ];

  // Agregar botón de chat del barrio si el usuario está autenticado
  const chatMenuItem: MenuItem = {
    id: 'neighborhood-chat',
    label: t('neighborhoodChat'),
    icon: <FiMessageCircle className="w-6 h-6 flex-shrink-0" />,
    action: () => {
      window.dispatchEvent(new CustomEvent('openNeighborhoodChat'));
    }
  };

  // Filtrar los elementos del menú según los tabs disponibles
  const filteredMenuItems = menuItems.filter(item =>
    availableTabs.includes(item.id)
  );

  // Agregar chat del barrio si el usuario está autenticado
  if (status === 'authenticated') {
    filteredMenuItems.splice(2, 0, chatMenuItem); // Insertar después de stats
  }

  // Manejar el cambio de tab
  const handleTabChange = useCallback((tabId: string) => {
    if (tabId === 'report') {
      onReportClickAction();
    } else {
      onTabChangeAction(tabId);
    }
  }, [onTabChangeAction, onReportClickAction]);

  // Manejar el clic en un tab
  const handleTabClick = useCallback((tabId: string) => {
    handleTabChange(tabId);
  }, [handleTabChange]);

  // Manejar el colapso de la barra lateral
  const toggleSidebar = useCallback(() => {
    const newCollapsedState = !collapsed;
    setCollapsed(newCollapsedState);
    if (onCollapseChange) {
      onCollapseChange(newCollapsedState);
    }
  }, [collapsed, onCollapseChange]);

  // Manejar el clic en un incidente
  const handleIncidentClick = useCallback((incidentId: string) => {
    if (onIncidentSelect) {
      onIncidentSelect(incidentId);
    }
  }, [onIncidentSelect]);

  // Cerrar el menú de perfil al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Función para obtener el color según el tipo de incidente
  const getIncidentTypeColor = (type: string) => {
    switch (type) {
      case 'robbery':
        return 'bg-red-500';
      case 'vandalism':
        return 'bg-orange-500';
      case 'accident':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  // Variantes para las animaciones
  const sidebarVariants = {
    expanded: { width: 320 },
    collapsed: { width: 72 }
  };

  const contentVariants = {
    expanded: { opacity: 1, display: 'block' },
    collapsed: {
      opacity: 0,
      display: 'none',
      transition: {
        display: { delay: 0.2 }
      }
    }
  };

  const iconVariants = {
    expanded: { rotate: 0 },
    collapsed: { rotate: 180 }
  };

  return (
    <div className={`${isMobile ? 'fixed bottom-0 left-0 w-full z-50' : 'absolute top-0 left-0 h-full z-40'}`}>
      <motion.div
        className={`flex flex-col bg-gray-900 text-white transition-all duration-300 ease-in-out shadow-xl border-r border-gray-800 ${isMobile ? 'rounded-t-xl h-16' : 'h-full'} ${collapsed ? 'w-16' : 'w-64'}`}
        initial={false}
        animate={{
          width: isMobile ? '100%' : (collapsed ? 64 : 256),
        }}
      >
        {/* Header with logo and collapse button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <motion.div
            variants={contentVariants}
            animate={collapsed ? 'collapsed' : 'expanded'}
            className="font-bold text-lg text-blue-400"
          >
            <ClaridadLogo size="md" showText={!collapsed} />
          </motion.div>

          <button
            onClick={toggleSidebar}
            className="p-2 rounded-full hover:bg-blue-900/40 hover:text-blue-300 transition-all duration-200"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <motion.div
              variants={iconVariants}
              animate={collapsed ? 'collapsed' : 'expanded'}
            >
              <FiChevronLeft className="w-5 h-5" />
            </motion.div>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-2 px-2">
            {filteredMenuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      if (item.action) {
                        item.action();
                      } else {
                        handleTabClick(item.id);
                      }
                    }}
                    className={`flex items-center w-full p-2 rounded-lg transition-all duration-200 ${isActive
                      ? 'bg-blue-900/40 text-blue-300 border-l-2 border-blue-500 pl-2'
                      : 'hover:bg-gray-800 hover:text-blue-300 hover:border-l-2 hover:border-blue-500 hover:pl-2'}`}
                  >
                    <div className="flex-shrink-0 text-blue-400">{item.icon}</div>
                    <motion.span
                      variants={contentVariants}
                      animate={collapsed ? 'collapsed' : 'expanded'}
                      className="ml-3 whitespace-nowrap font-medium"
                    >
                      {item.label}
                    </motion.span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Profile section */}
        <div className="border-t border-gray-800 p-4">
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center w-full rounded-lg p-2 hover:bg-blue-900/40 hover:text-blue-300 transition-all duration-200 bg-gray-800/50 shadow-lg"
            >
              <div className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full p-2 shadow-lg">
                <FiUser className="w-4 h-4 text-white" />
              </div>
              <motion.div
                variants={contentVariants}
                animate={collapsed ? 'collapsed' : 'expanded'}
                className="ml-3 flex-1 flex items-center justify-between"
              >
                <span className="truncate font-medium text-gray-200">
                  {session?.user?.name || 'Usuario'}
                </span>
                <FiSettings className="w-4 h-4 text-blue-400 hover:text-blue-300" />
              </motion.div>
            </button>

            {/* Profile dropdown menu */}
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  ref={profileMenuRef}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-full left-0 mb-2 w-full bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50"
                >
                  <ul className="divide-y divide-gray-700">
                    <li>
                      <Link href="/profile" className="flex items-center px-4 py-3 hover:bg-blue-900/30 transition-all duration-200 text-gray-200 hover:text-blue-300">
                        <FiSettings className="w-4 h-4 mr-2 text-blue-400" />
                        <span>Configuración</span>
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={() => signOut()}
                        className="flex items-center w-full text-left px-4 py-3 hover:bg-red-900/30 transition-all duration-200 text-red-400 hover:text-red-300"
                      >
                        <FiLogOut className="w-4 h-4 mr-2" />
                        <span>Cerrar sesión</span>
                      </button>
                    </li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Sidebar;
