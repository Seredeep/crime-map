'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import MobileBottomTabs from '../../components/MobileBottomTabs';
import MobileStatsView from '../../components/MobileStatsView';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';

export default function StatsPage() {
  // State to track sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [appLoading, setAppLoading] = useState(true);
  const router = useRouter();
  const { status } = useSession();
  const { data: session } = useSession();

  // Estados para los nuevos paneles móviles
  const [isFiltersPanelOpen, setIsFiltersPanelOpen] = useState(false);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);

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

  const handleReportClick = useCallback(() => {
    if (status !== 'authenticated') {
      router.push('/auth/signin?callbackUrl=/stats');
    } else {
      // En desktop, ir a la página de reporte
      router.push('/report');
    }
  }, [router, status]);

  // Callbacks para los paneles móviles
  const handleFiltersClick = useCallback(() => {
    setIsFiltersPanelOpen(true);
  }, []);

  const handleSettingsClick = useCallback(() => {
    setIsSettingsPanelOpen(true);
  }, []);

  // Definir las tabs disponibles basado en el rol del usuario
  const availableTabs = useMemo(() => {
    const baseTabs = ['incidents', 'stats', 'communities'];

    if (session?.user?.role === 'admin' || session?.user?.role === 'editor') {
      baseTabs.push('queue');
    }

    return baseTabs;
  }, [session?.user?.role]);

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
        activeTab="stats"
        onFiltersClick={handleFiltersClick}
        onSettingsClick={handleSettingsClick}
      />

      {/* Main content area - Below navbar */}
      <div className="flex flex-1 relative h-[calc(100vh-4rem)] ">
        {/* Desktop Layout */}
        <div className="hidden md:block h-full w-full relative">

          {/* Sidebar - Positioned on top of content with higher z-index */}
          <div className="absolute top-0 left-0 h-full z-40">
            <Sidebar
              activeTab="stats"
              onReportClickAction={handleReportClick}
              status={status}
              availableTabs={availableTabs}
              onCollapseChange={handleSidebarCollapse}
            />
          </div>

          {/* Main content with margin for sidebar */}
          <div className={`h-full transition-all duration-300 ${isSidebarCollapsed ? 'ml-[72px]' : 'ml-[320px]'}`}>
            <div className="w-full h-full">
              <div className="w-full h-full">
                <MobileStatsView />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden w-full relative">
          {/* Contenido principal con altura ajustada */}
          <div className="h-[calc(100vh-4rem)]">
            <div className="w-full h-full">
              <MobileStatsView />
            </div>
          </div>

          {/* Mobile Bottom Tabs */}
          <MobileBottomTabs
            activeTab="stats"
            onReportClick={handleReportClick}
            status={status}
            availableTabs={availableTabs}
          />

        </div>
      </div>
    </div>
  );
}
