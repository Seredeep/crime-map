'use client';

import { useRouter } from 'next/navigation';
import IncidentsView from './components/IncidentsView';
import { useSession } from 'next-auth/react';
import IncidentForm from './components/IncidentForm';
import IncidentQueue from './components/IncidentQueue';
import Sidebar from './components/Sidebar';
import { useCallback, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  // State to track sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); // Start collapsed
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);
  const router = useRouter();
  const { status } = useSession();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('incidents');

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
    } else if (tabId === 'report') {
      handleReportClick();
    }
  }, [handleReportClick, status]);

  // Handle incident selection
  const handleIncidentSelect = useCallback((incidentId: string) => {
    setSelectedIncidentId(incidentId);
    setDetailsPanelOpen(true);
  }, []);
  
  // Definir las tabs disponibles basado en el rol del usuario
  const availableTabs = useMemo(() => {
    const baseTabs = ['incidents', 'communities', 'report'];

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
            <IncidentsView />
          </div>
        );

      case 'communities':
        return (
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Comunidades</h2>
            <p className="text-gray-300">
              Sección de comunidades en desarrollo. Próximamente podrás ver y unirte a comunidades locales.
            </p>
          </div>
        );

      case 'report':
        return (
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-200">Reportar un Incidente</h2>
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
            <IncidentForm />
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
        <div className="md:hidden h-full w-full relative">
          {/* Content wrapper with map and incidents */}
          <div className="flex flex-col h-full">
            {/* Main content area */}
            <div className="flex-1 relative">
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
          </div>

          {/* Mobile Sidebar */}
          <div className="fixed bottom-0 left-0 w-full z-40">
            <Sidebar
              activeTab={activeTab}
              onTabChangeAction={handleTabChange}
              onReportClickAction={handleReportClick}
              status={status}
              availableTabs={availableTabs}
              onIncidentSelect={handleIncidentSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
}