'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchNeighborhoods, Neighborhood } from '@/lib/neighborhoodService';
import { IncidentFilters as FiltersType } from '@/lib/types';
import { useSession } from 'next-auth/react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Tags, 
  CheckCircle,
  Clock3,
  Trash2,
  List
} from 'lucide-react';

interface IncidentFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
  onNeighborhoodSelect?: (neighborhood: Neighborhood | null) => void;
}

// Ejemplo de etiquetas comunes (en una implementación real se cargarían desde el backend)
const COMMON_TAGS = [
  'robo',
  'asalto',
  'vandalismo',
  'disturbio',
  'amenaza',
  'sospechoso',
  'violencia'
];

export default function IncidentFilters({ filters, onFiltersChange, onNeighborhoodSelect }: IncidentFiltersProps) {
  const { data: session } = useSession();
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tags || []);
  const [open, setOpen] = useState(false);

  const isEditorOrAdmin = session?.user?.role === 'editor' || session?.user?.role === 'admin';

  // Contador de filtros activos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.neighborhoodId && filters.neighborhoodId !== '83') count++;
    if (filters.status && filters.status !== 'verified') count++;
    if (filters.tags && filters.tags.length > 0) count++;
    if (filters.timeFrom || filters.timeTo || filters.time) count++;

    // Verificar si las fechas son diferentes al rango por defecto
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const defaultDateFrom = thirtyDaysAgo.toISOString().split('T')[0];
    const defaultDateTo = today.toISOString().split('T')[0];

    if (filters.dateFrom !== defaultDateFrom || filters.dateTo !== defaultDateTo) count++;

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
    onFiltersChange({
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
  }, [filters, neighborhoods, onFiltersChange, onNeighborhoodSelect]);

  // Handle date range changes - memoized
  const handleDateFromChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      dateFrom: e.target.value || undefined,
      date: undefined // Clear single date if using range
    });
  }, [filters, onFiltersChange]);

  const handleDateToChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      dateTo: e.target.value || undefined,
      date: undefined // Clear single date if using range
    });
  }, [filters, onFiltersChange]);

  // Handle time range changes - memoized
  const handleTimeFromChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      timeFrom: e.target.value || undefined,
      time: undefined // Clear time period if using range
    });
  }, [filters, onFiltersChange]);

  const handleTimeToChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      timeTo: e.target.value || undefined,
      time: undefined // Clear time period if using range
    });
  }, [filters, onFiltersChange]);

  // Handle time period selection - memoized
  const handleTimePeriodChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      time: value || undefined,
      timeFrom: undefined, // Clear time range if using period
      timeTo: undefined
    });
  }, [filters, onFiltersChange]);

  // Handle status change - memoized
  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as 'pending' | 'verified' | 'resolved' | '';
    onFiltersChange({
      ...filters,
      status: value || undefined
    });
  }, [filters, onFiltersChange]);

  // Handle tag selection - memoized
  const handleTagToggle = useCallback((tag: string) => {
    const newSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];

    setSelectedTags(newSelectedTags);

    onFiltersChange({
      ...filters,
      tags: newSelectedTags.length > 0 ? newSelectedTags : undefined
    });
  }, [selectedTags, filters, onFiltersChange]);

  // Clear all filters - memoized
  const handleClearFilters = useCallback(() => {
    setSelectedTags([]);
    const today = new Date();
    const defaultDate = new Date('2013-01-01');

    onFiltersChange({
      dateFrom: defaultDate.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0],
      neighborhoodId: '83', // Bosque Peralta Ramos
      status: 'verified' // Siempre volver a 'verified' al limpiar filtros
    });

    // Limpiar también el barrio seleccionado
    if (onNeighborhoodSelect) {
      onNeighborhoodSelect(null);
    }
  }, [onFiltersChange, onNeighborhoodSelect]);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <motion.button
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
      </PopoverPrimitive.Trigger>
      
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="z-50 w-80 md:w-96 rounded-lg shadow-xl animate-in data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
          style={{
            backgroundColor: 'rgba(36, 40, 50, 1)',
            backgroundImage: 'linear-gradient(139deg, rgba(36, 40, 50, 1) 0%, rgba(36, 40, 50, 1) 0%, rgba(37, 28, 40, 1) 100%)',
            border: '1px solid #42434a',
            padding: '15px 0px'
          }}
          sideOffset={5}
          align="end"
        >
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-2"
          >
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
          </motion.div>
          <PopoverPrimitive.Arrow className="fill-gray-800" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}