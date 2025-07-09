'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatAddress, reverseGeocode } from '../../lib/geocoding';

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
      // Verificar soporte de geolocalización
      let location = null;
      let formattedAddress = null;

      if (!navigator.geolocation) {
        console.error('❌ Geolocalización no soportada por este navegador');
        // No mostrar alert aquí ya que el botón está en estado alerting
      } else {
        console.log('🔍 Solicitando permisos de ubicación...');

        // Verificar permisos primero
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          console.log('📋 Estado de permisos de geolocalización:', permission.state);
        } catch (permissionError) {
          console.log('⚠️ No se pudo verificar permisos:', permissionError);
        }

        // Intentar obtener ubicación con alta precisión
        try {
          console.log('🎯 Obteniendo ubicación de alta precisión...');
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                console.log('✅ Ubicación obtenida exitosamente');
                resolve(pos);
              },
              (error) => {
                console.error('❌ Error obteniendo ubicación:', error);
                console.error('Código de error:', error.code);
                console.error('Mensaje:', error.message);
                reject(error);
              },
              {
                timeout: 15000, // Más tiempo para obtener ubicación
                enableHighAccuracy: true,
                maximumAge: 0
              }
            );
          });

          location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };

          // Realizar geocodificación inversa
          try {
            const geoResponse = await reverseGeocode(location.lat, location.lng);
            if (geoResponse.features && geoResponse.features.length > 0) {
              formattedAddress = formatAddress(geoResponse.features[0]);
              console.log(`📍 Dirección obtenida: ${formattedAddress}`);
            }
          } catch (geoError) {
            console.error('❌ Error en geocodificación inversa:', geoError);
          }

          console.log(`📍 Ubicación GPS obtenida:`, {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: `${position.coords.accuracy}m`,
            timestamp: new Date(position.timestamp).toLocaleString()
          });

        } catch (error: any) {
          console.error('❌ Error en geolocalización de alta precisión:', error);

          // Intentar fallback sin mostrar alerts (el botón está en modo alerting)
          if (error.code === 3) { // TIMEOUT
            console.log('⏱️ Timeout en alta precisión, intentando fallback...');

            try {
              const fallbackPosition = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                  resolve,
                  reject,
                  {
                    timeout: 10000,
                    enableHighAccuracy: false,
                    maximumAge: 60000
                  }
                );
              });

              location = {
                lat: fallbackPosition.coords.latitude,
                lng: fallbackPosition.coords.longitude,
                accuracy: fallbackPosition.coords.accuracy,
                timestamp: fallbackPosition.timestamp,
                fallback: true
              };

              // Realizar geocodificación inversa para el fallback
              try {
                const geoResponse = await reverseGeocode(location.lat, location.lng);
                if (geoResponse.features && geoResponse.features.length > 0) {
                  formattedAddress = formatAddress(geoResponse.features[0]);
                  console.log(`📍 Dirección fallback obtenida: ${formattedAddress}`);
                }
              } catch (geoError) {
                console.error('❌ Error en geocodificación inversa para fallback:', geoError);
              }

              console.log(`📍 Ubicación fallback obtenida con precisión de ${fallbackPosition.coords.accuracy}m`);

            } catch (fallbackError) {
              console.error('❌ También falló el fallback:', fallbackError);
              location = null;
            }
          } else {
            console.error(`❌ Error de geolocalización (código ${error.code}):`, error.message);
            location = null;
          }
        }
      }

      const response = await fetch('/api/panic/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          location,
          address: formattedAddress
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Error al enviar la alerta');
      }

      console.log('Alerta enviada:', result.data);
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
            boxShadow: [
              '0 0 25px rgba(251, 146, 60, 0.4), 0 0 50px rgba(251, 146, 60, 0.2)',
              '0 0 35px rgba(251, 146, 60, 0.6), 0 0 70px rgba(251, 146, 60, 0.3)',
              '0 0 25px rgba(251, 146, 60, 0.4), 0 0 50px rgba(251, 146, 60, 0.2)'
            ],
            ...(panicState === 'alerting' && {
              scale: [1, 1.1, 1],
              boxShadow: [
                '0 0 40px rgba(239, 68, 68, 0.6), 0 0 80px rgba(239, 68, 68, 0.4)',
                '0 0 60px rgba(239, 68, 68, 0.8), 0 0 120px rgba(239, 68, 68, 0.6)',
                '0 0 40px rgba(239, 68, 68, 0.6), 0 0 80px rgba(239, 68, 68, 0.4)'
              ],
              transition: { duration: 0.8, repeat: Infinity }
            })
          }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'mirror' }}
        >
          <motion.button
            onClick={handlePanicClick}
            whileHover={{
              scale: 1.05,
              boxShadow: panicState === 'alerting'
                ? '0 0 60px rgba(239, 68, 68, 0.8), 0 0 120px rgba(239, 68, 68, 0.6)'
                : '0 0 40px rgba(251, 146, 60, 0.6), 0 0 80px rgba(251, 146, 60, 0.4)'
            }}
            className={`relative w-24 h-24 text-gray-800 flex items-center justify-center transition-all duration-300 group overflow-hidden ${
              panicState === 'alerting' ? 'animate-pulse' : ''
            }`}
            style={{
              background: panicState === 'alerting'
                ? `
                  radial-gradient(circle at 30% 30%, rgba(239, 68, 68, 0.3) 0%, transparent 50%),
                  linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%),
                  rgba(20, 20, 20, 0.9)
                `
                : `
                  radial-gradient(circle at 30% 30%, rgba(251, 146, 60, 0.2) 0%, transparent 50%),
                  linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%),
                  rgba(20, 20, 20, 0.8)
                `,
              backdropFilter: 'blur(20px)',
              border: panicState === 'alerting'
                ? '2px solid rgba(239, 68, 68, 0.5)'
                : '2px solid rgba(251, 146, 60, 0.4)',
              boxShadow: panicState === 'alerting'
                ? `
                  inset 0 0 20px rgba(239, 68, 68, 0.2),
                  0 0 40px rgba(239, 68, 68, 0.4),
                  0 8px 32px rgba(0, 0, 0, 0.3),
                  0 4px 16px rgba(0, 0, 0, 0.2)
                `
                : `
                  inset 0 0 20px rgba(251, 146, 60, 0.15),
                  0 0 30px rgba(251, 146, 60, 0.3),
                  0 8px 32px rgba(0, 0, 0, 0.3),
                  0 4px 16px rgba(0, 0, 0, 0.2)
                `,
              borderRadius: '30px'
            }}
          >
            {/* Efecto de pulso de fondo */}
            <motion.div
              className={`absolute inset-0 rounded-[28px] ${
                panicState === 'alerting'
                  ? 'bg-gradient-to-r from-red-500/30 to-red-600/30'
                  : 'bg-gradient-to-r from-orange-500/20 to-orange-600/20'
              }`}
              animate={{
                opacity: panicState === 'alerting' ? [0.4, 0.8, 0.4] : [0.3, 0.6, 0.3],
                scale: panicState === 'alerting' ? [1, 1.05, 1] : [1, 1.02, 1]
              }}
              transition={{
                duration: panicState === 'alerting' ? 1 : 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* Icono principal con animación dramática */}
            <motion.div
              className={`relative z-10 ${getButtonColor()} group-hover:scale-110 transition-all duration-200`}
              animate={panicState === 'alerting' ? {
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0]
              } : {
                scale: [1, 1.05, 1],
                rotate: [0, 2, -2, 0]
              }}
              transition={{
                duration: panicState === 'alerting' ? 0.6 : 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="relative">
                {getIcon()}
                {/* Efecto de glow en el icono */}
                <div
                  className="absolute inset-0 blur-sm"
                  style={{
                    background: panicState === 'alerting'
                      ? 'radial-gradient(circle, rgba(239, 68, 68, 0.6) 0%, transparent 70%)'
                      : 'radial-gradient(circle, rgba(251, 146, 60, 0.4) 0%, transparent 70%)'
                  }}
                />
              </div>
            </motion.div>

            {/* Ondas de impacto para estado de alerta */}
            {panicState === 'alerting' && (
              <motion.div className="absolute inset-0 pointer-events-none">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 border-2 border-red-400/30 rounded-full"
                    initial={{ scale: 0.8, opacity: 0.8 }}
                    animate={{
                      scale: [0.8, 2.5],
                      opacity: [0.8, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.6,
                      ease: "easeOut"
                    }}
                  />
                ))}
              </motion.div>
            )}

            {/* Partículas de emergencia */}
            {panicState === 'normal' && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-orange-400 rounded-full"
                    style={{
                      left: `${15 + (i * 8)}%`,
                      top: `${15 + (i * 7)}%`,
                    }}
                    animate={{
                      y: [-8, -16, -8],
                      opacity: [0.4, 0.9, 0.4],
                      scale: [0.5, 1.2, 0.5]
                    }}
                    transition={{
                      duration: 1.5 + (i * 0.1),
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </motion.div>
            )}

            {/* Efecto de brillo mejorado */}
            <div
              className="absolute inset-0 bg-gradient-to-tr from-white/15 to-transparent opacity-60"
              style={{ borderRadius: '24px' }}
            />

            {/* Reflejo superior más pronunciado */}
            <div
              className="absolute top-1 left-1 right-1 h-1/2 bg-gradient-to-b from-white/25 to-transparent"
              style={{ borderRadius: '20px 20px 8px 8px' }}
            />

            {/* Sombra interior */}
            <div
              className="absolute inset-[2px] bg-gradient-to-b from-transparent via-transparent to-black/15"
              style={{ borderRadius: '22px' }}
            />

            {/* Texto "Pánico" con efecto de glow */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className={`absolute bottom-2 text-sm font-bold drop-shadow-lg ${
                panicState === 'alerting' ? 'text-red-300' : 'text-orange-300'
              }`}
              style={{
                textShadow: panicState === 'alerting'
                  ? '0 0 15px rgba(239, 68, 68, 0.8)'
                  : '0 0 10px rgba(251, 146, 60, 0.6)'
              }}
            >
              {panicState === 'alerting' ? '¡ALERTA!' : 'Pánico'}
            </motion.p>

            {/* Borde animado */}
            <motion.div
              className={`absolute inset-0 rounded-[28px] border-2 ${
                panicState === 'alerting' ? 'border-red-400/60' : 'border-orange-400/50'
              }`}
              animate={{
                borderColor: panicState === 'alerting' ? [
                  'rgba(239, 68, 68, 0.4)',
                  'rgba(239, 68, 68, 0.8)',
                  'rgba(239, 68, 68, 0.4)'
                ] : [
                  'rgba(251, 146, 60, 0.3)',
                  'rgba(251, 146, 60, 0.6)',
                  'rgba(251, 146, 60, 0.3)'
                ]
              }}
              transition={{
                duration: panicState === 'alerting' ? 1 : 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.button>
        </motion.div>

        {/* Tooltip mejorado */}
        {showTooltip && panicState === 'normal' && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            transition={{ delay: 1, duration: 0.3 }}
            className="absolute right-20 top-1/2 transform -translate-y-1/2 text-white px-5 py-3 rounded-xl text-sm font-medium whitespace-nowrap"
            style={{
              background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(40, 40, 40, 0.95) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(251, 146, 60, 0.4)',
              boxShadow: `
                inset 0 0 10px rgba(251, 146, 60, 0.1),
                0 0 25px rgba(0, 0, 0, 0.5),
                0 8px 30px rgba(0, 0, 0, 0.3),
                0 4px 15px rgba(0, 0, 0, 0.2)
              `
            }}
          >
            <span className="text-orange-300 font-semibold">⚠️ Botón de pánico</span>
            <div
              className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-3 h-3 rotate-45"
              style={{
                background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(40, 40, 40, 0.95) 100%)',
                border: '1px solid rgba(251, 146, 60, 0.4)',
                borderLeft: 'none',
                borderTop: 'none'
              }}
            />
          </motion.div>
        )}
      </motion.div>

      {/* Modal de confirmación mejorado */}
      <AnimatePresence>
        {panicState === 'confirming' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4"
            onClick={handleCancel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative overflow-hidden rounded-2xl p-6 max-w-sm w-full mx-4"
              style={{
                background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(40, 40, 40, 0.95) 100%)',
                backdropFilter: 'blur(20px)',
                border: '2px solid rgba(251, 146, 60, 0.3)',
                boxShadow: `
                  inset 0 0 20px rgba(251, 146, 60, 0.1),
                  0 0 40px rgba(0, 0, 0, 0.5),
                  0 8px 50px rgba(0, 0, 0, 0.4)
                `
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Efecto de brillo de fondo */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-50" />

              <div className="relative text-center">
                <motion.div
                  className="w-20 h-20 bg-gradient-to-br from-orange-500/30 to-orange-600/30 rounded-full flex items-center justify-center mx-auto mb-4 relative overflow-hidden"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(251, 146, 60, 0.3)',
                      '0 0 40px rgba(251, 146, 60, 0.5)',
                      '0 0 20px rgba(251, 146, 60, 0.3)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <AlertTriangle className="w-10 h-10 text-orange-400 drop-shadow-lg" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent rounded-full" />
                </motion.div>

                <h3 className="text-2xl font-bold text-white mb-2">
                  ⚠️ Alerta de Pánico
                </h3>

                <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                  ¿Confirmás la alerta para tu barrio? Se notificará a todos los vecinos conectados de manera <span className="text-orange-400 font-semibold">inmediata</span>.
                </p>

                <div className="flex space-x-3">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-3 bg-gray-700/80 hover:bg-gray-600/80 text-white rounded-xl font-medium transition-all duration-200 backdrop-blur-sm border border-gray-600/50"
                  >
                    Cancelar
                  </button>
                  <motion.button
                    onClick={handleConfirm}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-4 py-3 text-white rounded-xl font-bold transition-all duration-200 relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.9) 100%)',
                      boxShadow: '0 0 20px rgba(239, 68, 68, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <span className="relative z-10">🚨 Sí, alertar</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200" />
                  </motion.button>
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
