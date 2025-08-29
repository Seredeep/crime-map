'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { FiMic, FiMicOff, FiPlay, FiSquare, FiX } from 'react-icons/fi';

interface AudioRecorderProps {
  onClose: () => void;
  onAudioSend: (audioBlob: Blob) => void;
}

const AudioRecorder = ({ onClose, onAudioSend }: AudioRecorderProps) => {
  const t = useTranslations('Chat');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Detener el stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Timer para mostrar duración de grabación
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

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onAudioSend(audioBlob);
      onClose();
    }
  };

  const handleRetry = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[1000] flex items-end justify-center">
      <div className="bg-gray-900 rounded-t-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">{t('recordAudio')}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-800 transition-colors"
          >
            <FiX className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 text-center">
          {!audioBlob ? (
            /* Estado de grabación */
            <div className="space-y-6">
              <div className="w-32 h-32 mx-auto rounded-full bg-red-600 flex items-center justify-center">
                {isRecording ? (
                  <FiMicOff className="w-16 h-16 text-white" />
                ) : (
                  <FiMic className="w-16 h-16 text-white" />
                )}
              </div>

              <div className="text-center">
                <h4 className="text-xl font-semibold text-white mb-2">
                  {isRecording ? t('recording') : t('tapToRecord')}
                </h4>
                {isRecording && (
                  <p className="text-red-400 text-lg font-mono">
                    {formatTime(recordingTime)}
                  </p>
                )}
                <p className="text-gray-400 text-sm mt-2">
                  {isRecording ? t('releaseToStop') : t('pressAndHold')}
                </p>
              </div>

              <div className="flex justify-center space-x-4">
                {!isRecording ? (
                  <button
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    {t('startRecording')}
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    {t('stopRecording')}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Estado de preview y envío */
            <div className="space-y-6">
              <div className="w-32 h-32 mx-auto rounded-full bg-blue-600 flex items-center justify-center">
                <FiPlay className="w-16 h-16 text-white" />
              </div>

              <div className="text-center">
                <h4 className="text-xl font-semibold text-white mb-2">
                  {t('audioRecorded')}
                </h4>
                <p className="text-gray-400 text-sm">
                  {formatTime(recordingTime)}
                </p>
              </div>

              {/* Controles de audio */}
              <div className="flex justify-center space-x-4">
                {isPlaying ? (
                  <button
                    onClick={stopAudio}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <FiSquare className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={playAudio}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FiPlay className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex space-x-3">
                <button
                  onClick={handleRetry}
                  className="flex-1 py-3 px-4 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                >
                  {t('retry')}
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
        </div>

        {/* Audio element oculto */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;

