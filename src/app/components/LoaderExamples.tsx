import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { FiAlertTriangle, FiMapPin } from 'react-icons/fi';
import CustomLoader from './CustomLoader';

// Ejemplos de uso del CustomLoader para diferentes contextos

// Para carga de mapa
export const MapLoader = () => {
  const t = useTranslations('Loader');
  return (
    <CustomLoader
      loadingText={t('mapLoading')}
      words={t.raw('mapWords')}
      className="h-64"
    />
  );
};

// Para carga de incidentes
export const IncidentsLoader = () => {
  const t = useTranslations('Loader');
  return (
    <CustomLoader
      loadingText={t('incidentsLoading')}
      words={t.raw('incidentsWords')}
      className="h-32"
    />
  );
};

// Para carga de estadísticas
export const StatsLoader = () => {
  const t = useTranslations('Loader');
  return (
    <CustomLoader
      loadingText={t('statsLoading')}
      words={t.raw('statsWords')}
      className="h-40"
    />
  );
};

// Para carga de geocodificación
export const GeocodeLoader = () => {
  const t = useTranslations('Loader');
  return (
    <CustomLoader
      loadingText={t('geocodeLoading')}
      words={t.raw('geocodeWords')}
      className="h-24"
    />
  );
};

// Para carga de usuario/autenticación
export const AuthLoader = () => {
  const t = useTranslations('Loader');
  return (
    <CustomLoader
      loadingText={t('authLoading')}
      words={t.raw('authWords')}
      className="h-28"
    />
  );
};

// Para carga de formularios
export const FormLoader = () => {
  const t = useTranslations('Loader');
  return (
    <CustomLoader
      loadingText={t('formLoading')}
      words={t.raw('formWords')}
      className="h-24"
    />
  );
};

// Para carga de barrios/comunidades
export const NeighborhoodsLoader = () => {
  const t = useTranslations('Loader');
  return (
    <CustomLoader
      loadingText={t('neighborhoodsLoading')}
      words={t.raw('neighborhoodsWords')}
      className="h-32"
    />
  );
};

// Loader genérico más pequeño para elementos inline
export const InlineLoader = ({ words }: { words?: string[] }) => {
  const t = useTranslations('Loader');
  return (
    <CustomLoader
      loadingText=""
      words={words || t.raw('inlineWords')}
      className="h-8"
    />
  );
};

// Loader de pantalla completa
export const FullScreenLoader = ({ words, loadingText }: {
  words?: string[],
  loadingText?: string
}) => {
  const t = useTranslations('Loader');
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <CustomLoader
        loadingText={loadingText || t('loading')}
        words={words || t.raw('fullScreenWords')}
        className="scale-125"
      />
    </div>
  );
};

export const IncidentLoader = ({ message }: { message?: string }) => {
  const t = useTranslations('IncidentList');
  const defaultMessage = message || t('loadingIncidents');
  console.log('🔍 IncidentLoader - message:', message, 'defaultMessage:', defaultMessage, 'locale:', typeof window !== 'undefined' ? window.location.pathname : 'server');
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative mb-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 w-16 h-16 border-2 border-t-white border-r-gray-300 border-transparent rounded-full"
        />
        <div className="w-16 h-16 bg-gradient-to-br from-white to-gray-200 rounded-full flex items-center justify-center shadow-xl">
          <FiAlertTriangle className="w-8 h-8 text-gray-900" />
        </div>
      </motion.div>
      <div className="text-lg font-semibold text-white mb-2">{defaultMessage}</div>
      <div className="flex space-x-2 mt-2">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ y: [0, -8, 0], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
            className="w-3 h-3 bg-white rounded-full shadow"
          />
        ))}
      </div>
    </div>
  );
};

export const MapLoadingOverlay = ({ message }: { message?: string }) => {
  const t = useTranslations('Loader');
  const defaultMessage = message || t('mapLoadingMessage');
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative mb-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 w-20 h-20 border-2 border-t-white border-r-gray-300 border-transparent rounded-full"
        />
        <div className="w-20 h-20 bg-gradient-to-br from-white to-gray-200 rounded-full flex items-center justify-center shadow-2xl">
          <FiMapPin className="w-10 h-10 text-gray-900" />
        </div>
      </motion.div>
      <div className="text-lg font-semibold text-white mb-2">{defaultMessage}</div>
      <div className="flex space-x-2 mt-2">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ y: [0, -10, 0], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.22, ease: 'easeInOut' }}
            className="w-4 h-4 bg-white rounded-full shadow"
          />
        ))}
      </div>
    </div>
  );
};

export default CustomLoader;
