'use client';

// #region Imports
import { LastChatMessage } from '@/lib/services/chat/types';
import { AnimatePresence, motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { FiCompass, FiHome, FiUsers } from 'react-icons/fi';
import LazyImage from './LazyImage';
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
  lastMessage: LastChatMessage | null;
  participants: Array<{
    id: string;
    name: string;
    surname: string;
    email: string;
    blockNumber?: number;
    lotNumber?: number;
    profileImage?: string;
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
  formatTime,
  profileImage,
  t
}: {
  chatInfo: ChatInfo | null;
  lastMessage: LastChatMessage | null;
  lastMessageAt: string | null;
  isLoadingMessage: boolean;
  onClick: () => void;
  formatTime: (dateString: string) => string;
  profileImage: string | null;
  t: (key: string) => string;
}) => {
  // Función para obtener la inicial del barrio
  const getNeighborhoodInitial = (neighborhood: string) => {
    if (!neighborhood) return 'B';
    // Extraer solo la parte del nombre después de "Barrio" si existe
    const cleanName = neighborhood.replace(/barrio\s*/i, '').trim();
    return cleanName.charAt(0).toUpperCase() || 'B';
  };

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-gray-800 rounded-2xl p-5 shadow-lg space-y-4 border border-gray-700/50"
    >
      {/* Header mejorado */}
      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
          {/* Mostrar inicial del barrio en lugar de la imagen del remitente */}
          <span className="text-white font-bold text-lg">
            {getNeighborhoodInitial(chatInfo?.neighborhood || '')}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-lg truncate">
            {chatInfo?.neighborhood || t('myNeighborhood')}
          </h3>
          <p className="text-sm text-gray-400">
            {chatInfo?.participantsCount || 0} {t('participants')}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 text-sm">
        {/* Mostrar imagen del remitente del último mensaje */}
        <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
          {profileImage ? (
            <LazyImage
              src={profileImage}
              alt="Perfil"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white text-xs font-semibold">
              {chatInfo?.lastMessage?.userName?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Mostrar nombre del remitente y mensaje */}
          {chatInfo?.lastMessage ? (
            <p className="text-gray-300 overflow-hidden text-ellipsis whitespace-nowrap">
              <span className="text-gray-400 font-medium">
                {chatInfo.lastMessage.userName}:
              </span>{' '}
              {chatInfo.lastMessage.message}
            </p>
          ) : (
            <p className="text-gray-400 italic">
              {t('noMessagesYet')}
            </p>
          )}
        </div>

        {/* Timestamp */}
        {chatInfo?.lastMessageAt && (
          <p className="text-xs text-gray-500 flex-shrink-0">
            {formatTime(chatInfo.lastMessageAt)}
          </p>
        )}
      </div>
    </motion.div>
  );
};

// #region Lógica principal del componente
const MobileCommunitiesView = () => {
  const { data: session } = useSession();
  const t = useTranslations('Communities');
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [viewMode, setViewMode] = useState<ViewMode>('main');
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [isLoadingMessage, setIsLoadingMessage] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos del chat (incluyendo el último mensaje) desde la API
  const loadChatData = useCallback(async () => {
    if (!session?.user?.email) {
      setIsLoadingMessage(false);
      setError(null);
      return;
    }

    setIsLoadingMessage(true);
    setError(null);
    try {
      const response = await fetch('/api/chat/my-chat');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setChatInfo(result.data);
        } else {
          setChatInfo(null);
          setError(result.error || 'Error al cargar los datos del chat.');
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (err) {
      console.error('Error al cargar datos del chat:', err);
      setError('Error al cargar los datos del chat. Por favor, inténtalo de nuevo.');
      setChatInfo(null);
    } finally {
      setIsLoadingMessage(false);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user && activeTab === 'chat') {
      loadChatData();
      // Opcional: implementar un polling aquí para actualizaciones periódicas
      const intervalId = setInterval(() => {
        if (!document.hidden) { // Solo hacer polling si la ventana está activa
          loadChatData();
        }
      }, 8000); // Polling cada 8 segundos

      return () => clearInterval(intervalId);
    }
  }, [session, activeTab, loadChatData]);


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
    // Recargar datos cuando regresamos del chat para ver el último mensaje actualizado
    loadChatData();
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

  const getLastMessageSenderProfileImage = useCallback(() => {
    if (!chatInfo || !chatInfo.lastMessage || !chatInfo.participants) {
      return null;
    }
    const sender = chatInfo.participants.find(
      (p) => p.id === chatInfo.lastMessage?.userId
    );
    return sender?.profileImage || null;
  }, [chatInfo]);

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
                              <h1 className="text-2xl font-bold text-white">{t('communities')}</h1>
            </div>
            {/* #endregion */}

            {/* #region Navigation Tabs */}
            <div className="bg-gray-900/95 px-6 pb-4">
              <div className="flex bg-gray-800/50 rounded-xl p-1">
                <button
                  onClick={() => handleTabChange('chat')}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === 'chat'
                      ? 'bg-gray-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <FiHome className="w-4 h-4 mx-auto mb-1" />
                  {t('myNeighborhood')}
                </button>
                <button
                  disabled
                  className="flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 bg-gray-700/30 text-gray-500 cursor-not-allowed opacity-60"
                >
                  <FiCompass className="w-4 h-4 mx-auto mb-1" />
                  {t('explore')}
                  <div className="text-xs text-gray-400 mt-1">Not available in demo</div>
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
                    <div className="bg-gray-800 rounded-2xl p-5 shadow-lg space-y-4 border border-gray-700/50">
                      <div className="flex items-center space-x-4">
                        <div className="loading-skeleton w-12 h-12 rounded-full"></div>
                        <div className="space-y-2 flex-1">
                          <div className="loading-skeleton h-5 w-3/4 rounded"></div>
                          <div className="loading-skeleton h-3 w-1/2 rounded"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="loading-skeleton h-3 w-full rounded"></div>
                        <div className="loading-skeleton h-3 w-5/6 rounded"></div>
                      </div>
                    </div>
                  ) : !chatInfo ? (
                    // Estado sin chat asignado mejorado
                    <div className="text-center py-16 bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-700/50">
                      <div className="w-24 h-24 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-600/50">
                        <FiUsers className="w-12 h-12 text-gray-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-200 mb-3">
                        {t('noChatAssigned')}
                      </h3>
                      <p className="text-gray-400 text-base max-w-sm mx-auto leading-relaxed mb-6">
                        {t('completeProfileToJoin')}
                      </p>
                      <div className="text-xs text-gray-500 bg-gray-700/30 rounded-lg px-4 py-2 inline-block">
                        {t('tipAddAddress')}
                      </div>
                    </div>
                  ) : (
                    // Chat card
                    <ChatCard
                      chatInfo={chatInfo}
                      lastMessage={chatInfo.lastMessage}
                      lastMessageAt={chatInfo.lastMessageAt}
                      isLoadingMessage={isLoadingMessage}
                      onClick={handleChatOpen}
                      formatTime={formatTime}
                      profileImage={getLastMessageSenderProfileImage()}
                      t={t}
                    />
                  )}
                </div>
              )}

              {activeTab === 'explore' && (
                <div className="p-6">
                  <div className="text-center py-16 bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-700/50">
                    <div className="w-24 h-24 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-600/50">
                      <FiCompass className="w-12 h-12 text-gray-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-200 mb-3">
                      Explore Feature Disabled
                    </h3>
                    <p className="text-gray-400 text-base max-w-sm mx-auto leading-relaxed mb-6">
                      This feature is currently disabled for the demo. In the full version, you will be able to explore and join other neighborhood communities.
                    </p>
                    <div className="text-xs text-gray-500 bg-gray-700/30 rounded-lg px-4 py-2 inline-block">
                      Coming soon in the full release
                    </div>
                  </div>
                </div>
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
