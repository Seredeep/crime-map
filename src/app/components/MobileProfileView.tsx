'use client';

import { motion } from 'framer-motion';
import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiLogOut,
  FiMail,
  FiMapPin,
  FiSettings,
  FiShield,
  FiUser,
  FiUsers
} from 'react-icons/fi';
import IncidentQueue from './IncidentQueue';

interface MobileProfileViewProps {
  className?: string;
}

const MobileProfileView = ({ className = '' }: MobileProfileViewProps) => {
  const { data: session } = useSession();
  const [activeSection, setActiveSection] = useState<'profile' | 'queue'>('profile');

  const isAdmin = session?.user?.role === 'admin';
  const isEditor = session?.user?.role === 'editor';
  const canManageIncidents = isAdmin || isEditor;

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'editor': return 'Editor';
      case 'user': return 'Usuario';
      default: return 'Usuario';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'editor': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'user': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (!session?.user) {
    return (
      <div className={`w-full h-full bg-gray-900 flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400">
          <FiUser className="w-12 h-12 mx-auto mb-4" />
          <p>No hay sesión activa</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 p-4">
        <h1 className="text-2xl font-bold text-white mb-4">
          {canManageIncidents ? 'Panel de Administración' : 'Mi Perfil'}
        </h1>

        {/* Section selector for admins/editors */}
        {canManageIncidents && (
          <div className="flex bg-gray-800/50 rounded-xl p-1">
            <button
              onClick={() => setActiveSection('profile')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeSection === 'profile'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <FiUser className="w-4 h-4 mx-auto mb-1" />
              Perfil
            </button>
            <button
              onClick={() => setActiveSection('queue')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeSection === 'queue'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <FiCheckCircle className="w-4 h-4 mx-auto mb-1" />
              Cola
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 pb-24">
        {activeSection === 'profile' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* User Info Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <FiUser className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white">
                    {session.user.name || 'Usuario'}
                  </h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(session.user.role || 'user')}`}>
                      {getRoleName(session.user.role || 'user')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                                <div className="flex items-center space-x-3 text-gray-300">
                  <FiMail className="w-5 h-5 text-gray-400" />
                  <span>{session.user.email}</span>
                </div>

                <div className="flex items-center space-x-3 text-gray-300">
                  <FiMapPin className="w-5 h-5 text-gray-400" />
                  <span>Barrio asignado</span>
                </div>
              </div>
            </div>

            {/* Admin Stats (if applicable) */}
            {canManageIncidents && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <FiShield className="w-5 h-5 mr-2 text-blue-400" />
                  Estadísticas de Administración
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                    <FiAlertTriangle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">12</div>
                    <div className="text-xs text-gray-400">Pendientes</div>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                    <FiCheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">45</div>
                    <div className="text-xs text-gray-400">Verificados</div>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                    <FiClock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">2.3h</div>
                    <div className="text-xs text-gray-400">Tiempo promedio</div>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                    <FiUsers className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">156</div>
                    <div className="text-xs text-gray-400">Total usuarios</div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FiSettings className="w-5 h-5 mr-2 text-gray-400" />
                Configuración
              </h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 bg-gray-700/30 hover:bg-gray-700/50 rounded-lg transition-colors">
                  <span className="text-gray-300">Notificaciones</span>
                  <div className="w-5 h-5 bg-blue-500 rounded-full"></div>
                </button>
                <button className="w-full flex items-center justify-between p-3 bg-gray-700/30 hover:bg-gray-700/50 rounded-lg transition-colors">
                  <span className="text-gray-300">Privacidad</span>
                  <div className="w-5 h-5 bg-gray-600 rounded-full"></div>
                </button>
                <button className="w-full flex items-center justify-between p-3 bg-gray-700/30 hover:bg-gray-700/50 rounded-lg transition-colors">
                  <span className="text-gray-300">Ubicación automática</span>
                  <div className="w-5 h-5 bg-blue-500 rounded-full"></div>
                </button>
              </div>
            </div>

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center space-x-2 p-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl transition-colors"
            >
              <FiLogOut className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-medium">Cerrar Sesión</span>
            </button>
          </motion.div>
        ) : (
          // Queue section for admins/editors
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FiCheckCircle className="w-5 h-5 mr-2 text-blue-400" />
                Cola de Verificación
              </h3>
              <IncidentQueue />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MobileProfileView;
