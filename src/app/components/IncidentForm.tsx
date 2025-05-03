'use client';

import { useState, ChangeEvent, useEffect } from 'react';
import { DateTime } from 'luxon';
import GeocodeSearch from './GeocodeSearch';
import { GeocodingResult } from '@/lib/geocoding';
import Map from './Map';

// Lista de etiquetas comunes para incidents
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

export default function IncidentForm() {
  const [formData, setFormData] = useState<IncidentFormData>({
    description: '',
    address: '',
    time: '',
    date: '',
    evidence: [],
    location: null,
    tags: [],
  });

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      date: DateTime.now().toFormat('yyyy-MM-dd')
    }));
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);

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

  const handleTagToggle = (tag: string) => {
    setFormData((prev) => {
      const newTags = prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag];
      
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
      
      formData.tags.forEach(tag => {
        formDataToSend.append('tags[]', tag);
      });

      formData.evidence.forEach((file) => {
        formDataToSend.append('evidence', file);
      });

      const response = await fetch('/api/incidents', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('Error al enviar el incidente');
      }

      setFormData({
        description: '',
        address: '',
        time: '',
        date: DateTime.now().toFormat('yyyy-MM-dd'),
        evidence: [],
        location: null,
        tags: [],
      });

      setSubmitMessage({
        type: 'success',
        message: 'Incidente reportado correctamente'
      });
      
    } catch (error) {
      console.error('Error al enviar el incidente:', error);
      setSubmitMessage({
        type: 'error',
        message: 'No se pudo enviar el incidente. Por favor, inténtalo de nuevo.'
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {submitMessage && (
        <div className={`p-3 rounded-md ${submitMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {submitMessage.message}
        </div>
      )}
      
      <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
        <div className="md:w-1/2 w-full">
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

        <div className="md:w-1/2 w-full space-y-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
              rows={3}
              placeholder="Describe lo que ocurrió"
              required
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium mb-1">
              Ubicación
            </label>
            <GeocodeSearch 
              onLocationSelect={handleLocationSelect}
              placeholder="Busca una dirección o lugar"
              className="w-full"
              selectedAddress={formData.address}
              selectedCoordinates={
                formData.location
                  ? [formData.location.coordinates[1], formData.location.coordinates[0]]
                  : null
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="time" className="block text-sm font-medium mb-1">
                Hora
              </label>
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                required
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium mb-1">
                Fecha
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Etiquetas
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_TAGS.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                    formData.tags.includes(tag)
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="evidence" className="block text-sm font-medium mb-1">
              Evidencia
            </label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="evidence"
                className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-gray-700 border-gray-600 hover:bg-gray-600"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <p className="mb-1 text-sm text-gray-300">
                    <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                  </p>
                  <p className="text-xs text-gray-400">Imágenes, PDFs, DOCs (MÁX. 10MB)</p>
                </div>
                <input
                  type="file"
                  id="evidence"
                  name="evidence"
                  onChange={handleFileChange}
                  className="hidden"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                />
              </label>
            </div>
            
            {formData.evidence.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium mb-2">Archivos subidos:</h4>
                <ul className="space-y-2">
                  {formData.evidence.map((file, index) => (
                    <li key={index} className="flex items-center justify-between bg-gray-700 p-2 rounded-md">
                      <span className="text-sm truncate max-w-xs">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-300"
                        aria-label="Eliminar archivo"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Enviando...' : 'Reportar Incidente'}
        </button>
      </div>
    </form>
  );
} 