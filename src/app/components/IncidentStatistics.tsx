'use client';

import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
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

  // Opciones para el gráfico de incidentes por día
  const dailyIncidentsOption = {
    title: {
      text: 'Incidentes por día',
      textStyle: {
        color: '#E5E7EB',
        fontSize: 16,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1F2937',
      borderColor: '#374151',
      textStyle: {
        color: '#E5E7EB'
      }
    },
    legend: {
      data: ['Incidentes', 'Promedio móvil (7 días)'],
      textStyle: {
        color: '#E5E7EB'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: stats.day?.dates || [],
      axisLine: {
        lineStyle: {
          color: '#9CA3AF'
        }
      },
      axisLabel: {
        color: '#9CA3AF'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#9CA3AF'
        }
      },
      axisLabel: {
        color: '#9CA3AF'
      },
      splitLine: {
        lineStyle: {
          color: '#374151'
        }
      }
    },
    series: [
      {
        name: 'Incidentes',
        type: 'line',
        data: stats.day?.counts || [],
        smooth: true,
        lineStyle: {
          color: '#3B82F6',
          width: 2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0,
              color: 'rgba(59, 130, 246, 0.3)'
            }, {
              offset: 1,
              color: 'rgba(59, 130, 246, 0.1)'
            }]
          }
        }
      },
      {
        name: 'Promedio móvil (7 días)',
        type: 'line',
        data: stats.day?.rollingAverage || [],
        smooth: true,
        lineStyle: {
          color: '#10B981',
          width: 2
        }
      }
    ]
  };

  // Opciones para el gráfico de incidentes por semana
  const weeklyIncidentsOption = {
    title: {
      text: 'Incidentes por semana',
      textStyle: {
        color: '#E5E7EB',
        fontSize: 16,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1F2937',
      borderColor: '#374151',
      textStyle: {
        color: '#E5E7EB'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: stats.week?.weeks || [],
      axisLine: {
        lineStyle: {
          color: '#9CA3AF'
        }
      },
      axisLabel: {
        color: '#9CA3AF'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#9CA3AF'
        }
      },
      axisLabel: {
        color: '#9CA3AF'
      },
      splitLine: {
        lineStyle: {
          color: '#374151'
        }
      }
    },
    series: [{
      data: stats.week?.counts || [],
      type: 'bar',
      itemStyle: {
        color: '#3B82F6',
        borderRadius: [4, 4, 0, 0]
      }
    }]
  };

  // Opciones para el gráfico de distribución por día de la semana
  const weekdayDistributionOption = {
    title: {
      text: 'Distribución por día de la semana',
      textStyle: {
        color: '#E5E7EB',
        fontSize: 16,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1F2937',
      borderColor: '#374151',
      textStyle: {
        color: '#E5E7EB'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: stats.weekdayDistribution?.weekdays.map((_, i) => WEEKDAYS[i]) || [],
      axisLine: {
        lineStyle: {
          color: '#9CA3AF'
        }
      },
      axisLabel: {
        color: '#9CA3AF'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#9CA3AF'
        }
      },
      axisLabel: {
        color: '#9CA3AF'
      },
      splitLine: {
        lineStyle: {
          color: '#374151'
        }
      }
    },
    series: [{
      data: stats.weekdayDistribution?.counts || [],
      type: 'bar',
      itemStyle: {
        color: '#3B82F6',
        borderRadius: [4, 4, 0, 0]
      }
    }]
  };

  // Opciones para el gráfico de distribución por hora
  const hourDistributionOption = {
    title: {
      text: 'Distribución por hora del día',
      textStyle: {
        color: '#E5E7EB',
        fontSize: 16,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1F2937',
      borderColor: '#374151',
      textStyle: {
        color: '#E5E7EB'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: stats.hourDistribution?.hours.map(hour => `${hour}:00`) || [],
      axisLine: {
        lineStyle: {
          color: '#9CA3AF'
        }
      },
      axisLabel: {
        color: '#9CA3AF'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#9CA3AF'
        }
      },
      axisLabel: {
        color: '#9CA3AF'
      },
      splitLine: {
        lineStyle: {
          color: '#374151'
        }
      }
    },
    series: [{
      data: stats.hourDistribution?.counts || [],
      type: 'bar',
      itemStyle: {
        color: '#3B82F6',
        borderRadius: [4, 4, 0, 0]
      }
    }]
  };

  // Opciones para el gráfico de distribución por tipo
  const tagDistributionOption = {
    title: {
      text: 'Distribución por tipo de incidente',
      textStyle: {
        color: '#E5E7EB',
        fontSize: 16,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: '#1F2937',
      borderColor: '#374151',
      textStyle: {
        color: '#E5E7EB'
      },
      formatter: '{b}: {c} ({d}%)'
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#1F2937',
        borderWidth: 2
      },
      label: {
        show: true,
        color: '#E5E7EB',
        formatter: '{b}: {d}%'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold'
        }
      },
      data: stats.tag?.tags.map((tag, index) => ({
        name: tag,
        value: stats.tag?.counts[index],
        itemStyle: {
          color: COLORS[index % COLORS.length]
        }
      })) || []
    }]
  };

  return (
    <div className="space-y-8 bg-gray-900/50 p-6 rounded-lg backdrop-blur-sm">
      {/* Daily incidents with rolling average */}
      {stats.day && (
        <div className="h-[400px] w-full">
          <ReactECharts option={dailyIncidentsOption} style={{ height: '100%' }} />
        </div>
      )}

      {/* Weekly incidents */}
      {stats.week && (
        <div className="h-[400px] w-full">
          <ReactECharts option={weeklyIncidentsOption} style={{ height: '100%' }} />
        </div>
      )}

      {/* Weekday distribution */}
      {stats.weekdayDistribution && (
        <div className="h-[400px] w-full">
          <ReactECharts option={weekdayDistributionOption} style={{ height: '100%' }} />
        </div>
      )}

      {/* Hour distribution */}
      {stats.hourDistribution && (
        <div className="h-[400px] w-full">
          <ReactECharts option={hourDistributionOption} style={{ height: '100%' }} />
        </div>
      )}

      {/* Tag distribution */}
      {stats.tag && (
        <div className="h-[400px] w-full">
          <ReactECharts option={tagDistributionOption} style={{ height: '100%' }} />
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