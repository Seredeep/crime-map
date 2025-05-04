'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { Incident } from '@/lib/types';
import { CHART_COLORS } from '@/config/constants';

interface IncidentChartsProps {
  incidents: Incident[];
}

export default function IncidentCharts({ incidents }: IncidentChartsProps) {
  // Procesar datos para el gráfico de incidentes por día
  const incidentsPerDay = useMemo(() => {
    const groupedByDate = incidents.reduce((acc, incident) => {
      const date = incident.date;
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(groupedByDate)
      .map(([date, count]) => ({
        date,
        count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [incidents]);

  // Procesar datos para el gráfico de distribución por tipo de crimen
  const crimeDistribution = useMemo(() => {
    const distribution = incidents.reduce((acc, incident) => {
      if (incident.tags) {
        incident.tags.forEach(tag => {
          acc[tag] = (acc[tag] || 0) + 1;
        });
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [incidents]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Incidentes por Día</h3>
        <div className="w-full overflow-x-auto">
          <LineChart width={500} height={300} data={incidentsPerDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="date" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke={CHART_COLORS.PRIMARY[0]} />
          </LineChart>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Distribución por Tipo</h3>
        <div className="w-full">
          <PieChart width={500} height={300}>
            <Pie
              data={crimeDistribution}
              cx={250}
              cy={150}
              labelLine={false}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {crimeDistribution.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={CHART_COLORS.PRIMARY[index % CHART_COLORS.PRIMARY.length]} 
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      </div>
    </div>
  );
} 