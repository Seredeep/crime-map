'use client';

import { motion } from 'framer-motion';
import { FiTrendingUp, FiAlertTriangle, FiMapPin, FiClock, FiUsers, FiShield } from 'react-icons/fi';
import { useState, useEffect } from 'react';

interface StatCard {
  id: string;
  title: string;
  value: string | number;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

interface MobileStatsViewProps {
  className?: string;
}

const MobileStatsView = ({ className = '' }: MobileStatsViewProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [stats, setStats] = useState<StatCard[]>([]);

  // Simular datos de estadísticas
  useEffect(() => {
    const mockStats: StatCard[] = [
      {
        id: 'total-incidents',
        title: 'Total Incidentes',
        value: 247,
        change: '+12%',
        changeType: 'increase',
        icon: <FiAlertTriangle className="w-5 h-5" />,
        color: 'bg-red-500'
      },
      {
        id: 'resolved',
        title: 'Resueltos',
        value: 189,
        change: '+8%',
        changeType: 'increase',
        icon: <FiShield className="w-5 h-5" />,
        color: 'bg-green-500'
      },
      {
        id: 'active-areas',
        title: 'Áreas Activas',
        value: 15,
        change: '-3%',
        changeType: 'decrease',
        icon: <FiMapPin className="w-5 h-5" />,
        color: 'bg-orange-500'
      },
      {
        id: 'response-time',
        title: 'Tiempo Respuesta',
        value: '2.4h',
        change: '-15%',
        changeType: 'decrease',
        icon: <FiClock className="w-5 h-5" />,
        color: 'bg-blue-500'
      },
      {
        id: 'community-reports',
        title: 'Reportes Comunidad',
        value: 156,
        change: '+25%',
        changeType: 'increase',
        icon: <FiUsers className="w-5 h-5" />,
        color: 'bg-purple-500'
      },
      {
        id: 'trend',
        title: 'Tendencia General',
        value: 'Mejorando',
        change: '+5%',
        changeType: 'increase',
        icon: <FiTrendingUp className="w-5 h-5" />,
        color: 'bg-teal-500'
      }
    ];

    setStats(mockStats);
  }, [selectedPeriod]);

  const periods = [
    { id: 'day', label: 'Hoy' },
    { id: 'week', label: 'Semana' },
    { id: 'month', label: 'Mes' },
    { id: 'year', label: 'Año' }
  ];

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return 'text-green-400';
      case 'decrease':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return '↗';
      case 'decrease':
        return '↘';
      default:
        return '→';
    }
  };

  return (
    <div className={`w-full h-full bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 p-4">
        <h1 className="text-2xl font-bold text-white mb-4">Estadísticas</h1>
        
        {/* Period selector */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {periods.map((period) => (
            <button
              key={period.id}
              onClick={() => setSelectedPeriod(period.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                selectedPeriod === period.id
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4 pb-24">
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                delay: index * 0.1,
                duration: 0.3,
                ease: "easeOut"
              }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200"
            >
              {/* Icon and change indicator */}
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.color}/20`}>
                  <div className={`${stat.color.replace('bg-', 'text-')}`}>
                    {stat.icon}
                  </div>
                </div>
                <div className={`flex items-center text-xs font-medium ${getChangeColor(stat.changeType)}`}>
                  <span className="mr-1">{getChangeIcon(stat.changeType)}</span>
                  {stat.change}
                </div>
              </div>

              {/* Value */}
              <div className="mb-1">
                <div className="text-2xl font-bold text-white">
                  {stat.value}
                </div>
              </div>

              {/* Title */}
              <div className="text-sm text-gray-400 font-medium">
                {stat.title}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.3 }}
          className="mt-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl p-4 border border-blue-700/30"
        >
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
            <FiTrendingUp className="w-5 h-5 mr-2 text-blue-400" />
            Resumen Rápido
          </h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p>• Los reportes de la comunidad han aumentado un 25% esta semana</p>
            <p>• El tiempo de respuesta ha mejorado significativamente</p>
            <p>• 3 áreas menos activas comparado con el período anterior</p>
            <p>• Tendencia general positiva en la resolución de incidentes</p>
          </div>
        </motion.div>

        {/* Chart placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.3 }}
          className="mt-6 bg-gray-800/50 rounded-xl p-4 border border-gray-700/50"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Tendencia Semanal</h3>
          <div className="h-32 bg-gray-700/30 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-400">
              <FiTrendingUp className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Gráfico en desarrollo</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MobileStatsView; 