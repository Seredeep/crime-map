'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { FiAlertTriangle, FiMapPin, FiPhone, FiShield, FiX } from 'react-icons/fi';

interface PanicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const PanicModal = ({ isOpen, onClose, onConfirm }: PanicModalProps) => {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        onClose();
        setIsConfirming(false);
      }, 2000);
    } catch (error) {
      setIsConfirming(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[500] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full border border-gray-700/50 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {!isConfirming ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                      <FiAlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Alerta de Pánico</h3>
                      <p className="text-sm text-gray-400">Emergencia</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                  >
                    <FiX className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Content */}
                <div className="mb-6">
                  <p className="text-gray-300 mb-4">
                    ¿Estás en una situación de emergencia? Esta acción enviará una alerta inmediata a:
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
                      <FiShield className="w-5 h-5 text-blue-400" />
                      <span className="text-sm text-gray-300">Chat de vecinos de tu barrio</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
                      <FiMapPin className="w-5 h-5 text-green-400" />
                      <span className="text-sm text-gray-300">Tu ubicación aproximada</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
                      <FiPhone className="w-5 h-5 text-yellow-400" />
                      <span className="text-sm text-gray-300">Servicios de emergencia (próximamente)</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors font-medium flex items-center justify-center space-x-2"
                  >
                    <FiAlertTriangle className="w-4 h-4" />
                    <span>Enviar Alerta</span>
                  </button>
                </div>
              </>
            ) : (
              /* Confirmation State */
              <div className="text-center py-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
                  >
                    <motion.svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </motion.svg>
                  </motion.div>
                </motion.div>

                <h3 className="text-lg font-semibold text-white mb-2">¡Alerta Enviada!</h3>
                <p className="text-gray-400 mb-4">
                  Tu mensaje de pánico ha sido enviado al chat de tu barrio. Los vecinos han sido notificados.
                </p>

                <div className="flex items-center justify-center space-x-2 text-sm text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Mensaje enviado al chat barrial</span>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PanicModal;
