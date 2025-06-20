'use client';

import { GeocodingResult } from '@/lib/geocoding';
import { AnimatePresence, motion } from 'framer-motion';
import { DateTime } from 'luxon';
import { useRouter } from 'next/navigation';
import { ChangeEvent, useEffect, useState } from 'react';
import { FiArrowLeft, FiCalendar, FiCamera, FiCheck, FiClock, FiMapPin, FiSend } from 'react-icons/fi';
import CustomLoader from '../components/CustomLoader';
import GeocodeSearch from '../components/GeocodeSearch';
import Map from '../components/Map';
import ProtectedRoute from '../components/ProtectedRoute';

// Lista de etiquetas comunes para incidents
const COMMON_TAGS = [
  { id: 'robo', label: 'Robo', icon: '🔓', color: 'from-red-500 to-red-600' },
  { id: 'asalto', label: 'Asalto', icon: '⚠️', color: 'from-orange-500 to-orange-600' },
  { id: 'vandalismo', label: 'Vandalismo', icon: '🎨', color: 'from-purple-500 to-purple-600' },
  { id: 'disturbio', label: 'Disturbio', icon: '📢', color: 'from-yellow-500 to-yellow-600' },
  { id: 'amenaza', label: 'Amenaza', icon: '⚡', color: 'from-red-600 to-red-700' },
  { id: 'sospechoso', label: 'Sospechoso', icon: '👁️', color: 'from-blue-500 to-blue-600' },
  { id: 'violencia', label: 'Violencia', icon: '💥', color: 'from-red-700 to-red-800' }
];

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

