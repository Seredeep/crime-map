'use client';

import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useEffect, useState } from 'react';
import { FiX, FiFilter } from 'react-icons/fi';
import IncidentFiltersComponent from './IncidentFilters';
import { IncidentFilters } from '@/lib/types';
import { Neighborhood } from '@/lib/neighborhoodService';

interface MobileSlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: IncidentFilters;
  onFiltersChange: (newFilters: IncidentFilters) => void;
  onNeighborhoodSelect: (neighborhood: Neighborhood | null) => void;
}

const MobileSlidePanel = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onNeighborhoodSelect
}: MobileSlidePanelProps) => {
  const [dragX, setDragX] = useState(0);

  // Prevenir scroll del body cuando el panel está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Si se arrastra más de 100px hacia la izquierda, cerrar el panel
    if (info.offset.x < -100) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] md:hidden"
            onClick={onClose}
          />

          {/* Panel deslizante */}
          <motion.div
            initial={{ x: '-100%', scale: 0.95 }}
            animate={{ x: 0, scale: 1 }}
            exit={{ x: '-100%', scale: 0.95 }}
            transition={{ 
              type: 'spring', 
              damping: 30, 
              stiffness: 300,
              duration: 0.5
            }}
            drag="x"
            dragConstraints={{ left: -50, right: 0 }}
            dragElastic={0.05}
            onDragEnd={handleDragEnd}
            className="fixed left-0 top-0 h-full w-[85%] max-w-sm bg-gray-900/98 backdrop-blur-xl border-r border-gray-700/50 z-[301] md:hidden shadow-2xl"
            style={{ x: dragX }}
          >
            {/* Header del panel */}
            <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 z-10">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <FiFilter className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Filtros</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all duration-200"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Indicador de deslizar */}
              <div className="flex justify-center pb-2">
                <div className="w-8 h-1 bg-gray-600 rounded-full" />
              </div>
            </div>

            {/* Contenido del panel */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <IncidentFiltersComponent
                  filters={filters}
                  onFiltersChange={onFiltersChange}
                  onNeighborhoodSelect={onNeighborhoodSelect}
                />
              </div>
            </div>

            {/* Footer con acciones */}
            <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700/50 p-4">
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    // Resetear filtros
                    onFiltersChange({
                      status: undefined,
                      tags: []
                    });
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded-lg transition-all duration-200 font-medium"
                >
                  Limpiar
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-medium"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileSlidePanel; 