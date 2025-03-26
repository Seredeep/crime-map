'use client';

import React, { useState, useEffect } from 'react';
import { fetchNeighborhoods, Neighborhood } from '@/lib/neighborhoodService';
import { IncidentFilters as FiltersType } from '@/lib/incidentService';

interface IncidentFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
  onNeighborhoodSelect?: (neighborhood: any | null) => void;
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
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tags || []);

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

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    
    if (date) {
      onFiltersChange({
        ...filters,
        date
      });
    } else {
      const { date, ...restFilters } = filters;
      onFiltersChange(restFilters);
    }
  };

  // Handle time period selection
  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      time: e.target.value || undefined
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
    onFiltersChange({});
    
    // Limpiar también el barrio seleccionado
    if (onNeighborhoodSelect) {
      onNeighborhoodSelect(null);
    }
  };

  return (
    <div className="space-y-4 bg-gray-900/50 p-4 rounded-lg backdrop-blur-sm">
      {/* Filtros activos */}
      {Object.keys(filters).length > 0 && (
        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
          <p className="text-sm text-gray-300">
            Filtros activos: {
              Object.entries(filters).map(([key, value]) => {
                const label = {
                  neighborhoodId: 'Barrio',
                  date: 'Fecha',
                  time: 'Hora',
                  tags: 'Etiquetas'
                }[key];
                return `${label}: ${Array.isArray(value) ? value.join(', ') : value}`;
              }).join(' • ')
            }
          </p>
          <button
            onClick={handleClearFilters}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      )}

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

        {/* Filtro de fecha */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-1">
            Fecha
          </label>
          <input
            type="date"
            id="date"
            className="w-full p-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.date || ''}
            onChange={handleDateChange}
          />
        </div>

        {/* Filtro de hora */}
        <div>
          <label htmlFor="time" className="block text-sm font-medium text-gray-300 mb-1">
            Hora
          </label>
          <select
            id="time"
            className="w-full p-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.time || ''}
            onChange={handleTimeChange}
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
  );
} 