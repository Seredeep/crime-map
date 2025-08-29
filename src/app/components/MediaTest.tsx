'use client';

import { useRef, useState } from 'react';

export default function MediaTest() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | 'document'>('image');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio Recording Functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      // Usar formato más compatible
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Detener el stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error al iniciar grabación:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  // File Selection Functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      // Determinar el tipo de archivo
      if (file.type.startsWith('image/')) {
        setFileType('image');
      } else if (file.type.startsWith('video/')) {
        setFileType('video');
      } else {
        setFileType('document');
      }
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  // Upload Functions
  const uploadAudio = async () => {
    if (!audioBlob) return;
    await uploadFile(audioBlob, 'audio', 'audio.webm');
  };

  const uploadSelectedFile = async () => {
    if (!selectedFile) return;
    await uploadFile(selectedFile, fileType, selectedFile.name);
  };

  const uploadFile = async (file: File | Blob, type: string, filename: string) => {
    try {
      setIsUploading(true);

      // Obtener duración del audio si es posible
      let duration = null;
      if (type === 'audio') {
        try {
          const tempUrl = URL.createObjectURL(file);
          const audio = new Audio(tempUrl);

          await new Promise((resolve, reject) => {
            audio.addEventListener('loadedmetadata', resolve);
            audio.addEventListener('error', reject);
            audio.load();
          });

          duration = audio.duration;
          URL.revokeObjectURL(tempUrl);
          console.log('Audio duration:', duration);
        } catch (error) {
          console.warn('No se pudo obtener la duración:', error);
        }
      }

      const formData = new FormData();
      formData.append('file', file, filename);
      formData.append('type', type);

      const response = await fetch('/api/chat/upload-media', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setUploadResult(result);
        console.log(`${type} upload successful:`, result);
      } else {
        const error = await response.json();
        console.error(`${type} upload failed:`, error);
      }
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-center">Prueba de Medios del Chat</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Audio Recording Section */}
        <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
          <h3 className="text-xl font-semibold text-center">{'🎵'} Grabación de Audio</h3>

          <div className="flex space-x-2">
            <button
              onClick={startRecording}
              disabled={isRecording}
              className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-400"
            >
              {isRecording ? 'Grabando...' : 'Iniciar Grabación'}
            </button>

            <button
              onClick={stopRecording}
              disabled={!isRecording}
              className="px-4 py-2 bg-gray-500 text-white rounded disabled:bg-gray-400"
            >
              Detener
            </button>
          </div>

          {isRecording && (
            <div className="text-center">
              <div className="text-2xl font-mono">{formatTime(recordingTime)}</div>
              <div className="text-sm text-gray-600">Grabando...</div>
            </div>
          )}

          {audioUrl && (
            <div className="space-y-2">
              <h4 className="font-semibold">Audio Grabado:</h4>
              <audio src={audioUrl} controls className="w-full" />

              <button
                onClick={uploadAudio}
                disabled={isUploading}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
              >
                {isUploading ? 'Subiendo...' : 'Subir Audio'}
              </button>
            </div>
          )}
        </div>

        {/* File Upload Section */}
        <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
          <h3 className="text-xl font-semibold text-center">{'📁'} Subida de Archivos</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Archivo:
              </label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value as 'image' | 'video' | 'document')}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="image">{'🖼️'} Imagen</option>
                <option value="video">{'🎥'} Video</option>
                <option value="document">{'📄'} Documento</option>
              </select>
            </div>

            <button
              onClick={openFilePicker}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Seleccionar Archivo
            </button>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept={`${fileType === 'image' ? 'image/*' : fileType === 'video' ? 'video/*' : '.pdf,.doc,.docx,.txt'}`}
              className="hidden"
            />

            {selectedFile && (
              <div className="p-3 bg-gray-100 rounded">
                <h4 className="font-semibold">Archivo Seleccionado:</h4>
                <div className="text-sm text-gray-600">
                  <p><strong>Nombre:</strong> {selectedFile.name}</p>
                  <p><strong>Tipo:</strong> {selectedFile.type}</p>
                  <p><strong>Tamaño:</strong> {formatFileSize(selectedFile.size)}</p>
                </div>

                <button
                  onClick={uploadSelectedFile}
                  disabled={isUploading}
                  className="w-full mt-2 px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
                >
                  {isUploading ? 'Subiendo...' : 'Subir Archivo'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Results */}
      {uploadResult && (
        <div className="mt-6 p-4 bg-green-100 rounded">
          <h3 className="font-semibold text-green-800">Subida Exitosa:</h3>
          <pre className="text-sm text-green-700 mt-2 overflow-auto">
            {JSON.stringify(uploadResult, null, 2)}
          </pre>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold text-blue-800 mb-2">Instrucciones:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Audio:</strong> Graba un audio y súbelo para probar la funcionalidad</li>
          <li>• <strong>Archivos:</strong> Selecciona imágenes, videos o documentos para subir</li>
          <li>• <strong>Verificación:</strong> Revisa la consola del navegador para ver los logs</li>
          <li>• <strong>Supabase:</strong> Los archivos se suben al bucket &quot;chat-media&quot;</li>
        </ul>
      </div>
    </div>
  );
}

