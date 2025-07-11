'use client';

import { Neighborhood, fetchNeighborhoods } from '@/lib/services/neighborhoods';
import { IncidentFilters as FiltersType } from '@/lib/types/global';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  CheckCircle,
  Clock,
  Clock3,
  List,
  MapPin,
  Tags,
  Trash2
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface IncidentFiltersProps {
  filters: FiltersType;
  onFiltersChangeAction: (filters: FiltersType) => void;
  onNeighborhoodSelect?: (neighborhood: Neighborhood | null) => void;
}

// Common tags for quick filtering
const COMMON_TAGS = [
  'robo', 'hurto', 'asalto', 'vandalismo', 'drogas', 'ruido', 'violencia', 'accidente'
];

export default function IncidentFilters({ filters, onFiltersChangeAction, onNeighborhoodSelect }: IncidentFiltersProps) {
  const [open, setOpen] = useState(false);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tags || []);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const { data: session } = useSession();

  // Check if user is editor or admin
  const isEditorOrAdmin = useMemo(() => {
    if (!session?.user) return false;
    const userRole = (session.user as any).role;
    return userRole === 'editor' || userRole === 'admin';
  }, [session]);

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.neighborhoodId) count++;
    if (filters.status) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.timeFrom || filters.timeTo) count++;
    if (filters.time) count++;
    if (filters.tags && filters.tags.length > 0) count++;
    return count;
  }, [filters]);

  // Load neighborhoods on component mount
  useEffect(() => {
    async function loadNeighborhoods() {
      setLoading(true);
      try {
        const data = await fetchNeighborhoods();

        // Ordenar los barrios alfabéticamente por el nombre
        const sortedNeighborhoods = [...data].sort((a, b) => {
          const nameA = a.properties.soc_fomen?.toLowerCase() || '';
          const nameB = b.properties.soc_fomen?.toLowerCase() || '';
          return nameA.localeCompare(nameB, 'es');
        });

        setNeighborhoods(sortedNeighborhoods);
      } catch (err) {
        console.error('Error loading neighborhoods:', err);
        setError('No se pudieron cargar los barrios');
      } finally {
        setLoading(false);
      }
    }

    loadNeighborhoods();
  }, []);

  // Handle neighborhood selection change - memoized
  const handleNeighborhoodChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;

    // Actualizar filtros
    onFiltersChangeAction({
      ...filters,
      neighborhoodId: value || undefined
    });

    // Buscar y pasar el objeto completo del barrio si hay un callback
    if (onNeighborhoodSelect) {
      if (value) {
        const selectedNeighborhood = neighborhoods.find(
          n => n.properties.id.toString() === value
        );
        onNeighborhoodSelect(selectedNeighborhood || null);
      } else {
        onNeighborhoodSelect(null);
      }
    }
  }, [filters, neighborhoods, onFiltersChangeAction, onNeighborhoodSelect]);

  // Handle date range changes - memoized
  const handleDateFromChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChangeAction({
      ...filters,
      dateFrom: e.target.value || undefined,
      date: undefined // Clear single date if using range
    });
  }, [filters, onFiltersChangeAction]);

  const handleDateToChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChangeAction({
      ...filters,
      dateTo: e.target.value || undefined,
      date: undefined // Clear single date if using range
    });
  }, [filters, onFiltersChangeAction]);

  // Handle time range changes - memoized
  const handleTimeFromChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChangeAction({
      ...filters,
      timeFrom: e.target.value || undefined
    });
  }, [filters, onFiltersChangeAction]);

  const handleTimeToChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChangeAction({
      ...filters,
      timeTo: e.target.value || undefined
    });
  }, [filters, onFiltersChangeAction]);

  // Handle time period change - memoized
  const handleTimePeriodChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChangeAction({
      ...filters,
      time: e.target.value || undefined
    });
  }, [filters, onFiltersChangeAction]);

  // Handle status change - memoized
  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChangeAction({
      ...filters,
      status: e.target.value as 'pending' | 'verified' | 'resolved' | undefined
    });
  }, [filters, onFiltersChangeAction]);

  // Handle tag toggle - memoized
  const handleTagToggle = useCallback((tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];

    setSelectedTags(newTags);
    onFiltersChangeAction({
      ...filters,
      tags: newTags.length > 0 ? newTags : undefined
    });
  }, [selectedTags, filters, onFiltersChangeAction]);

  // Clear all filters - memoized
  const handleClearFilters = useCallback(() => {
    setSelectedTags([]);
    const today = new Date();
    const defaultDate = new Date('2013-01-01');

    onFiltersChangeAction({
      dateFrom: defaultDate.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0],
      neighborhoodId: '83', // Bosque Peralta Ramos
      status: 'verified' // Siempre volver a 'verified' al limpiar filtros
    });

    // Limpiar también el barrio seleccionado
    if (onNeighborhoodSelect) {
      onNeighborhoodSelect(null);
    }
  }, [onFiltersChangeAction, onNeighborhoodSelect]);

  // Handle click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        triggerRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  return (
    <div className="relative">
      <motion.button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center p-2 text-gray-400 hover:text-white rounded-lg transition-all duration-300"
        whileTap={{ scale: 0.95 }}
        aria-label="Filtros de incidentes"
      >
        <List className="h-6 w-6" />

        <AnimatePresence>
          {activeFiltersCount > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 text-xs bg-blue-500 text-white rounded-full"
            >
              {activeFiltersCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 w-[90vw] max-w-sm md:max-w-md rounded-lg shadow-xl z-[200]"
            style={{
              backgroundColor: 'rgba(36, 40, 50, 1)',
              backgroundImage: 'linear-gradient(139deg, rgba(36, 40, 50, 1) 0%, rgba(36, 40, 50, 1) 0%, rgba(37, 28, 40, 1) 100%)',
              border: '1px solid #42434a',
              padding: '15px 0px',
              transform: 'translateX(-50%)'
            }}
          >
            <div className="flex flex-col gap-2">
              {/* Header */}
              <div className="px-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold" style={{ color: '#7e8590' }}>Filtros</h3>
                <AnimatePresence>
                  {activeFiltersCount > 0 && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      onClick={(e) => {
                        e.preventDefault();
                        handleClearFilters();
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all duration-300"
                      style={{ color: '#bd89ff' }}
                      whileHover={{
                        backgroundColor: 'rgba(56, 45, 71, 0.836)',
                        transform: 'translate(1px, -1px)'
                      }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Limpiar
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Separator */}
              <div style={{ borderTop: '1.5px solid #42434a' }}></div>

              {/* Filters List */}
              <div className="px-3 space-y-1">
                {/* Neighborhood Filter */}
                <motion.div
                  className="flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-300 cursor-pointer"
                  style={{ color: '#7e8590' }}
                  whileHover={{
                    backgroundColor: '#5353ff',
                    color: '#ffffff',
                    transform: 'translate(1px, -1px)'
                  }}
                  whileTap={{ scale: 0.99 }}
                >
                  <MapPin className="h-5 w-5" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Barrio</p>
                    <select
                      className="w-full bg-transparent border-none outline-none text-sm appearance-none cursor-pointer"
                      value={filters.neighborhoodId || ''}
                      onChange={handleNeighborhoodChange}
                      disabled={loading}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="">Todos los barrios</option>
                      {error ? (
                        <option disabled>Error al cargar barrios</option>
                      ) : loading ? (
                        <option disabled>Cargando barrios...</option>
                      ) : (
                        neighborhoods.map((neighborhood) => (
                          <option key={neighborhood._id} value={neighborhood.properties.id.toString()}>
                            {neighborhood.properties.soc_fomen}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </motion.div>

                {/* Status Filter - solo visible para editores y administradores */}
                {isEditorOrAdmin && (
                  <motion.div
                    className="flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-300 cursor-pointer"
                    style={{ color: '#7e8590' }}
                    whileHover={{
                      backgroundColor: '#5353ff',
                      color: '#ffffff',
                      transform: 'translate(1px, -1px)'
                    }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <CheckCircle className="h-5 w-5" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Estado</p>
                      <select
                        className="w-full bg-transparent border-none outline-none text-sm appearance-none cursor-pointer"
                        value={filters.status || ''}
                        onChange={handleStatusChange}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">Todos los estados</option>
                        <option value="pending">Pendiente</option>
                        <option value="verified">Verificado</option>
                        <option value="resolved">Resuelto</option>
                      </select>
                    </div>
                  </motion.div>
                )}

                {/* Date Range Filter */}
                <motion.div
                  className="flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-300 cursor-pointer"
                  style={{ color: '#7e8590' }}
                  whileHover={{
                    backgroundColor: '#5353ff',
                    color: '#ffffff',
                    transform: 'translate(1px, -1px)'
                  }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Calendar className="h-5 w-5" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Fechas</p>
                    <div className="flex gap-2 text-xs">
                      <input
                        type="date"
                        className="flex-1 bg-transparent border-none outline-none cursor-pointer"
                        value={filters.dateFrom || ''}
                        onChange={handleDateFromChange}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span>-</span>
                      <input
                        type="date"
                        className="flex-1 bg-transparent border-none outline-none cursor-pointer"
                        value={filters.dateTo || ''}
                        onChange={handleDateToChange}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Time Range Filter */}
                <motion.div
                  className="flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-300 cursor-pointer"
                  style={{ color: '#7e8590' }}
                  whileHover={{
                    backgroundColor: '#5353ff',
                    color: '#ffffff',
                    transform: 'translate(1px, -1px)'
                  }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Clock className="h-5 w-5" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Horas</p>
                    <div className="flex gap-2 text-xs">
                      <input
                        type="time"
                        className="flex-1 bg-transparent border-none outline-none cursor-pointer"
                        value={filters.timeFrom || ''}
                        onChange={handleTimeFromChange}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span>-</span>
                      <input
                        type="time"
                        className="flex-1 bg-transparent border-none outline-none cursor-pointer"
                        value={filters.timeTo || ''}
                        onChange={handleTimeToChange}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Time Period Filter */}
                <motion.div
                  className="flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-300 cursor-pointer"
                  style={{ color: '#7e8590' }}
                  whileHover={{
                    backgroundColor: '#5353ff',
                    color: '#ffffff',
                    transform: 'translate(1px, -1px)'
                  }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Clock3 className="h-5 w-5" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Período</p>
                    <select
                      className="w-full bg-transparent border-none outline-none text-sm appearance-none cursor-pointer"
                      value={filters.time || ''}
                      onChange={handleTimePeriodChange}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="">Cualquier hora</option>
                      <option value="morning">Mañana (6:00 - 12:00)</option>
                      <option value="afternoon">Tarde (12:00 - 18:00)</option>
                      <option value="evening">Noche (18:00 - 00:00)</option>
                      <option value="night">Madrugada (00:00 - 6:00)</option>
                    </select>
                  </div>
                </motion.div>
              </div>

              {/* Separator */}
              <div style={{ borderTop: '1.5px solid #42434a' }}></div>

              {/* Tags Section */}
              <div className="px-3">
                <motion.div
                  className="flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-300"
                  style={{ color: '#bd89ff' }}
                  whileHover={{
                    backgroundColor: 'rgba(56, 45, 71, 0.836)',
                    transform: 'translate(1px, -1px)'
                  }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Tags className="h-5 w-5" />
                  <p className="font-semibold text-sm">Etiquetas</p>
                </motion.div>

                <div className="px-2 pt-2">
                  <div className="flex flex-wrap gap-2">
                    {COMMON_TAGS.map((tag, index) => (
                      <motion.button
                        key={tag}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleTagToggle(tag)}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-300 font-medium ${
                          selectedTags.includes(tag)
                            ? 'text-white shadow-lg shadow-blue-500/20'
                            : 'hover:text-white'
                        }`}
                        style={{
                          backgroundColor: selectedTags.includes(tag) ? '#5353ff' : 'rgba(126, 133, 144, 0.1)',
                          color: selectedTags.includes(tag) ? '#ffffff' : '#7e8590'
                        }}
                        whileHover={!selectedTags.includes(tag) ? {
                          backgroundColor: '#5353ff',
                          color: '#ffffff',
                          transform: 'translate(1px, -1px)'
                        } : {}}
                        whileTap={{ scale: 0.99 }}
                      >
                        {tag}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
