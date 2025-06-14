'use client';

import { motion } from 'framer-motion';
import { FiCamera, FiMapPin, FiArrowLeft, FiCheck } from 'react-icons/fi';
import { useState, useRef } from 'react';

interface MobileReportViewProps {
  onBack: () => void;
  className?: string;
}

const MobileReportView = ({ onBack, className = '' }: MobileReportViewProps) => {
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    location: '',
    severity: 'medium',
    anonymous: false
  });
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + images.length <= 3) {
      setImages(prev => [...prev, ...files]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Submitting report:', { formData, images });
    setIsSubmitting(false);
    onBack();
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return formData.type !== '';
      case 2:
        return formData.description.trim() !== '' && formData.location.trim() !== '';
      case 3:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">¿Qué tipo de incidente quieres reportar?</h3>
              <div className="grid grid-cols-2 gap-3">
                {incidentTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      formData.type === type.id
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    }`}
                  >
                    <div className="text-2xl mb-2">{type.icon}</div>
                    <div className="text-sm font-medium text-white">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Describe el incidente</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Descripción detallada
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe lo que pasó, cuándo y cualquier detalle relevante..."
                    className="w-full h-32 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <FiMapPin className="inline w-4 h-4 mr-1" />
                    Ubicación
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Dirección o punto de referencia"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nivel de gravedad
                  </label>
                  <div className="space-y-2">
                    {severityLevels.map((level) => (
                      <button
                        key={level.id}
                        onClick={() => setFormData(prev => ({ ...prev, severity: level.id }))}
                        className={`w-full p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                          formData.severity === level.id
                            ? 'border-blue-500 bg-blue-500/20'
                            : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${level.color}`} />
                            <div>
                              <div className="font-medium text-white">{level.label}</div>
                              <div className="text-sm text-gray-400">{level.description}</div>
                            </div>
                          </div>
                          {formData.severity === level.id && (
                            <FiCheck className="w-5 h-5 text-blue-400" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Información adicional</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <FiCamera className="inline w-4 h-4 mr-1" />
                    Fotos (opcional)
                  </label>
                  
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    
                    {images.length < 3 && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-20 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors"
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
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-800/50 rounded-xl">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={formData.anonymous}
                    onChange={(e) => setFormData(prev => ({ ...prev, anonymous: e.target.checked }))}
                    className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="anonymous" className="text-sm text-gray-300">
                    Reportar de forma anónima
                  </label>
                </div>

                <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4">
                  <h4 className="font-medium text-blue-300 mb-2">Resumen del reporte</h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p><strong>Tipo:</strong> {incidentTypes.find(t => t.id === formData.type)?.label}</p>
                    <p><strong>Ubicación:</strong> {formData.location}</p>
                    <p><strong>Gravedad:</strong> {severityLevels.find(s => s.id === formData.severity)?.label}</p>
                    <p><strong>Fotos:</strong> {images.length}</p>
                  </div>
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
    <div className={`w-full h-full bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>
          <h1 className="text-xl font-bold text-white">Reportar Incidente</h1>
          <div className="w-16" />
        </div>

        {/* Progress indicator */}
        <div className="flex items-center space-x-2">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                  step <= currentStep
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {step < currentStep ? <FiCheck className="w-4 h-4" /> : step}
              </div>
              {step < 3 && (
                <div
                  className={`w-8 h-1 mx-2 rounded-full transition-all duration-200 ${
                    step < currentStep ? 'bg-blue-500' : 'bg-gray-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-28">
        {renderStep()}
      </div>

      {/* Bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700/50 p-4">
        <div className="flex space-x-3">
          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors"
            >
              Anterior
            </button>
          )}
          
          {currentStep < 3 ? (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!canProceedToNextStep()}
              className={`flex-1 py-3 px-4 font-medium rounded-xl transition-colors ${
                canProceedToNextStep()
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`flex-1 py-3 px-4 font-medium rounded-xl transition-colors ${
                isSubmitting
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
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