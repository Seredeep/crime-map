'use client';

import { useRouter } from 'next/navigation';
import IncidentsView from './components/IncidentsView';
import SwipeableIncidentsView from './components/SwipeableIncidentsView';
import { useSession } from 'next-auth/react';
import IncidentForm from './components/IncidentForm';
import IncidentQueue from './components/IncidentQueue';
import Sidebar from './components/Sidebar';
import MobileBottomTabs from './components/MobileBottomTabs';
import MobileStatsView from './components/MobileStatsView';
import MobileCommunitiesView from './components/MobileCommunitiesView';
import MobileReportView from './components/MobileReportView';
import MobileDynamicNavbar from './components/MobileDynamicNavbar';
import MobileSlidePanel from './components/MobileSlidePanel';
import MobileSettingsPanel from './components/MobileSettingsPanel';
import FloatingReportButton from './components/FloatingReportButton';
import { useCallback, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IncidentFilters } from '@/lib/types';
import { Neighborhood } from '@/lib/neighborhoodService';

export default function Home() {
  // State to track sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); // Start collapsed
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);
  const router = useRouter();
  const { status } = useSession();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('incidents');
  
  // Estados para los nuevos paneles móviles
  const [isFiltersPanelOpen, setIsFiltersPanelOpen] = useState(false);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [filters, setFilters] = useState<IncidentFilters>({
    status: undefined,
    tags: []
  });

  const handleReportClick = useCallback(() => {
    if (status !== 'authenticated') {
      router.push('/auth/signin?callbackUrl=/');
    } else {
      setActiveTab('report');
    }
  }, [router, status]);

  const handleTabChange = useCallback((tabId: string) => {
    if (status === 'authenticated' || tabId === 'incidents' || tabId === 'communities') {
      setActiveTab(tabId);
    }
  }, [status]);

  // Callbacks para los paneles móviles
  const handleFiltersClick = useCallback(() => {
    setIsFiltersPanelOpen(true);
  }, []);

  const handleSettingsClick = useCallback(() => {
    setIsSettingsPanelOpen(true);
  }, []);

  const handleFiltersChange = useCallback((newFilters: IncidentFilters) => {
    setFilters(newFilters);
  }, []);

  const handleNeighborhoodSelect = useCallback((neighborhood: Neighborhood | null) => {
    // Implementar lógica de selección de barrio si es necesario
    console.log('Neighborhood selected:', neighborhood);
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
  const renderTabContent = () => {
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

      case 'report':
        return (
          <div className="w-full h-full">
            <MobileReportView onBack={() => setActiveTab('incidents')} />
          </div>
        );

      case 'queue':
        if (session?.user?.role === 'admin' || session?.user?.role === 'editor') {
          return (
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-200">Cola de Revisión</h2>
                <button
                  onClick={() => setActiveTab('incidents')}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Volver al mapa</span>
                </button>
              </div>
              <IncidentQueue />
            </div>
          );
        }
        return null;

      default:
        return null;
    }
  };

  // Handle sidebar collapse state change
  const handleSidebarCollapse = useCallback((isCollapsed: boolean) => {
    setIsSidebarCollapsed(isCollapsed);
  }, []);

  return (
    <div className="flex flex-col w-screen bg-gray-900 dark:bg-gray-900 ">
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
          {/* Nueva navbar dinámica para móvil */}
          <MobileDynamicNavbar
            activeTab={activeTab}
            onFiltersClick={handleFiltersClick}
            onSettingsClick={handleSettingsClick}
          />

          {/* Contenido principal con altura ajustada */}
          <div className="h-[calc(100vh-4rem)] pt-16">
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

          {/* Botón flotante de reportar - solo visible en el mapa */}
          <FloatingReportButton
            onClick={handleReportClick}
            isVisible={activeTab === 'incidents'}
          />

          {/* Mobile Bottom Tabs */}
          <MobileBottomTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onReportClick={handleReportClick}
            status={status}
            availableTabs={availableTabs}
          />

          {/* Paneles deslizantes */}
          <MobileSlidePanel
            isOpen={isFiltersPanelOpen}
            onClose={() => setIsFiltersPanelOpen(false)}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onNeighborhoodSelect={handleNeighborhoodSelect}
          />

          <MobileSettingsPanel
            isOpen={isSettingsPanelOpen}
            onClose={() => setIsSettingsPanelOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}