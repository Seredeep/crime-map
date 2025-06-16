'use client';

import { motion, PanInfo, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useEffect, useRef } from 'react';
import IncidentsView from './IncidentsView';
import MapSearchBar from './MapSearchBar';
import { Incident } from '@/lib/types';
import { fetchIncidents } from '@/lib/incidentService';
import { formatDate } from '@/lib/utils';

interface SwipeableIncidentsViewProps {
  onFiltersOpen?: () => void;
}

const SwipeableIncidentsView = ({ onFiltersOpen }: SwipeableIncidentsViewProps) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [bottomSheetHeight, setBottomSheetHeight] = useState(80); // Más pequeño inicialmente
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cargar incidentes
  useEffect(() => {
    const loadIncidents = async () => {
      try {
        setLoading(true);
        const fetchedIncidents = await fetchIncidents({
          status: 'verified',
          dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          dateTo: new Date().toISOString().split('T')[0],
          neighborhoodId: '83'
        });
        setIncidents(fetchedIncidents);
      } catch (error) {
        console.error('Error loading incidents:', error);
      } finally {
        setLoading(false);
      }
    };

    loadIncidents();
  }, []);

  // Detectar swipe horizontal para filtros
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    let hasMoved = false;

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      
      // Solo considerar swipe horizontal si el movimiento es principalmente horizontal
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
        hasMoved = true;
        setIsDraggingHorizontal(true);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX;
      
      // Si se deslizó más de 150px hacia la derecha desde el borde izquierdo, abrir filtros
      if (startX < 50 && deltaX > 150 && hasMoved) {
        onFiltersOpen?.();
      }
      
      setIsDraggingHorizontal(false);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  }, [onFiltersOpen]);

  const handleBottomSheetDrag = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const newHeight = bottomSheetHeight - info.offset.y;
    const minHeight = 80; // Más pequeño
    const maxHeight = window.innerHeight * 0.6; // Un poco menos alto
    
    setBottomSheetHeight(Math.max(minHeight, Math.min(newHeight, maxHeight)));
  }, [bottomSheetHeight]);

  const handleBottomSheetDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;
    const minHeight = 80;
    const maxHeight = window.innerHeight * 0.6;
    
    // Si se arrastra hacia arriba con suficiente velocidad o distancia, expandir
    if (velocity < -500 || offset < -100) {
      setBottomSheetHeight(maxHeight);
      setIsExpanded(true);
    }
    // Si se arrastra hacia abajo, contraer
    else if (velocity > 500 || offset > 100) {
      setBottomSheetHeight(minHeight);
      setIsExpanded(false);
    }
    // Snap a la posición más cercana
    else {
      const midPoint = (minHeight + maxHeight) / 2;
      if (bottomSheetHeight > midPoint) {
        setBottomSheetHeight(maxHeight);
        setIsExpanded(true);
      } else {
        setBottomSheetHeight(minHeight);
        setIsExpanded(false);
      }
    }
  }, [bottomSheetHeight]);

  const getIncidentTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'robo': return 'bg-red-500';
      case 'asalto': return 'bg-orange-500';
      case 'hurto': return 'bg-yellow-500';
      case 'vandalismo': return 'bg-green-500';
      case 'actividad sospechosa': return 'bg-cyan-500';
      default: return 'bg-purple-500';
    }
  };

  const getIncidentIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'robo':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM8 15a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'asalto':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative"
      onTouchStart={handleTouchStart}
    >
      {/* Indicador visual de swipe para filtros */}
      <AnimatePresence>
        {isDraggingHorizontal && (
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-[150] pointer-events-none"
          >
            <div className="bg-blue-500/30 backdrop-blur-md rounded-r-xl p-4 border-r-2 border-blue-400 shadow-lg">
              <div className="flex items-center space-x-3 text-blue-300">
                <motion.svg 
                  className="w-6 h-6" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </motion.svg>
                <span className="text-sm font-semibold">Filtros</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barra de búsqueda */}
      <div className="absolute top-4 left-4 right-4 z-[100] md:hidden">
        <MapSearchBar 
          onLocationSelect={(coords, address) => {
            console.log('Location selected:', coords, address);
          }}
          onIncidentSelect={(incidentId) => {
            console.log('Incident selected:', incidentId);
          }}
        />
      </div>

      {/* Contenido principal del mapa - z-index bajo */}
      <div className="w-full h-full relative z-10">
        <IncidentsView />
      </div>

      {/* Bottom Sheet con lista de incidentes - arriba de las tabs */}
      <motion.div
        className="fixed left-0 right-0 z-[140] md:hidden bg-gray-900/95 backdrop-blur-lg border-t border-gray-700/50 rounded-t-2xl shadow-2xl"
        style={{ 
          height: bottomSheetHeight,
          bottom: 80 // 80px arriba de las tabs (altura de tabs = 80px)
        }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDrag={handleBottomSheetDrag}
        onDragEnd={handleBottomSheetDragEnd}
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Handle del bottom sheet */}
        <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 pb-2 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-red-500/20 rounded-lg">
                <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Incidentes Recientes</h3>
                {isExpanded && (
                  <p className="text-sm text-gray-400">{incidents.length} incidentes verificados</p>
                )}
              </div>
            </div>
            <motion.button
              onClick={() => {
                const minHeight = 80;
                const maxHeight = window.innerHeight * 0.6;
                if (isExpanded) {
                  setBottomSheetHeight(minHeight);
                  setIsExpanded(false);
                } else {
                  setBottomSheetHeight(maxHeight);
                  setIsExpanded(true);
                }
              }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-full bg-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-600/50 transition-all duration-200"
            >
              <motion.svg 
                className="w-5 h-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </motion.svg>
            </motion.button>
          </div>
        </div>

        {/* Lista de incidentes */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p>No hay incidentes recientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incidents.slice(0, isExpanded ? incidents.length : 3).map((incident, index) => (
                <motion.div
                  key={incident._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30 hover:border-gray-600/50 transition-all duration-200 cursor-pointer"
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${getIncidentTypeColor(incident.type)} text-white`}>
                      {getIncidentIcon(incident.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-white truncate">
                          {incident.type || 'Incidente'}
                        </h4>
                        <span className="text-xs text-gray-400">
                          {formatDate(incident.date)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                        {incident.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 truncate">
                          📍 {incident.address}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                          VERIFICADO
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SwipeableIncidentsView; 