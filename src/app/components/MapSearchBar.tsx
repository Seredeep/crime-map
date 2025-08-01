'use client';

import { useUserLocation } from '@/lib/hooks/useUserLocation';
import { IncidentFilters as IncidentFiltersType } from '@/lib/types/global';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FiAlertTriangle, FiMapPin, FiSearch } from 'react-icons/fi';

interface SearchResult {
  id: string;
  type: 'address' | 'incident';
  title: string;
  subtitle: string;
  coordinates?: [number, number];
  incident?: any; // Para incidentes completos
  distance?: number; // Distancia desde la ubicación del usuario
}

interface MapSearchBarProps {
  onLocationSelect?: (coordinates: [number, number], address: string) => void;
  onIncidentSelect?: (incidentId: string) => void;
  className?: string;
  activeFilters?: IncidentFiltersType; // Filtros activos para la búsqueda
}

const MapSearchBar = ({
  onLocationSelect,
  onIncidentSelect,
  className = '',
  activeFilters
}: MapSearchBarProps) => {
  const t = useTranslations('Search');
  const { userLocation, isLoading: locationLoading, error: locationError, neighborhood } = useUserLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Función para buscar direcciones con filtros y ubicación del usuario
  const searchAddresses = useCallback(async (query: string): Promise<SearchResult[]> => {
    try {
      console.log('🔍 Searching addresses for:', query);

      // Construir parámetros de búsqueda
      const params = new URLSearchParams();
      params.append('q', query);

      // Agregar coordenadas del usuario si están disponibles
      if (userLocation) {
        params.append('lat', userLocation[1].toString());
        params.append('lng', userLocation[0].toString());
      }

      const url = `/api/geocode?${params.toString()}`;
      console.log('🌍 Geocoding URL:', url);

      const response = await fetch(url);
      console.log('🌍 Geocoding response status:', response.status);

      if (!response.ok) {
        console.error('❌ Geocoding response not ok:', response.status, response.statusText);
        return [];
      }

      const data = await response.json();
      console.log('🌍 Geocoding data:', data);

      const results = (data.features || []).slice(0, 5).map((feature: any) => ({
        id: feature.properties.id || feature.properties.gid,
        type: 'address' as const,
        title: feature.properties.main_text || feature.properties.name || t('address'),
        subtitle: feature.properties.secondary_text || feature.properties.label || t('location'),
        coordinates: feature.geometry.coordinates
      }));

      console.log('🌍 Address results:', results);
      return results;
    } catch (error) {
      console.error('❌ Error searching addresses:', error);
      return [];
    }
  }, [userLocation]);

  // Función para buscar incidentes con filtros
  const searchIncidents = useCallback(async (query: string): Promise<SearchResult[]> => {
    try {
      console.log('🚨 Searching incidents for:', query);

      // Construir parámetros de búsqueda con filtros
      const params = new URLSearchParams();
      params.append('q', query);

      // Agregar filtros activos si están disponibles
      if (activeFilters) {
        if (activeFilters.dateFrom) params.append('dateFrom', activeFilters.dateFrom);
        if (activeFilters.dateTo) params.append('dateTo', activeFilters.dateTo);
        if (activeFilters.neighborhoodId) params.append('neighborhoodId', activeFilters.neighborhoodId);
        if (activeFilters.status) params.append('status', activeFilters.status);
        if (activeFilters.type) params.append('type', activeFilters.type);
        if (activeFilters.tags && activeFilters.tags.length > 0) {
          params.append('tags', activeFilters.tags.join(','));
        }
      }

      // Agregar coordenadas del usuario para búsqueda por proximidad
      if (userLocation) {
        params.append('userLat', userLocation[1].toString());
        params.append('userLng', userLocation[0].toString());
      }

      const url = `/api/incidents/search?${params.toString()}`;
      console.log('🚨 Incidents search URL:', url);

      const response = await fetch(url);
      console.log('🚨 Incidents response status:', response.status);

      if (!response.ok) {
        console.error('❌ Incidents response not ok:', response.status, response.statusText);
        return [];
      }

      const data = await response.json();
      console.log('🚨 Incidents data:', data);

      const results = data.incidents || [];
      console.log('🚨 Incident results:', results);
      return results;
    } catch (error) {
      console.error('❌ Error searching incidents:', error);
      return [];
    }
  }, [activeFilters, userLocation]);

  // Función principal de búsqueda
  const performSearch = useCallback(async (query: string) => {
    console.log('🔍 Starting search for:', query);

    if (!query.trim() || query.trim().length < 2) {
      console.log('❌ Query too short, clearing results');
      setResults([]);
      return;
    }

    setIsLoading(true);
    console.log('⏳ Search loading started');

    try {
      // Buscar direcciones e incidentes en paralelo
      console.log('🔄 Starting parallel search...');
      const [addressResults, incidentResults] = await Promise.all([
        searchAddresses(query),
        searchIncidents(query)
      ]);

      console.log('📊 Search results:', {
        addresses: addressResults.length,
        incidents: incidentResults.length
      });

      // Combinar y ordenar resultados
      const combinedResults = [
        ...addressResults.map(result => ({ ...result, priority: 1 })), // Direcciones primero
        ...incidentResults.map(result => ({ ...result, priority: 2 })) // Incidentes después
      ];

      console.log('🔗 Combined results:', combinedResults.length);

      // Ordenar por prioridad y limitar a 10 resultados totales
      const sortedResults = combinedResults
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 10)
        .map(({ priority, ...result }) => result);

      console.log('📋 Final sorted results:', sortedResults.length);
      setResults(sortedResults);
    } catch (error) {
      console.error('❌ Error performing search:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
      console.log('✅ Search loading finished');
    }
  }, [searchAddresses, searchIncidents]);

  // Efecto para manejar la búsqueda con debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchTerm);
      }, 300); // Debounce de 300ms
    } else {
      setResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, performSearch]);

  // Manejar selección de resultado
  const handleResultSelect = (result: SearchResult) => {
    if (result.type === 'address' && result.coordinates && onLocationSelect) {
      onLocationSelect(result.coordinates, result.title);
    } else if (result.type === 'incident' && onIncidentSelect) {
      onIncidentSelect(result.id);
    }

    // Limpiar búsqueda después de seleccionar
    setSearchTerm('');
    setResults([]);
  };

  // Función para formatear distancia
  const formatDistance = (distance?: number) => {
    if (!distance) return null;
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        {/* Contenedor principal con efectos glass avanzados */}
        <div className="relative border-transparent">
          <div
            className="relative flex items-center transition-all focus:rounded-full duration-300 hover:scale-[1.01]"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px)',
              border: 'transparent',
              boxShadow: `
                inset 0 0 10px rgba(255,255,255,0.04),
                0 0 30px rgba(255,255,255,0.02),
                0 8px 32px rgba(0, 0, 0, 0.08),
                0 4px 16px rgba(0, 0, 0, 0.06),
                0 20px 60px rgba(0, 0, 0, 0.04)
              `,
              borderRadius: '20px'
            }}
          >
            {/* Ícono de búsqueda */}
            <div className="pl-5 pr-3">
              <FiSearch className="w-5 h-5 text-gray-700" />
            </div>

            {/* Input de búsqueda */}
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                locationLoading ? "Cargando ubicación..." :
                userLocation ? `Buscar en ${neighborhood}...` :
                t('placeholder')
              }
              className="flex-1 py-2 px-3 focus:rounded-full bg-transparent text-gray-900 placeholder-gray-600 border-transparent focus:outline-none font-medium"
            />

            {/* Spinner de carga */}
            {isLoading && (
              <div className="px-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
              </div>
            )}

            {/* Indicador de ubicación del usuario */}
            {userLocation && !locationLoading && (
              <div className="px-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title={`Buscando cerca de ${neighborhood}`} />
              </div>
            )}

            {/* Indicador de error de ubicación */}
            {locationError && (
              <div className="px-3">
                <div className="w-2 h-2 bg-red-500 rounded-full" title={locationError} />
              </div>
            )}

            {/* Efectos adicionales para el contenedor */}
            <div
              className="absolute inset-0 bg-gradient-to-tr from-white/2 to-transparent opacity-30 pointer-events-none"
              style={{ borderRadius: '20px' }}
            />

            <div
              className="absolute top-1 left-1 right-1 h-1/3 bg-gradient-to-b from-white/6 to-transparent pointer-events-none"
              style={{ borderRadius: '18px 18px 8px 8px' }}
            />

            <div
              className="absolute inset-[2px] bg-gradient-to-b from-transparent via-transparent to-black/2 pointer-events-none"
              style={{ borderRadius: '18px' }}
            />
          </div>

          {/* Resultados de búsqueda con estilo glass mejorado */}
          <AnimatePresence>
            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="absolute top-full left-0 right-0 mt-3 overflow-hidden z-10"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: `
                    inset 0 0 10px rgba(255,255,255,0.04),
                    0 0 30px rgba(255,255,255,0.02),
                    0 8px 32px rgba(0, 0, 0, 0.10),
                    0 4px 16px rgba(0, 0, 0, 0.08),
                    0 20px 60px rgba(0, 0, 0, 0.05)
                  `,
                  borderRadius: '20px'
                }}
              >
                <div className="max-h-64 overflow-y-auto">
                  {results.map((result, index) => (
                    <motion.button
                      key={result.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleResultSelect(result)}
                      className="w-full flex items-center space-x-4 p-4 hover:bg-white/10 transition-all duration-200 text-left border-b border-white/10 last:border-b-0 group"
                    >
                      <div className={`p-2.5 rounded-xl backdrop-blur-sm transition-all duration-200 group-hover:scale-105 ${result.type === 'address'
                          ? 'bg-blue-500/20 text-blue-700 border border-blue-300/30'
                          : 'bg-red-500/20 text-red-700 border border-red-300/30'
                        }`}>
                        {result.type === 'address' ? (
                          <FiMapPin className="w-4 h-4" />
                        ) : (
                          <FiAlertTriangle className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate group-hover:text-gray-800 transition-colors">
                          {result.title}
                        </h4>
                        <p className="text-sm text-gray-600 truncate">
                          {result.subtitle}
                        </p>
                        {result.type === 'incident' && result.incident?.date && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(result.incident.date).toLocaleDateString('es-ES')}
                          </p>
                        )}
                        {/* Mostrar distancia si tenemos ubicación del usuario */}
                        {userLocation && result.coordinates && (
                          <p className="text-xs text-green-600 mt-1">
                            📍 {result.distance ? formatDistance(result.distance) : 'Cerca de tu barrio'}
                          </p>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Efectos adicionales para los resultados */}
                <div
                  className="absolute inset-0 bg-gradient-to-tr from-white/2 to-transparent opacity-30 pointer-events-none"
                  style={{ borderRadius: '20px' }}
                />

                <div
                  className="absolute top-1 left-1 right-1 h-1/4 bg-gradient-to-b from-white/6 to-transparent pointer-events-none"
                  style={{ borderRadius: '18px 18px 8px 8px' }}
                />

                <div
                  className="absolute inset-[2px] bg-gradient-to-b from-transparent via-transparent to-black/2 pointer-events-none"
                  style={{ borderRadius: '18px' }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default MapSearchBar;
