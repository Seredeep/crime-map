'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import FloatingPanicButton from './FloatingPanicButton';
import PanicModal from './PanicModal';

const GlobalPanicButton = () => {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // No mostrar el botón si:
  // - No está autenticado
  // - Está en la página principal (mapa) donde ya está el botón de reportar
  // - Está en páginas de autenticación
  const shouldHideButton =
    status !== 'authenticated' ||
    pathname === '/' ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/onboarding');

  if (shouldHideButton) {
    return null;
  }

  const handlePanicClick = () => {
    setIsModalOpen(true);
  };

    const handleConfirm = async () => {
    try {
      // Verificar contexto seguro (HTTPS o localhost)
      const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      console.log('🔒 Contexto seguro:', isSecureContext);
      console.log('🌐 Protocolo:', window.location.protocol);
      console.log('🏠 Hostname:', window.location.hostname);

      if (!isSecureContext) {
        console.warn('⚠️ Geolocalización requiere HTTPS o localhost');
        alert('⚠️ Para obtener ubicación GPS, la aplicación debe ejecutarse en HTTPS. La alerta se enviará sin ubicación exacta.');
      }

      // Verificar soporte de geolocalización
      let location = null;

      if (!navigator.geolocation) {
        console.error('❌ Geolocalización no soportada por este navegador');
        alert('Tu navegador no soporta geolocalización. La alerta se enviará sin ubicación GPS.');
      } else {
        console.log('🔍 Solicitando permisos de ubicación...');

        // Verificar permisos primero
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          console.log('📋 Estado de permisos de geolocalización:', permission.state);

          if (permission.state === 'denied') {
            console.warn('❌ Permisos de ubicación denegados');
            alert('Los permisos de ubicación están denegados. Por favor, habilítalos en la configuración del navegador para enviar la ubicación exacta.');
          }
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
          console.log(`📍 Ubicación GPS obtenida:`, {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: `${position.coords.accuracy}m`,
            timestamp: new Date(position.timestamp).toLocaleString()
          });

        } catch (error: any) {
          console.error('❌ Error en geolocalización de alta precisión:', error);

          // Mostrar mensaje específico según el tipo de error
          if (error.code === 1) { // PERMISSION_DENIED
            alert('❌ Permisos de ubicación denegados. La alerta se enviará sin ubicación GPS exacta.');
          } else if (error.code === 2) { // POSITION_UNAVAILABLE
            alert('⚠️ No se pudo determinar la ubicación. La alerta se enviará sin ubicación GPS.');
          } else if (error.code === 3) { // TIMEOUT
            console.log('⏱️ Timeout en alta precisión, intentando fallback...');

            // Intentar con configuración menos estricta
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
              console.log(`📍 Ubicación fallback obtenida con precisión de ${fallbackPosition.coords.accuracy}m`);

            } catch (fallbackError) {
              console.error('❌ También falló el fallback:', fallbackError);
              alert('⚠️ No se pudo obtener la ubicación GPS. La alerta se enviará sin ubicación exacta.');
              location = null;
            }
          }
        }
      }

      // Enviar alerta de pánico (ahora maneja tanto la alerta como el mensaje al chat)
      const response = await fetch('/api/panic/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          location
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Error al enviar la alerta');
      }

      console.log('Alerta de pánico enviada exitosamente:', result.data);
    } catch (error) {
      console.error('Error al enviar alerta de pánico:', error);
      throw error;
    }
  };

  return (
    <>
      <FloatingPanicButton
        onClick={handlePanicClick}
        isVisible={true}
      />

      <PanicModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
};

export default GlobalPanicButton;
