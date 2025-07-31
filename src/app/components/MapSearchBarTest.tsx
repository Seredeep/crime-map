'use client';

import { IncidentFilters } from '@/lib/types/global';
import { useState } from 'react';
import MapSearchBar from './MapSearchBar';

export default function MapSearchBarTest() {
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<IncidentFilters>({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días atrás
    dateTo: new Date().toISOString().split('T')[0], // Hoy
    neighborhoodId: '83', // Barrio de ejemplo
    status: 'verified'
  });

  const handleLocationSelect = (coordinates: [number, number], address: string) => {
    setSelectedLocation(coordinates);
    setSelectedIncidentId(null);
    setSearchHistory(prev => [...prev, `📍 ${address}`]);

    console.log('📍 Ubicación seleccionada:', {
      address,
      coordinates,
      latitude: coordinates[1],
      longitude: coordinates[0]
    });
  };

  const handleIncidentSelect = (incidentId: string) => {
    setSelectedIncidentId(incidentId);
    setSelectedLocation(null);
    setSearchHistory(prev => [...prev, `🚨 Incidente: ${incidentId}`]);

    console.log('🚨 Incidente seleccionado:', incidentId);
  };

  const updateFilters = (newFilters: Partial<IncidentFilters>) => {
    setActiveFilters(prev => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            MapSearchBar - Prueba de Funcionalidad
          </h1>
          <p className="text-gray-600">
            Prueba la búsqueda combinada de direcciones e incidentes con filtros
          </p>
        </div>

        {/* Filtros de ejemplo */}
        <div className="mb-6 bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            🔧 Filtros Activos (Simulación)
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rango de fechas
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={activeFilters.dateFrom}
                  onChange={(e) => updateFilters({ dateFrom: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="date"
                  value={activeFilters.dateTo}
                  onChange={(e) => updateFilters({ dateTo: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={activeFilters.status}
                onChange={(e) => updateFilters({ status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="verified">Verificado</option>
                <option value="pending">Pendiente</option>
                <option value="resolved">Resuelto</option>
              </select>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              💡 Estos filtros se aplican automáticamente a la búsqueda de incidentes
            </p>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="mb-8">
          <MapSearchBar
            onLocationSelect={handleLocationSelect}
            onIncidentSelect={handleIncidentSelect}
            activeFilters={activeFilters}
            className="w-full max-w-2xl mx-auto"
          />
        </div>

        {/* Información de selección */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Ubicación seleccionada */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              📍 Ubicación Seleccionada
            </h3>
            {selectedLocation ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Latitud:</span> {selectedLocation[1].toFixed(6)}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Longitud:</span> {selectedLocation[0].toFixed(6)}
                </p>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700">
                    💡 Esta ubicación se puede usar para centrar el mapa o crear un marcador
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                Selecciona una dirección de los resultados de búsqueda
              </p>
            )}
          </div>

          {/* Incidente seleccionado */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              🚨 Incidente Seleccionado
            </h3>
            {selectedIncidentId ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">ID:</span> {selectedIncidentId}
                </p>
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-red-700">
                    💡 Este ID se puede usar para obtener los detalles completos del incidente
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                Selecciona un incidente de los resultados de búsqueda
              </p>
            )}
          </div>
        </div>

        {/* Historial de búsquedas */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📋 Historial de Selecciones
          </h3>
          {searchHistory.length > 0 ? (
            <div className="space-y-2">
              {searchHistory.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-600">
                    {new Date().toLocaleTimeString()}
                  </span>
                  <span className="text-sm font-medium text-gray-800">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              Realiza búsquedas para ver el historial aquí
            </p>
          )}
        </div>

        {/* Instrucciones */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">
            💡 Instrucciones de Uso
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <h4 className="font-medium mb-2">Para buscar direcciones:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Escribe el nombre de una calle</li>
                <li>Incluye el número si lo conoces</li>
                <li>Puedes buscar intersecciones</li>
                <li>Ejemplo: "Avenida Luro 123"</li>
                <li>La búsqueda se centra en tu barrio</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Para buscar incidentes:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Escribe el tipo de incidente</li>
                <li>Busca por descripción</li>
                <li>Usa palabras clave</li>
                <li>Ejemplo: "robo", "accidente", "vandalismo"</li>
                <li>Se aplican los filtros activos</li>
                <li>Se ordenan por proximidad a tu barrio</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
