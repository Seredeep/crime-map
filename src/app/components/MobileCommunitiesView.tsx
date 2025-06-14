'use client';

import { motion } from 'framer-motion';
import { FiUsers, FiMapPin, FiMessageCircle, FiTrendingUp, FiPlus, FiSearch, FiFilter } from 'react-icons/fi';
import { useState } from 'react';

interface Community {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  location: string;
  category: string;
  isJoined: boolean;
  recentActivity: number;
  avatar: string;
}

interface MobileCommunitiesViewProps {
  className?: string;
}

const MobileCommunitiesView = ({ className = '' }: MobileCommunitiesViewProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Datos de ejemplo para comunidades
  const communities: Community[] = [
    {
      id: '1',
      name: 'Vecinos Centro',
      description: 'Comunidad del centro de la ciudad para reportar y discutir incidentes locales',
      memberCount: 234,
      location: 'Centro',
      category: 'neighborhood',
      isJoined: true,
      recentActivity: 12,
      avatar: '🏢'
    },
    {
      id: '2',
      name: 'Seguridad Norte',
      description: 'Grupo enfocado en la seguridad de la zona norte',
      memberCount: 156,
      location: 'Zona Norte',
      category: 'security',
      isJoined: false,
      recentActivity: 8,
      avatar: '🛡️'
    },
    {
      id: '3',
      name: 'Comerciantes Unidos',
      description: 'Red de comerciantes para reportar incidentes que afecten el comercio',
      memberCount: 89,
      location: 'Distrito Comercial',
      category: 'business',
      isJoined: true,
      recentActivity: 15,
      avatar: '🏪'
    },
    {
      id: '4',
      name: 'Estudiantes Seguros',
      description: 'Comunidad estudiantil para reportar incidentes cerca de universidades',
      memberCount: 312,
      location: 'Zona Universitaria',
      category: 'education',
      isJoined: false,
      recentActivity: 23,
      avatar: '🎓'
    }
  ];

  const categories = [
    { id: 'all', label: 'Todas', icon: '📋' },
    { id: 'neighborhood', label: 'Vecindario', icon: '🏘️' },
    { id: 'security', label: 'Seguridad', icon: '🛡️' },
    { id: 'business', label: 'Comercio', icon: '🏪' },
    { id: 'education', label: 'Educación', icon: '🎓' }
  ];

  const filteredCommunities = communities.filter(community => {
    const matchesSearch = community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         community.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || community.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleJoinCommunity = (communityId: string) => {
    // Aquí iría la lógica para unirse a una comunidad
    console.log('Joining community:', communityId);
  };

  return (
    <div className={`w-full h-full bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Comunidades</h1>
          <button className="p-2 bg-blue-500 rounded-full text-white hover:bg-blue-600 transition-colors">
            <FiPlus className="w-5 h-5" />
          </button>
        </div>
        
        {/* Search bar */}
        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar comunidades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Category filters */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center space-x-2 ${
                selectedCategory === category.id
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Communities List */}
      <div className="p-4 pb-24 space-y-4">
        {filteredCommunities.map((community, index) => (
          <motion.div
            key={community.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: index * 0.1,
              duration: 0.3,
              ease: "easeOut"
            }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200"
          >
            {/* Community header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
                  {community.avatar}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{community.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span className="flex items-center">
                      <FiMapPin className="w-4 h-4 mr-1" />
                      {community.location}
                    </span>
                    <span className="flex items-center">
                      <FiUsers className="w-4 h-4 mr-1" />
                      {community.memberCount}
                    </span>
                  </div>
                </div>
              </div>
              
              {community.isJoined && (
                <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                  Unido
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-300 text-sm mb-4 line-clamp-2">
              {community.description}
            </p>

            {/* Stats and actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span className="flex items-center">
                  <FiMessageCircle className="w-4 h-4 mr-1" />
                  {community.recentActivity} recientes
                </span>
                <span className="flex items-center">
                  <FiTrendingUp className="w-4 h-4 mr-1 text-green-400" />
                  Activa
                </span>
              </div>

              {!community.isJoined && (
                <button
                  onClick={() => handleJoinCommunity(community.id)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Unirse
                </button>
              )}
            </div>
          </motion.div>
        ))}

        {filteredCommunities.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <FiUsers className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              No se encontraron comunidades
            </h3>
            <p className="text-gray-500">
              Intenta ajustar tus filtros de búsqueda
            </p>
          </motion.div>
        )}

        {/* Create community prompt */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="mt-8 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl p-6 border border-blue-700/30 text-center"
        >
          <FiPlus className="w-12 h-12 text-blue-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">
            ¿No encuentras tu comunidad?
          </h3>
          <p className="text-gray-300 text-sm mb-4">
            Crea una nueva comunidad y conecta con tus vecinos
          </p>
          <button className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors">
            Crear Comunidad
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default MobileCommunitiesView; 