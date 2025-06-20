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
        <h1
          className="font-manrope text-3xl font-semibold text-[#B5CCF4] text-center mb-8"
          style={{
            textShadow: '0 0 12px rgba(140,200,255,0.8)'
          }}
        >
          Claridad
        </h1>
      )}

      {/* Tab navigation with improved glassmorphism */}
      <div className="tab-glass">
        <nav className="flex space-x-2" aria-label="Tabs">
          {tabs.map((tab) => {
            const IconComponent = tab.icon ? iconMap[tab.icon] : null;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-button group relative flex items-center justify-center p-4 rounded-xl transition-all duration-300 ${
                  isActive ? 'active' : 'inactive'
                }`}
                style={isActive ? {
                  background: 'linear-gradient(135deg, rgba(139, 181, 255, 0.2) 0%, rgba(181, 204, 244, 0.15) 100%)',
                  border: '1px solid rgba(139, 181, 255, 0.4)',
                  boxShadow: '0 8px 32px rgba(139, 181, 255, 0.15)'
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
                    className={`icon w-6 h-6 transition-all duration-300 ${
                      isActive
                        ? 'text-[#B5CCF4] drop-shadow-sm'
                        : 'text-gray-400 group-hover:text-gray-300'
                    }`}
                    style={isActive ? {
                      filter: 'drop-shadow(0 0 4px rgba(181, 204, 244, 0.3))'
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
                       background: 'radial-gradient(circle at center, rgba(139, 181, 255, 0.1) 0%, transparent 70%)'
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
