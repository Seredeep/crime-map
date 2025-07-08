'use client';

// #region Imports
import { simpleChatCache } from '@/lib/chatCache';
import { Message } from '@/lib/types';
import { AnimatePresence, motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import { FiCompass, FiHome, FiUsers } from 'react-icons/fi';
import MobileExploreCommunitiesView from './MobileExploreCommunitiesView';
import MobileFullScreenChatView from './MobileFullScreenChatView';
// #endregion

// #region Tipos e interfaces
interface ChatInfo {
  chatId: string;
  userId: string;
  userName: string;
  neighborhood: string;
  lastMessageAt: string | null;
  participantsCount: number;
  lastMessage: Message | null;
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

type TabType = 'chat' | 'explore';
type ViewMode = 'main' | 'fullscreenChat';
// #endregion


/**
 * Card del chat estilo WhatsApp - más minimalista
 */
const ChatCard = ({
  chatInfo,
  onClick,
  formatTime
}: {
  chatInfo: ChatInfo | null;
  lastMessage: Message | string | null;
  lastMessageAt: string | null;
  isLoadingMessage: boolean;
  onClick: () => void;
  formatTime: (dateString: string) => string;
}) => {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="whatsapp-chat-card"
    >
      {/* Header simplificado */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <FiHome className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg">
            {chatInfo?.neighborhood || 'Mi Barrio'}
          </h3>
          <p className="text-sm text-gray-400">
            {chatInfo?.participantsCount || 0} participantes
          </p>
        </div>
      </div>

        <div className="flex">
          <p className="text-sm text-gray-400">
            {typeof chatInfo?.lastMessage === 'string' ? chatInfo.lastMessage : chatInfo?.lastMessage?.message || "No hay mensajes aún. ¡Inicia la conversación!"}
          </p>
          <p className="text-xs text-gray-400">
            {chatInfo?.lastMessageAt ? formatTime(chatInfo.lastMessageAt) : ''}
          </p>
        </div>
    </motion.div>
  );
};

// #region Lógica principal del componente
const MobileCommunitiesView = () => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [viewMode, setViewMode] = useState<ViewMode>('main');
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const [isLoadingMessage, setIsLoadingMessage] = useState(true);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  // Cargar datos iniciales del chat
  const loadChatData = useCallback(async () => {
    try {
      // Intentar obtener de la caché primero
      const cachedData = simpleChatCache.getCachedChatInfo('user-chat');
      if (cachedData) {
        setChatInfo(cachedData);
        return;
      }

      const response = await fetch('/api/chat/my-chat');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setChatInfo(result.data);
          simpleChatCache.setCachedChatInfo('user-chat', result.data); // Guardar en caché
        }
      }
    } catch (error) {
      console.error('Error al cargar datos del chat:', error);
    }
  }, []);

  const loadInitialMessage = useCallback(async () => {
    setIsLoadingMessage(true);
    try {
      // Cache-first para el último mensaje
      const cachedMessages = simpleChatCache.getCachedMessages('user-chat');
      if (cachedMessages && cachedMessages.messages.length > 0) {
        const message = cachedMessages.messages[0];
        setLastMessage(message);
        setLastMessageTimestamp(new Date(message.timestamp).getTime());
        setIsLoadingMessage(false);
        return;
      }

      const response = await fetch('/api/chat/firestore-messages?limit=1');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          const message = result.data[0];
          const finalMessage = {
            ...message,
            timestamp: new Date(message.timestamp).toISOString(),
            isOwn: message.userId === session?.user?.id || message.userName === session?.user?.name
          };
          setLastMessage(finalMessage);
          setLastMessageTimestamp(new Date(message.timestamp).getTime());
          simpleChatCache.setCachedMessages('user-chat', [finalMessage]);
        } else {
          setLastMessage(null);
        }
      }
    } catch (error) {
      console.error('Error al cargar el mensaje inicial:', error);
    } finally {
      setIsLoadingMessage(false);
    }
  }, [session]);

  // Cargar datos iniciales del chat
  useEffect(() => {
    if (session?.user && activeTab === 'chat') {
      loadChatData();
      loadInitialMessage();
    }
  }, [session, activeTab, loadChatData, loadInitialMessage]);


  // Detectar cuando la ventana está activa/inactiva
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsActive(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Escuchar evento para abrir chat fullscreen (desde desktop)
  useEffect(() => {
    const handleOpenFullscreenChat = () => {
      if (chatInfo) {
        setViewMode('fullscreenChat');
      }
    };

    window.addEventListener('openFullscreenChat', handleOpenFullscreenChat);

    return () => {
      window.removeEventListener('openFullscreenChat', handleOpenFullscreenChat);
    };
  }, [chatInfo]);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  const handleChatOpen = () => {
    setViewMode('fullscreenChat');
  };

  const handleBackFromChat = () => {
    setViewMode('main');
    // Recargar datos cuando regresamos del chat
    loadInitialMessage();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };
  // #endregion

  // #region Renderizado
  return (
    <div className="w-full h-full bg-gray-900 flex flex-col">
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
                  onClick={() => handleTabChange('chat')}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'chat'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                >
                  <FiHome className="w-4 h-4 mx-auto mb-1" />
                  Mi Barrio
                </button>
                <button
                  onClick={() => handleTabChange('explore')}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'explore'
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
                  {isLoadingMessage ? (
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
                    <ChatCard
                      chatInfo={chatInfo}
                      lastMessage={lastMessage}
                      lastMessageAt={chatInfo.lastMessageAt}
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
    </div>
  );
  // #endregion
}
// #region Export
export default MobileCommunitiesView;
// #endregion
