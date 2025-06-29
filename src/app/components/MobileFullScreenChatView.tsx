'use client';

import { PanInfo, motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { FiAlertTriangle, FiArrowLeft, FiMapPin, FiSend, FiUsers } from 'react-icons/fi';

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

interface Message {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'normal' | 'panic';
  isOwn: boolean;
  metadata?: Record<string, any>;
}

const MobileFullScreenChatView = ({ onBack, className = '' }: MobileFullScreenChatViewProps) => {
  const { data: session } = useSession();
  const [chat, setChat] = useState<ChatInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showParticipants, setShowParticipants] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Cargar información del chat y mensajes en paralelo
  useEffect(() => {
    if (session?.user) {
      setLoading(true);
      Promise.all([
        loadChatInfo(),
        loadMessages()
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [session]);

  // Polling optimizado - solo cuando hay actividad
  useEffect(() => {
    if (session?.user && !loading) {
      const interval = setInterval(() => {
        // Solo hacer polling si la ventana está activa
        if (!document.hidden) {
          loadMessages();
        }
      }, 8000); // Polling menos agresivo
      return () => clearInterval(interval);
    }
  }, [session, loading]);

  // Auto-scroll a mensajes nuevos
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatInfo = async () => {
    if (!session?.user) return;

    try {
      const response = await fetch('/api/chat/mine');

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Usuario no autenticado - esto es normal');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setChat(result.data);
      }
    } catch (error) {
      console.error('Error al cargar información del chat:', error);
      setError('Error al cargar información del chat');
    }
  };

  const loadMessages = async () => {
    if (!session?.user) return;

    try {
      const response = await fetch('/api/chat/messages');

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const formattedMessages = result.data.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
            isOwn: msg.userId === session.user?.id || msg.userName === session.user?.name
          }));
          setMessages(formattedMessages);
          setIsConnected(true);
          setError(null);
        }
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
      setError('Error al cargar mensajes');
      setIsConnected(false);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const sendMessage = async (message: string): Promise<boolean> => {
    if (!session?.user || !message.trim()) return false;

    try {
      const response = await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          type: 'normal'
        }),
      });

      if (response.ok) {
        // Recargar mensajes después de enviar
        await loadMessages();
        return true;
      } else {
        setError('Error enviando mensaje');
        return false;
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      setError('Error enviando mensaje');
      return false;
    }
  };

  const sendPanicMessage = async (message: string, location?: { lat: number; lng: number }): Promise<boolean> => {
    if (!session?.user || !message.trim()) return false;

    try {
      const response = await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          type: 'panic',
          metadata: { location }
        }),
      });

      if (response.ok) {
        await loadMessages();
        return true;
      } else {
        setError('Error enviando mensaje de pánico');
        return false;
      }
    } catch (error) {
      console.error('Error enviando mensaje de pánico:', error);
      setError('Error enviando mensaje de pánico');
      return false;
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

      {/* Header simplificado */}
      <div className="bg-gray-800 border-b border-gray-700/50">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors mr-3"
          >
            <FiArrowLeft className="w-5 h-5 text-gray-400" />
          </button>

          <div className="flex items-center space-x-3 flex-1">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <FiMapPin className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">
                {chat?.neighborhood || 'Chat Barrial'}
              </h2>
              <p className="text-sm text-gray-400">
                {chat?.participants.length || 0} participantes
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          >
            <FiUsers className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Panel de participantes simplificado */}
      {showParticipants && chat && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="participants-panel"
        >
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-300">Participantes</h3>
              <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-1 rounded">
                {chat.participants.length}
              </span>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
              {chat.participants.map((participant: ChatParticipant) => (
                <div key={participant._id} className="participant-item">
                  <div className="participant-avatar">
                    <span className="text-xs font-medium text-white">
                      {participant.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      {participant.name} {participant.surname}
                    </p>
                    <p className="text-xs text-gray-500">
                      Manzana {participant.blockNumber}
                    </p>
                  </div>
                  {session?.user?.email && participant.name === session.user.name && (
                    <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded">
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
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUsers className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">
                ¡Bienvenido al chat de {chat?.neighborhood || 'tu barrio'}!
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
              const isOwn = isMessageOwn(message);

              // Crear una key única más robusta
              const messageKey = message.id || `msg-${message.timestamp.getTime()}-${index}`;
              const dateKey = `date-${formatDate(message.timestamp)}`;

              const elements = [];

              // Agregar divisor de fecha si es necesario
              if (showDateDivider) {
                elements.push(
                  <div key={dateKey} className="flex justify-center my-4">
                    <span className="px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-full">
                      {formatDate(message.timestamp)}
                    </span>
                  </div>
                );
              }

              // Agregar mensaje
              elements.push(
                <motion.div
                  key={messageKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 message-enter`}
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
              );

              return elements;
            }).flat()}
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
              className="message-input"
              rows={1}
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
            className={`send-button ${newMessage.trim() ? 'active' : 'inactive'}`}
          >
            <FiSend className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default MobileFullScreenChatView;
