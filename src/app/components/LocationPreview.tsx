'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { FiExternalLink, FiMapPin, FiX } from 'react-icons/fi';

interface LocationPreviewProps {
  location: { lat: number; lng: number; address?: string };
  onClose: () => void;
  onConfirm: () => void;
}

const LocationPreview = ({ location, onClose, onConfirm }: LocationPreviewProps) => {
  const t = useTranslations('Chat');
  const [staticMapUrl, setStaticMapUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateStaticMapUrl = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);

      // Obtener la API key de Google Maps desde las variables de entorno
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        setError(t('googleMapsApiKeyNotConfigured'));
        setIsLoading(false);
        return;
      }

      // Construir la URL de Google Static Maps
      const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
      const params = new URLSearchParams({
        center: `${location.lat},${location.lng}`,
        zoom: '16',
        size: '400x300',
        scale: '2', // Para pantallas de alta densidad
        maptype: 'roadmap',
        markers: `color:red|label:L|${location.lat},${location.lng}`,
        key: apiKey
      });

      // Agregar estilo personalizado para mejor visibilidad
      const style = 'feature:all|element:labels.text.fill|color:0xffffff|feature:all|element:labels.text.stroke|color:0x000000|lightness:13';
      params.append('style', style);

      const url = `${baseUrl}?${params.toString()}`;
      setStaticMapUrl(url);
      setIsLoading(false);
    } catch (err) {
      console.error('Error generando URL de mapa estático:', err);
      setError(t('locationPreviewError'));
      setIsLoading(false);
    }
  }, [location, t]);

  useEffect(() => {
    generateStaticMapUrl();
  }, [generateStaticMapUrl]);

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
    window.open(url, '_blank');
  };

  const copyCoordinates = () => {
    const coords = `${location.lat}, ${location.lng}`;
    navigator.clipboard.writeText(coords).then(() => {
      // Mostrar feedback visual (opcional)
      console.log('Coordenadas copiadas al portapapeles');
    });
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[600] flex items-center justify-center p-4"
      >
        <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">{t('generatingLocationPreview')}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[600] flex items-center justify-center p-4"
      >
        <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <FiMapPin className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-400 mb-2">{t('error')}</h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              {t('close')}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[600] flex items-center justify-center p-4"
    >
      <div className="bg-gray-900 rounded-2xl max-w-md w-full mx-4 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gray-800/50 px-6 py-4 border-b border-gray-700/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FiMapPin className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">{t('locationPreview')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-600/50 transition-all duration-200"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {/* Mapa estático */}
          <div className="relative mb-4">
            <Image
              src={staticMapUrl}
              alt="Vista previa de ubicación"
              width={400}
              height={300}
              className="w-full h-48 object-cover rounded-lg border border-gray-700/50"
            />
            {/* Overlay con información */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
              <div className="text-white text-sm">
                <p className="font-semibold">{t('selectedLocation')}</p>
                {location.address && (
                  <p className="text-gray-300 text-xs mt-1">{location.address}</p>
                )}
              </div>
            </div>
          </div>

          {/* Información de coordenadas */}
          <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">{t('coordinates')}</p>
                <p className="text-white font-mono text-sm">
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </p>
              </div>
              <button
                onClick={copyCoordinates}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
                title={t('copyCoordinates')}
              >
                {t('copyCoordinates')}
              </button>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex space-x-3">
            <button
              onClick={openInGoogleMaps}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <FiExternalLink className="w-4 h-4" />
              <span>{t('openInGoogleMaps')}</span>
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              {t('confirmLocation')}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LocationPreview;
