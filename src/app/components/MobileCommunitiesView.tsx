'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { FiCompass, FiHome } from 'react-icons/fi';
import MobileChatView from './MobileChatView';
import MobileExploreCommunitiesView from './MobileExploreCommunitiesView';
import PanicButton from './PanicButton';

interface MobileCommunitiesViewProps {
  className?: string;
}

type TabType = 'chat' | 'explore';

const MobileCommunitiesView = ({ className = '' }: MobileCommunitiesViewProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('chat');

  const tabs = [
    {
      id: 'chat' as TabType,
      label: 'Mi Barrio',
      icon: FiHome,
      description: 'Chat con tus vecinos'
    },
    {
      id: 'explore' as TabType,
      label: 'Explorar',
      icon: FiCompass,
      description: 'Descubre comunidades'
    }
  ];

  return (
    <div className={`w-full h-full bg-gray-900 flex flex-col ${className}`}>
      {/* Tab Navigation */}
      <div className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Comunidades</h1>
        </div>

        {/* Tab buttons */}
        <div className="flex space-x-1 bg-gray-800/50 rounded-xl p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 relative px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-blue-500 rounded-lg"
                    transition={{
                      type: "spring",
                      bounce: 0.2,
                      duration: 0.6
                    }}
                  />
                )}
                <div className="relative flex items-center justify-center space-x-2">
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tab description */}
        <div className="mt-3 text-center">
          <p className="text-sm text-gray-400">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: activeTab === 'chat' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: activeTab === 'chat' ? 20 : -20 }}
          transition={{
            type: "spring",
            bounce: 0.1,
            duration: 0.4
          }}
          className="w-full h-full"
        >
          {activeTab === 'chat' && (
            <MobileChatView className="w-full h-full" />
          )}

          {activeTab === 'explore' && (
            <MobileExploreCommunitiesView className="w-full h-full" />
          )}
        </motion.div>
      </div>

      {/* Botón de pánico flotante */}
      <PanicButton isVisible={true} />
    </div>
  );
};

export default MobileCommunitiesView;
