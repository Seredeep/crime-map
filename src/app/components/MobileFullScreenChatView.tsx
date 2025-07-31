'use client';

import { AnimatePresence, PanInfo, motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FiAlertTriangle, FiArrowLeft, FiSend, FiUsers } from 'react-icons/fi';
import LazyImage from './LazyImage';

interface MobileFullScreenChatViewProps {
  onBack: () => void;
  className?: string;
}

interface ChatParticipant {
  _id: string;
  name: string;
  surname: string;
  blockNumber: number;
  lotNumber: number;
  profileImage?: string;
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
  metadata?: {
    location?: { lat: number; lng: number; accuracy?: number; timestamp?: number; fallback?: boolean };
    address?: string;
  };
  senderProfileImage?: string;
}

const MobileFullScreenChatView = ({ onBack, className = '' }: MobileFullScreenChatViewProps) => {
  const { data: session } = useSession();
  const t = useTranslations('States');
  const tErrors = useTranslations('Errors');
  const [chat, setChat] = useState<ChatInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showParticipants, setShowParticipants] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadChatInfo = useCallback(async () => {
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
      setError(tErrors('chatLoadError'));
    }
  }, [session]);

  const loadMessages = useCallback(async () => {
    if (!session?.user) return;

    try {
      const response = await fetch('/api/chat/firestore-messages');

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.messages) {
          const formattedMessages = result.data.messages.map((msg: any) => ({
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
      setError(tErrors('messagesLoadError'));
      setIsConnected(false);
    }
  }, [session]);

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
  }, [session, loadChatInfo, loadMessages]);

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
  }, [session, loading, loadMessages]);

  // Auto-scroll a mensajes nuevos
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const sendMessage = async (message: string): Promise<boolean> => {
    if (!session?.user || !message.trim()) return false;

    try {
      setIsSending(true);
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
    } finally {
      setIsSending(false);
    }
  };

  const sendPanicMessage = async (message: string, location?: { lat: number; lng: number }): Promise<boolean> => {
    if (!session?.user || !message.trim()) return false;

    try {
      setIsSending(true);
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
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() && !isSending) {
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

  const isMessageOwn = (message: any) => {
    if (!session?.user?.id) return false;
    return message.userId === session?.user?.id;
  };

  // Función helper para determinar las clases de border radius
  const getBorderRadiusClass = (isOwn: boolean, isFirstInGroup: boolean, isLastInGroup: boolean) => {
    // Base: todas las esquinas redondeadas
    let classes = 'rounded-2xl';

    if (isOwn) {
      // Mensajes del usuario actual (derecha) - siempre tienen la "burbujita" en bottom-right
      if (isLastInGroup) {
        classes = 'rounded-2xl rounded-br-sm'; // Último mensaje o único con tail
      }
    } else {
      // Mensajes de otros usuarios (izquierda) - siempre tienen la "burbujita" en bottom-left
      if (isLastInGroup) {
        classes = 'rounded-2xl rounded-bl-sm'; // Último mensaje o único con tail
      }
    }

    return classes;
  };

  if (loading) {
    return (
      <div className={`fixed inset-0 bg-gray-900 z-[210] flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">{t('loadingChat')}</p>
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
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{
        type: 'spring',
        damping: 25,
        stiffness: 200,
        duration: 0.5
      }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
      className={`fixed inset-0 bg-gray-900 z-[400] flex flex-col overflow-hidden ${className}`}
      style={{
        background: 'rgba(17, 24, 39, 0.98)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 0 50px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* #region Header */}
      <div className="bg-gray-900/95 backdrop-blur-md border-b border-gray-800/50 px-4 py-4 flex items-center justify-between z-10">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center flex-grow">
          <h2 className="text-lg font-semibold text-white">{chat?.neighborhood || t('loading')}</h2>
          <p className="text-xs text-gray-400">{chat?.participants.length || 0} participantes</p>
        </div>
        <button
          onClick={() => setShowParticipants(true)}
          className="p-2 rounded-full bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
        >
          <FiUsers className="w-5 h-5" />
        </button>
      </div>
      {/* #endregion */}

      {/* #region Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide">
        {messages.map((message, index) => {
          const showDate = index === 0 || message.timestamp.toDateString() !== messages[index - 1].timestamp.toDateString();
          const isOwn = isMessageOwn(message);

          // Lógica para agrupar mensajes consecutivos del mismo usuario
          const prevMessage = index > 0 ? messages[index - 1] : null;
          const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;

          const isFirstInGroup = !prevMessage || prevMessage.userId !== message.userId || showDate;
          const isLastInGroup = !nextMessage || nextMessage.userId !== message.userId;

          // Determinar si mostrar avatar y nombre
          const showAvatar = !isOwn && isLastInGroup;
          const showName = !isOwn && isFirstInGroup;

          return (
            <div key={message.id} className="flex flex-col">
              {showDate && (
                <div className="text-center w-full my-4">
                  <span className="text-xs text-gray-500 bg-gray-800/50 px-3 py-1 rounded-full">
                    {formatDate(message.timestamp)}
                  </span>
                </div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className={`flex w-full items-end ${isOwn ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-2' : 'mt-0.5' // Menos espacio entre mensajes del mismo usuario
                  }`}
              >
                {/* Avatar solo para otros usuarios y solo en el último mensaje del grupo */}
                {showAvatar ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mr-2">
                    {message.senderProfileImage ? (
                      <LazyImage
                        src={message.senderProfileImage}
                        alt={`${message.userName}'s profile`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white text-xs font-semibold">
                        {message.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                ) : !isOwn ? (
                  <div className="w-8 h-8 mr-2"></div> // Espacio para mantener alineación
                ) : null}

                <div className="flex flex-col max-w-[80%]">
                  {/* Mostrar nombre solo en el primer mensaje del grupo para otros usuarios */}
                  {showName && (
                    <span className="text-xs text-gray-400 mb-1 ml-3">
                      {message.userName}
                    </span>
                  )}

                  <div
                    className={`px-4 py-2 shadow-md ${isOwn
                        ? 'bg-blue-600 text-white'
                        : message.type === 'panic'
                          ? 'bg-red-700 text-white border border-red-600'
                          : 'bg-gray-700 text-gray-100'
                      } ${getBorderRadiusClass(isOwn, isFirstInGroup, isLastInGroup)
                      }`}
                  >
                    {message.type === 'panic' ? (
                      <>
                        <span className="font-semibold">¡ALERTA DE PÁNICO!</span>
                        <br />
                        <span className="text-sm">
                          {message.metadata?.address || 'Ubicación GPS exacta no disponible'}
                        </span>
                        <br />
                        <span className="text-xs text-gray-300 mt-1 block">
                          {formatTime(message.timestamp)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm leading-tight block">
                          {message.message}
                        </span>
                        <span className={`text-xs text-gray-300 mt-1 block ${isOwn ? 'text-right' : 'text-left'}`}>
                          {formatTime(message.timestamp)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      {/* #endregion */}

      {/* #region Message Input */}
      <div className="bg-gray-900/95 backdrop-blur-md border-t border-gray-800/50 px-4 py-2 flex items-end space-x-2">
        <textarea
          ref={textareaRef}
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            // Auto-resize textarea
            if (textareaRef.current) {
              textareaRef.current.style.height = 'auto';
              textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
            }
          }}
          onKeyPress={handleKeyPress}
          placeholder="Escribe un mensaje..."
          className="flex-1 p-2 bg-gray-800 rounded-lg text-white resize-none scrollbar-hide outline-none text-sm max-h-10"
        />
        <button
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || isSending}
          className="p-2.5 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex-shrink-0"
        >
          <FiSend className="w-4 h-4" />
        </button>
      </div>
      {/* #endregion */}

      {/* #region Participants Modal */}
      <AnimatePresence>
        {showParticipants && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 200,
              duration: 0.5
            }}
            className="fixed inset-0 bg-gray-900 z-[500] flex flex-col"
          >
            <div className="bg-gray-900/95 backdrop-blur-md border-b border-gray-800/50 px-4 py-4 flex items-center justify-between">
              <button
                onClick={() => setShowParticipants(false)}
                className="p-2 rounded-full bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold text-white">Participantes</h2>
              <div className="w-10">{/* Spacer */}</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chat?.participants.map((participant) => (
                <div key={participant._id} className="flex items-center space-x-3 bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    {participant.profileImage ? (
                      <LazyImage
                        src={participant.profileImage}
                        alt={`${participant.name}'s profile`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold">
                        {participant.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">{participant.name} {participant.surname}</p>
                    <p className="text-sm text-gray-400">Manzana {participant.blockNumber}, Lote {participant.lotNumber}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* #endregion */}
    </motion.div>
  );
};

export default MobileFullScreenChatView;
