'use client';

import { formatAddress, reverseGeocode } from '@/lib/services/geo/geocoding';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

interface PanicButtonProps {
  isVisible?: boolean;
  className?: string;
}

type PanicState = 'normal' | 'confirming' | 'alerting' | 'success';

const PanicButton = ({ isVisible = true, className = '' }: PanicButtonProps) => {
  const [panicState, setPanicState] = useState<PanicState>('normal');
  const t = useTranslations('Panic');
  // Minimal UI: no tooltip or extra chrome

  // Handle active alert state
  useEffect(() => {
    if (panicState === 'alerting') {
      const timer = setTimeout(() => {
        setPanicState('success');
        // Return to normal after a short delay
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
        // Check geolocation support
      let location = null;
      let formattedAddress = null;

      if (!navigator.geolocation) {
          console.error('❌ Geolocation not supported by this browser');
      } else {
        console.log('🔍 Requesting location permissions...');

          // Check permissions first
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          console.log('📋 Geolocation permission status:', permission.state);
        } catch (permissionError) {
            console.log('⚠️ Could not query permissions:', permissionError);
        }

          // Try to get high accuracy position
        try {
          console.log('🎯 Getting high precision location...');
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                console.log('✅ Location obtained successfully');
                resolve(pos);
              },
              (error) => {
                  console.error('❌ Error getting location:', error);
                  console.error('Error code:', error.code);
                  console.error('Message:', error.message);
                reject(error);
              },
              {
                  timeout: 15000,
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

          // Reverse geocoding
          try {
            const geoResponse = await reverseGeocode(location.lat, location.lng);
            if (geoResponse.features && geoResponse.features.length > 0) {
              formattedAddress = formatAddress(geoResponse.features[0]);
              console.log(`📍 Address obtained: ${formattedAddress}`);
            }
          } catch (geoError) {
            console.error('❌ Reverse geocoding error:', geoError);
          }

          console.log(`📍 GPS location obtained:`, {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: `${position.coords.accuracy}m`,
            timestamp: new Date(position.timestamp).toLocaleString()
          });

        } catch (error: any) {
          console.error('❌ High accuracy geolocation error:', error);

          // Fallback when timeout
          if (error.code === 3) {
            console.log('⏱️ High precision timeout, trying fallback...');

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

              // Reverse geocoding for fallback
              try {
                const geoResponse = await reverseGeocode(location.lat, location.lng);
                if (geoResponse.features && geoResponse.features.length > 0) {
                  formattedAddress = formatAddress(geoResponse.features[0]);
                  console.log(`📍 Fallback address obtained: ${formattedAddress}`);
                }
              } catch (geoError) {
                console.error('❌ Reverse geocoding fallback error:', geoError);
              }

              console.log(`📍 Fallback location obtained with ${fallbackPosition.coords.accuracy}m accuracy`);

            } catch (fallbackError) {
              console.error('❌ Fallback also failed:', fallbackError);
              location = null;
            }
          } else {
            console.error(`❌ Geolocation error (code ${error.code}):`, error.message);
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
      console.error('Error sending alert:', error);
      // In case of error, return to normal state
      setPanicState('normal');
    }
  };

  const handleCancel = () => {
    setPanicState('normal');
  };

  if (!isVisible) return null;

  const getButtonStyle = () => {
    if (panicState === 'alerting') {
      return 'bg-red-600 text-white';
    }
    if (panicState === 'success') {
      return 'bg-emerald-600 text-white';
    }
    return 'bg-orange-600 text-white';
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
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        className={`fixed bottom-[21%] right-4 z-[140] md:hidden ${className}`}
      >
        <motion.button
          onClick={handlePanicClick}
          whileTap={{ scale: 0.95 }}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform ${
            panicState === 'alerting' ? 'animate-pulse' : ''
          } ${getButtonStyle()}`}
        >
          <motion.div
            animate={panicState === 'alerting' ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.8, repeat: panicState === 'alerting' ? Infinity : 0 }}
            className="text-white"
          >
            {panicState === 'success' ? (
              <CheckCircle className="w-8 h-8" />
            ) : (
              <AlertTriangle className="w-8 h-8" />
            )}
          </motion.div>
        </motion.button>
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
                border: '2px solid rgba(234, 88, 12, 0.3)',
                boxShadow: `
                  inset 0 0 20px rgba(234, 88, 12, 0.1),
                  0 0 40px rgba(0, 0, 0, 0.5),
                  0 8px 50px rgba(0, 0, 0, 0.4)
                `
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Efecto de brillo de fondo */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-transparent opacity-50" />

              <div className="relative text-center">
                <motion.div
                  className="w-20 h-20 bg-gradient-to-br from-orange-600/30 to-orange-700/30 rounded-full flex items-center justify-center mx-auto mb-4 relative overflow-hidden"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(234, 88, 12, 0.3)',
                      '0 0 40px rgba(234, 88, 12, 0.5)',
                      '0 0 20px rgba(234, 88, 12, 0.3)'
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
                      background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(185, 28, 28, 0.9) 100%)',
                      boxShadow: '0 0 20px rgba(220, 38, 38, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.1)'
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
