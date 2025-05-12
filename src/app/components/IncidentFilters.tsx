'use client';

import React, { useState, useEffect } from 'react';
import { fetchNeighborhoods, Neighborhood } from '@/lib/neighborhoodService';
import { IncidentFilters as FiltersType } from '@/lib/types';
import { useSession } from 'next-auth/react';

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
  const [isOpen, setIsOpen] = useState(false);

  const isEditorOrAdmin = session?.user?.role === 'editor' || session?.user?.role === 'admin';

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

  // Initialize selected tags when filters change externally
  useEffect(() => {
    setSelectedTags(filters.tags || []);
  }, [filters.tags]);

  // Handle neighborhood selection change
  const handleNeighborhoodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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
  };

  // Handle date range changes
  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      dateFrom: e.target.value || undefined,
      date: undefined // Clear single date if using range
    });
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      dateTo: e.target.value || undefined,
      date: undefined // Clear single date if using range
    });
  };

  // Handle time range changes
  const handleTimeFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      timeFrom: e.target.value || undefined,
      time: undefined // Clear time period if using range
    });
  };

  const handleTimeToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      timeTo: e.target.value || undefined,
      time: undefined // Clear time period if using range
    });
  };

  // Handle time period selection (for backward compatibility)
  const handleTimePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      time: value || undefined,
      timeFrom: undefined, // Clear time range if using period
      timeTo: undefined
    });
  };

  // Handle status change
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as 'pending' | 'verified' | 'resolved' | '';
    onFiltersChange({
      ...filters,
      status: value || undefined
    });
  };

  // Handle tag selection
  const handleTagToggle = (tag: string) => {
    const newSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newSelectedTags);
    
    onFiltersChange({
      ...filters,
      tags: newSelectedTags.length > 0 ? newSelectedTags : undefined
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
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
  };

  // Count active filters
  const activeFiltersCount = Object.keys(filters).length;

  const toggleFilters = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleFilters}
        className="w-full flex items-center justify-between p-4 bg-gray-900/50 rounded-lg backdrop-blur-sm hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <span className="text-gray-200">Filtros</span>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {activeFiltersCount > 0 && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                handleClearFilters();
              }}
              className="px-2 py-1 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-full cursor-pointer"
            >
              Limpiar
            </div>
          )}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </button>

      {/* Filters content */}
      {isOpen && (
        <div className="mt-4 space-y-4 bg-gray-900/50 p-4 rounded-lg backdrop-blur-sm">
          {/* Grid de filtros principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Filtro de barrio */}
            <div>
              <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-300 mb-1">
                Barrio
              </label>
              <select
                id="neighborhood"
                className="w-full p-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.neighborhoodId || ''}
                onChange={handleNeighborhoodChange}
                disabled={loading}
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

            {/* Filtro de estado - solo visible para editores y administradores */}
            {isEditorOrAdmin && (
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">
                  Estado
                </label>
                <select
                  id="status"
                  className="w-full p-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.status || ''}
                  onChange={handleStatusChange}
                >
                  <option value="">Todos los estados</option>
                  <option value="pending">Pendiente</option>
                  <option value="verified">Verificado</option>
                  <option value="resolved">Resuelto</option>
                </select>
              </div>
            )}

            {/* Filtro de fecha desde */}
            <div>
              <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-300 mb-1">
                Fecha desde
              </label>
              <input
                type="date"
                id="dateFrom"
                className="w-full p-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.dateFrom || ''}
                onChange={handleDateFromChange}
              />
            </div>

            {/* Filtro de fecha hasta */}
            <div>
              <label htmlFor="dateTo" className="block text-sm font-medium text-gray-300 mb-1">
                Fecha hasta
              </label>
              <input
                type="date"
                id="dateTo"
                className="w-full p-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.dateTo || ''}
                onChange={handleDateToChange}
              />
            </div>

            {/* Filtro de hora desde */}
            <div>
              <label htmlFor="timeFrom" className="block text-sm font-medium text-gray-300 mb-1">
                Hora desde
              </label>
              <input
                type="time"
                id="timeFrom"
                className="w-full p-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.timeFrom || ''}
                onChange={handleTimeFromChange}
              />
            </div>

            {/* Filtro de hora hasta */}
            <div>
              <label htmlFor="timeTo" className="block text-sm font-medium text-gray-300 mb-1">
                Hora hasta
              </label>
              <input
                type="time"
                id="timeTo"
                className="w-full p-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.timeTo || ''}
                onChange={handleTimeToChange}
              />
            </div>

            {/* Filtro de período de hora (para compatibilidad) */}
            <div>
              <label htmlFor="timePeriod" className="block text-sm font-medium text-gray-300 mb-1">
                Período de hora
              </label>
              <select
                id="timePeriod"
                className="w-full p-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.time || ''}
                onChange={handleTimePeriodChange}
              >
                <option value="">Cualquier hora</option>
                <option value="morning">Mañana (6:00 - 12:00)</option>
                <option value="afternoon">Tarde (12:00 - 18:00)</option>
                <option value="evening">Noche (18:00 - 00:00)</option>
                <option value="night">Madrugada (00:00 - 6:00)</option>
              </select>
            </div>
          </div>

          {/* Sección de etiquetas */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Etiquetas
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 