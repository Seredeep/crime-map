'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import { FiSearch, FiMapPin, FiAlertTriangle } from 'react-icons/fi';

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
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <div className="relative flex items-center bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-gray-200/50 overflow-hidden">
            <div className="pl-4 pr-2">
              <FiSearch className="w-5 h-5 text-gray-500" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar dirección o incidente..."
              className="flex-1 py-3 px-2 bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none"
            />
            {isLoading && (
              <div className="px-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
              </div>
            )}
          </div>

          {/* Resultados de búsqueda */}
          <AnimatePresence>
            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden z-10"
              >
                <div className="max-h-64 overflow-y-auto">
                  {results.map((result, index) => (
                    <motion.button
                      key={result.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {}}
                      className="w-full flex items-center space-x-3 p-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                    >
                      <div className={`p-2 rounded-lg ${result.type === 'address'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-red-100 text-red-600'
                        }`}>
                        {result.type === 'address' ? (
                          <FiMapPin className="w-4 h-4" />
                        ) : (
                          <FiAlertTriangle className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {result.title}
                        </h4>
                        <p className="text-sm text-gray-500 truncate">
                          {result.subtitle}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MapSearchBar;
