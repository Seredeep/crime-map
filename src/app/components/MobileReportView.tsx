'use client';

import { CAROUSEL_CONFIG, GRID_CONFIG, INCIDENT_COLORS, MESSAGES, TIME_CONFIG } from '@/lib/config';
import { GeocodingResult } from '@/lib/services/geo';
import { ACTIVE_INCIDENT_TYPES } from '@/lib/services/incidents';
import { motion } from 'framer-motion';
import { DateTime } from 'luxon';
import Image from 'next/image';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { FiAlertCircle, FiCalendar, FiCamera, FiCheckCircle, FiChevronLeft, FiChevronRight, FiClock, FiGrid, FiList, FiMapPin, FiSend, FiTag, FiType, FiX } from 'react-icons/fi';
import GeocodeSearch from './GeocodeSearch';
import Map from './Map';

interface MobileReportViewProps {
  onBack: () => void;
  className?: string;
}

// Usar los tipos de incidentes organizados por regiones
const INCIDENT_TYPES = ACTIVE_INCIDENT_TYPES;

// Simplificar los colores usando la nueva estructura
const COLORS = {
  red: `${INCIDENT_COLORS.red.border} ${INCIDENT_COLORS.red.bg} ${INCIDENT_COLORS.red.text}`,
  orange: `${INCIDENT_COLORS.orange.border} ${INCIDENT_COLORS.orange.bg} ${INCIDENT_COLORS.orange.text}`,
  yellow: `${INCIDENT_COLORS.yellow.border} ${INCIDENT_COLORS.yellow.bg} ${INCIDENT_COLORS.yellow.text}`,
  blue: `${INCIDENT_COLORS.blue.border} ${INCIDENT_COLORS.blue.bg} ${INCIDENT_COLORS.blue.text}`,
  purple: `${INCIDENT_COLORS.purple.border} ${INCIDENT_COLORS.purple.bg} ${INCIDENT_COLORS.purple.text}`,
  pink: `${INCIDENT_COLORS.pink.border} ${INCIDENT_COLORS.pink.bg} ${INCIDENT_COLORS.pink.text}`,
  gray: `${INCIDENT_COLORS.gray.border} ${INCIDENT_COLORS.gray.bg} ${INCIDENT_COLORS.gray.text}`,
  green: `${INCIDENT_COLORS.green.border} ${INCIDENT_COLORS.green.bg} ${INCIDENT_COLORS.green.text}`
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      date: DateTime.now().toFormat('yyyy-MM-dd'),
      time: DateTime.now().toFormat('HH:mm')
    }));
  }, []);

  // Auto-scroll SOLO cuando NO hay elementos seleccionados
  useEffect(() => {
    if (formData.tags.length === 0 && viewMode === 'carousel') {
      const interval = setInterval(() => {
        setScrollPosition(prev => prev + CAROUSEL_CONFIG.SCROLL_SPEED);
      }, CAROUSEL_CONFIG.SCROLL_INTERVAL);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    if (!formData.description.trim()) {
      setSubmitMessage({ type: 'error', message: MESSAGES.ERRORS.DESCRIPTION_REQUIRED });
      setIsSubmitting(false);
      return;
    }

    if (!formData.location) {
      setSubmitMessage({ type: 'error', message: MESSAGES.ERRORS.LOCATION_REQUIRED });
      setIsSubmitting(false);
      return;
    }

    if (formData.tags.length === 0) {
      setSubmitMessage({ type: 'error', message: MESSAGES.ERRORS.TAGS_REQUIRED });
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
        setSubmitMessage({ type: 'success', message: MESSAGES.SUCCESS.INCIDENT_REPORTED });
        setFormData({
          description: '',
          address: '',
          time: DateTime.now().toFormat(TIME_CONFIG.TIME_FORMAT),
          date: DateTime.now().toFormat(TIME_CONFIG.DATE_FORMAT),
          evidence: [],
          location: null,
          tags: [],
        });
        setTimeout(() => onBack(), TIME_CONFIG.REDIRECT_DELAY);
      } else {
        throw new Error(data.message || MESSAGES.ERRORS.SUBMIT_ERROR);
      }
    } catch (error) {
      setSubmitMessage({
        type: 'error',
        message: error instanceof Error ? error.message : MESSAGES.ERRORS.SUBMIT_ERROR
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.description.trim() && formData.location && formData.tags.length > 0;

  const renderIncidentButton = (type: typeof INCIDENT_TYPES[0], isCarousel = false) => {
    const isSelected = formData.tags.includes(type.id);
    const selectedClass = isSelected ? COLORS[type.color as keyof typeof COLORS] :
      `border-${type.color}-500/40 text-${type.color}-400/80 bg-gray-800/30 hover:bg-gray-800/50`;

    const IconComponent = type.icon;

    return (
      <button
        key={type.id}
        type="button"
        onClick={() => handleTagToggle(type.id)}
        className={`
          ${isCarousel
            ? `flex-shrink-0 w-${GRID_CONFIG.CAROUSEL_BUTTON_WIDTH} h-${GRID_CONFIG.CAROUSEL_BUTTON_HEIGHT}`
            : `w-full h-${GRID_CONFIG.BUTTON_HEIGHT} p-3`
          }
          rounded-xl border-2 transition-all duration-300 ${selectedClass}
          ${isSelected ? 'shadow-lg scale-105' : ''}
          flex flex-col items-center justify-center gap-1
        `}
      >
        <IconComponent className={`${isCarousel ? 'w-4 h-4' : 'w-6 h-6'} flex-shrink-0`} />
        <span className={`font-medium text-center leading-tight ${isCarousel ? 'text-[7px] px-1' : 'text-xs'}`}>
          {type.label}
        </span>
      </button>
    );
  };

  return (
    <div className={`w-full h-full min-h-screen ${className}`}>
      <div className="p-3 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
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
                  Fecha
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full p-2 text-sm bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
                  required
                />
              </div>
              <div>
                <label className="block text-md text-gray-400 mb-1">
                  <FiClock className="inline w-3 h-3 mr-1" />
                  Hora
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className="w-full p-2 text-sm bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
                  required
                />
              </div>
            </div>
          </motion.div>

          {/* Descripción */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <label className="flex items-center gap-2 my-4 text-md font-medium text-gray-300">
              <FiType className="w-4 h-4 text-green-400" />
              Descripción del incidente
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describí lo que pasó..."
              className="w-full h-60 p-2 text-sm bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none"
              required
            />
          </motion.div>

          {/* Tipo de incidente */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center justify-between my-4">
              <div className="flex items-center gap-2">
                <FiTag className="w-4 h-4 text-blue-400" />
                <h2 className="text-md font-medium text-gray-300">Tipo de incidente</h2>
                {formData.tags.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, tags: [] }))}
                    className="flex items-center gap-1 text-xs bg-blue-500/20 hover:bg-red-500/20 text-blue-300 hover:text-red-300 px-2 py-0.5 rounded-full transition-colors"
                    title="Deseleccionar todo"
                  >
                    <span>{formData.tags.length} seleccionado{formData.tags.length > 1 ? 's' : ''}</span>
                    <FiX className="w-3 h-3" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setViewMode(prev => prev === 'carousel' ? 'grid' : 'carousel')}
                className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
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
                    animate={{ x: `${-scrollPosition * CAROUSEL_CONFIG.ELEMENT_SPACING}px` }}
                    transition={{ type: "tween", duration: CAROUSEL_CONFIG.TRANSITION_DURATION, ease: "easeOut" }}
                    drag="x"
                    dragConstraints={{ left: -1000, right: 0 }}
                  >
                    {Array.from({ length: CAROUSEL_CONFIG.CAROUSEL_COPIES }, (_, copyIndex) =>
                      INCIDENT_TYPES.map(type => (
                        <div key={`${type.id}-${copyIndex}`} className="flex-shrink-0">
                          {renderIncidentButton(type, true)}
                        </div>
                      ))
                    )}
                  </motion.div>
                </div>
              </div>
            ) : (
              <div className={`grid grid-cols-${GRID_CONFIG.COLUMNS} gap-${GRID_CONFIG.GAP}`}>
                {INCIDENT_TYPES.map((type, index) => (
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
              <h2 className="text-md font-medium text-gray-300">Evidencia <span className="text-xs text-gray-500">(opcional)</span></h2>
            </div>

            <label className="flex flex-col items-center justify-center w-full h-20 border border-dashed border-gray-600 rounded-lg cursor-pointer bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
              <div className="flex flex-col items-center justify-center py-2">
                <FiCamera className="w-5 h-5 text-gray-500 mb-1" />
                <p className="text-xs text-gray-400">Subir fotos o videos</p>
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

            {formData.evidence.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {formData.evidence.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="relative w-full h-20 rounded-lg overflow-hidden border border-gray-600">
                      {file.type.startsWith('image/') ? (
                        <Image
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                          <span className="text-xs text-gray-400 text-center px-1">{file.name}</span>
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
            )}
          </motion.div>

          {/* Ubicación */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-lg my-4">
            <div className="flex items-center gap-2 mb-2">
              <FiMapPin className="w-4 h-4 text-purple-400" />
              <h2 className="text-md font-medium text-gray-300">Ubicación del incidente</h2>
            </div>

            <div className="space-y-3">
              <GeocodeSearch
                onLocationSelect={handleLocationSelect}
                placeholder="Buscar dirección..."
                className="w-full"
                selectedAddress={formData.address}
                selectedCoordinates={
                  formData.location
                    ? [formData.location.coordinates[1], formData.location.coordinates[0]]
                    : null
                }
              />

              <div className="w-full h-56 rounded-lg overflow-hidden border border-gray-600/50 bg-gray-900">
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

              {formData.location && (
                <div className="text-xs text-gray-400 bg-gray-800/50 p-2 rounded">
                  <strong>Coordenadas:</strong> {formData.location.coordinates[1].toFixed(4)}, {formData.location.coordinates[0].toFixed(4)}
                </div>
              )}
            </div>
          </motion.div>

          {/* Botón de envío */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-all ${isFormValid && !isSubmitting
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Enviando...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <FiSend className="w-4 h-4" />
                  <span>Reportar Incidente</span>
                </div>
              )}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default MobileReportView;
