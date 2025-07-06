'use client';

import { fetchIncidents } from '@/lib/incidentService';
import { Neighborhood } from '@/lib/neighborhoodService';
import { Incident, IncidentFilters } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import IncidentCharts from './IncidentCharts';
import IncidentDetails from './IncidentDetails';
import IncidentFiltersComponent from './IncidentFilters';
import Map from './Map';

// Componente para el panel de incidentes recientes
function RecentIncidentsPanel({ incidents, onIncidentClick, filters, onFiltersChange, onNeighborhoodSelect, isMobile = false }: {
  incidents: Incident[],
  onIncidentClick: (incident: Incident) => void,
  onViewStatsClick: () => void,
  showFilters: boolean,
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>,
  filters: IncidentFilters,
  onFiltersChange: (newFilters: IncidentFilters) => void,
  onNeighborhoodSelect: (neighborhood: Neighborhood | null) => void,
  isMobile?: boolean
}) {
  const [showStats, setShowStats] = useState(false);
  const [panelWidth, setPanelWidth] = useState(400);
  const [searchTerm, setSearchTerm] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Filtrar incidentes basado en el término de búsqueda
  const filteredIncidents = incidents.filter(incident =>
    incident.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    incident.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    incident.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Función para obtener el color según el tipo de incidente
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

  // Función para obtener el ícono según el tipo de incidente
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
      case 'hurto':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
            <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
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

  // Función para obtener el estado badge
  const getStatusBadge = (status?: string) => {
    const statusConfig = {
      verified: { label: 'VERIFIED', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
      pending: { label: 'PENDING', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      resolved: { label: 'RESOLVED', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  // Manejar el redimensionamiento del panel mejorado
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      const startX = e.clientX;
      const startWidth = panelWidth;

      const handleMouseMove = (e: MouseEvent) => {
        const newWidth = startWidth + (e.clientX - startX);
        if (newWidth >= 320 && newWidth <= 600) {
          setPanelWidth(newWidth);
        }
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
      };

      document.body.style.cursor = 'ew-resize';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    const resizerElement = resizeRef.current;
    if (resizerElement) {
      resizerElement.addEventListener('mousedown', handleMouseDown);
    }

    return () => {
      if (resizerElement) {
        resizerElement.removeEventListener('mousedown', handleMouseDown);
      }
    };
  }, [panelWidth]);

  return (
    <div
      ref={panelRef}
      className={`bg-gray-900/95 backdrop-blur-sm text-white h-full shadow-2xl z-10 border-r border-gray-700/50 relative transition-all duration-200 flex flex-col ${isResizing ? 'select-none' : ''} ${isMobile ? 'w-full' : ''}`}
      style={isMobile ? {} : { width: `${panelWidth}px` }}
    >
      {/* Header con controles */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 z-20">
        <div className={`p-4 ${isMobile ? 'pr-16' : ''}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-xl text-white">Incidentes</h2>
            {!isMobile && (
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowStats(!showStats)}
                  className={`p-2.5 rounded-xl transition-all duration-300 ease-in-out hover:shadow-lg transform hover:scale-105 ${showStats
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-700/50 hover:bg-gray-600 text-gray-300 border border-gray-600/50'
                    }`}
                  title="Ver estadísticas"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Contenedor de búsqueda y filtros */}
          <div className="relative flex justify-between items-center">
            <div className="flex-1 flex items-center gap-2 mr-4">
              <motion.div
                initial={{ width: "40px" }}
                animate={{ width: isSearchOpen ? "100%" : "40px" }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="relative flex-1"
              >
                {!isSearchOpen ? (
                  <button
                    onClick={() => {
                      setIsSearchOpen(true);
                      setTimeout(() => {
                        const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                        if (input) input.focus();
                      }, 100);
                    }}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors z-10"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                ) : (
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                )}
                <motion.input
                  type="text"
                  placeholder="Buscar incidentes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  initial={{ opacity: 0, x: 0 }}
                  animate={{
                    opacity: isSearchOpen ? 1 : 0,
                    x: isSearchOpen ? 0 : 0
                  }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl px-4 py-3 pl-11 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/10 transition-all duration-200"
                  onBlur={() => setIsSearchOpen(false)}
                  autoFocus={isSearchOpen}
                  style={{ pointerEvents: isSearchOpen ? 'auto' : 'none' }}
                />
                {searchTerm && isSearchOpen && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors z-10"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </motion.div>
            </div>

            <div className="flex items-center gap-2">
              <motion.span
                className="text-gray-400 absolute right-12"
                initial={{ opacity: 1, x: 0 }}
                animate={{
                  opacity: isSearchOpen ? 0 : 1,
                  x: isSearchOpen ? 20 : 0
                }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                Filtros
              </motion.span>
              <IncidentFiltersComponent
                filters={filters}
                onFiltersChangeAction={onFiltersChange}
                onNeighborhoodSelect={onNeighborhoodSelect}
              />
            </div>
          </div>

          {/* Contador de resultados */}
          <div className="mt-2 flex items-center justify-between text-sm text-gray-400">
            <span>
              {filteredIncidents.length} de {incidents.length} incidente{incidents.length !== 1 ? 's' : ''}
            </span>
            {searchTerm && (
              <span className="text-blue-400">Filtrando por: &quot;{searchTerm}&quot;</span>
            )}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {showStats ? (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="p-4 h-full overflow-y-auto"
            >
              <IncidentCharts incidents={filteredIncidents} />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="h-full overflow-y-auto"
            >
              {filteredIncidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <svg className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.44.963-5.966 2.514C5.68 17.842 5.316 18 4.828 18H4a2 2 0 01-2-2V4a2 2 0 012-2h5.172a2 2 0 011.414.586l.828.828A2 2 0 0012.828 4H20a2 2 0 012 2v12a2 2 0 01-2 2h-4.172a2 2 0 01-1.656-.879z" />
                  </svg>
                  <p>{searchTerm ? 'No se encontraron incidentes' : 'No hay incidentes disponibles'}</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {/* Incidente principal (más reciente) */}
                  {filteredIncidents.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      onClick={() => onIncidentClick(filteredIncidents[0])}
                      className="relative bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-sm rounded-2xl p-5 cursor-pointer border border-gray-600/30 hover:border-gray-500/50 transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-black/20 transform hover:-translate-y-1 group"
                    >
                      {/* Imagen de fondo borrosa */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      <div className="relative z-10">
                        {/* Header con estado */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className={`p-2 rounded-lg ${getIncidentTypeColor(filteredIncidents[0].type)} text-white`}>
                              {getIncidentIcon(filteredIncidents[0].type)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg text-white group-hover:text-blue-300 transition-colors">
                                {filteredIncidents[0].description || 'Sin descripción'}
                              </h3>
                              <p className="text-sm text-gray-400">{formatDate(filteredIncidents[0].date)}</p>
                            </div>
                          </div>
                          {getStatusBadge(filteredIncidents[0].status)}
                        </div>

                        {/* Ubicación */}
                        <div className="flex items-center text-gray-300 mb-4">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm">{filteredIncidents[0].address || 'Ubicación no disponible'}</span>
                        </div>

                        {/* Tags del tipo */}
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-700/50 text-gray-300 border border-gray-600/30">
                            {filteredIncidents[0].type || 'Sin tipo'}
                          </span>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Separador */}
                  {filteredIncidents.length > 1 && (
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-700/50"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-gray-900 px-3 text-xs text-gray-500 font-medium">INCIDENTES ANTERIORES</span>
                      </div>
                    </div>
                  )}

                  {/* Lista de incidentes anteriores */}
                  {filteredIncidents.slice(1).map((incident, index) => (
                    <motion.div
                      key={incident._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + (index + 1) * 0.05 }}
                      onClick={() => onIncidentClick(incident)}
                      className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 cursor-pointer border border-gray-700/30 hover:border-gray-600/50 transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-black/10 transform hover:-translate-y-0.5 group"
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-1.5 rounded-lg ${getIncidentTypeColor(incident.type)} text-white flex-shrink-0 mt-0.5`}>
                          {getIncidentIcon(incident.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-white group-hover:text-blue-300 transition-colors truncate">
                              {incident.description || 'Sin descripción'}
                            </h4>
                            <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                              {formatDate(incident.date)}
                            </span>
                          </div>

                          <p className="text-sm text-gray-400 mb-3 truncate">
                            {incident.address || 'Ubicación no disponible'}
                          </p>

                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-700/50 text-gray-300">
                              {incident.type || 'Sin tipo'}
                            </span>
                            {getStatusBadge(incident.status)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Handle de redimensionamiento mejorado - Solo en desktop */}
      {!isMobile && (
        <div
          ref={resizeRef}
          className={`absolute top-0 right-0 w-2 h-full cursor-ew-resize group hover:bg-blue-500/20 transition-all duration-200 flex items-center justify-center ${isResizing ? 'bg-blue-500/30' : ''
            }`}
          title="Arrastrar para redimensionar"
        >
          <div className="w-1 h-8 bg-gray-600 rounded-full group-hover:bg-blue-400 transition-colors duration-200"></div>
        </div>
      )}
    </div>
  );
}

export default function IncidentsView({
  incidents: externalIncidents,
  onIncidentUpdate: externalOnIncidentUpdate,
  onIncidentSelect: externalOnIncidentSelect
}: {
  incidents?: Incident[];
  onIncidentUpdate?: (updatedIncident: Incident) => void;
  onIncidentSelect?: (incident: Incident) => void;
} = {}) {
  const { data: session } = useSession();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const isEditorOrAdmin = session?.user?.role === 'editor' || session?.user?.role === 'admin';

  // Usar incidentes externos si se proporcionan, de lo contrario usar el estado interno
  const currentIncidents = externalIncidents || incidents;
  const isExternalMode = !!externalIncidents;

  const [filters, setFilters] = useState<IncidentFilters>(() => {
    // Set default date range to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    return {
      dateFrom: thirtyDaysAgo.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0],
      neighborhoodId: '83',
      status: 'verified' // Siempre iniciar con estado 'verified'
    };
  });

  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | null>(null);

  // Function to load incidents based on filters - solo si no estamos en modo externo
  const loadIncidents = useCallback(async () => {
    if (isExternalMode) return; // No cargar si estamos en modo externo

    setLoading(true);
    setError(null);

    try {
      const fetchedIncidents = await fetchIncidents(filters);
      setIncidents(fetchedIncidents);
    } catch (err) {
      console.error('Error fetching incidents:', err);
      setError('No se pudieron cargar los incidentes. Intente nuevamente más tarde.');
    } finally {
      setLoading(false);
    }
  }, [filters, isExternalMode]);

  // Load incidents on component mount and when filters change - solo si no estamos en modo externo
  useEffect(() => {
    if (!isExternalMode) {
      loadIncidents();
    } else {
      setLoading(false); // En modo externo, no hay loading
    }
  }, [loadIncidents, isExternalMode]);

  const handleIncidentSelected = (incident: Incident) => {
    setSelectedIncident(incident);
    setShowDetailsModal(true);
    // Llamar al handler externo si existe
    externalOnIncidentSelect?.(incident);
  };

  const handleIncidentUpdate = (updatedIncident: Incident) => {
    // Actualizar el incidente en la lista local
    if (!isExternalMode) {
      setIncidents(incidents.map(inc =>
        inc._id === updatedIncident._id ? updatedIncident : inc
      ));
    }
    // Actualizar el incidente seleccionado si es el mismo
    if (selectedIncident?._id === updatedIncident._id) {
      setSelectedIncident(updatedIncident);
    }
    // Llamar al handler externo si existe
    externalOnIncidentUpdate?.(updatedIncident);
  };

  // Handler for when filters change - solo si no estamos en modo externo
  const handleFiltersChange = useCallback((newFilters: IncidentFilters) => {
    if (isExternalMode) return; // No cambiar filtros en modo externo

    // Si el usuario no es editor o admin, forzar el estado a 'verified'
    if (!isEditorOrAdmin) {
      newFilters.status = 'verified';
    }
    setFilters(newFilters);
    if (selectedIncident) {
      setSelectedIncident(null);
    }
  }, [isEditorOrAdmin, selectedIncident, isExternalMode]);

  // Handler cuando se selecciona un barrio
  const handleNeighborhoodSelect = useCallback((neighborhood: Neighborhood | null) => {
    setSelectedNeighborhood(null);
    setTimeout(() => {
      setSelectedNeighborhood(neighborhood);
    }, 50);
  }, []);

  return (
    <div className="p-0 w-full h-full">
      <div className="rounded-lg overflow-hidden shadow-xl h-full relative flex">
        {loading ? (
          <div className="w-full h-full bg-gray-800/50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="w-full h-full bg-gray-800/50 flex items-center justify-center p-4 text-center">
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-300 mb-2">Error</h3>
              <p className="text-gray-400">{error}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Panel de incidentes recientes - Desktop */}
            <div className="hidden md:block h-full z-20 relative">
              <RecentIncidentsPanel
                incidents={currentIncidents}
                onIncidentClick={handleIncidentSelected}
                onViewStatsClick={() => { }}
                showFilters={false}
                setShowFilters={() => { }}
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onNeighborhoodSelect={handleNeighborhoodSelect}
                isMobile={false}
              />
            </div>

            {/* Mapa principal */}
            <div className="flex-1 h-full relative">
              <Map
                incidents={currentIncidents}
                onIncidentSelect={handleIncidentSelected}
                mode="incidents"
                selectedNeighborhood={selectedNeighborhood}
                onIncidentUpdate={handleIncidentUpdate}
              />

            </div>
          </>
        )}
      </div>

      {/* Modal de detalles del incidente */}
      {showDetailsModal && selectedIncident && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-gray-200">Detalles del Incidente</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-300 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] z-[1000]">
              <IncidentDetails
                incident={selectedIncident}
                onIncidentUpdate={handleIncidentUpdate}
              />
            </div>

            <div className="flex items-center justify-end p-4 border-t border-gray-700">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
