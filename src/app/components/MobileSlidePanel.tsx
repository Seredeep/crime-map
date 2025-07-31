'use client';

import { Neighborhood } from '@/lib/services/neighborhoods';
import { IncidentFilters } from '@/lib/types/global';
import { AnimatePresence, PanInfo, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { FiFilter, FiX } from 'react-icons/fi';
import IncidentFiltersContent from './IncidentFiltersContent';

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
  const t = useTranslations('Actions');
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

          {/* Panel deslizante con estilo Claridad */}
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
            className="fixed left-0 top-0 h-full w-[85%] max-w-sm z-[301] md:hidden shadow-2xl"
            style={{
              x: dragX,
              background: 'rgba(0, 0, 0, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRight: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: `
                -10px 0 50px rgba(0, 0, 0, 0.3),
                -5px 0 25px rgba(0, 0, 0, 0.2),
                inset 1px 0 0 rgba(255, 255, 255, 0.1)
              `
            }}
          >
            {/* Header del panel con estilo Claridad */}
            <div className="sticky top-0 z-10" style={{
              background: 'rgba(0, 0, 0, 0.95)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
                    <FiFilter className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-white font-manrope">Filtros</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all duration-200 backdrop-blur-sm border border-white/20"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Indicador de deslizar */}
              <div className="flex justify-center pb-2">
                <div className="w-8 h-1 bg-white/30 rounded-full" />
              </div>
            </div>

            {/* Contenido del panel */}
            <div className="flex-1 overflow-y-auto p-4">
              <IncidentFiltersContent
                filters={filters}
                onFiltersChangeAction={onFiltersChange}
                onNeighborhoodSelect={onNeighborhoodSelect}
              />
            </div>

            {/* Footer con acciones */}
            <div className="sticky bottom-0 p-4" style={{
              background: 'rgba(0, 0, 0, 0.95)',
              backdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div className="flex space-x-3">
                <motion.button
                  onClick={() => {
                    // Resetear filtros
                    onFiltersChange({
                      status: undefined,
                      tags: []
                    });
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF'
                  }}
                  whileHover={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    transform: 'translateY(-1px)'
                  }}
                >
                  {t('clear')}
                </motion.button>
                <motion.button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium"
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: '#000000'
                  }}
                  whileHover={{
                    background: 'rgba(255, 255, 255, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    transform: 'translateY(-1px)'
                  }}
                >
                  {t('apply')}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileSlidePanel;
