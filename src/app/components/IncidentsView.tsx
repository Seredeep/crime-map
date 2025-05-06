'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Map from './Map';
import IncidentDetails from './IncidentDetails';
import { Incident, IncidentFilters } from '@/lib/types';
import { fetchIncidents } from '@/lib/incidentService';
import IncidentFiltersComponent from './IncidentFilters';
import { Neighborhood } from '@/lib/neighborhoodService';
import IncidentStatistics from './IncidentStatistics';
import { fetchNeighborhoods } from '@/lib/neighborhoodService';
import { useSession } from 'next-auth/react';

export default function IncidentsView() {
  const { data: session } = useSession();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isEditorOrAdmin = session?.user?.role === 'editor' || session?.user?.role === 'admin';

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

  // Load initial neighborhood
  useEffect(() => {
    async function loadInitialNeighborhood() {
      try {
        const neighborhoods = await fetchNeighborhoods();
        const defaultNeighborhood = neighborhoods.find(n => n.properties.id === 83);
        if (defaultNeighborhood) {
          setSelectedNeighborhood(defaultNeighborhood);
        }
      } catch (err) {
        console.error('Error loading initial neighborhood:', err);
      }
    }
    loadInitialNeighborhood();
  }, []);

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
  };

  // Handler for when filters change
  const handleFiltersChange = (newFilters: IncidentFilters) => {
    // Si el usuario no es editor o admin, forzar el estado a 'verified'
    if (!isEditorOrAdmin) {
      newFilters.status = 'verified';
    }
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
    }, 50);
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Panel de Filtros */}
      <div className="bg-gray-900/50 p-4 rounded-lg backdrop-blur-sm">
        <IncidentFiltersComponent 
          filters={filters} 
          onFiltersChange={handleFiltersChange}
          onNeighborhoodSelect={handleNeighborhoodSelect}
        />
      </div>
      
      {/* Mapa y Panel de Detalles */}
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
        
        {/* Panel de Detalles */}
        <div className="flex-1">
          {selectedIncident ? (
            <IncidentDetails incident={selectedIncident} />
          ) : (
            <div className="bg-gray-900/50 p-6 rounded-lg backdrop-blur-sm text-center">
              <p className="text-gray-300">
                Selecciona un incidente en el mapa para ver sus detalles.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stats section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-200 mb-4">Estadísticas</h2>
        <IncidentStatistics filters={filters} />
      </div>
    </div>
  );
} 