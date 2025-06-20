'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PanicButtonProps {
  isVisible?: boolean;
  className?: string;
}

type PanicState = 'normal' | 'confirming' | 'alerting' | 'success';

const PanicButton = ({ isVisible = true, className = '' }: PanicButtonProps) => {
  const [panicState, setPanicState] = useState<PanicState>('normal');
  const [showTooltip, setShowTooltip] = useState(true);

  // Ocultar tooltip después de 3 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Manejar el estado de alerta activa
  useEffect(() => {
    if (panicState === 'alerting') {
      const timer = setTimeout(() => {
        setPanicState('success');
        // Volver al estado normal después de 2 segundos más
        setTimeout(() => {
          setPanicState('normal');
        }, 2000);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [panicState]);

  const handlePanicClick = () => {
    if (panicState === 'normal') {
      setPanicState('confirming');
    }
  };

  const handleConfirm = async () => {
    setPanicState('alerting');

    try {
      const response = await fetch('/api/panic/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          location: 'current' // Se podría agregar geolocalización aquí
        }),
      });

      const result = await response.json();
      console.log('Alerta enviada:', result);
    } catch (error) {
      console.error('Error al enviar alerta:', error);
      // En caso de error, volver al estado normal
      setPanicState('normal');
    }
  };

  const handleCancel = () => {
    setPanicState('normal');
  };

  if (!isVisible) return null;

  const getButtonColor = () => {
    switch (panicState) {
      case 'alerting':
        return 'text-red-500';
      case 'success':
        return 'text-green-500';
      default:
        return 'text-orange-500';
    }
  };

  const getIcon = () => {
    switch (panicState) {
      case 'success':
        return <CheckCircle className="w-8 h-8" />;
      default:
        return <AlertTriangle className="w-8 h-8" />;
    }
  };

  return (
    <>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20,
          delay: 0.1
        }}
        className={`fixed bottom-36 right-4 z-[119] md:hidden ${className}`}
      >
        <motion.div
          whileTap={{ scale: 0.95 }}
          animate={{
            borderRadius: ['20%', '30%', '24%'],
            ...(panicState === 'alerting' && {
              scale: [1, 1.05, 1],
              transition: { duration: 1, repeat: Infinity }
            })
          }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'mirror' }}
        >
          <motion.button
            onClick={handlePanicClick}
            whileHover={{ scale: 1.02 }}
            className={`relative w-14 h-14 text-gray-800 flex items-center justify-center transition-all duration-300 group ${
              panicState === 'alerting' ? 'animate-pulse' : ''
            }`}
            style={{
              background: panicState === 'alerting'
                ? 'rgba(239, 68, 68, 0.1)'
                : 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px)',
              border: panicState === 'alerting'
                ? '1px solid rgba(239, 68, 68, 0.2)'
                : '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: panicState === 'alerting'
                ? `
                  inset 0 0 10px rgba(239,68,68,0.1),
                  0 0 30px rgba(239,68,68,0.15),
                  0 8px 32px rgba(239, 68, 68, 0.1),
                  0 4px 16px rgba(0, 0, 0, 0.06),
                  0 2px 8px rgba(0, 0, 0, 0.04)
                `
                : `
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
            <div className={`${getButtonColor()} group-hover:scale-110 transition-all duration-200`}>
              {getIcon()}
            </div>

            {/* Efecto de brillo */}
            <div
              className="absolute inset-0 bg-gradient-to-tr from-white/3 to-transparent opacity-40"
              style={{ borderRadius: '24px' }}
            />

            {/* Reflejo superior */}
            <div
              className="absolute top-1 left-1 right-1 h-1/3 bg-gradient-to-b from-white/8 to-transparent"
              style={{ borderRadius: '20px 20px 8px 8px' }}
            />

            {/* Sombra interior */}
            <div
              className="absolute inset-[2px] bg-gradient-to-b from-transparent via-transparent to-black/2"
              style={{ borderRadius: '22px' }}
            />
          </motion.button>
        </motion.div>

        {/* Tooltip */}
        {showTooltip && panicState === 'normal' && (
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
            Botón de pánico
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

      {/* Modal de confirmación */}
      <AnimatePresence>
        {panicState === 'confirming' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150] flex items-center justify-center p-4"
            onClick={handleCancel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="bg-gray-900/95 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6 max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-orange-500" />
                </div>

                <h3 className="text-xl font-semibold text-white mb-2">
                  Alerta de Pánico
                </h3>

                <p className="text-gray-300 text-sm mb-6">
                  ¿Confirmás la alerta para tu barrio? Se notificará a todos los vecinos conectados.
                </p>

                <div className="flex space-x-3">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
                  >
                    Sí, alertar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PanicButton;
