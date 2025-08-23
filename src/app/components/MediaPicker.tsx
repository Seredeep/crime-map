'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { FiCamera, FiImage, FiFile, FiX } from 'react-icons/fi';

interface MediaPickerProps {
  onClose: () => void;
  onMediaSelect: (file: File, type: 'image' | 'video' | 'document') => void;
}

const MediaPicker = ({ onClose, onMediaSelect }: MediaPickerProps) => {
  const t = useTranslations('Chat');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'document') => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Crear preview para imágenes y videos
      if (type === 'image' || type === 'video') {
        const url = URL.createObjectURL(file);
        setPreview(url);
      } else {
        setPreview(null);
      }
    }
  };

  const handleSend = () => {
    if (selectedFile) {
      const type = selectedFile.type.startsWith('image/') ? 'image' : 
                   selectedFile.type.startsWith('video/') ? 'video' : 'document';
      onMediaSelect(selectedFile, type);
      onClose();
    }
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleGallerySelect = () => {
    fileInputRef.current?.click();
  };

  const handleDocumentSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.txt,.rtf';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setSelectedFile(file);
        setPreview(null);
      }
    };
    input.click();
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[1000] flex items-end justify-center">
      <div className="bg-gray-900 rounded-t-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">{t('attachMedia')}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-800 transition-colors"
          >
            <FiX className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Opciones de medios */}
        {!selectedFile && (
          <div className="p-4 space-y-3">
            <button
              onClick={handleCameraCapture}
              className="w-full flex items-center space-x-3 p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-white"
            >
              <FiCamera className="w-6 h-6 text-blue-400" />
              <span>{t('camera')}</span>
            </button>

            <button
              onClick={handleGallerySelect}
              className="w-full flex items-center space-x-3 p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-white"
            >
              <FiImage className="w-6 h-6 text-green-400" />
              <span>{t('gallery')}</span>
            </button>

            <button
              onClick={handleDocumentSelect}
              className="w-full flex items-center space-x-3 p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-white"
            >
              <FiFile className="w-6 h-6 text-purple-400" />
              <span>{t('document')}</span>
            </button>
          </div>
        )}

        {/* Vista previa y envío */}
        {selectedFile && (
          <div className="p-4 space-y-4">
            <div className="text-center">
              <h4 className="text-white font-medium mb-2">{selectedFile.name}</h4>
              <p className="text-gray-400 text-sm">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>

            {/* Preview para imágenes */}
            {preview && selectedFile.type.startsWith('image/') && (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Preview para videos */}
            {preview && selectedFile.type.startsWith('video/') && (
              <div className="relative">
                <video
                  src={preview}
                  controls
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Preview para documentos */}
            {!preview && selectedFile && (
              <div className="bg-gray-800 p-4 rounded-lg text-center">
                <FiFile className="w-12 h-12 text-purple-400 mx-auto mb-2" />
                <p className="text-white font-medium">{selectedFile.name}</p>
                <p className="text-gray-400 text-sm">{selectedFile.type}</p>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex space-x-3">
              <button
                onClick={clearSelection}
                className="flex-1 py-3 px-4 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSend}
                className="flex-1 py-3 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                {t('send')}
              </button>
            </div>
          </div>
        )}

        {/* Inputs ocultos */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={(e) => handleFileSelect(e, 'image')}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*,video/*"
          capture="environment"
          onChange={(e) => handleFileSelect(e, 'image')}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default MediaPicker;

