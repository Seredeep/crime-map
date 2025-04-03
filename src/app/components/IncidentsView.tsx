'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Map from './Map';
import IncidentDetails from './IncidentDetails';
import { Incident, IncidentFilters } from '@/lib/types';
import { fetchIncidents } from '@/lib/incidentService';
import IncidentFiltersComponent from './IncidentFilters';
import IncidentCharts from './IncidentCharts';
import { Neighborhood } from '@/lib/neighborhoodService';

export default function IncidentsView() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<IncidentFilters>({});
  const [showCharts, setShowCharts] = useState(false);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | null>(null);

  // Function to load incidents based on filters
  const loadIncidents = useCallback(async () => {
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
  }, [filters]);

  // Load incidents on component mount and when filters change
  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  const handleIncidentSelected = (incident: Incident) => {
    setSelectedIncident(incident);
    setShowCharts(false);
  };

  // Handler for when filters change
  const handleFiltersChange = (newFilters: IncidentFilters) => {
    setFilters(newFilters);
    if (selectedIncident) {
      setSelectedIncident(null);
    }
  };

  // Handler cuando se selecciona un barrio
  const handleNeighborhoodSelect = (neighborhood: Neighborhood | null) => {
    setSelectedNeighborhood(null);
    setTimeout(() => {
      setSelectedNeighborhood(neighborhood);
      console.log('Barrio seleccionado:', neighborhood?.properties?.soc_fomen);
    }, 50);
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Panel de Filtros */}
      <div className="bg-gray-900/50 p-4 rounded-lg backdrop-blur-sm">
        <h2 className="text-lg font-semibold mb-2 text-gray-200">Filtros</h2>
        <IncidentFiltersComponent 
          filters={filters} 
          onFiltersChange={handleFiltersChange}
          onNeighborhoodSelect={handleNeighborhoodSelect}
        />
      </div>
      
      {/* Mapa y Panel de Detalles/Estadísticas */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Mapa */}
        <div className="flex-1 min-h-[400px] lg:min-h-[600px] relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm rounded-lg z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-300">Cargando incidentes...</p>
              </div>
            </div>
          ) : null}
          
          {error ? (
            <div className="bg-red-900/50 backdrop-blur-sm p-4 rounded-lg text-red-200">{error}</div>
          ) : incidents.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm rounded-lg">
              <div className="text-center p-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 13h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-300 mt-2">No se encontraron incidentes</h3>
                <p className="text-gray-400 mt-1">Intente con diferentes filtros o elimine algunos filtros para ver más resultados.</p>
              </div>
            </div>
          ) : (
            <Map 
              incidents={incidents} 
              onIncidentSelect={handleIncidentSelected} 
              mode="incidents"
              selectedNeighborhood={selectedNeighborhood}
            />
          )}
        </div>
        
        {/* Panel de Detalles/Estadísticas */}
        <div className="flex-1">
          {/* Botones de alternancia */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShowCharts(false)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                !showCharts
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              Detalles
            </button>
            <button
              onClick={() => setShowCharts(true)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                showCharts
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              Estadísticas
            </button>
          </div>

          {/* Contenido del panel */}
          {showCharts ? (
            <IncidentCharts incidents={incidents} />
          ) : selectedIncident ? (
            <IncidentDetails incident={selectedIncident} />
          ) : (
            <div className="bg-gray-900/50 p-6 rounded-lg backdrop-blur-sm text-center">
              <p className="text-gray-300">
                Selecciona un incidente en el mapa para ver sus detalles o haz clic en &quot;Estadísticas&quot; para ver gráficos.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 