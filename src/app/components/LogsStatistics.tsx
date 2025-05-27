'use client';

import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';

interface LogsStatisticsProps {
  filters: {
    action: string;
    user: string;
    dateFrom: string;
    dateTo: string;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function LogsStatistics({ filters }: LogsStatisticsProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStatistics() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filters.action && filters.action !== 'all') {
          params.append('action', filters.action);
        }
        if (filters.user) {
          params.append('user', filters.user);
        }
        if (filters.dateFrom) {
          params.append('dateFrom', filters.dateFrom);
        }
        if (filters.dateTo) {
          params.append('dateTo', filters.dateTo);
        }

        const response = await fetch(`/api/logs/stats?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Error al cargar las estadísticas');
        }
        const data = await response.json();
        setStats(data.data);
      } catch (err) {
        console.error('Error loading statistics:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar las estadísticas');
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

  // Opciones para el gráfico de acciones por día
  const actionsByDayOption = {
    title: {
      text: 'Acciones por día',
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
      data: stats.actionsByDay?.map((item: any) => item._id) || [],
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
      data: stats.actionsByDay?.map((item: any) => item.count) || [],
      type: 'line',
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
    }]
  };

  // Opciones para el gráfico de distribución de tipos de acción
  const actionTypesOption = {
    title: {
      text: 'Distribución de tipos de acción',
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
      data: stats.actionTypes?.map((item: any, index: number) => ({
        name: item._id,
        value: item.count,
        itemStyle: {
          color: COLORS[index % COLORS.length]
        }
      })) || []
    }]
  };

  // Opciones para el gráfico de top usuarios
  const topUsersOption = {
    title: {
      text: 'Top usuarios más activos',
      textStyle: {
        color: '#E5E7EB',
        fontSize: 16,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
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
      data: stats.topUsers?.map((item: any) => item._id) || [],
      axisLine: {
        lineStyle: {
          color: '#9CA3AF'
        }
      },
      axisLabel: {
        color: '#9CA3AF',
        rotate: 45
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
      data: stats.topUsers?.map((item: any) => item.count) || [],
      type: 'bar',
      itemStyle: {
        color: '#3B82F6',
        borderRadius: [4, 4, 0, 0]
      }
    }]
  };

  // Opciones para el gráfico de actividad por hora
  const activityByHourOption = {
    title: {
      text: 'Actividad por hora del día',
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
      data: stats.activityByHour?.map((item: any) => `${item._id}:00`) || [],
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
      data: stats.activityByHour?.map((item: any) => item.count) || [],
      type: 'bar',
      itemStyle: {
        color: '#3B82F6',
        borderRadius: [4, 4, 0, 0]
      }
    }]
  };

  return (
    <div className="space-y-8 bg-gray-900/50 p-6 rounded-lg backdrop-blur-sm">
      {/* Acciones por día */}
      {stats.actionsByDay && (
        <div className="h-[400px] w-full">
          <ReactECharts option={actionsByDayOption} style={{ height: '100%' }} />
        </div>
      )}

      {/* Distribución de tipos de acción */}
      {stats.actionTypes && (
        <div className="h-[400px] w-full">
          <ReactECharts option={actionTypesOption} style={{ height: '100%' }} />
        </div>
      )}

      {/* Top usuarios activos */}
      {stats.topUsers && (
        <div className="h-[400px] w-full">
          <ReactECharts option={topUsersOption} style={{ height: '100%' }} />
        </div>
      )}

      {/* Actividad por hora del día */}
      {stats.activityByHour && (
        <div className="h-[400px] w-full">
          <ReactECharts option={activityByHourOption} style={{ height: '100%' }} />
        </div>
      )}
    </div>
  );
} 