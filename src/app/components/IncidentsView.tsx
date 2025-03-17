'use client';

import React, { useState, useEffect } from 'react';
import Map from './Map';
import IncidentDetails from './IncidentDetails';
import { Incident } from '@/lib/types';
import { fetchIncidents } from '@/lib/incidentService';
import IncidentFilters from './IncidentFilters';

export default function IncidentsView() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>({});

  // Function to load incidents based on filters
  const loadIncidents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Cargando incidentes con filtros:', filters);
      const fetchedIncidents = await fetchIncidents(filters);
      setIncidents(fetchedIncidents);
      console.log(`Se cargaron ${fetchedIncidents.length} incidentes`);
    } catch (err) {
      console.error('Error fetching incidents:', err);
      setError('No se pudieron cargar los incidentes. Intente nuevamente más tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Load incidents on component mount and when filters change
  useEffect(() => {
    loadIncidents();
  }, [filters]);

  const handleIncidentSelected = (incident: Incident) => {
    setSelectedIncident(incident);
  };

  // Handler for when filters change
  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    // If there's a selected incident, deselect it when filters change
    if (selectedIncident) {
      setSelectedIncident(null);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Filter Panel */}
      <div className="bg-white shadow-md p-4 mb-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Filtros</h2>
        <IncidentFilters filters={filters} onFiltersChange={handleFiltersChange} />
        
        {/* Debug info */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="text-sm font-medium text-yellow-800">Debug - Filtros activos:</h3>
            <pre className="mt-1 text-xs overflow-auto max-h-20">
              {JSON.stringify(filters, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      {/* Map and Incident Details */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 min-h-[400px] md:min-h-[600px] relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-70 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-700">Cargando incidentes...</p>
              </div>
            </div>
          ) : null}
          
          {error ? (
            <div className="bg-red-100 p-4 rounded-lg text-red-700">{error}</div>
          ) : incidents.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <div className="text-center p-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 13h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-700 mt-2">No se encontraron incidentes</h3>
                <p className="text-gray-500 mt-1">Intente con diferentes filtros o elimine algunos filtros para ver más resultados.</p>
              </div>
            </div>
          ) : (
            <Map incidents={incidents} onIncidentSelect={handleIncidentSelected} mode="incidents" />
          )}
        </div>
        
        <div className="flex-1">
          {selectedIncident ? (
            <IncidentDetails incident={selectedIncident} />
          ) : (
            <div className="bg-white shadow-md p-4 rounded-lg">
              <p className="text-gray-500">
                Selecciona un incidente en el mapa para ver más detalles.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 