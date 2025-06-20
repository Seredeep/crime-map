'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { FiAlertTriangle, FiMapPin, FiSearch } from 'react-icons/fi';

interface SearchResult {
  id: string;
  type: 'address' | 'incident';
  title: string;
  subtitle: string;
  coordinates?: [number, number];
}

interface MapSearchBarProps {
  onLocationSelect?: (coordinates: [number, number], address: string) => void;
  onIncidentSelect?: (incidentId: string) => void;
  className?: string;
}

const MapSearchBar = ({ onLocationSelect, onIncidentSelect, className = '' }: MapSearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={`relative ${className}`}>
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        {/* Contenedor principal con efectos glass avanzados */}
        <div className="relative border-transparent">
          <div
            className="relative flex items-center transition-all focus:rounded-full duration-300 hover:scale-[1.01]"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px)',
              border: 'transparent',
              boxShadow: `
                inset 0 0 10px rgba(255,255,255,0.04),
                0 0 30px rgba(255,255,255,0.02),
                0 8px 32px rgba(0, 0, 0, 0.08),
                0 4px 16px rgba(0, 0, 0, 0.06),
                0 20px 60px rgba(0, 0, 0, 0.04)
              `,
              borderRadius: '20px'
            }}
          >
            {/* Ícono de búsqueda */}
            <div className="pl-5 pr-3">
              <FiSearch className="w-5 h-5 text-gray-700" />
            </div>

            {/* Input de búsqueda */}
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar dirección o incidente..."
              className="flex-1 py-2 px-3 focus:rounded-full bg-transparent text-gray-900 placeholder-gray-600 border-transparent focus:outline-none font-medium"
            />

            {/* Spinner de carga */}
            {isLoading && (
              <div className="px-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
              </div>
            )}

            {/* Efectos adicionales para el contenedor */}
            <div
              className="absolute inset-0 bg-gradient-to-tr from-white/2 to-transparent opacity-30 pointer-events-none"
              style={{ borderRadius: '20px' }}
            />

            <div
              className="absolute top-1 left-1 right-1 h-1/3 bg-gradient-to-b from-white/6 to-transparent pointer-events-none"
              style={{ borderRadius: '18px 18px 8px 8px' }}
            />

            <div
              className="absolute inset-[2px] bg-gradient-to-b from-transparent via-transparent to-black/2 pointer-events-none"
              style={{ borderRadius: '18px' }}
            />
          </div>

          {/* Resultados de búsqueda con estilo glass mejorado */}
          <AnimatePresence>
            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="absolute top-full left-0 right-0 mt-3 overflow-hidden z-10"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: `
                    inset 0 0 10px rgba(255,255,255,0.04),
                    0 0 30px rgba(255,255,255,0.02),
                    0 8px 32px rgba(0, 0, 0, 0.10),
                    0 4px 16px rgba(0, 0, 0, 0.08),
                    0 20px 60px rgba(0, 0, 0, 0.05)
                  `,
                  borderRadius: '20px'
                }}
              >
                <div className="max-h-64 overflow-y-auto">
                  {results.map((result, index) => (
                    <motion.button
                      key={result.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {}}
                      className="w-full flex items-center space-x-4 p-4 hover:bg-white/10 transition-all duration-200 text-left border-b border-white/10 last:border-b-0 group"
                    >
                      <div className={`p-2.5 rounded-xl backdrop-blur-sm transition-all duration-200 group-hover:scale-105 ${result.type === 'address'
                          ? 'bg-blue-500/20 text-blue-700 border border-blue-300/30'
                          : 'bg-red-500/20 text-red-700 border border-red-300/30'
                        }`}>
                        {result.type === 'address' ? (
                          <FiMapPin className="w-4 h-4" />
                        ) : (
                          <FiAlertTriangle className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate group-hover:text-gray-800 transition-colors">
                          {result.title}
                        </h4>
                        <p className="text-sm text-gray-600 truncate">
                          {result.subtitle}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Efectos adicionales para los resultados */}
                <div
                  className="absolute inset-0 bg-gradient-to-tr from-white/2 to-transparent opacity-30 pointer-events-none"
                  style={{ borderRadius: '20px' }}
                />

                <div
                  className="absolute top-1 left-1 right-1 h-1/4 bg-gradient-to-b from-white/6 to-transparent pointer-events-none"
                  style={{ borderRadius: '18px 18px 8px 8px' }}
                />

                <div
                  className="absolute inset-[2px] bg-gradient-to-b from-transparent via-transparent to-black/2 pointer-events-none"
                  style={{ borderRadius: '18px' }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default MapSearchBar;
