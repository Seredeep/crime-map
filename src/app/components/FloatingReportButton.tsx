'use client';

import { motion } from 'framer-motion';
import { FiPlus, FiAlertTriangle } from 'react-icons/fi';
import { useState, useEffect } from 'react';

interface FloatingReportButtonProps {
  onClick: () => void;
  isVisible?: boolean;
}

const FloatingReportButton = ({ onClick, isVisible = true }: FloatingReportButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);
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
      className="fixed bottom-40 right-4 z-[120] md:hidden"
    >
      <motion.button
        onClick={onClick}
        onTapStart={() => setIsPressed(true)}
        onTapEnd={() => setIsPressed(false)}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        className="relative w-14 h-14 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-200"
        style={{
          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.4), 0 4px 16px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Efecto de ondas al presionar */}
        <motion.div
          className="absolute inset-0 rounded-full bg-red-400"
          initial={{ scale: 1, opacity: 0 }}
          animate={isPressed ? { scale: 1.5, opacity: [0, 0.3, 0] } : { scale: 1, opacity: 0 }}
          transition={{ duration: 0.6 }}
        />

        {/* Icono principal */}
        <motion.div
          animate={{ rotate: isPressed ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="relative z-10"
        >
          <FiAlertTriangle className="w-6 h-6" />
        </motion.div>

        {/* Efecto de brillo */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent" />
      </motion.button>

      {/* Tooltip */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, x: 10, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 10, scale: 0.9 }}
          transition={{ delay: 1, duration: 0.3 }}
          className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-gray-900/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap border border-gray-700/50"
        >
          Reportar incidente
          <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900/90 rotate-45 border-r border-b border-gray-700/50" />
        </motion.div>
      )}
    </motion.div>
  );
};

export default FloatingReportButton; 