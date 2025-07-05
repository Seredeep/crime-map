'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { FiPlus } from 'react-icons/fi';

interface FloatingReportButtonProps {
  onClick: () => void;
  isVisible?: boolean;
  className?: string;
}

const FloatingReportButton = ({ onClick, isVisible = true, className }: FloatingReportButtonProps) => {
  const [showTooltip, setShowTooltip] = useState(true);

  // Ocultar tooltip después de 3 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: 0.2
      }}
      className={`fixed bottom-52 right-4 z-[120] md:hidden ${className}`}
    >
      <motion.div
        whileTap={{ scale: 0.95 }}
        animate={{ borderRadius: ['20%', '30%', '24%'] }}
        transition={{ duration: 2, repeat: Infinity, repeatType: 'mirror' }}
      >
        <motion.button
          onClick={onClick}
          whileHover={{ scale: 1.02 }}
          className="relative w-20 h-20 p-1 text-gray-800 flex items-center justify-center transition-all duration-300 group"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: `
              inset 0 0 10px rgba(255,255,255,0.04),
              0 0 30px rgba(255,255,255,0.02),
              0 8px 32px rgba(0, 0, 0, 0.08),
              0 4px 16px rgba(0, 0, 0, 0.06),
              0 2px 8px rgba(0, 0, 0, 0.04)
            `,
            borderRadius: '30px'
          }}
        >
          {/* Icono principal */}
          <FiPlus className="w-12 h-12 text-red-500 group-hover:text-red-600 transition-colors stroke-[2.5]" />


          {/* Efecto de brillo reducido */}
          <div
            className="absolute inset-0 bg-gradient-to-tr from-white/3 to-transparent opacity-40"
            style={{ borderRadius: '24px' }}
          />

          {/* Reflejo superior más sutil */}
          <div
            className="absolute top-1 left-1 right-1 h-1/3 bg-gradient-to-b from-white/8 to-transparent"
            style={{ borderRadius: '20px 20px 8px 8px' }}
          />

          {/* Sombra interior más sutil */}
          <div
            className="absolute inset-[2px] bg-gradient-to-b from-transparent via-transparent to-black/2"
            style={{ borderRadius: '22px' }}
          />

          <motion.p
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            transition={{ delay: 1, duration: 0.3 }}
            className="absolute bottom-1 transform -translate-y-1/2 font-manrope text-xs font-semibold text-[#B5CCF4]"
          >
            Reportar
          </motion.p>
        </motion.button>
      </motion.div>

      {/* Tooltip mejorado */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, x: 10, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 10, scale: 0.9 }}
          transition={{ delay: 1, duration: 0.3 }}
          className="absolute right-16 top-1/2 transform -translate-y-1/2 text-white px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap"
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: `
              inset 0 0 5px rgba(0,255,255,0.05),
              0 0 20px rgba(0,0,0,0.3),
              0 8px 25px rgba(0,0,0,0.2),
              0 4px 12px rgba(0,0,0,0.15)
            `
          }}
        >
          Reportar incidente
          <div
            className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-2 h-2 rotate-45"
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderLeft: 'none',
              borderTop: 'none'
            }}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

export default FloatingReportButton;
