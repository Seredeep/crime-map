'use client';

import React from 'react';
import { FiActivity, FiAlertTriangle, FiClock, FiMessageCircle, FiShield, FiUsers } from 'react-icons/fi';

interface ChatInfoProps {
  totalMessages?: number;
  todayMessages?: number;
  lastMessageAt?: Date;
  activeUsers?: number;
  lastActivity?: Date;
  safetyLevel?: 'high' | 'medium' | 'low';
  emergencyLevel?: 'normal' | 'elevated' | 'high';
  recentIncidents?: number;
  panicMessages?: number;
  className?: string;
}

const ChatInfo: React.FC<ChatInfoProps> = ({
  totalMessages = 0,
  todayMessages = 0,
  activeUsers = 0,
  lastActivity,
  safetyLevel = 'medium',
  emergencyLevel = 'normal',
  recentIncidents = 0,
  panicMessages = 0,
  className = ''
}) => {
  const formatLastActivity = () => {
    if (!lastActivity) return 'Sin actividad reciente';

    const now = new Date();
    const diff = now.getTime() - lastActivity.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Activo ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days} días`;
    return 'Inactivo';
  };

  const getSafetyColor = () => {
    switch (safetyLevel) {
      case 'high': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getSafetyText = () => {
    if (panicMessages > 0) return 'Alerta activa';
    if (recentIncidents > 10) return 'Zona de riesgo';
    if (recentIncidents > 5) return 'Actividad elevada';

    switch (safetyLevel) {
      case 'high': return 'Zona tranquila';
      case 'medium': return 'Actividad normal';
      case 'low': return 'Zona de atención';
      default: return 'Sin datos';
    }
  };

  const getActivityText = () => {
    if (activeUsers === 0) return 'Inactivo';
    if (activeUsers === 1) return '1 vecino activo';
    return `${activeUsers} vecinos activos`;
  };

  const getIncidentsText = () => {
    if (recentIncidents === 0) return 'Sin incidentes';
    if (recentIncidents === 1) return '1 incidente reciente';
    return `${recentIncidents} incidentes recientes`;
  };

  return (
    <div className={`bg-gray-800/30 backdrop-blur-sm border-b border-gray-700/30 ${className}`}>
      <div className="px-4 py-2">
        <div className="flex items-center justify-between text-xs">
                    {/* Actividad del chat */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-blue-400">
              <FiMessageCircle className="w-3 h-3" />
              <span>{todayMessages === 0 ? 'Sin mensajes hoy' : `${todayMessages} hoy`}</span>
            </div>

            <div className="flex items-center space-x-1 text-green-400">
              <FiUsers className="w-3 h-3" />
              <span>{getActivityText()}</span>
            </div>

            {recentIncidents > 0 && (
              <div className="flex items-center space-x-1 text-orange-400">
                <FiActivity className="w-3 h-3" />
                <span>{getIncidentsText()}</span>
              </div>
            )}
          </div>

          {/* Estado y seguridad */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 text-gray-400">
              <FiClock className="w-3 h-3" />
              <span>{formatLastActivity()}</span>
            </div>

            <div className="flex items-center space-x-1">
              {panicMessages > 0 ? (
                <FiAlertTriangle className="w-3 h-3 text-red-500 animate-pulse" />
              ) : (
                <FiShield className={`w-3 h-3 ${getSafetyColor()}`} />
              )}
              <span className={panicMessages > 0 ? 'text-red-500' : getSafetyColor()}>
                {getSafetyText()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInfo;
