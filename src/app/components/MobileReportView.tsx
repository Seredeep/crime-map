'use client';

import { GeocodingResult } from '@/lib/services/geo';
import { GET_REGION_INCIDENT_TYPES, IncidentType, Region } from '@/lib/services/incidents';
import { motion } from 'framer-motion';
import { DateTime } from 'luxon';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiAlertCircle, FiCalendar, FiCamera, FiCheckCircle, FiChevronLeft, FiChevronRight, FiClock, FiGrid, FiList, FiMapPin, FiSend, FiTag, FiType, FiX } from 'react-icons/fi';
import GeocodeSearch from './GeocodeSearch';
import Map from './Map';

interface MobileReportViewProps {
  onBack: () => void;
  className?: string;
}

// Función mejorada para obtener los colores de los tipos de incidentes
const getIncidentColors = (type: IncidentType, isSelected: boolean) => {
  if (!isSelected) {
    // Cuando no está seleccionado, usar colores blancos/grises
    return 'border-white/40 bg-gray-800/30 hover:bg-gray-800/50 hover:border-white/60 text-white/80';
  }

  // Cuando está seleccionado, usar el color específico del tipo
  switch (type.color) {
    case 'red':
      return 'border-red-500 bg-red-500/15 text-red-400 shadow-lg scale-105';
    case 'yellow':
      return 'border-yellow-500 bg-yellow-500/15 text-yellow-400 shadow-lg scale-105';
    case 'orange':
      return 'border-orange-500 bg-orange-500/15 text-orange-400 shadow-lg scale-105';
    case 'amber':
      return 'border-amber-500 bg-amber-500/15 text-amber-400 shadow-lg scale-105';
    case 'gray':
      return 'border-gray-500 bg-gray-500/15 text-gray-400 shadow-lg scale-105';
    case 'violet':
      return 'border-violet-500 bg-violet-500/15 text-violet-400 shadow-lg scale-105';
    case 'emerald':
      return 'border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-lg scale-105';
    case 'blue':
      return 'border-blue-500 bg-blue-500/15 text-blue-400 shadow-lg scale-105';
    case 'purple':
      return 'border-purple-500 bg-purple-500/15 text-purple-400 shadow-lg scale-105';
    case 'pink':
      return 'border-pink-500 bg-pink-500/15 text-pink-400 shadow-lg scale-105';
    case 'green':
      return 'border-green-500 bg-green-500/15 text-green-400 shadow-lg scale-105';
    case 'cyan':
      return 'border-cyan-500 bg-cyan-500/15 text-cyan-400 shadow-lg scale-105';
    case 'teal':
      return 'border-teal-500 bg-teal-500/15 text-teal-400 shadow-lg scale-105';
    case 'indigo':
      return 'border-indigo-500 bg-indigo-500/15 text-indigo-400 shadow-lg scale-105';
    case 'rose':
      return 'border-rose-500 bg-rose-500/15 text-rose-400 shadow-lg scale-105';
    case 'lime':
      return 'border-lime-500 bg-lime-500/15 text-lime-400 shadow-lg scale-105';
    default:
      return 'border-white/40 bg-gray-800/30 text-white/80 shadow-lg scale-105';
  }
};

interface IncidentFormData {
  description: string;
  address: string;
  time: string;
  date: string;
  evidence: File[];
  location: {
    type: 'Point';
    coordinates: [number, number];
  } | null;
  tags: string[];
}

