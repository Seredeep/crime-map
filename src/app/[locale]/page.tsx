'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import FloatingReportButton from '../components/FloatingReportButton';
import MobileBottomTabs from '../components/MobileBottomTabs';
import MobileCommunitiesView from '../components/MobileCommunitiesView';
import MobileReportView from '../components/MobileReportView';
import MobileSettingsView from '../components/MobileSettingsView';
import MobileStatsView from '../components/MobileStatsView';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import SwipeableIncidentsView from '../components/SwipeableIncidentsView';

export default function Home() {
  const t = useTranslations('Forms');
  // State to track sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [appLoading, setAppLoading] = useState(true);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);
  const router = useRouter();
  const { status } = useSession();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('incidents');

  // Estados para los nuevos paneles móviles
  const [isFiltersPanelOpen, setIsFiltersPanelOpen] = useState(false);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [showReportFormInPanel, setShowReportFormInPanel] = useState(false);

  // Carga inicial de la aplicación
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Si el usuario está autenticado, precargar datos del chat
        if (status === 'authenticated' && session?.user) {
          try {
            // Precargar información del chat
            const chatResponse = await fetch('/api/chat/mine');
            if (chatResponse.ok) {
              const chatResult = await chatResponse.json();
              // Los datos se almacenarán en caché automáticamente
            }

            // Precargar mensajes recientes
            const messagesResponse = await fetch('/api/chat/firestore-messages?limit=10');
            if (messagesResponse.ok) {
              const messagesResult = await messagesResponse.json();
              // Los datos se almacenarán en caché automáticamente
            }
          } catch (error) {
            console.log('Error precargando datos del chat:', error);
            // No es crítico, la app puede funcionar sin estos datos
          }
        }
      } catch (error) {
        console.error('Error en la inicialización:', error);
      } finally {
        // Dar un pequeño delay para que la carga se vea natural
        setTimeout(() => {
          setAppLoading(false);
        }, 500);
      }
    };

    // Solo inicializar cuando tengamos información del estado de sesión
    if (status !== 'loading') {
      initializeApp();
    }
  }, [status, session]);

  // Escuchar evento para abrir chat del barrio (desde desktop)
  useEffect(() => {
    const handleOpenNeighborhoodChat = () => {
      setActiveTab('communities');
      // Disparar evento para que MobileCommunitiesView abra el chat
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('openFullscreenChat'));
      }, 100);
    };

    window.addEventListener('openNeighborhoodChat', handleOpenNeighborhoodChat);

    return () => {
      window.removeEventListener('openNeighborhoodChat', handleOpenNeighborhoodChat);
    };
  }, []);

  const handleReportClick = useCallback(() => {
    if (status !== 'authenticated') {
      router.push('/auth/signin?callbackUrl=/');
    } else {
      // En móvil, mostrar el formulario en el panel swipeable
      if (window.innerWidth < 768) {
        setShowReportFormInPanel(true);
        setActiveTab('incidents'); // Asegurar que estamos en la tab de incidentes
      } else {
        // En desktop, cambiar a la tab de reporte
        setActiveTab('report');
      }
    }
  }, [router, status]);

  const handleCloseReportForm = useCallback(() => {
    setShowReportFormInPanel(false);
  }, []);

  const handleTabChange = useCallback((tabId: string) => {
    if (status === 'authenticated' || tabId === 'incidents' || tabId === 'communities') {
      setActiveTab(tabId);
      // Cerrar el formulario de reporte si se cambia de tab
      if (tabId !== 'incidents') {
        setShowReportFormInPanel(false);
      }
    }
  }, [status]);

  // Callbacks para los paneles móviles
  const handleFiltersClick = useCallback(() => {
    setIsFiltersPanelOpen(true);
  }, []);

  const handleSettingsClick = useCallback(() => {
    setIsSettingsPanelOpen(true);
  }, []);

  // Handle incident selection
  const handleIncidentSelect = useCallback((incidentId: string) => {
    setSelectedIncidentId(incidentId);
    setDetailsPanelOpen(true);
  }, []);

  // Definir las tabs disponibles basado en el rol del usuario
  const availableTabs = useMemo(() => {
    const baseTabs = ['incidents', 'stats', 'communities'];

    if (session?.user?.role === 'admin' || session?.user?.role === 'editor') {
      baseTabs.push('queue');
    }

    return baseTabs;
  }, [session?.user?.role]);

  // Componente para renderizar el contenido de cada tab
  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'incidents':
        return (
          <div className="w-full h-full">
            <SwipeableIncidentsView onFiltersOpen={handleFiltersClick} />
          </div>
        );

      case 'stats':
        return (
          <div className="w-full h-full">
            <MobileStatsView />
          </div>
        );

      case 'communities':
        return (
          <div className="w-full h-full">
            <MobileCommunitiesView />
          </div>
        );

      case 'profile':
        return (
          <div className="w-full h-full">
            <MobileSettingsView />
          </div>
        );

      default:
        return null;
    }
  }, [activeTab, handleFiltersClick]);

  // Handle sidebar collapse state change
  const handleSidebarCollapse = useCallback((isCollapsed: boolean) => {
    setIsSidebarCollapsed(isCollapsed);
  }, []);

  // Si la app está cargando, no renderizar nada
  if (appLoading) {
    return null;
  }

  return (
    <div className="flex flex-col w-screen bg-black dark:bg-black">
      {/* Navbar unificado */}
      <Navbar
        activeTab={activeTab}
        onFiltersClick={handleFiltersClick}
        onSettingsClick={handleSettingsClick}
      />

      {/* Language selector removed from desktop; now available in Mobile Settings */}

      {/* Main content area - Below navbar */}
      <div className="flex flex-1 relative h-[calc(100vh-4rem)] ">
        {/* Desktop Layout */}
        <div className="hidden md:block h-full w-full relative">

          {/* Sidebar - Positioned on top of content with higher z-index */}
          <div className="absolute top-0 left-0 h-full z-40">
            <Sidebar
              activeTab={activeTab}
              onTabChangeAction={handleTabChange}
              onReportClickAction={handleReportClick}
              status={status}
              availableTabs={availableTabs}
              onCollapseChange={handleSidebarCollapse}
              onIncidentSelect={handleIncidentSelect}
            />
          </div>

          {/* Main content with margin for sidebar */}
          <div className={`h-full transition-all duration-300 ${isSidebarCollapsed ? 'ml-[72px]' : 'ml-[320px]'}`}>
            <div className="w-full h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1],
                    type: "spring",
                    stiffness: 100
                  }}
                  className="w-full h-full"
                >
                  {renderTabContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden w-full relative">
          {/* Contenido principal con altura ajustada */}
          <div className="h-[calc(100vh-4rem)]">
            {/* Tab content with animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{
                  duration: 0.4,
                  ease: [0.4, 0, 0.2, 1],
                  type: "spring",
                  stiffness: 100
                }}
                className="w-full h-full"
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Panel de reporte swipeable desde la derecha */}
          <AnimatePresence>
            {showReportFormInPanel && (
              <>
                {/* Overlay de fondo */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="fixed inset-0 backdrop-blur-sm z-[200] md:hidden"
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)'
                  }}
                  onClick={handleCloseReportForm}
                />

                {/* Panel deslizable */}
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{
                    type: 'spring',
                    damping: 25,
                    stiffness: 200,
                    duration: 0.5
                  }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.1}
                  onDragEnd={(_: any, info: any) => {
                    // Si se arrastra más del 50% hacia la derecha, cerrar
                    if (info.offset.x > 150) {
                      handleCloseReportForm();
                    }
                  }}
                  className="fixed top-0 right-0 bottom-0 w-full backdrop-blur-lg border-l border-gray-700/50 shadow-2xl z-[210] md:hidden"
                  style={{
                    background: 'linear-gradient(180deg, rgba(20, 20, 20, 1) 0%, rgba(15, 15, 15, 1) 100%)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: `
                      -10px 0 50px rgba(0, 0, 0, 0.3),
                      -5px 0 25px rgba(0, 0, 0, 0.2),
                      inset 1px 0 0 rgba(255, 255, 255, 0.1)
                    `
                  }}
                >
                  {/* Handle de arrastre */}
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-12 bg-gray-600 rounded-r-full cursor-grab active:cursor-grabbing" />

                  {/* Header del panel */}
                  <div className="sticky top-0 backdrop-blur-lg px-3 py-1 z-20" style={{
                    background: 'linear-gradient(180deg, rgba(20, 20, 20, 1) 0%, rgba(15, 15, 15, 1) 100%)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                      <div className="flex items-center space-x-2">
                        <motion.button
                          onClick={handleCloseReportForm}
                          whileTap={{ scale: 0.95 }}
                          className="p-4 rounded-full bg-transparent text-gray-400 hover:text-white hover:bg-gray-600/50 transition-all duration-200"
                        >
                          <FiArrowLeft className="w-5 h-5" />
                        </motion.button>
                        <h1 className="text-lg font-semibold font-manrope text-white">{t('reportIncident')}</h1>

                      </div>
                  </div>

                  {/* Contenido del formulario */}
                  <div className="flex-1 px-4 overflow-y-auto" style={{ maxHeight: '100vh' }}>
                    <MobileReportView onBack={handleCloseReportForm} />
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Botón flotante de reportar - solo visible en el mapa y cuando no se muestra el formulario */}
          <FloatingReportButton
            onClick={handleReportClick}
            isVisible={activeTab === 'incidents' && !showReportFormInPanel}
            className="bottom-56"
          />

          {/* Mobile Bottom Tabs */}
          <MobileBottomTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onReportClick={handleReportClick}
            status={status}
            availableTabs={availableTabs}
          />

        </div>
      </div>
    </div>
  );
}
