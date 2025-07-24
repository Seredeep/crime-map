'use client';

import {
  Activity,
  BarChart3,
  CheckCircle,
  Compass,
  Settings,
  Users
} from 'lucide-react';
import { useState } from 'react';
import ClaridadLogo from './ClaridadLogo';

interface TabProps {
  tabs: {
    id: string;
    label: string;
    content: React.ReactNode;
    icon?: 'map' | 'stats' | 'community' | 'settings' | 'verification' | 'analytics';
  }[];
  defaultTab?: string;
  showTitle?: boolean;
}

const iconMap = {
  map: Compass,
  stats: BarChart3,
  community: Users,
  settings: Settings,
  verification: CheckCircle,
  analytics: Activity,
};

export default function Tabs({ tabs, defaultTab, showTitle = false }: TabProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0].id);

  return (
    <div className="w-full">
      {/* App Title */}
      {showTitle && (
        <div className="flex justify-center mb-8">
          <ClaridadLogo size="xl" showText={true} />
        </div>
      )}

      {/* Tab navigation with improved glassmorphism */}
      <div
        className="flex justify-center items-center space-x-1 px-2 py-2 rounded-2xl mb-8 w-fit mx-auto"
        style={{
          background: 'linear-gradient(180deg, rgba(20, 20, 20, 0.95) 0%, rgba(15, 15, 15, 0.98) 100%)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
        }}
      >
        <nav className="flex space-x-2" aria-label="Tabs">
          {tabs.map((tab) => {
            const IconComponent = tab.icon ? iconMap[tab.icon] : null;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex items-center justify-center p-4 rounded-xl transition-all duration-300 ${
                  isActive ? 'active' : 'inactive'
                }`}
                style={isActive ? {
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(243, 244, 246, 0.15) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  boxShadow: '0 8px 32px rgba(255, 255, 255, 0.15)'
                } : {
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                }}
                aria-current={isActive ? 'page' : undefined}
                title={tab.label}
              >
                {IconComponent && (
                  <IconComponent
                    className={`w-6 h-6 transition-all duration-300 ${
                      isActive
                        ? 'text-white drop-shadow-sm'
                        : 'text-gray-400 group-hover:text-gray-300'
                    }`}
                    style={isActive ? {
                      filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))'
                    } : {}}
                  />
                )}

                {/* Efecto de brillo para tab activo */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent rounded-xl pointer-events-none" />
                )}

                {/* Ripple effect on hover */}
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                     style={{
                       background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, transparent 70%)'
                     }} />
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}
