'use client';

import { CalendarDateRangeIcon, CloudIcon, WifiIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface ChatConnectionStatusProps {
  isConnected: boolean;
  useWebSockets: boolean;
  cacheStatus: 'loading' | 'loaded' | 'none';
  cacheStats?: {
    totalSize: number;
    totalEntries: number;
    maxSize: number;
    lastCleanup: Date;
  } | null;
  className?: string;
}

const ChatConnectionStatus: React.FC<ChatConnectionStatusProps> = ({
  isConnected,
  useWebSockets,
  cacheStatus,
  cacheStats,
  className = ''
}) => {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getConnectionColor = () => {
    if (!useWebSockets) return 'text-blue-500'; // Polling mode
    return isConnected ? 'text-green-500' : 'text-red-500';
  };

  const getConnectionText = () => {
    if (!useWebSockets) return 'Polling';
    return isConnected ? 'WebSocket' : 'Desconectado';
  };

  const getCacheColor = () => {
    switch (cacheStatus) {
      case 'loaded': return 'text-green-500';
      case 'loading': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getCacheText = () => {
    switch (cacheStatus) {
      case 'loaded': return 'Cache activo';
      case 'loading': return 'Cargando cache';
      default: return 'Sin cache';
    }
  };

  return (
    <div className={`flex items-center space-x-4 text-xs ${className}`}>
      {/* Estado de conexión */}
      <div className="flex items-center space-x-1">
        <WifiIcon className={`h-4 w-4 ${getConnectionColor()}`} />
        <span className={getConnectionColor()}>
          {getConnectionText()}
        </span>
      </div>

      {/* Estado del cache */}
      <div className="flex items-center space-x-1">
        <CalendarDateRangeIcon className={`h-4 w-4 ${getCacheColor()}`} />
        <span className={getCacheColor()}>
          {getCacheText()}
        </span>
      </div>

      {/* Estadísticas del cache */}
      {cacheStats && cacheStatus === 'loaded' && (
        <div className="flex items-center space-x-1 text-gray-400">
          <CloudIcon className="h-4 w-4" />
          <span>
            {formatBytes(cacheStats.totalSize)} / {formatBytes(cacheStats.maxSize)}
          </span>
        </div>
      )}
    </div>
  );
};

export default ChatConnectionStatus;
