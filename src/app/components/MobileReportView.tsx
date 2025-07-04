'use client';

import { motion } from 'framer-motion';
import { DateTime } from 'luxon';
import { useRef, useState } from 'react';
import { FiArrowLeft, FiCamera, FiCheck, FiMapPin } from 'react-icons/fi';

interface MobileReportViewProps {
  onBack: () => void;
  className?: string;
}

const COMMON_TAGS = [
  'robo',
  'asalto',
  'vandalismo',
  'disturbio',
  'amenaza',
  'sospechoso',
  'violencia'
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

const MobileReportView = ({ onBack, className = '' }: MobileReportViewProps) => {
  const [formData, setFormData] = useState<IncidentFormData>({
    description: '',
    address: '',
    time: '',
    date: DateTime.now().toFormat('yyyy-MM-dd'),
    evidence: [],
    location: null,
    tags: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitMessage, setSubmitMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const incidentTypes = [
    { id: 'robo', label: 'Robo', icon: '🏠' },
    { id: 'asalto', label: 'Asalto', icon: '⚠️' },
    { id: 'hurto', label: 'Hurto', icon: '👜' },
    { id: 'vandalismo', label: 'Vandalismo', icon: '🎨' },
    { id: 'actividad_sospechosa', label: 'Actividad Sospechosa', icon: '👁️' },
    { id: 'accidente', label: 'Accidente', icon: '🚗' },
    { id: 'otro', label: 'Otro', icon: '❓' }
  ];

  const severityLevels = [
    { id: 'low', label: 'Baja', color: 'bg-green-500', description: 'Sin peligro inmediato' },
    { id: 'medium', label: 'Media', color: 'bg-yellow-500', description: 'Requiere atención' },
    { id: 'high', label: 'Alta', color: 'bg-red-500', description: 'Situación urgente' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setFormData((prev) => ({ ...prev, evidence: [...prev.evidence, ...filesArray] }));
    }
  };

  const removeFile = (index: number) => {
    setFormData((prev) => ({ ...prev, evidence: prev.evidence.filter((_, i) => i !== index) }));
  };

  const handleLocationSelect = (result: any) => {
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

  const handleTagToggle = (tag: string) => {
    setFormData((prev) => {
      const newTags = prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags: newTags };
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitMessage(null);
    if (!formData.location) {
      setSubmitMessage({ type: 'error', message: 'Por favor selecciona una ubicación válida' });
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
          time: '',
          date: DateTime.now().toFormat('yyyy-MM-dd'),
          evidence: [],
          location: null,
          tags: [],
        });
        setCurrentStep(1);
      } else {
        throw new Error(data.message || 'Error al reportar el incidente');
      }
    } catch (error) {
      setSubmitMessage({ type: 'error', message: error instanceof Error ? error.message : 'Error al reportar el incidente' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return formData.description.trim() !== '';
      case 2:
        return formData.address.trim() !== '';
      case 3:
        return formData.evidence.length > 0;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gray-800/80 rounded-2xl shadow-lg p-6 mb-6 border border-gray-700"
          >
            <h3 className="text-lg font-bold text-white mb-4 text-center">¿Qué tipo de incidente quieres reportar?</h3>
            <div className="grid grid-cols-2 gap-4">
                {incidentTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setFormData(prev => ({ ...prev, tags: [...prev.tags, type.id] }))}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 shadow transition-all duration-200 focus:outline-none
                    ${formData.tags.includes(type.id)
                      ? 'border-blue-500 bg-blue-500/20 scale-105 shadow-blue-500/10'
                      : 'border-gray-700 bg-gray-900/60 hover:border-gray-600'}
                  `}
                  >
                  <span className="text-3xl mb-1">{type.icon}</span>
                  <span className="text-sm font-medium text-white">{type.label}</span>
                  </button>
                ))}
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gray-800/80 rounded-2xl shadow-lg p-6 mb-6 border border-gray-700"
          >
            <h3 className="text-lg font-bold text-white mb-4 text-center">Detalles del incidente</h3>
              <div className="space-y-4">
                <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Descripción detallada</label>
                  <textarea
                    value={formData.description}
                    onChange={handleInputChange}
                    name="description"
                    placeholder="Describe lo que pasó, cuándo y cualquier detalle relevante..."
                  className="w-full h-28 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none shadow"
                  />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-1">
                  <FiMapPin className="inline w-4 h-4 mr-1" /> Ubicación
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={handleInputChange}
                    name="address"
                    placeholder="Dirección o punto de referencia"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 shadow"
                  />
              </div>
              <div className="mt-2">
                <div className="w-full h-48 rounded-xl overflow-hidden border-2 border-blue-900 bg-gray-900 flex items-center justify-center relative shadow">
                  <span className="text-gray-500 text-sm">[Mapa interactivo aquí]</span>
                  <div className="absolute bottom-2 right-2 bg-blue-900/80 text-blue-200 text-xs px-2 py-1 rounded shadow">Próximamente: selección en mapa</div>
                </div>
              </div>
                <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nivel de gravedad</label>
                  <div className="space-y-2">
                    {severityLevels.map((level) => (
                      <button
                        key={level.id}
                        onClick={() => setFormData(prev => ({ ...prev, tags: [...prev.tags, level.id] }))}
                      className={`w-full p-3 rounded-xl border-2 text-left transition-all duration-200 shadow focus:outline-none
                        ${formData.tags.includes(level.id)
                          ? 'border-blue-500 bg-blue-500/20 shadow-blue-500/10'
                          : 'border-gray-700 bg-gray-900/60 hover:border-gray-600'}
                      `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${level.color}`} />
                            <div>
                              <div className="font-medium text-white">{level.label}</div>
                            <div className="text-xs text-gray-400">{level.description}</div>
                            </div>
                          </div>
                          {formData.tags.includes(level.id) && (
                            <FiCheck className="w-5 h-5 text-blue-400" />
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gray-800/80 rounded-2xl shadow-lg p-6 mb-6 border border-gray-700"
          >
            <h3 className="text-lg font-bold text-white mb-4 text-center">Fotos y resumen</h3>
              <div className="space-y-4">
                <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-1">
                  <FiCamera className="inline w-4 h-4 mr-1" /> Fotos (opcional)
                  </label>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {formData.evidence.map((file, index) => (
                    <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Upload ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg border-2 border-gray-700 shadow"
                        />
                        <button
                          onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs shadow-lg opacity-80 group-hover:opacity-100"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {formData.evidence.length < 3 && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                      className="w-full h-20 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-300 transition-colors shadow"
                      >
                        <FiCamera className="w-6 h-6 mb-1" />
                        <span className="text-xs">Agregar</span>
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              <div className="flex items-center space-x-3 p-4 bg-gray-900/70 rounded-xl border border-gray-700">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={formData.tags.includes('anonymous')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({ ...prev, tags: [...prev.tags, 'anonymous'] }));
                      } else {
                        setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== 'anonymous') }));
                      }
                    }}
                    className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="anonymous" className="text-sm text-gray-300">
                    Reportar de forma anónima
                  </label>
                </div>
              <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4 shadow">
                  <h4 className="font-medium text-blue-300 mb-2">Resumen del reporte</h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p><strong>Tipo:</strong> {formData.tags.map(tag => incidentTypes.find(t => t.id === tag)?.label).join(', ')}</p>
                    <p><strong>Ubicación:</strong> {formData.address}</p>
                    <p><strong>Gravedad:</strong> {formData.tags.map(tag => severityLevels.find(s => s.id === tag)?.label).join(', ')}</p>
                    <p><strong>Fotos:</strong> {formData.evidence.length}</p>
                  <p><strong>Anónimo:</strong> {formData.tags.includes('anonymous') ? 'Sí' : 'No'}</p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`w-full h-full bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 min-h-screen ${className}`}>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur border-b border-gray-700/50 px-4 pt-4 pb-2 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span className="font-medium">Volver</span>
          </button>
          <h1 className="text-xl font-bold text-white tracking-tight">Reportar Incidente</h1>
          <div className="w-16" />
        </div>
        {/* Indicador de pasos visual */}
        <div className="flex items-center justify-center gap-4 mb-1">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-base font-bold border-2 transition-all duration-200 shadow-md
                  ${step === currentStep ? 'bg-blue-500 border-blue-400 text-white scale-110' : step < currentStep ? 'bg-green-500 border-green-400 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
              >
                {step < currentStep ? <FiCheck className="w-5 h-5" /> : step}
              </div>
              <span className={`text-xs mt-1 ${step === currentStep ? 'text-blue-400 font-semibold' : 'text-gray-400'}`}>
                {step === 1 ? 'Tipo' : step === 2 ? 'Detalles' : 'Resumen'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-32 max-w-md mx-auto">
        {renderStep()}
      </div>

      {/* Bottom actions mejorados */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-gray-700/50 p-4 z-30 shadow-2xl">
        <div className="flex space-x-3 max-w-md mx-auto">
          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-colors shadow"
            >
              Anterior
            </button>
          )}
          {currentStep < 3 ? (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!canProceedToNextStep()}
              className={`flex-1 py-3 px-4 font-semibold rounded-xl transition-colors shadow-lg
                ${canProceedToNextStep()
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'}
              `}
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`flex-1 py-3 px-4 font-semibold rounded-xl transition-colors shadow-lg
                ${isSubmitting
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 text-white'}
              `}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Reporte'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileReportView;
