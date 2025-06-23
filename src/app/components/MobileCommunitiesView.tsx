'use client';

import { useFirestoreChat } from '@/lib/hooks/useFirestoreChat';
import { AnimatePresence, motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { FiCompass, FiHome, FiMessageCircle, FiUsers } from 'react-icons/fi';
import FloatingPanicButton from './FloatingPanicButton';
import MobileExploreCommunitiesView from './MobileExploreCommunitiesView';
import MobileFullScreenChatView from './MobileFullScreenChatView';

// #region Types & Interfaces
interface ChatInfo {
  chatId: string;
  userId: string;
  userName: string;
  neighborhood: string;
  participantsCount: number;
  participants: Array<{
    id: string;
    name: string;
    surname: string;
    email: string;
    blockNumber: number;
    lotNumber: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
  type: 'normal' | 'panic';
  isOwn: boolean;
  metadata?: Record<string, any>;
}

interface MobileCommunitiesViewProps {
  className?: string;
}

type TabType = 'chat' | 'explore';
type ViewMode = 'main' | 'fullscreenChat';
// #endregion

// #region Components
/**
 * Componente para mostrar el último mensaje con datos reales
 */
const RealMessagePreview = ({
  message,
  isLoading,
  formatTime
}: {
  message: Message | null;
  isLoading: boolean;
  formatTime: (dateString: string) => string;
}) => {
  if (isLoading) {
    return (
      <div className="border-t border-gray-800/50 pt-4">
        <div className="flex items-start space-x-3">
          <div className="loading-skeleton w-6 h-6 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="loading-skeleton h-3 w-3/4"></div>
            <div className="loading-skeleton h-3 w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="border-t border-gray-800/50 pt-4">
        <div className="text-center py-3">
          <div className="w-8 h-8 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-2">
            <FiMessageCircle className="w-4 h-4 text-gray-500" />
          </div>
          <p className="text-sm text-gray-500 font-medium mb-1">
            No hay mensajes aún
          </p>
          <p className="text-xs text-gray-600">
            ¡Sé el primero en saludar! 👋
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-800/50 pt-4">
      <div className="flex items-start space-x-3">
        {/* Avatar mejorado */}
        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
          <span className="text-xs font-bold text-white">
            {message.isOwn ? 'T' : message.userName?.charAt(0)?.toUpperCase() || '?'}
          </span>
        </div>

        {/* Contenido del mensaje mejorado */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xs font-semibold text-blue-400">
              {message.isOwn ? 'Tú' : message.userName?.split(' ')[0] || 'Usuario'}
            </span>
                         <div className="flex items-center space-x-1">
               <span className="text-xs text-gray-500">•</span>
               <span className="text-xs text-gray-500">
                 {formatTime(message.timestamp)}
               </span>
             </div>
            {message.type === 'panic' && (
              <div className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">
                ⚠️ PÁNICO
              </div>
            )}
          </div>
          <p className="message-preview text-gray-300 leading-relaxed">
            {message.message}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Card minimalista del chat del barrio
 */
const NeighborhoodChatCard = ({
  chatInfo,
  lastMessage,
  isLoadingMessage,
  onClick,
  formatTime
}: {
  chatInfo: ChatInfo | null;
  lastMessage: Message | null;
  isLoadingMessage: boolean;
  onClick: () => void;
  formatTime: (dateString: string) => string;
}) => {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="community-card-minimal p-5 cursor-pointer"
    >
      {/* Header del chat */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-4">
          {/* Icono del barrio con efecto mejorado */}
          <div className="neighborhood-avatar">
            <FiHome className="w-6 h-6 text-white" />
          </div>

          {/* Info del barrio */}
          <div>
            <h3 className="text-white font-bold text-lg mb-1">
              {chatInfo?.neighborhood || 'Mi Barrio'}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <FiUsers className="w-3 h-3" />
                <span>{chatInfo?.participantsCount || 0} vecinos</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400">En línea</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vista previa del último mensaje */}
      <RealMessagePreview
        message={lastMessage}
        isLoading={isLoadingMessage}
        formatTime={formatTime}
      />

      {/* Indicador de acción mejorado */}
      <div className="flex items-center justify-center mt-5 pt-4 border-t border-gray-800/50">
        <div className="flex items-center space-x-2 text-blue-400 text-sm font-semibold">
          <FiMessageCircle className="w-4 h-4" />
          <span>Abrir chat del barrio</span>
        </div>
      </div>
    </motion.div>
  );
};
// #endregion

// #region Main Component
const MobileCommunitiesView = ({ className = '' }: MobileCommunitiesViewProps) => {
  // #region State Management
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [viewMode, setViewMode] = useState<ViewMode>('main');
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [isLoadingChat, setIsLoadingChat] = useState(true);
  const [isLoadingMessage, setIsLoadingMessage] = useState(true);

  // Usar Firestore para obtener el último mensaje
  const { chatData } = useFirestoreChat({
    enabled: true
  });

  const { data: session } = useSession();

    // Función para convertir Timestamp a Date
  const toDate = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp.toDate) return timestamp.toDate();
    if (timestamp instanceof Date) return timestamp;
    return new Date(timestamp);
  };

  // Obtener el último mensaje de Firestore
  const lastMessage = chatData.messages.length > 0
    ? {
        ...chatData.messages[chatData.messages.length - 1],
        timestamp: toDate(chatData.messages[chatData.messages.length - 1].timestamp).toISOString(),
        isOwn: false // Se determinará en el componente
      }
    : null;
  // #endregion

  // #region Effects
  useEffect(() => {
    loadChatData();
  }, [session]);

  // Ya no necesitamos cargar el último mensaje por separado
  // porque Firestore nos da los mensajes en tiempo real
  // #endregion

  // #region API Calls
  /**
   * Carga la información del chat del usuario desde la API
   */
  const loadChatData = async () => {
    // No hacer llamada si no hay sesión
    if (!session?.user) {
      setIsLoadingChat(false);
      return;
    }

    try {
      setIsLoadingChat(true);
      const response = await fetch('/api/chat/mine');

      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        if (response.status === 401) {
          console.log('Usuario no autenticado - esto es normal');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setChatInfo(result.data);
      }
    } catch (error) {
      console.error('Error al cargar datos del chat:', error);
    } finally {
      setIsLoadingChat(false);
    }
  };

  /**
   * Carga el último mensaje del chat desde la API
   */
  // Ya no necesitamos loadLastMessage ya que usamos Firestore en tiempo real
  // #endregion

  // #region Event Handlers
  const handleChatOpen = () => {
    setViewMode('fullscreenChat');
  };

  const handleBackFromChat = () => {
    setViewMode('main');
    // Ya no necesitamos recargar mensajes manualmente
    // Firestore se actualiza automáticamente
  };

  const handlePanicClick = async () => {
    try {
      const response = await fetch('/api/panic/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          location: 'current'
        }),
      });

      const result = await response.json();
      console.log('Alerta de pánico enviada:', result);
    } catch (error) {
      console.error('Error al enviar alerta de pánico:', error);
    }
  };
  // #endregion

  // #region Utility Functions
  /**
   * Formatea el tiempo de manera inteligente
   */
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'ahora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}d`;

    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short'
    }).format(date);
  };
  // #endregion

  // #region Render
  return (
    <div className={`w-full h-full bg-gray-900 flex flex-col ${className}`}>
      <AnimatePresence mode="wait">
        {viewMode === 'fullscreenChat' ? (
          <MobileFullScreenChatView
            key="fullscreen-chat"
            onBack={handleBackFromChat}
          />
        ) : (
          <motion.div
            key="main-view"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex flex-col"
          >
            {/* #region Header */}
            <div className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800/50 px-6 py-4">
              <h1 className="text-2xl font-bold text-white">Comunidades</h1>
            </div>
            {/* #endregion */}

            {/* #region Navigation Tabs */}
            <div className="bg-gray-900/95 px-6 pb-4">
              <div className="flex bg-gray-800/50 rounded-xl p-1">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === 'chat'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <FiHome className="w-4 h-4 mx-auto mb-1" />
                  Mi Barrio
                </button>
                <button
                  onClick={() => setActiveTab('explore')}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === 'explore'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <FiCompass className="w-4 h-4 mx-auto mb-1" />
                  Explorar
                </button>
              </div>
            </div>
            {/* #endregion */}

            {/* #region Content Area */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'chat' && (
                <div className="p-6">
                  {isLoadingChat ? (
                    // Loading state mejorado
                    <div className="community-card-minimal p-5">
                      <div className="flex items-center space-x-4 mb-5">
                        <div className="loading-skeleton w-12 h-12 rounded-xl"></div>
                        <div className="space-y-2 flex-1">
                          <div className="loading-skeleton h-5 w-32"></div>
                          <div className="loading-skeleton h-3 w-24"></div>
                        </div>
                      </div>
                      <div className="space-y-3 mb-5">
                        <div className="loading-skeleton h-3 w-full"></div>
                        <div className="loading-skeleton h-3 w-3/4"></div>
                      </div>
                      <div className="flex justify-center pt-4 border-t border-gray-800/50">
                        <div className="loading-skeleton h-4 w-28"></div>
                      </div>
                    </div>
                  ) : !chatInfo ? (
                    // Estado sin chat asignado mejorado
                    <div className="text-center py-16">
                      <div className="w-24 h-24 bg-gray-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-gray-700/50">
                        <FiUsers className="w-12 h-12 text-gray-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-200 mb-3">
                        Sin chat asignado
                      </h3>
                      <p className="text-gray-400 text-base max-w-sm mx-auto leading-relaxed mb-6">
                        Completa tu perfil para unirte al chat de tu barrio y conectar con tus vecinos
                      </p>
                      <div className="text-xs text-gray-500 bg-gray-800/30 rounded-lg px-4 py-2 inline-block">
                        💡 Tip: Agrega tu dirección en configuración
                      </div>
                    </div>
                  ) : (
                    // Chat card
                    <NeighborhoodChatCard
                      chatInfo={chatInfo}
                      lastMessage={lastMessage}
                      isLoadingMessage={isLoadingMessage}
                      onClick={handleChatOpen}
                      formatTime={formatTime}
                    />
                  )}
                </div>
              )}

              {activeTab === 'explore' && (
                <MobileExploreCommunitiesView className="w-full h-full" />
              )}
            </div>
            {/* #endregion */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* #region Floating Panic Button */}
      <FloatingPanicButton
        onClick={handlePanicClick}
        isVisible={true}
      />
      {/* #endregion */}
    </div>
  );
};
// #endregion

export default MobileCommunitiesView;