const MobileReportView = ({ onBack, className = '' }: MobileReportViewProps) => {
  const { data: session } = useSession();
  const t = useTranslations('Forms');
  const tStates = useTranslations('States');
  const tUI = useTranslations('UI');
  const tIncidentTypes = useTranslations('incidentTypes');

  // Helper function to get user region from session
  const getUserRegion = (): Region => {
    const country = session?.user?.country;
    if (country === 'Argentina') return 'argentina';
    if (country === 'Mexico') return 'mexico';
    if (country === 'Colombia') return 'colombia';
    if (country === 'Chile') return 'chile';
    return 'general';
  };

  const userRegion = getUserRegion();
  // TODO: Re-enable UI_MESSAGES when properly configured
  // const uiMessages = UI_MESSAGES(tUI);
  const incidentTypes = GET_REGION_INCIDENT_TYPES(tIncidentTypes, userRegion);

  const [formData, setFormData] = useState<IncidentFormData>({
    description: '',
    address: '',
    time: '',
    date: '',
    evidence: [],
    location: null,
    tags: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check if form has any data
  const hasFormData = useMemo(() => {
    return (
      formData.description.trim() !== '' ||
      formData.address.trim() !== '' ||
      formData.evidence.length > 0 ||
      formData.tags.length > 0
    );
  }, [formData]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      date: DateTime.now().toFormat('yyyy-MM-dd'),
      time: DateTime.now().toFormat('HH:mm')
    }));
  }, []);

  // TODO: Move this useEffect after handleBackClick is defined
  // useEffect(() => {
  //   // Si el componente padre necesita acceso a la función de back
  //   (window as any).handleReportBackClick = handleBackClick;

  //   return () => {
  //     delete (window as any).handleReportBackClick;
  //   };
  // }, [formData, handleBackClick]);

  // Auto-scroll SOLO cuando NO hay elementos seleccionados
  useEffect(() => {
    if (formData.tags.length === 0 && viewMode === 'carousel') {
      const interval = setInterval(() => {
                 setScrollPosition(prev => prev + 1);
             }, 50);
      return () => clearInterval(interval);
    }
  }, [formData.tags.length, viewMode]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({ ...prev, evidence: [...prev.evidence, ...Array.from(e.target.files!)] }));
    }
  };

  const handleLocationSelect = (result: GeocodingResult) => {
    const [longitude, latitude] = result.geometry.coordinates;

    // Si las coordenadas son [0, 0], significa que se está limpiando la selección
    if (longitude === 0 && latitude === 0) {
      setFormData(prev => ({
        ...prev,
        address: '',
        location: null
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      address: result.properties.label,
      location: { type: 'Point', coordinates: [longitude, latitude] }
    }));
  };

  const handleMapMarkerChange = (position: [number, number], address?: string) => {
    const [latitude, longitude] = position;
    setFormData(prev => ({
      ...prev,
      location: { type: 'Point', coordinates: [longitude, latitude] },
      ...(address ? { address } : {})
    }));
  };

  const handleTagToggle = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(t => t !== tagId)
        : [...prev.tags, tagId]
    }));
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    setScrollPosition(prev => prev + (direction === 'left' ? -5 : 5));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({ ...prev, evidence: prev.evidence.filter((_, i) => i !== index) }));
  };

  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);
    handleSubmit();
  };

  const handleBackClick = useCallback(() => {
    if (hasFormData) {
      setShowDiscardModal(true);
    } else {
      onBack();
    }
  }, [hasFormData, onBack]);

  // Exponer la función handleBackClick para uso externo
  useEffect(() => {
    // Si el componente padre necesita acceso a la función de back
    (window as any).handleReportBackClick = handleBackClick;

    return () => {
      delete (window as any).handleReportBackClick;
    };
  }, [formData, handleBackClick]);

  const handleDiscardAndBack = () => {
    setShowDiscardModal(false);
    onBack();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitMessage(null);

    if (!formData.description.trim()) {
      setSubmitMessage({ type: 'error', message: 'La descripción es requerida' });
      setIsSubmitting(false);
      return;
    }

    if (!formData.location) {
      setSubmitMessage({ type: 'error', message: 'La ubicación es requerida' });
      setIsSubmitting(false);
      return;
    }

    if (formData.tags.length === 0) {
      setSubmitMessage({ type: 'error', message: 'Debes seleccionar al menos un tipo de incidente' });
      setIsSubmitting(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('description', formData.description);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('time', formData.time);
      formDataToSend.append('date', formData.date);
      formDataToSend.append('location', JSON.stringify(formData.location));
      formData.tags.forEach(tag => formDataToSend.append('tags[]', tag));
      formData.evidence.forEach(file => formDataToSend.append('evidence', file));

      const response = await fetch('/api/incidents', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitMessage({ type: 'success', message: 'Incidente reportado exitosamente' });
        setFormData({
          description: '',
          address: '',
          time: DateTime.now().toFormat('HH:mm'),
          date: DateTime.now().toFormat('yyyy-MM-dd'),
          evidence: [],
          location: null,
          tags: [],
        });
        setTimeout(() => onBack(), 2000);
      } else {
        throw new Error(data.message || 'Error al enviar el incidente');
      }
    } catch (error) {
      setSubmitMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Error al enviar el incidente'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.description.trim() && formData.location && formData.tags.length > 0;

  const renderIncidentButton = (type: IncidentType, isCarousel = false) => {
    const isSelected = formData.tags.includes(type.id);
    const colorClasses = getIncidentColors(type, isSelected);

    const IconComponent = type.icon;

    return (
      <button
        key={type.id}
        type="button"
        onClick={() => handleTagToggle(type.id)}
        className={`
          ${isCarousel
            ? 'flex-shrink-0 w-20 h-16'
            : 'w-full h-20 p-3'
          }
          rounded-xl border-2 transition-all duration-300 ${colorClasses}
          flex flex-col items-center justify-center gap-1
        `}
      >
        <IconComponent className={`${isCarousel ? 'w-4 h-4' : 'w-6 h-6'} flex-shrink-0`} />
        <span className={`font-medium text-center leading-tight ${isCarousel ? 'text-[8px] px-1' : 'text-sm'}`}>
          {type.label}
        </span>
      </button>
    );
  };

  return (
    <div className={`w-full h-full min-h-screen ${className}`}>
      <div className="p-3 max-w-md mx-auto pb-24">
        <div className="space-y-8">
          {/* Mensaje de estado */}
          {submitMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-lg border text-sm ${submitMessage.type === 'success'
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}
            >
              <div className="flex items-center gap-2">
                {submitMessage.type === 'success' ?
                  <FiCheckCircle className="w-4 h-4 flex-shrink-0" /> :
                  <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                }
                <span>{submitMessage.message}</span>
              </div>
            </motion.div>
          )}

          {/* Fecha y hora */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="grid grid-cols-2 gap-3 my-4">
              <div>
                <label className="block text-md text-gray-400 mb-1">
                  <FiCalendar className="inline w-3 h-3 mr-1" />
                  {t('date')}
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full p-2 text-sm border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
                  style={{
                    background: 'rgba(55, 65, 81, 0.3)',
                    backdropFilter: 'blur(10px)'
                  }}
                  required
                />
              </div>
              <div>
                <label className="block text-md text-gray-400 mb-1">
                  <FiClock className="inline w-3 h-3 mr-1" />
                  {t('time')}
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className="w-full p-2 text-sm border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
                  style={{
                    background: 'rgba(55, 65, 81, 0.3)',
                    backdropFilter: 'blur(10px)'
                  }}
                  required
                />
              </div>
            </div>
          </motion.div>

          {/* Descripción */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <label className="flex items-center gap-2 my-4 text-md font-medium text-gray-300">
              <FiType className="w-4 h-4 text-green-400" />
              {t('incidentDescription')}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
                              placeholder={t('reportPlaceholder')}
              className="w-full h-60 p-2 text-sm border border-gray-600/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none"
              style={{
                background: 'rgba(55, 65, 81, 0.3)',
                backdropFilter: 'blur(10px)'
              }}
              required
            />
          </motion.div>

          {/* Tipo de incidente */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center justify-between my-4">
              <div className="flex items-center gap-2">
                <FiTag className="w-4 h-4 text-blue-400" />
                <h2 className="text-md font-medium text-gray-300">{t('incidentType')}</h2>
                {formData.tags.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, tags: [] }))}
                    className="flex items-center gap-1 text-xs bg-blue-500/20 hover:bg-red-500/20 text-blue-300 hover:text-red-300 px-2 py-0.5 rounded-full transition-colors"
                    title={t('deselectAll')}
                  >
                    <span>{formData.tags.length} {formData.tags.length > 1 ? t('selectedPlural') : t('selectedSingular')}</span>
                    <FiX className="w-3 h-3" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setViewMode(prev => prev === 'carousel' ? 'grid' : 'carousel')}
                className="p-2 rounded-lg transition-colors"
                style={{
                  background: 'rgba(55, 65, 81, 0.3)',
                  backdropFilter: 'blur(10px)'
                }}
                title={viewMode === 'carousel' ? 'Ver en grilla' : 'Ver carrusel'}
              >
                {viewMode === 'carousel' ?
                  <FiGrid className="w-4 h-4 text-gray-400" /> :
                  <FiList className="w-4 h-4 text-gray-400" />
                }
              </button>
            </div>

            {viewMode === 'carousel' ? (
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => scrollCarousel('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-gray-900/80 hover:bg-gray-800/90 transition-all opacity-0 group-hover:opacity-100"
                >
                  <FiChevronLeft className="w-4 h-4 text-gray-300" />
                </button>

                <button
                  type="button"
                  onClick={() => scrollCarousel('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-gray-900/80 hover:bg-gray-800/90 transition-all opacity-0 group-hover:opacity-100"
                >
                  <FiChevronRight className="w-4 h-4 text-gray-300" />
                </button>

                <div className="overflow-hidden rounded-xl cursor-grab active:cursor-grabbing">
                  <motion.div
                    className="flex py-2 gap-3"
                                         animate={{ x: `${-scrollPosition * 5}px` }}
                                         transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
                    drag="x"
                    dragConstraints={{ left: -1000, right: 0 }}
                  >
                                         {Array.from({ length: 3 }, (_, copyIndex) =>
                      incidentTypes.map((type: IncidentType) => (
                        <div key={`${type.id}-${copyIndex}`} className="flex-shrink-0">
                          {renderIncidentButton(type, true)}
                        </div>
                      ))
                    )}
                  </motion.div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {incidentTypes.map((type: IncidentType, index: number) => (
                  <motion.div
                    key={type.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="w-full"
                  >
                    {renderIncidentButton(type)}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Evidencia */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <div className="flex items-center gap-2 my-4">
              <FiCamera className="w-4 h-4 text-pink-400" />
              <h2 className="text-md font-medium text-gray-300">{t('evidence')} <span className="text-xs text-gray-500">{t('optional')}</span></h2>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2">
              {/* Botón de subir fotos */}
              <label className="flex-shrink-0 flex flex-col items-center justify-center w-28 h-28 border border-dashed border-gray-600/50 rounded-lg cursor-pointer transition-colors"
                style={{
                  background: 'rgba(55, 65, 81, 0.3)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div className="flex flex-col items-center justify-center">
                  {formData.evidence.length > 0 ? (
                    <div className="w-7 h-7 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center justify-center mb-1">
                      <span className="text-pink-400 text-xl font-bold leading-none">+</span>
                    </div>
                  ) : (
                    <FiCamera className="w-6 h-6 text-gray-500 mb-1" />
                  )}
                  <p className="text-xs text-gray-400 text-center leading-tight">
                    {formData.evidence.length > 0 ? t('add') : t('upload')}
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  multiple
                  accept="image/*,video/*"
                />
              </label>

              {/* Imágenes subidas */}
              {formData.evidence.map((file, index) => (
                <div key={index} className="relative group flex-shrink-0">
                  <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-gray-600">
                    {file.type.startsWith('image/') ? (
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <span className="text-xs text-gray-400 text-center px-1 leading-tight">{file.name}</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                  >
                    <FiX className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Ubicación */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-lg my-4">
            <div className="flex items-center gap-2 mb-3">
              <FiMapPin className="w-4 h-4 text-purple-400" />
              <h2 className="text-md font-medium text-gray-300">{t('incidentLocation')}</h2>
            </div>

            <div className="space-y-4">
              <GeocodeSearch
                onLocationSelect={handleLocationSelect}
                placeholder={t('searchAddressPlaceholder')}
                className="w-full"
                selectedAddress={formData.address}
                selectedCoordinates={
                  formData.location
                    ? [formData.location.coordinates[1], formData.location.coordinates[0]]
                    : null
                }
              />

              <div className="w-full h-[500px] rounded-lg overflow-hidden border border-gray-600/50 shadow-lg"
                style={{
                  background: 'rgba(55, 65, 81, 0.3)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <Map
                  markerPosition={
                    formData.location
                      ? [formData.location.coordinates[1], formData.location.coordinates[0]]
                      : undefined
                  }
                  onMarkerPositionChange={handleMapMarkerChange}
                  draggable={true}
                  setMarkerOnClick={true}
                  mode="form"
                />
              </div>
            </div>

          </motion.div>

          {/* Botón flotante estilo Claridad */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="fixed bottom-6 right-6 z-[9999]"
          >
            <motion.div
              whileTap={{ scale: 0.95 }}
              animate={{
                borderRadius: ['20%', '30%', '24%'],
                boxShadow: isFormValid && !isSubmitting ? [
                  '0 0 25px rgba(59, 130, 246, 0.4), 0 0 50px rgba(59, 130, 246, 0.2)',
                  '0 0 35px rgba(59, 130, 246, 0.6), 0 0 70px rgba(59, 130, 246, 0.3)',
                  '0 0 25px rgba(59, 130, 246, 0.4), 0 0 50px rgba(59, 130, 246, 0.2)'
                ] : [
                  '0 0 15px rgba(107, 114, 128, 0.2), 0 0 30px rgba(107, 114, 128, 0.1)',
                  '0 0 20px rgba(107, 114, 128, 0.3), 0 0 40px rgba(107, 114, 128, 0.15)',
                  '0 0 15px rgba(107, 114, 128, 0.2), 0 0 30px rgba(107, 114, 128, 0.1)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, repeatType: 'mirror' }}
            >
              <motion.button
                onClick={() => isFormValid ? setShowConfirmModal(true) : null}
                disabled={isSubmitting}
                whileHover={isFormValid ? {
                  scale: 1.05,
                  boxShadow: '0 0 40px rgba(59, 130, 246, 0.6), 0 0 80px rgba(59, 130, 246, 0.4)'
                } : {}}
                className={`relative w-16 h-16 flex items-center rounded-[28px] justify-center transition-all duration-300 group overflow-hidden ${isSubmitting ? 'animate-pulse' : ''
                  } ${isFormValid ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                style={{
                  background: isFormValid && !isSubmitting
                    ? `
                      radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
                      linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%),
                      rgba(20, 20, 20, 0.9)
                    `
                    : `
                      radial-gradient(circle at 30% 30%, rgba(107, 114, 128, 0.2) 0%, transparent 50%),
                      linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%),
                      rgba(20, 20, 20, 0.8)
                    `,
                  backdropFilter: 'blur(20px)',
                  border: isFormValid && !isSubmitting
                    ? '2px solid rgba(59, 130, 246, 0.5)'
                    : '2px solid rgba(107, 114, 128, 0.4)',
                  boxShadow: isFormValid && !isSubmitting
                    ? `
                      inset 0 0 20px rgba(59, 130, 246, 0.2),
                      0 0 40px rgba(59, 130, 246, 0.4),
                      0 8px 32px rgba(0, 0, 0, 0.3),
                      0 4px 16px rgba(0, 0, 0, 0.2)
                    `
                    : `
                      inset 0 0 20px rgba(107, 114, 128, 0.15),
                      0 0 20px rgba(107, 114, 128, 0.2),
                      0 8px 32px rgba(0, 0, 0, 0.3),
                      0 4px 16px rgba(0, 0, 0, 0.2)
                    `,
                  borderRadius: '30px'
                }}
              >
                {/* Efecto de pulso de fondo */}
                <motion.div
                  className={`absolute inset-0 rounded-[28px] ${isFormValid && !isSubmitting
                      ? 'bg-gradient-to-r from-blue-500/30 to-blue-600/30'
                      : 'bg-gradient-to-r from-gray-500/20 to-gray-600/20'
                    }`}
                  animate={{
                    opacity: isFormValid ? [0.4, 0.8, 0.4] : [0.2, 0.4, 0.2],
                    scale: isFormValid ? [1, 1.05, 1] : [1, 1.02, 1]
                  }}
                  transition={{
                    duration: isFormValid ? 1.5 : 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />

                {/* Icono principal */}
                <motion.div
                  className={`relative z-10 transition-all duration-300 ${isFormValid && !isSubmitting ? 'text-blue-400' : 'text-gray-400'
                    }`}
                  animate={isFormValid ? {
                    scale: [1, 1.1, 1],
                    rotate: [0, 3, -3, 0]
                  } : {
                    scale: [1, 1.02, 1]
                  }}
                  transition={{
                    duration: isFormValid ? 1.5 : 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {isSubmitting ? (
                    <div className="animate-spin w-6 h-6 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <div className="relative">
                      <FiSend className="w-6 h-6" />
                      {/* Efecto de glow en el icono */}
                      <div
                        className="absolute inset-0 blur-sm"
                        style={{
                          background: isFormValid && !isSubmitting
                            ? 'radial-gradient(circle, rgba(59, 130, 246, 0.6) 0%, transparent 70%)'
                            : 'radial-gradient(circle, rgba(107, 114, 128, 0.4) 0%, transparent 70%)'
                        }}
                      />
                    </div>
                  )}
                </motion.div>

                {/* Efecto de brillo */}
                <div
                  className="absolute inset-0 bg-gradient-to-tr from-white/15 to-transparent opacity-60"
                  style={{ borderRadius: '24px' }}
                />

                {/* Reflejo superior */}
                <div
                  className="absolute top-1 left-1 right-1 h-1/2 bg-gradient-to-b from-white/25 to-transparent"
                  style={{ borderRadius: '20px 20px 8px 8px' }}
                />

                {/* Borde animado */}
                <motion.div
                  className={`absolute inset-0 rounded-[28px] border-2 ${isFormValid && !isSubmitting ? 'border-blue-400/60' : 'border-gray-400/40 rounded-[28px]'
                    }`}
                  animate={{
                    borderColor: isFormValid && !isSubmitting ? [
                      'rgba(59, 130, 246, 0.4)',
                      'rgba(59, 130, 246, 0.8)',
                      'rgba(59, 130, 246, 0.4)'
                    ] : [
                      'rgba(107, 114, 128, 0.3)',
                      'rgba(107, 114, 128, 0.5)',
                      'rgba(107, 114, 128, 0.3)'
                    ]
                  }}
                  transition={{
                    duration: isFormValid ? 1.5 : 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Modal de confirmación */}
          {showConfirmModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 backdrop-blur-sm z-[9998] flex items-center justify-center p-4"
              style={{
                background: 'rgba(0, 0, 0, 0.3)'
              }}
              onClick={() => setShowConfirmModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="rounded-2xl p-6 max-w-sm w-full border border-gray-600/50 shadow-2xl"
                style={{
                  background: 'linear-gradient(180deg, rgba(20, 20, 20, 1) 0%, rgba(15, 15, 15, 1) 100%)',
                  backdropFilter: 'blur(20px)'
                }}
                onClick={(e: any) => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiAlertCircle className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {t('confirmReport')}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {t('confirmReportMessage')}
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleConfirmSubmit}
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        <span>{tStates('sending')}</span>
                      </div>
                    ) : (
                      t('confirmSendReport')
                    )}
                  </button>

                  <button
                    onClick={() => setShowConfirmModal(false)}
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 text-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {tStates('cancel')}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Modal de descarte */}
          {showDiscardModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 backdrop-blur-sm z-[9998] flex items-center justify-center p-4"
              style={{
                background: 'rgba(0, 0, 0, 0.3)'
              }}
              onClick={() => setShowDiscardModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="rounded-2xl p-6 max-w-sm w-full border border-gray-600/50 shadow-2xl"
                style={{
                  background: 'linear-gradient(180deg, rgba(20, 20, 20, 1) 0%, rgba(15, 15, 15, 1) 100%)',
                  backdropFilter: 'blur(20px)'
                }}
                onClick={(e: any) => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiAlertCircle className="w-8 h-8 text-yellow-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {t('discardReport')}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {t('discardWarning')}
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleDiscardAndBack}
                    className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    {t('yesDiscardAndGoBack')}
                  </button>

                  <button
                    onClick={() => setShowDiscardModal(false)}
                    className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 text-gray-200 rounded-lg font-medium transition-colors"
                  >
                    {t('continueEditing')}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileReportView;
