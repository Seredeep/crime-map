'use client';

import { useChatMessages } from '@/lib/hooks/useChatMessages';
import { PanInfo, motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { FiAlertTriangle, FiArrowLeft, FiChevronRight, FiMapPin, FiSend, FiUsers } from 'react-icons/fi';
import ChatInfo from './ChatInfo';

interface MobileFullScreenChatViewProps {
  onBack: () => void;
  className?: string;
}

interface ChatParticipant {
  _id: string;
  name: string;
  surname: string;
  blockNumber: number;
}

interface ChatInfo {
  _id: string;
  neighborhood: string;
  participants: ChatParticipant[];
}

const MobileFullScreenChatView = ({ onBack, className = '' }: MobileFullScreenChatViewProps) => {
  const { data: session } = useSession();
  const [chat, setChat] = useState<ChatInfo | null>(null);
  const [chatStats, setChatStats] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showParticipants, setShowParticipants] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Usar el hook de mensajes con WebSockets y cache
  const {
    messages,
    loading,
    error,
    chatData,
    isConnected,
    typingUsers,
    sendMessage,
    sendPanicMessage,
    startTyping,
    stopTyping,
    loadMoreMessages
  } = useChatMessages({
    pollingInterval: 3000,
    enabled: true,
    useWebSockets: true
  });

  // Cargar información del chat
  useEffect(() => {
    loadChatInfo();
    loadChatStats();
  }, []);

  // Recargar stats cada 30 segundos
  useEffect(() => {
    const interval = setInterval(loadChatStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll a mensajes nuevos
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatInfo = async () => {
    try {
      const response = await fetch('/api/chat/mine');
      const result = await response.json();

      if (result.success && result.data) {
        setChat(result.data);
      }
    } catch (error) {
      console.error('Error al cargar información del chat:', error);
    }
  };

  const loadChatStats = async () => {
    try {
      const response = await fetch('/api/chat/stats');
      const result = await response.json();

      if (result.success && result.data) {
        setChatStats(result.data);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas del chat:', error);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      try {
        await sendMessage(newMessage);
        setNewMessage('');

        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      } catch (error) {
        console.error('Error al enviar mensaje:', error);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'short'
      }).format(date);
    }
  };

  // Changed to horizontal drag (lateral swipe)
  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.x > 100) { // Swipe right to close
      onBack();
    }
  };

  // Fix for isOwn issue - check current user email/id
  const isMessageOwn = (message: any) => {
    if (!session?.user?.email) return false;

    // Check both userId and email to ensure proper ownership detection
    const currentUserEmail = session.user.email;
    const isOwnByEmail = message.userName === session.user.name ||
                        message.userEmail === currentUserEmail;

    return message.isOwn || isOwnByEmail;
  };

  if (loading) {
    return (
      <div className={`fixed inset-0 bg-gray-900 z-[210] flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`fixed inset-0 bg-gray-900 z-[210] flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <FiAlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-400 mb-2">Error</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0, right: 0.2 }}
      onDragEnd={handleDragEnd}
      className={`fixed inset-0 bg-gray-900 z-[210] flex flex-col ${className}`}
    >
      {/* Hidden drag indicator - minimal but functional */}
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-0.5 h-16 bg-gray-600/30 rounded-r-full"></div>

      {/* Enhanced Header with full-width participants button */}
      <div className="bg-gray-800 border-b border-gray-700/50">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors mr-3"
          >
            <FiArrowLeft className="w-5 h-5 text-gray-400" />
          </button>

          {/* Full-width clickable header area */}
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="flex-1 flex items-center justify-between hover:bg-gray-700/30 rounded-lg p-2 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <FiMapPin className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-semibold text-white">
                  {chatData.neighborhood || 'Chat Barrial'}
                </h2>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-400">
                    {chat?.participants.length || 0} participantes
                  </p>
                  {typingUsers.length > 0 && (
                    <span className="text-xs text-blue-400">
                      • {typingUsers.join(', ')} escribiendo...
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <FiUsers className="w-5 h-5 text-gray-400" />
              <FiChevronRight
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  showParticipants ? 'rotate-90' : ''
                }`}
              />
            </div>
          </button>
        </div>

        {/* Chat Info */}
        <ChatInfo
          todayMessages={chatStats?.todayMessages || messages.filter(m => {
            const today = new Date();
            return m.timestamp.toDateString() === today.toDateString();
          }).length}
          activeUsers={chatStats?.activeUsers || chat?.participants.length || 0}
          lastActivity={chatStats?.lastActivity ? new Date(chatStats.lastActivity) :
            (messages.length > 0 ? messages[messages.length - 1].timestamp : undefined)}
          safetyLevel={chatStats?.safetyLevel || "medium"}
          emergencyLevel={chatStats?.emergencyLevel || "normal"}
          recentIncidents={chatStats?.recentIncidents || 0}
          panicMessages={chatStats?.panicMessages || 0}
          className="px-4 py-2"
        />
      </div>

      {/* Enhanced Participants panel */}
      {showParticipants && chat && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/50"
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-200">Participantes del {chatData.neighborhood}</h3>
              <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full">
                {chat.participants.length} miembros
              </span>
            </div>

            <div className="grid gap-3 max-h-48 overflow-y-auto">
              {chat.participants.map((participant: ChatParticipant) => (
                <div key={participant._id} className="flex items-center space-x-3 p-2 hover:bg-gray-700/30 rounded-lg transition-colors">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-white">
                        {participant.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    {/* Online indicator - you can implement this later */}
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {participant.name} {participant.surname}
                    </p>
                    <p className="text-xs text-gray-400">
                      Manzana {participant.blockNumber} • Vecino
                    </p>
                  </div>

                  {/* Current user indicator */}
                  {session?.user?.email && participant.name === session.user.name && (
                    <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded-full">
                      Tú
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUsers className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">
                ¡Bienvenido al chat de {chatData.neighborhood}!
              </h3>
              <p className="text-gray-500 text-sm">
                Sé el primero en enviar un mensaje a tus vecinos
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const showDateDivider = index === 0 ||
                formatDate(messages[index - 1].timestamp) !== formatDate(message.timestamp);

              const isPanicMessage = message.type === 'panic';
              const isOwn = isMessageOwn(message); // Use improved ownership detection

              // Crear una key única que incluya el timestamp para evitar duplicados
              const uniqueKey = `${message.id}-${message.timestamp.getTime()}-${index}`;

              return (
                <div key={uniqueKey}>
                  {showDateDivider && (
                    <div className="flex justify-center my-4">
                      <span className="px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-full">
                        {formatDate(message.timestamp)}
                      </span>
                    </div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}
                  >
                    <div className={`max-w-[80%] ${isOwn ? 'order-2' : 'order-1'}`}>
                      {!isOwn && (
                        <p className="text-xs text-blue-400 mb-1 px-1 font-medium">
                          {message.userName.split(' ')[0]}
                        </p>
                      )}
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isPanicMessage
                            ? 'bg-red-500/20 border border-red-500/30 text-red-100'
                            : isOwn
                            ? 'bg-blue-500 text-white ml-2'
                            : 'bg-gray-800 text-gray-100 mr-2'
                        }`}
                      >
                        {isPanicMessage && (
                          <div className="flex items-center space-x-2 mb-2">
                            <FiAlertTriangle className="w-4 h-4 text-red-400" />
                            <span className="text-xs font-semibold text-red-400">ALERTA DE PÁNICO</span>
                          </div>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          isPanicMessage
                            ? 'text-red-300'
                            : isOwn
                            ? 'text-blue-100'
                            : 'text-gray-400'
                        }`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message input */}
      <div className="bg-gray-800 p-4 border-t border-gray-700/50">
        <div className="flex items-end space-x-3">
          <div className="flex-1 bg-gray-700 rounded-2xl px-4 py-2 flex items-center space-x-3">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-transparent text-white placeholder-gray-400 resize-none outline-none max-h-20 min-h-[1.5rem]"
              rows={1}
              style={{ lineHeight: '1.5rem' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
              newMessage.trim()
                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <FiSend className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default MobileFullScreenChatView;