export default function ReportPage() {
  const router = useRouter();
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
  const [submitMessage, setSubmitMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      date: DateTime.now().toFormat('yyyy-MM-dd'),
      time: DateTime.now().toFormat('HH:mm')
    }));
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setFormData((prev) => ({
        ...prev,
        evidence: [...prev.evidence, ...filesArray],
      }));
    }
  };

  const handleLocationSelect = (result: GeocodingResult) => {
    const [longitude, latitude] = result.geometry.coordinates;
    setFormData((prev) => ({
      ...prev,
      address: result.properties.label,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
    }));
  };

  const handleMapMarkerChange = (position: [number, number], address?: string) => {
    const [latitude, longitude] = position;

    setFormData((prev) => ({
      ...prev,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      ...(address ? { address } : {})
    }));
  };

  const handleTagToggle = (tagId: string) => {
    setFormData((prev) => {
      const newTags = prev.tags.includes(tagId)
        ? prev.tags.filter((t) => t !== tagId)
        : [...prev.tags, tagId];

      return {
        ...prev,
        tags: newTags
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    if (!formData.location) {
      setSubmitMessage({
        type: 'error',
        message: 'Por favor selecciona una ubicación válida'
      });
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

      // Add tags
      formData.tags.forEach(tag => formDataToSend.append('tags[]', tag));

      // Add evidence files
      formData.evidence.forEach(file => formDataToSend.append('evidence', file));

      const response = await fetch('/api/incidents', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitMessage({
          type: 'success',
          message: 'Incidente reportado exitosamente'
        });

        // Esperar un poco y redirigir
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        throw new Error(data.message || 'Error al reportar el incidente');
      }
    } catch (error) {
      setSubmitMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Error al reportar el incidente'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      evidence: prev.evidence.filter((_, i) => i !== index),
    }));
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, rgba(255, 119, 198, 0.3) 0%, transparent 50%)`
          }}></div>
        </div>

        {/* Header con liquid glass */}
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-50 p-4"
        >
          <div className="max-w-4xl mx-auto">
            <div
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                boxShadow: `
                  inset 0 1px 0 rgba(255,255,255,0.1),
                  0 4px 32px rgba(0,0,0,0.3),
                  0 16px 64px rgba(0,0,0,0.2)
                `
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <motion.button
                    onClick={() => router.back()}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <FiArrowLeft className="w-6 h-6 text-white" />
                  </motion.button>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Reportar Incidente</h1>
                    <p className="text-white/70 text-sm">Completa la información del incidente</p>
                  </div>
                </div>

                {/* Progress indicator */}
                <div className="flex items-center space-x-2">
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        step <= currentStep ? 'bg-blue-400' : 'bg-white/20'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="relative z-10 p-4 pb-20">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                boxShadow: `
                  inset 0 1px 0 rgba(255,255,255,0.1),
                  0 8px 32px rgba(0,0,0,0.3),
                  0 32px 64px rgba(0,0,0,0.2)
                `
              }}
            >
              {/* Success/Error Messages */}
              <AnimatePresence>
                {submitMessage && (
                  <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    className={`p-4 m-6 rounded-2xl backdrop-blur-sm ${
                      submitMessage.type === 'success'
                        ? 'bg-green-500/20 border border-green-400/30 text-green-100'
                        : 'bg-red-500/20 border border-red-400/30 text-red-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {submitMessage.type === 'success' ? (
                        <FiCheck className="w-5 h-5" />
                      ) : (
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 0.5 }}
                        >
                          ⚠️
                        </motion.div>
                      )}
                      <span>{submitMessage.message}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="p-6 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Mapa - Más pequeño y contenido */}
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center space-x-2 text-white/90">
                      <FiMapPin className="w-5 h-5 text-blue-400" />
                      <h3 className="text-lg font-semibold">Ubicación del Incidente</h3>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                      <div className="h-64 rounded-xl overflow-hidden">
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

                    <div>
                      <GeocodeSearch
                        onLocationSelect={handleLocationSelect}
                        placeholder="🔍 Busca una dirección o lugar"
                        className="w-full"
                        selectedAddress={formData.address}
                        selectedCoordinates={
                          formData.location
                            ? [formData.location.coordinates[1], formData.location.coordinates[0]]
                            : null
                        }
                      />
                    </div>
                  </motion.div>

                  {/* Formulario */}
                  <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-6 max-h-96 overflow-y-auto custom-scrollbar pr-2"
                  >
                    {/* Descripción */}
                    <div>
                      <label className="block text-white/90 text-sm font-medium mb-2">
                        📝 Descripción del Incidente
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 text-white placeholder-white/50 transition-all resize-none"
                        rows={4}
                        placeholder="Describe detalladamente lo que ocurrió..."
                        required
                      />
                    </div>

                    {/* Fecha y Hora */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center space-x-2 text-white/90 text-sm font-medium mb-2">
                          <FiCalendar className="w-4 h-4 text-blue-400" />
                          <span>Fecha</span>
                        </label>
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 text-white transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="flex items-center space-x-2 text-white/90 text-sm font-medium mb-2">
                          <FiClock className="w-4 h-4 text-blue-400" />
                          <span>Hora</span>
                        </label>
                        <input
                          type="time"
                          name="time"
                          value={formData.time}
                          onChange={handleInputChange}
                          className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 text-white transition-all"
                          required
                        />
                      </div>
                    </div>

                    {/* Etiquetas */}
                    <div>
                      <label className="block text-white/90 text-sm font-medium mb-3">
                        🏷️ Tipo de Incidente
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {COMMON_TAGS.map((tag) => (
                          <motion.button
                            key={tag.id}
                            type="button"
                            onClick={() => handleTagToggle(tag.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-3 rounded-xl text-sm font-medium transition-all border ${
                              formData.tags.includes(tag.id)
                                ? `bg-gradient-to-r ${tag.color} text-white border-white/30 shadow-lg`
                                : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span>{tag.icon}</span>
                              <span>{tag.label}</span>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Evidencia */}
                    <div>
                      <label className="flex items-center space-x-2 text-white/90 text-sm font-medium mb-3">
                        <FiCamera className="w-4 h-4 text-blue-400" />
                        <span>Evidencia (Opcional)</span>
                      </label>

                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/30 rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <FiCamera className="w-8 h-8 text-white/50 mb-2" />
                          <p className="text-sm text-white/70">
                            <span className="font-semibold">Haz clic para subir</span> o arrastra archivos
                          </p>
                          <p className="text-xs text-white/50">Imágenes, PDFs, DOCs (MÁX. 10MB)</p>
                        </div>
                        <input
                          type="file"
                          onChange={handleFileChange}
                          className="hidden"
                          multiple
                          accept="image/*,.pdf,.doc,.docx"
                        />
                      </label>

                      {formData.evidence.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {formData.evidence.map((file, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center justify-between bg-white/10 p-3 rounded-xl"
                            >
                              <span className="text-sm text-white/90 truncate">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                              >
                                ✕
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Submit Button */}
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex justify-end pt-6 border-t border-white/10"
                >
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <CustomLoader
                        loadingText=""
                        words={["enviando", "procesando", "guardando"]}
                        className="h-6 scale-75"
                      />
                    ) : (
                      <>
                        <FiSend className="w-5 h-5" />
                        <span>Reportar Incidente</span>
                      </>
                    )}
                  </motion.button>
                </motion.div>
              </form>
            </motion.div>
          </div>
        </main>

        {/* Custom Scrollbar Styles */}
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
        `}</style>
      </div>
    </ProtectedRoute>
  );
}
