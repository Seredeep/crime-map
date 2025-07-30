'use client';

import { IncidentFilters } from '@/lib/types/global';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import IncidentFiltersComponent from '../../components/IncidentFilters';
import IncidentStatistics from '../../components/IncidentStatistics';

export default function StatsPage() {
  const { data: session } = useSession();
  const isEditorOrAdmin = session?.user?.role === 'editor' || session?.user?.role === 'admin';
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // Set default date range to last 30 days
  const [filters, setFilters] = useState<IncidentFilters>(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    return {
      dateFrom: thirtyDaysAgo.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0],
      neighborhoodId: '83',
      status: 'verified'
    };
  });

  // Handler for when filters change
  const handleFiltersChange = (newFilters: IncidentFilters) => {
    // Si el usuario no es editor o admin, forzar el estado a 'verified'
    if (!isEditorOrAdmin) {
      newFilters.status = 'verified';
    }
    setFilters(newFilters);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-200">Estadísticas de Incidentes</h1>

        <button
          onClick={() => setShowFiltersModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
          </svg>
          <span>Filtros</span>
        </button>
      </div>

      {/* Current filters display */}
      <div className="mb-8 p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-1">Período</h3>
            <p className="text-gray-200">
              {new Date(filters.dateFrom || '').toLocaleDateString()} - {new Date(filters.dateTo || '').toLocaleDateString()}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-1">Barrio</h3>
            <p className="text-gray-200">
              {filters.neighborhoodId === '83' ? 'Todos' : `ID: ${filters.neighborhoodId}`}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-1">Estado</h3>
            <p className="text-gray-200">
              {filters.status === 'verified' ? 'Verificados' :
               filters.status === 'pending' ? 'Pendientes' :
               filters.status === 'resolved' ? 'Resueltos' : 'Todos'}
            </p>
          </div>
          <div className="flex items-end justify-end">
            <button
              onClick={() => setShowFiltersModal(true)}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Cambiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Statistics section with improved layout */}
      <div className="grid grid-cols-1 gap-8">
        {/* General Statistics */}
        <div className="bg-gray-800/80 rounded-xl p-6 shadow-lg border border-gray-700/50">
          <h2 className="text-xl font-semibold text-gray-200 mb-6">Estadísticas Generales</h2>
          <IncidentStatistics filters={filters} />
        </div>

        {/* Temporal Analysis */}
        <div className="bg-gray-800/80 rounded-xl p-6 shadow-lg border border-gray-700/50">
          <h2 className="text-xl font-semibold text-gray-200 mb-6">Análisis Temporal</h2>
          <div className="h-80">
            <IncidentStatistics filters={filters} viewType="temporal" />
          </div>
        </div>

        {/* Geographic Analysis */}
        <div className="bg-gray-800/80 rounded-xl p-6 shadow-lg border border-gray-700/50">
          <h2 className="text-xl font-semibold text-gray-200 mb-6">Análisis Geográfico</h2>
          <div className="h-80">
            <IncidentStatistics filters={filters} viewType="geographic" />
          </div>
        </div>
      </div>

      {/* Modal de filtros */}
      {showFiltersModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Filtros de Estadísticas</h2>
              <button
                onClick={() => setShowFiltersModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] z-[1000]">
              <IncidentFiltersComponent
                filters={filters}
                onFiltersChangeAction={handleFiltersChange}
              />
            </div>

            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                Los cambios se aplicarán al cerrar
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowFiltersModal(false)}
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Aplicar y cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
