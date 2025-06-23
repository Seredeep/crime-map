'use client';

import { useEffect, useState } from 'react';
import { FiAlertTriangle, FiCheck, FiInfo, FiX } from 'react-icons/fi';

interface FirebaseStatus {
  isConfigured: boolean;
  projectId: string | null;
  isDemo: boolean;
}

export default function FirebaseStatusIndicator() {
  const [status, setStatus] = useState<FirebaseStatus>({
    isConfigured: false,
    projectId: null,
    isDemo: true
  });
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    // Verificar estado de Firebase
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const isDemo = !projectId || projectId === 'demo-project';
    const isConfigured = !isDemo && projectId !== undefined;

    setStatus({
      isConfigured,
      projectId,
      isDemo
    });

    // Mostrar información automáticamente si está en modo demo
    if (isDemo) {
      const hasSeenInfo = localStorage.getItem('firebase-info-seen');
      if (!hasSeenInfo) {
        setShowInfo(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setShowInfo(false);
    localStorage.setItem('firebase-info-seen', 'true');
  };

  if (!showInfo && status.isConfigured) return null;

  return (
    <>
      {/* Indicador de estado en la esquina */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowInfo(!showInfo)}
          className={`p-2 rounded-full shadow-lg transition-colors ${
            status.isConfigured
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-yellow-500 hover:bg-yellow-600 text-white animate-pulse'
          }`}
          title={status.isConfigured ? 'Firebase configurado' : 'Firebase en modo demo'}
        >
          {status.isConfigured ? (
            <FiCheck className="w-4 h-4" />
          ) : (
            <FiAlertTriangle className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Modal de información */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FiInfo className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Estado de Firebase
                </h3>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className={`p-3 rounded-lg ${
                status.isConfigured
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {status.isConfigured ? (
                    <FiCheck className="w-4 h-4 text-green-600" />
                  ) : (
                    <FiAlertTriangle className="w-4 h-4 text-yellow-600" />
                  )}
                  <span className={`font-medium ${
                    status.isConfigured ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {status.isConfigured ? 'Firebase Configurado' : 'Modo Demo Activo'}
                  </span>
                </div>
                <p className={`text-sm ${
                  status.isConfigured ? 'text-green-700' : 'text-yellow-700'
                }`}>
                  {status.isConfigured
                    ? `Conectado al proyecto: ${status.projectId}`
                    : 'El chat funciona con datos simulados. Para usar Firebase en tiempo real, configura las variables de entorno.'
                  }
                </p>
              </div>

              {!status.isConfigured && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Para configurar Firebase:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                    <li>Crea un proyecto en <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Firebase Console</a></li>
                    <li>Habilita Firestore Database</li>
                    <li>Copia la configuración de tu proyecto</li>
                    <li>Crea un archivo <code className="bg-gray-100 px-1 rounded">.env.local</code> con las variables:</li>
                  </ol>
                  <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                    <div>NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key</div>
                    <div>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com</div>
                    <div>NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id</div>
                    <div>NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com</div>
                    <div>NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789</div>
                    <div>NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef</div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Consulta <code>FIREBASE-SETUP.md</code> para instrucciones detalladas.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
