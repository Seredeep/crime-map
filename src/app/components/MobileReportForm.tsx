"use client";

import { GeocodingResult } from '@/lib/geocoding';
import { DateTime } from 'luxon';
import { useRouter } from 'next/navigation';
import { ChangeEvent, useEffect, useState } from 'react';
import { FiCalendar, FiCamera, FiCheckCircle, FiClock, FiFile, FiMapPin, FiTag } from 'react-icons/fi';
import GeocodeSearch from '../components/GeocodeSearch';
import Map from '../components/Map';

const COMMON_TAGS = [
  { id: 'robo', label: 'Robo', icon: '🔒', color: 'from-red-500 to-red-600' },
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

export default function MobileReportForm() {
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
      formData.tags.forEach(tag => formDataToSend.append('tags[]', tag));
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitMessage && (
        <div className={`p-3 rounded-md text-center text-base font-semibold ${submitMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {submitMessage.message}
        </div>
      )}

      {/* Sección: Tipo de incidente */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 p-4 border border-gray-700/40 shadow mb-2">
        <div className="flex items-center mb-3 gap-2">
          <FiTag className="text-blue-400" />
          <h3 className="font-bold text-white text-lg">Tipo de incidente</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {COMMON_TAGS.map((tag) => (
            <button
              type="button"
              key={tag.id}
              onClick={() => handleTagToggle(tag.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium shadow transition-all
                ${formData.tags.includes(tag.id)
                  ? 'bg-blue-600 text-white scale-105 shadow-blue-500/20'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'}
              `}
            >
              <span>{tag.icon}</span>
              <span>{tag.label}</span>
              {formData.tags.includes(tag.id) && <FiCheckCircle className="ml-1 text-green-300" />}
            </button>
          ))}
        </div>
      </div>

      {/* Sección: Ubicación */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-900 to-blue-950 p-4 border border-blue-800/40 shadow mb-2">
        <div className="flex items-center mb-3 gap-2">
          <FiMapPin className="text-blue-300" />
          <h3 className="font-bold text-white text-lg">Ubicación</h3>
        </div>
        <div className="mb-3">
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
        <div className="w-full rounded-xl overflow-hidden border border-blue-800/30" style={{ height: 180, minHeight: 120, maxHeight: 220 }}>
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

      {/* Sección: Detalles */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 p-4 border border-gray-700/40 shadow mb-2">
        <div className="flex items-center mb-3 gap-2">
          <FiCalendar className="text-yellow-300" />
          <h3 className="font-bold text-white text-lg">Detalles</h3>
        </div>
        <div className="mb-3">
          <label htmlFor="description" className="block text-sm font-medium mb-1 text-gray-200">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="time" className="block text-sm font-medium mb-1 text-gray-200">
              <span className="inline-flex items-center gap-1"><FiClock /> Hora</span>
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
            <label htmlFor="date" className="block text-sm font-medium mb-1 text-gray-200">
              <span className="inline-flex items-center gap-1"><FiCalendar /> Fecha</span>
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
      </div>

      {/* Sección: Evidencia */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 p-4 border border-gray-700/40 shadow mb-2">
        <div className="flex items-center mb-3 gap-2">
          <FiCamera className="text-pink-300" />
          <h3 className="font-bold text-white text-lg">Evidencia</h3>
        </div>
        <div className="flex items-center justify-center w-full mb-2">
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
            <h4 className="text-sm font-medium mb-2 text-gray-200 flex items-center gap-1"><FiFile /> Archivos subidos:</h4>
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

      {/* Botón de enviar */}
      <div className="sticky bottom-0 left-0 w-full z-10 pt-2 bg-gradient-to-t from-gray-900/90 to-transparent flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl text-lg font-bold shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Enviando...' : 'Reportar Incidente'}
        </button>
      </div>
    </form>
  );
}
