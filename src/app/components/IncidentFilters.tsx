'use client';

import React, { useState, useEffect } from 'react';
import { fetchNeighborhoods, Neighborhood } from '@/lib/neighborhoodService';
import { IncidentFilters as FiltersType } from '@/lib/incidentService';

interface IncidentFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
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

export default function IncidentFilters({ filters, onFiltersChange }: IncidentFiltersProps) {
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
        setNeighborhoods(data);
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
    console.log('Barrio seleccionado:', value);
    onFiltersChange({
      ...filters,
      neighborhoodId: value || undefined
    });
  };

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    console.log('Fecha seleccionada:', date, 'Formato válido:', /^\d{4}-\d{2}-\d{2}$/.test(date));
    
    if (date) {
      // Aseguramos que la fecha se guarde exactamente en el formato YYYY-MM-DD
      // sin conversiones UTC que puedan cambiar el día
      onFiltersChange({
        ...filters,
        date
      });
    } else {
      // Si no hay fecha, la eliminamos de los filtros
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

  // Handle status change
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      status: e.target.value || undefined
    });
  };

  // Handle tag selection
  const handleTagToggle = (tag: string) => {
    const newSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newSelectedTags);
    console.log('Etiquetas seleccionadas:', newSelectedTags);
    
    onFiltersChange({
      ...filters,
      tags: newSelectedTags.length > 0 ? newSelectedTags : undefined
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedTags([]);
    onFiltersChange({});
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="p-3 bg-gray-100 mb-2 rounded-md">
        <p className="text-sm text-gray-700">Filtros activos: {Object.keys(filters).length > 0 ? 
          Object.entries(filters).map(([key, value]) => `${key}: ${value}`).join(', ') : 
          'Ninguno'}</p>
      </div>
      {/* Main filters in grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Neighborhood filter */}
        <div>
          <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700 mb-1">
            Barrio
          </label>
          <select
            id="neighborhood"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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

        {/* Date filter */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Fecha
          </label>
          <input
            type="date"
            id="date"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            value={filters.date || ''}
            onChange={handleDateChange}
          />
        </div>

        {/* Time filter */}
        <div>
          <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
            Hora
          </label>
          <select
            id="time"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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

        {/* Status filter */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            id="status"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            value={filters.status || ''}
            onChange={handleStatusChange}
          >
            <option value="">Cualquier estado</option>
            <option value="pending">Pendiente</option>
            <option value="verified">Verificado</option>
            <option value="resolved">Resuelto</option>
          </select>
        </div>
      </div>

      {/* Tags section */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Etiquetas
        </label>
        <div className="flex flex-wrap gap-2">
          {COMMON_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagToggle(tag)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Clear filters button */}
      <div className="mt-4">
        <button
          onClick={handleClearFilters}
          className="w-full md:w-auto px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 transition-colors"
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  );
} 