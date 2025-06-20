'use client';

import { fetchIncidents } from '@/lib/incidentService';
import { Neighborhood } from '@/lib/neighborhoodService';
import { Incident, IncidentFilters as IncidentFiltersType } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { AnimatePresence, PanInfo, motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FiFilter, FiX } from 'react-icons/fi';
import CustomLoader from './CustomLoader';
import IncidentFiltersContent from './IncidentFiltersContent';
import IncidentsView from './IncidentsView';
import MapSearchBar from './MapSearchBar';

interface SwipeableIncidentsViewProps {
  onFiltersOpen?: () => void;
  onIncidentNavigate?: (coordinates: [number, number], incident: Incident) => void;
}

const SwipeableIncidentsView = ({ onFiltersOpen, onIncidentNavigate }: SwipeableIncidentsViewProps) => {
  const { data: session } = useSession();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [bottomSheetHeight, setBottomSheetHeight] = useState(85);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);
  const [showFiltersPopover, setShowFiltersPopover] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const isEditorOrAdmin = session?.user?.role === 'editor' || session?.user?.role === 'admin';

  // Estado de filtros
  const [filters, setFilters] = useState<IncidentFiltersType>(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    return {
      dateFrom: thirtyDaysAgo.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0],
      neighborhoodId: '83',
      status: 'verified'
    };
  });

  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | null>(null);

  // Cargar incidentes con filtros
  const loadIncidents = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedIncidents = await fetchIncidents(filters);
      setIncidents(fetchedIncidents);
    } catch (error) {
      console.error('Error loading incidents:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);



  // Handler para cambios de filtros
  const handleFiltersChange = useCallback((newFilters: IncidentFiltersType) => {
    if (!isEditorOrAdmin) {
      newFilters.status = 'verified';
    }
    setFilters(newFilters);
  }, [isEditorOrAdmin]);

  // Handler para selección de barrio
  const handleNeighborhoodSelect = useCallback((neighborhood: Neighborhood | null) => {
    setSelectedNeighborhood(neighborhood);
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
    const minHeight = 80;
    // Aumentamos la altura máxima para que el panel tenga más fondo
    const contentHeight = Math.max(400, incidents.length * 120 + 300);
    const maxHeight = Math.min(contentHeight, window.innerHeight * 0.85);

    setBottomSheetHeight(Math.max(minHeight, Math.min(newHeight, maxHeight)));
  }, [bottomSheetHeight, incidents.length]);

  const handleBottomSheetDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;
    const minHeight = 80;
    // Aumentamos la altura máxima para que el panel tenga más fondo
    const contentHeight = Math.max(400, incidents.length * 120 + 300);
    const maxHeight = Math.min(contentHeight, window.innerHeight * 0.85);

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
  }, [bottomSheetHeight, incidents.length]);

  // Función para alternar el estado del panel
  const togglePanel = useCallback(() => {
    const minHeight = 80;
    // Aumentamos la altura máxima para que el panel tenga más fondo
    const contentHeight = Math.max(400, incidents.length * 120 + 300);
    const maxHeight = Math.min(contentHeight, window.innerHeight * 0.85);

    if (isExpanded) {
      setBottomSheetHeight(minHeight);
      setIsExpanded(false);
    } else {
      setBottomSheetHeight(maxHeight);
      setIsExpanded(true);
    }
  }, [isExpanded, incidents.length]);

  // Función para cerrar el panel al tocar fuera
  const handleOutsideClick = useCallback(() => {
    if (isExpanded) {
      const minHeight = 80;
      setBottomSheetHeight(minHeight);
      setIsExpanded(false);
    }
  }, [isExpanded]);

  // Función para manejar click en incidente
  const handleIncidentClick = useCallback((incident: Incident) => {
    // Un solo click: navegar al incidente en el mapa y cerrar el panel
    if (incident.coordinates) {
      onIncidentNavigate?.(incident.coordinates, incident);
      // Cerrar el panel después de navegar
      const minHeight = 80;
      setBottomSheetHeight(minHeight);
      setIsExpanded(false);
    }
  }, [onIncidentNavigate]);

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
      {/* Barra de búsqueda y filtros con estilo liquid glass mejorado */}
      <div className="absolute top-4 left-4 right-4 z-[100] md:hidden">
        <div className="flex items-center space-x-3">
          {/* Barra de búsqueda mejorada con estilo liquid glass */}
          <div className="flex-1">
            <MapSearchBar
              onLocationSelect={(coords, address) => {
                // Handle location selection
              }}
              onIncidentSelect={(incidentId) => {
                // Handle incident selection
              }}
              className="w-full"
            />
          </div>

          {/* Botón de filtros con popover directo */}
          <div className="relative">
            <motion.div
              whileTap={{ scale: 0.95 }}
              animate={{ borderRadius: ['20%', '30%', '24%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: 'mirror' }}
            >
              <motion.button
                onClick={() => setShowFiltersPopover(!showFiltersPopover)}
                whileHover={{ scale: 1.02 }}
                className="relative w-12 h-12 text-gray-800 flex items-center justify-center transition-all duration-300 group"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: `
                    inset 0 0 10px rgba(255,255,255,0.04),
                    0 0 30px rgba(255,255,255,0.02),
                    0 8px 32px rgba(0, 0, 0, 0.08),
                    0 4px 16px rgba(0, 0, 0, 0.06),
                    0 2px 8px rgba(0, 0, 0, 0.04)
                  `,
                  borderRadius: '24px'
                }}
              >
                <FiFilter className="w-6 h-6 text-gray-700 group-hover:text-gray-800 transition-colors" />

                {/* Efecto de brillo reducido */}
                <div
                  className="absolute inset-0 bg-gradient-to-tr from-white/3 to-transparent opacity-40"
                  style={{ borderRadius: '24px' }}
                />

                {/* Reflejo superior más sutil */}
                <div
                  className="absolute top-1 left-1 right-1 h-1/3 bg-gradient-to-b from-white/8 to-transparent"
                  style={{ borderRadius: '20px 20px 8px 8px' }}
                />

                {/* Sombra interior más sutil */}
                <div
                  className="absolute inset-[2px] bg-gradient-to-b from-transparent via-transparent to-black/2"
                  style={{ borderRadius: '22px' }}
                />
              </motion.button>
            </motion.div>

            {/* Popover de filtros directo */}
            <AnimatePresence>
              {showFiltersPopover && (
                <>
                  {/* Overlay para cerrar al hacer clic fuera */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[150]"
                    onClick={() => setShowFiltersPopover(false)}
                  />

                  {/* Contenido del popover */}
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full right-0 mt-2 w-[90vw] max-w-sm md:max-w-md rounded-lg shadow-xl z-[200]"
                    style={{
                      backgroundColor: 'rgba(36, 40, 50, 1)',
                      backgroundImage: 'linear-gradient(139deg, rgba(36, 40, 50, 1) 0%, rgba(36, 40, 50, 1) 0%, rgba(37, 28, 40, 1) 100%)',
                      border: '1px solid #42434a',
                      padding: '15px 0px',
                      transform: 'translateX(-80%)'
                    }}
                  >
                    <div className="flex flex-col gap-2">
                      {/* Header */}
                      <div className="px-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold" style={{ color: '#7e8590' }}>Filtros</h3>
                        <motion.button
                          onClick={() => setShowFiltersPopover(false)}
                          whileTap={{ scale: 0.95 }}
                          className="p-1 rounded-full bg-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-600/50 transition-all duration-200"
                        >
                          <FiX className="w-4 h-4" />
                        </motion.button>
                      </div>

                      {/* Separator */}
                      <div style={{ borderTop: '1.5px solid #42434a' }}></div>

                                             {/* Contenido de filtros sin el botón trigger */}
                       <div className="px-4">
                         <IncidentFiltersContent
                           filters={filters}
                           onFiltersChangeAction={handleFiltersChange}
                           onNeighborhoodSelect={handleNeighborhoodSelect}
                         />
                       </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Contenido principal del mapa */}
      <div className="w-full h-full relative z-10">
        <IncidentsView />
      </div>

      {/* Overlay para bloquear interacción del mapa cuando el panel está expandido */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-[130] md:hidden"
          onClick={handleOutsideClick}
          style={{
            background: 'rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(2px)'
          }}
        />
      )}

      {/* Bottom Sheet con lista de incidentes */}
      <motion.div
        className="fixed left-0 right-0 z-[140] md:hidden bg-gray-900/95 backdrop-blur-lg border-t border-gray-700/50 rounded-t-2xl shadow-2xl"
        style={{
          height: bottomSheetHeight,
          bottom: 80
        }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDrag={handleBottomSheetDrag}
        onDragEnd={handleBottomSheetDragEnd}
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={togglePanel}
      >
        {/* Handle del bottom sheet */}
        <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-gray-600 rounded-full" />
        </div>

        {/* Header clickeable completo */}
        <div
          className="px-4 pb-3 border-b border-gray-700/30 cursor-pointer hover:bg-gray-800/20 transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                className="p-2.5 rounded-xl"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <svg className="w-5 h-5 text-[#8BB5FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </motion.div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3
                    className="font-manrope text-lg font-semibold text-[#B5CCF4]"
                    style={{
                      textShadow: '0 0 8px rgba(181, 204, 244, 0.3)'
                    }}
                  >
                    Incidentes
                  </h3>
                  <motion.div
                    className="px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: 'rgba(139, 181, 255, 0.15)',
                      border: '1px solid rgba(139, 181, 255, 0.3)',
                      color: '#8BB5FF'
                    }}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {incidents.length}
                  </motion.div>
                </div>
                <p className="text-sm text-gray-400 mt-0.5">
                  {incidents.length === 0 ? 'No hay incidentes' :
                   incidents.length === 1 ? '1 incidente verificado' :
                   `${incidents.length} incidentes verificados`}
                </p>
              </div>
            </div>
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="p-2.5 rounded-xl text-gray-400 hover:text-[#8BB5FF] transition-all duration-300"
              style={{
                background: 'transparent',
                border: 'transparent',
              }}
              whileHover={{
                background: 'rgba(139, 181, 255, 0.1)',
                borderColor: 'rgba(139, 181, 255, 0.3)'
              }}
            >
              <motion.svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </motion.svg>
            </motion.div>
          </div>
        </div>

        {/* Lista de incidentes */}
        <div className="flex-1 overflow-y-auto px-4 py-3" style={{ maxHeight: isExpanded ? '600px' : 'auto' }}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <CustomLoader
                loadingText="cargando"
                words={["incidentes", "reportes", "datos", "ubicaciones", "información"]}
                className="h-20"
              />
            </div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-[#B5CCF4] font-medium">No hay incidentes</p>
              <p className="text-sm text-gray-500 mt-1">Los incidentes aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {(isExpanded ? incidents : incidents.slice(0, 3)).map((incident, index) => {
                const isFirst = index === 0;

                return (
                  <div key={incident._id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="rounded-2xl border cursor-pointer transition-all duration-300 group"
                      style={{
                        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(30, 41, 59, 0.4) 100%)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(139, 181, 255, 0.15)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                        padding: '18px'
                      }}
                      whileTap={{ scale: 0.98 }}
                      whileHover={{
                        boxShadow: '0 12px 40px rgba(139, 181, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                        borderColor: 'rgba(139, 181, 255, 0.4)',
                        y: -2
                      }}
                      onClick={() => handleIncidentClick(incident)}
                    >
                      <div className="flex items-start space-x-4">
                        <motion.div
                          className={`p-3 rounded-xl ${getIncidentTypeColor(incident.type)} text-white shadow-lg relative overflow-hidden`}
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="w-6 h-6 relative z-10">
                            {getIncidentIcon(incident.type)}
                          </div>
                          {/* Efecto de brillo */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <h4
                              className="font-manrope font-semibold text-[#B5CCF4] text-base truncate pr-2"
                              style={{
                                textShadow: '0 0 6px rgba(181, 204, 244, 0.3)'
                              }}
                            >
                              {incident.type || 'Incidente'}
                            </h4>
                            <span
                              className="text-xs font-medium px-2.5 py-1.5 rounded-lg flex-shrink-0"
                              style={{
                                background: 'rgba(139, 181, 255, 0.1)',
                                border: '1px solid rgba(139, 181, 255, 0.2)',
                                color: '#8BB5FF'
                              }}
                            >
                              {formatDate(incident.date)}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm mb-4 line-clamp-2 leading-relaxed">
                            {incident.description}
                          </p>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-gray-400 truncate flex items-center gap-2 max-w-[60%]">
                              <svg className="w-4 h-4 text-[#8BB5FF] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              <span className="truncate">{incident.address}</span>
                            </span>
                            <motion.span
                              className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium flex-shrink-0"
                              style={{
                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                color: '#10B981'
                              }}
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.2 }}
                            >
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              VERIFICADO
                            </motion.span>
                          </div>
                          <div
                            className="pt-3 border-t"
                            style={{
                              borderColor: 'rgba(139, 181, 255, 0.2)'
                            }}
                          >
                            <motion.p
                              className="text-xs text-center font-medium"
                              style={{
                                color: '#8BB5FF',
                                textShadow: '0 0 4px rgba(139, 181, 255, 0.3)'
                              }}
                              whileHover={{ scale: 1.02 }}
                              transition={{ duration: 0.2 }}
                            >
                              Toca para ver en el mapa →
                            </motion.p>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Línea separadora después del primer incidente */}
                    {isFirst && incidents.length > 1 && (
                      <div className="my-4 flex items-center">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"></div>
                        <span className="px-3 text-xs text-gray-500">Otros incidentes</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"></div>
                      </div>
                    )}
                  </div>
                );
              })}
              {isExpanded && incidents.length > 3 && (
                <div className="text-center py-2 text-gray-500 text-sm">
                  {incidents.length} incidentes en total
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SwipeableIncidentsView;
