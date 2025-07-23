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
        animate={{
          borderRadius: ['20%', '30%', '24%'],
          boxShadow: [
            '0 0 20px rgba(220, 38, 38, 0.3), 0 0 40px rgba(220, 38, 38, 0.1)',
            '0 0 30px rgba(220, 38, 38, 0.4), 0 0 60px rgba(220, 38, 38, 0.2)',
            '0 0 20px rgba(220, 38, 38, 0.3), 0 0 40px rgba(220, 38, 38, 0.1)'
          ]
        }}
        transition={{ duration: 2, repeat: Infinity, repeatType: 'mirror' }}
      >
        <motion.button
          onClick={onClick}
          whileHover={{
            scale: 1.05,
            boxShadow: '0 0 40px rgba(220, 38, 38, 0.5), 0 0 80px rgba(220, 38, 38, 0.3)'
          }}
          className="relative w-24 h-24 p-1 text-gray-800 flex items-center justify-center transition-all duration-300 group overflow-hidden"
          style={{
            background: `
              radial-gradient(circle at 30% 30%, rgba(220, 38, 38, 0.15) 0%, transparent 50%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%),
              rgba(20, 20, 20, 0.8)
            `,
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(220, 38, 38, 0.3)',
            boxShadow: `
              inset 0 0 20px rgba(220, 38, 38, 0.1),
              0 0 30px rgba(220, 38, 38, 0.3),
              0 8px 32px rgba(0, 0, 0, 0.3),
              0 4px 16px rgba(0, 0, 0, 0.2)
            `,
            borderRadius: '30px'
          }}
        >
          {/* Efecto de pulso de fondo */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-red-700/20 rounded-[28px]"
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.02, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Icono principal con animación mejorada */}
          <motion.div
            className="relative z-10"
            animate={{
              rotate: [0, 180, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <FiPlus className="w-14 h-14 text-red-400 group-hover:text-red-300 transition-colors stroke-[2.5] drop-shadow-lg" />
          </motion.div>

          {/* Partículas flotantes */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-red-400 rounded-full"
                style={{
                  left: `${20 + (i * 10)}%`,
                  top: `${20 + (i * 8)}%`,
                }}
                animate={{
                  y: [-10, -20, -10],
                  opacity: [0.3, 0.8, 0.3],
                  scale: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 2 + (i * 0.2),
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>

          {/* Efecto de brillo mejorado */}
          <div
            className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-60"
            style={{ borderRadius: '24px' }}
          />

          {/* Reflejo superior más pronunciado */}
          <div
            className="absolute top-1 left-1 right-1 h-1/2 bg-gradient-to-b from-white/20 to-transparent"
            style={{ borderRadius: '20px 20px 8px 8px' }}
          />

          {/* Sombra interior */}
          <div
            className="absolute inset-[2px] bg-gradient-to-b from-transparent via-transparent to-black/10"
            style={{ borderRadius: '22px' }}
          />

          {/* Texto "Reportar" con efecto de glow */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="absolute bottom-2 font-manrope text-sm font-bold text-red-300 drop-shadow-lg"
            style={{
              textShadow: '0 0 10px rgba(220, 38, 38, 0.5)'
            }}
          >
            Reportar
          </motion.p>

          {/* Borde animado */}
          <motion.div
            className="absolute inset-0 rounded-[28px] border-2 border-red-600/50"
            animate={{
              borderColor: [
                'rgba(220, 38, 38, 0.3)',
                'rgba(220, 38, 38, 0.6)',
                'rgba(220, 38, 38, 0.3)'
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.button>
      </motion.div>

      {/* Tooltip mejorado */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, x: 10, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 10, scale: 0.9 }}
          transition={{ delay: 1, duration: 0.3 }}
          className="absolute right-20 top-1/2 transform -translate-y-1/2 text-white px-5 py-3 rounded-xl text-sm font-medium whitespace-nowrap"
          style={{
            background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(40, 40, 40, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            boxShadow: `
              inset 0 0 10px rgba(220, 38, 38, 0.1),
              0 0 25px rgba(0, 0, 0, 0.5),
              0 8px 30px rgba(0, 0, 0, 0.3),
              0 4px 15px rgba(0, 0, 0, 0.2)
            `
          }}
        >
          <span className="text-red-300 font-semibold">¡Reportar incidente!</span>
          <div
            className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-3 h-3 rotate-45"
            style={{
              background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(40, 40, 40, 0.95) 100%)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
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
