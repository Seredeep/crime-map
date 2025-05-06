'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { IncidentFilters, StatisticsResults } from '@/lib/types';
import { fetchStatistics } from '@/lib/incidentService';

interface IncidentStatisticsProps {
  filters: IncidentFilters;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function IncidentStatistics({ filters }: IncidentStatisticsProps) {
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
    return null;
  }

  return (
    <div className="space-y-8 bg-gray-900/50 p-6 rounded-lg backdrop-blur-sm">
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

      {/* Weekly incidents */}
      {stats.week && (
        <div>
          <h3 className="text-lg font-medium text-gray-200 mb-4">
            Incidentes por semana
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.week.weeks.map((week: string, i: number) => ({
                week,
                count: stats.week?.counts[i],
                average: stats.week?.rollingAverage[i]
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="week"
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
              <BarChart data={stats.weekdayDistribution.weekdays.map((_: string, i: number) => ({
                weekday: WEEKDAYS[i],
                count: stats.weekdayDistribution?.counts[i]
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="weekday"
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
                  {stats.tag.tags.map((_, index) => (
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
    </div>
  );
} 