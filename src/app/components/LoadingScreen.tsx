'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import ClaridadLogo from './ClaridadLogo';

interface LoadingScreenProps {
  isLoading: boolean;
  progress?: number;
  message?: string;
}

export default function LoadingScreen({ isLoading, progress = 0, message }: LoadingScreenProps) {
  const t = useTranslations('States');
  const tLoading = useTranslations('LoadingScreen');
  const [displayProgress, setDisplayProgress] = useState(0);
  const finalMessage = message || t('loadingApp');

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
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #000000 0%, #111111 50%, #000000 100%)'
      }}
    >
      {/* Efectos de fondo sutiles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/2 rounded-full blur-2xl animate-pulse delay-500" />
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-12 px-6">
        {/* Logo animado con efecto de brillo - MUCHO MÁS GRANDE */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative"
        >
          <div className="relative">
            {/* Efecto de brillo alrededor del logo - MÁS GRANDE */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 w-64 h-64 bg-white/20 rounded-full blur-xl"
            />

            {/* Logo central con efecto de brillo - MUCHO MÁS GRANDE */}
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                filter: [
                  'brightness(1)',
                  'brightness(1.3)',
                  'brightness(1)'
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative z-10 w-128 h-128 flex items-center justify-center"
            >
              <ClaridadLogo size="3xl" showText={false} />
            </motion.div>
          </div>
        </motion.div>

        {/* Nombre de la app - MÁS GRANDE */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center space-y-3"
        >
          <h1 className="text-6xl font-bold text-white tracking-wide">
            <span className="bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent">
              Claridad
            </span>
          </h1>
          <p className="text-gray-400 text-lg font-medium">
            Comunidad de seguridad
          </p>
        </motion.div>

        {/* Barra de progreso */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "100%", opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-80 space-y-4"
        >
          {/* Barra de progreso */}
          <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${displayProgress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-white to-gray-200 rounded-full relative"
            >
              {/* Efecto de brillo */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </motion.div>
          </div>

          {/* Mensaje de carga */}
          <div className="flex items-center justify-between text-base">
            <motion.span
              key={finalMessage}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="text-gray-400"
            >
              {finalMessage}
            </motion.span>
            <span className="text-gray-500 font-mono text-lg">
              {displayProgress}%
            </span>
          </div>
        </motion.div>

        {/* Puntos de carga animados - MÁS GRANDES */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex space-x-3"
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
              className="w-3 h-3 bg-white rounded-full"
            />
          ))}
        </motion.div>

        {/* Texto adicional */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-gray-500 text-sm text-center max-w-md leading-relaxed"
        >
          {tLoading('preparingExperience')}
        </motion.p>
      </div>
    </motion.div>
  );
}
