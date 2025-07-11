'use client';

import { fetchStatistics } from '@/lib/services/incidents/incidentService';
import { IncidentFilters, StatisticsResults } from '@/lib/types/global';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// StatisticsResults is imported from @/lib/types

interface IncidentStatisticsProps {
  filters: IncidentFilters;
  viewType?: 'general' | 'temporal' | 'geographic';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function IncidentStatistics({ filters, viewType = 'general' }: IncidentStatisticsProps) {
  const [stats, setStats] = useState<StatisticsResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStatistics() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchStatistics(filters);
        setStats(data);
      } catch (err) {
        console.error('Error loading statistics:', err);
        let errorMessage = 'No se pudieron cargar las estadísticas';

        // Try to get detailed error information
        if (err instanceof Error) {
          try {
            const errorData = JSON.parse(err.message);
            if (errorData.missingParams) {
              errorMessage = `Faltan parámetros requeridos: ${errorData.missingParams.join(', ')}`;
            } else if (errorData.error) {
              errorMessage = errorData.error;
            }
            console.log('Error details:', errorData);
          } catch {
            // If parsing fails, use the original error message
            errorMessage = err.message;
          }
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    loadStatistics();
  }, [filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/50 backdrop-blur-sm p-4 rounded-lg text-red-200">
        {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-4 bg-gray-800/50 rounded-lg text-gray-300">
        <p>No hay datos disponibles para los filtros seleccionados.</p>
      </div>
    );
  }

  const renderTemporalView = () => {
    return (
      <div className="space-y-8">
        {/* Daily incidents with rolling average */}
        {stats.day && (
          <div>
            <h3 className="text-lg font-medium text-gray-200 mb-4">
              Incidentes por día
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.day.dates.map((date: string, i: number) => ({
                  date,
                  count: stats.day?.counts[i],
                  average: stats.day?.rollingAverage[i]
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: '#E5E7EB',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="average"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={false}
                    name="Promedio móvil (7 días)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Hour distribution */}
        {stats.hourDistribution && (
          <div>
            <h3 className="text-lg font-medium text-gray-200 mb-4">
              Distribución por hora del día
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.hourDistribution.hours.map((hour: number, i: number) => ({
                  hour: `${hour}:00`,
                  count: stats.hourDistribution?.counts[i]
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="hour"
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: '#E5E7EB',
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Weekday distribution */}
        {stats.weekdayDistribution && (
          <div>
            <h3 className="text-lg font-medium text-gray-200 mb-4">
              Distribución por día de la semana
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weekdayDistribution.weekdays.map((day: string | number, i: number) => ({
                  day: WEEKDAYS[Number(day)],
                  count: stats.weekdayDistribution?.counts[i]
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="day"
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: '#E5E7EB',
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGeographicView = () => {
    return (
      <div className="space-y-8">
        {/* Tag distribution */}
        {stats.tag && (
          <div>
            <h3 className="text-lg font-medium text-gray-200 mb-4">
              Distribución por tipo de incidente
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.tag.tags.map((tag: string, i: number) => ({
                      name: tag,
                      value: stats.tag?.counts[i]
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.tag.tags.map((_: string, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: '#E5E7EB',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Heat map density */}
        {stats.heatMapDensity && (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-400 mb-1">Densidad</h4>
              <p className="text-2xl font-semibold text-blue-400">
                {stats.heatMapDensity.density.toFixed(2)}
                <span className="text-sm text-gray-400 ml-1">inc/km²</span>
              </p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-400 mb-1">Total incidentes</h4>
              <p className="text-2xl font-semibold text-blue-400">
                {stats.heatMapDensity.totalIncidents}
              </p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-400 mb-1">Área</h4>
              <p className="text-2xl font-semibold text-blue-400">
                {stats.heatMapDensity.area.toFixed(2)}
                <span className="text-sm text-gray-400 ml-1">km²</span>
              </p>
            </div>
          </div>
        )}

        {/* Neighborhood distribution would go here */}
        <div className="p-6 bg-gray-800/50 rounded-lg text-center">
          <h3 className="text-lg font-medium text-gray-200 mb-2">Distribución por barrio</h3>
          <p className="text-gray-400">Mapa de calor próximamente disponible</p>
        </div>
      </div>
    );
  };

  const renderGeneralView = () => {
    return (
      <div className="space-y-8">
        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-800/50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-400 mb-1">Total incidentes</h4>
            <p className="text-2xl font-semibold text-blue-400">
              {stats.heatMapDensity?.totalIncidents || 0}
            </p>
          </div>
          <div className="p-4 bg-gray-800/50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-400 mb-1">Promedio diario</h4>
            <p className="text-2xl font-semibold text-blue-400">
              {stats.day?.rollingAverage[stats.day.rollingAverage.length - 1]?.toFixed(1) || 0}
            </p>
          </div>
          <div className="p-4 bg-gray-800/50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-400 mb-1">Hora más frecuente</h4>
            <p className="text-2xl font-semibold text-blue-400">
              {stats.hourDistribution ?
              `${stats.hourDistribution.hours[
                stats.hourDistribution.counts.indexOf(Math.max(...stats.hourDistribution.counts))
              ]}:00` : '00:00'}
            </p>
          </div>
          <div className="p-4 bg-gray-800/50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-400 mb-1">Tipo más común</h4>
            <p className="text-2xl font-semibold text-blue-400">
              {stats.tag ?
              stats.tag.tags[
                stats.tag.counts.indexOf(Math.max(...stats.tag.counts))
              ] : 'N/A'}
            </p>
          </div>
        </div>

        {/* Daily trend */}
        {stats.day && (
          <div>
            <h3 className="text-lg font-medium text-gray-200 mb-4">
              Tendencia diaria
            </h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.day.dates.map((date: string, i: number) => ({
                  date,
                  count: stats.day?.counts[i],
                  average: stats.day?.rollingAverage[i]
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: '#E5E7EB',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="average"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={false}
                    name="Promedio móvil (7 días)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Type distribution */}
        {stats.tag && (
          <div>
            <h3 className="text-lg font-medium text-gray-200 mb-4">
              Distribución por tipo
            </h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.tag.tags.map((tag: string, i: number) => ({
                      name: tag,
                      value: stats.tag?.counts[i]
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.tag.tags.map((_: string, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: '#E5E7EB',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 bg-gray-900/50 p-6 rounded-lg backdrop-blur-sm">
      {/* Render the appropriate view based on viewType */}
      {viewType === 'temporal' && renderTemporalView()}
      {viewType === 'geographic' && renderGeographicView()}
      {viewType === 'general' && renderGeneralView()}
    </div>
  );
}
