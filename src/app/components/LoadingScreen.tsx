'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  isLoading: boolean;
  progress?: number;
  message?: string;
}

export default function LoadingScreen({ isLoading, progress = 0, message = "Cargando..." }: LoadingScreenProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    if (isLoading) {
      const timer = setInterval(() => {
        setDisplayProgress(prev => {
          if (prev < progress) {
            return Math.min(prev + 2, progress);
          }
          return prev;
        });
      }, 50);

      return () => clearInterval(timer);
    }
  }, [isLoading, progress]);

  if (!isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center"
    >
      {/* Efectos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-2xl animate-pulse delay-500" />
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-8 px-6">
        {/* Logo animado */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative"
        >
          <div className="relative">
            {/* Anillo exterior giratorio */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 w-24 h-24 border-2 border-transparent border-t-blue-500 border-r-blue-400 rounded-full"
            />

            {/* Anillo interior giratorio en sentido contrario */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 w-20 h-20 border-2 border-transparent border-b-cyan-500 border-l-cyan-400 rounded-full"
            />

            {/* Logo central */}
            <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-2xl">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="text-white text-2xl font-bold"
              >
                C
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Nombre de la app */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center space-y-2"
        >
          <h1 className="text-4xl font-bold text-white tracking-wide">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Claridad
            </span>
          </h1>
          <p className="text-gray-400 text-sm font-medium">
            Comunidad de seguridad
          </p>
        </motion.div>

        {/* Barra de progreso */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "100%", opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-64 space-y-3"
        >
          {/* Barra de progreso */}
          <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${displayProgress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full relative"
            >
              {/* Efecto de brillo */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </motion.div>
          </div>

          {/* Mensaje de carga */}
          <div className="flex items-center justify-between text-sm">
            <motion.span
              key={message}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="text-gray-400"
            >
              {message}
            </motion.span>
            <span className="text-gray-500 font-mono">
              {displayProgress}%
            </span>
          </div>
        </motion.div>

        {/* Puntos de carga animados */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex space-x-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
              className="w-2 h-2 bg-blue-400 rounded-full"
            />
          ))}
        </motion.div>

        {/* Texto adicional */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-gray-500 text-xs text-center max-w-xs leading-relaxed"
        >
          Preparando tu experiencia de seguridad vecinal
        </motion.p>
      </div>
    </motion.div>
  );
}
