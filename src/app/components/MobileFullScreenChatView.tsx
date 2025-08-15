'use client';

import { AnimatePresence, PanInfo, motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FiAlertTriangle, FiArrowLeft, FiSend, FiUser, FiUsers } from 'react-icons/fi';
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
    replyTo?: { id: string; userId: string; userName: string; snippet: string };
  };
  senderProfileImage?: string;
}

const MobileFullScreenChatView = ({ onBack, className = '' }: MobileFullScreenChatViewProps) => {
  const { data: session } = useSession();
  const t = useTranslations('States');
  const tErrors = useTranslations('Errors');
  const tChat = useTranslations('Chat');
  const [chat, setChat] = useState<ChatInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [longPressMessage, setLongPressMessage] = useState<Message | null>(null);
  const [swipeMessage, setSwipeMessage] = useState<Message | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
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
  }, [session, tErrors]);

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
  }, [session, tErrors]);

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

  // Cleanup de timers al desmontar
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  // Cerrar menú cuando se haga clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu && !(event.target as Element).closest('.menu-container')) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

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
          type: 'normal',
          metadata: {
            ...(anonymous ? { anonymous: true } : {}),
            ...(replyingTo ? {
              replyTo: {
                id: replyingTo.id,
                userId: replyingTo.userId,
                userName: replyingTo.userName,
                snippet: replyingTo.message.slice(0, 140)
              }
            } : {})
          }
        }),
      });

      if (response.ok) {
        // Recargar mensajes después de enviar
        await loadMessages();
        setReplyingTo(null);
        return true;
      } else {
        setError(tErrors('sendMessageError'));
        return false;
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      setError(tErrors('sendMessageError'));
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
        setError(tErrors('panicMessageError'));
        return false;
      }
    } catch (error) {
      console.error('Error enviando mensaje de pánico:', error);
      setError(tErrors('panicMessageError'));
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

  const handlePickReply = (message: Message) => {
    // Si ya está seleccionado, deseleccionar
    if (replyingTo?.id === message.id) {
      setReplyingTo(null);
      return;
    }

    // Seleccionar el mensaje para responder
    setReplyingTo(message);

    // Hacer scroll al input para que el usuario vea que puede escribir
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };

  const handleLongPressStart = (message: Message) => {
    // Limpiar timer anterior si existe
    if (longPressTimer) {
      clearTimeout(longPressTimer);
    }

    // Configurar nuevo timer para long press (500ms)
    const timer = setTimeout(() => {
      setLongPressMessage(message);
      handlePickReply(message);
    }, 500);

    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    // Limpiar timer si se cancela el long press
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setLongPressMessage(null);
  };

  const handleMessageMouseDown = (message: Message) => {
    handleLongPressStart(message);
  };

  const handleMessageMouseUp = () => {
    handleLongPressEnd();
  };

  const handleMessageMouseLeave = () => {
    handleLongPressEnd();
  };

  const handleMessageTouchStart = (message: Message) => {
    handleLongPressStart(message);
  };

  const handleMessageTouchEnd = () => {
    handleLongPressEnd();
  };

  // Sistema de swipe ultra-simplificado
  const handleSwipeStart = (message: Message, e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const startX = touch.clientX;

    const onMove = (moveEvent: TouchEvent) => {
      const currentX = moveEvent.touches[0].clientX;
      const offset = Math.max(0, startX - currentX);

      if (offset > 10) {
        setSwipeMessage(message);
        setIsSwiping(true);
        setSwipeOffset(Math.min(offset, 100));
      }
    };

    const onEnd = (endEvent: TouchEvent) => {
      const endX = endEvent.changedTouches[0].clientX;
      const totalOffset = startX - endX;

      if (totalOffset > 50) {
        handlePickReply(message);
      }

      // Resetear
      setIsSwiping(false);
      setSwipeOffset(0);
      setTimeout(() => setSwipeMessage(null), 200);

      // Limpiar
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };

    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd, { passive: false });
  };

  const clearReply = () => setReplyingTo(null);

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
      return tChat('today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return tChat('yesterday');
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
          <h3 className="text-xl font-semibold text-red-400 mb-2">{tErrors('error')}</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            {t('back')}
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
          <p className="text-xs text-gray-400">{chat?.participants.length || 0} {tChat('participants')}</p>
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

          const isAnonymous = Boolean((message as any).metadata?.anonymous) || (message.userName?.toLowerCase?.() === 'anonymous');

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
                    className={`px-4 py-2 shadow-md cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group relative ${isOwn
                        ? (isAnonymous ? 'bg-gray-600 text-white' : 'bg-blue-600 text-white')
                        : message.type === 'panic'
                          ? 'bg-red-700 text-white border border-red-600'
                          : 'bg-gray-700 text-gray-100'
                      } ${getBorderRadiusClass(isOwn, isFirstInGroup, isLastInGroup)
                      } ${replyingTo?.id === message.id ? 'ring-2 ring-blue-400 ring-opacity-70 shadow-lg shadow-blue-500/25' : ''}
                      ${longPressMessage?.id === message.id ? 'scale-105 ring-2 ring-yellow-400 ring-opacity-70' : ''}`}
                    style={{
                      transform: swipeMessage?.id === message.id ? `translateX(-${swipeOffset}px)` : 'translateX(0)',
                      transition: isSwiping ? 'none' : 'transform 0.3s ease-out'
                    }}
                    onClick={() => handlePickReply(message)}
                    onDoubleClick={() => handlePickReply(message)}
                    onContextMenu={(e) => { e.preventDefault(); handlePickReply(message); }}
                    onMouseDown={() => handleMessageMouseDown(message)}
                    onMouseUp={handleMessageMouseUp}
                    onMouseLeave={handleMessageMouseLeave}
                    onTouchStart={(e) => handleSwipeStart(message, e)}
                    onTouchMove={(e) => e.preventDefault()}
                    onTouchEnd={(e) => e.preventDefault()}
                    title={replyingTo?.id === message.id ? tChat('clickToDeselect') : tChat('swipeLongPressDoubleClick')}
                  >
                    {/* Indicador de que es clickeable */}
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="w-2 h-2 bg-current opacity-60 rounded-full"></div>
                    </div>

                    {/* Indicador de long press activo */}
                    {longPressMessage?.id === message.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 bg-yellow-400/10 rounded-lg flex items-center justify-center pointer-events-none"
                      >
                        <motion.div
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          className="bg-yellow-500 text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-lg"
                        >
                          {tChat('responder')}
                        </motion.div>
                      </motion.div>
                    )}

                    {/* Indicador de swipe activo */}
                    {swipeMessage?.id === message.id && swipeOffset > 20 && (
                      <div className="absolute -left-16 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-16 h-16 bg-green-500 rounded-full shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </div>
                    )}

                    {/* Mensaje de ayuda para swipe */}
                    {swipeMessage?.id === message.id && swipeOffset > 40 && (
                      <div className="absolute -left-32 top-1/2 transform -translate-y-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded-lg shadow-lg whitespace-nowrap">
                        {tChat('responder')}
                      </div>
                    )}
                    {/* Barra de progreso del swipe */}
                    {swipeMessage?.id === message.id && (
                      <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-green-600 rounded-full opacity-60">
                        <div
                          className="bg-green-300 rounded-full transition-all duration-200"
                          style={{
                            height: `${Math.min(100, (swipeOffset / 100) * 100)}%`,
                            opacity: swipeOffset > 0 ? 1 : 0
                          }}
                        />
                      </div>
                    )}
                    {/* Cita */}
                    {message.metadata?.replyTo && (
                      <div className={`mb-2 px-2 py-1 rounded ${isOwn ? 'bg-blue-500/40' : 'bg-gray-600/50'}`}>
                        <span className="text-xs font-semibold">{message.metadata.replyTo.userName}</span>
                        <div className="text-xs opacity-80 truncate">{message.metadata.replyTo.snippet}</div>
                      </div>
                    )}
                    {message.type === 'panic' ? (
                      <>
                        <span className="font-semibold">{tChat('panicAlert')}</span>
                        <br />
                        <span className="text-sm">
                          {message.metadata?.address || tChat('gpsLocationNotAvailable')}
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
      <div className="bg-gray-900/95 backdrop-blur-md border-t border-gray-800/50 px-4 py-2 flex flex-col space-y-2">
        {replyingTo && (
          <div className="flex items-center justify-between px-3 py-2 bg-blue-600/20 rounded-md border border-blue-500/40">
            <div className="text-xs">
              <span className="text-blue-300">{tChat('replyingTo')} </span>
              <span className="text-blue-200 font-semibold">{replyingTo.userName}</span>
              <div className="text-blue-100 truncate max-w-[240px]">{replyingTo.message}</div>
            </div>
            <button
              onClick={clearReply}
              className="text-blue-300 hover:text-white text-xs p-1 rounded-full hover:bg-blue-500/30 transition-colors"
              title={tChat('cancelReply')}
            >
              ✕
            </button>
          </div>
        )}
        <div className="flex items-center space-x-2">
          {/* Menú desplegable con 3 puntitos */}
          <div className="relative menu-container">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="h-12 w-12 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-200 flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {/* Menú desplegable */}
            {showMenu && (
              <div className="absolute bottom-0 left-full ml-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700/50 z-50">
                <div className="py-2">
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors flex items-center space-x-3">
                    <FiUser className="w-4 h-4" />
                    <span>{tChat('viewProfile')}</span>
                  </button>

                  <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors flex items-center space-x-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{tChat('settings')}</span>
                  </button>
                  <div className="border-t border-gray-700/50 my-1"></div>
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors flex items-center space-x-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{tChat('help')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Contenedor del textarea con botón de incógnito integrado */}
          <div className="flex-1 relative h-12">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
              }}
              onKeyPress={handleKeyPress}
              placeholder={anonymous ? `${tChat('writeMessage')} (${tChat('incognitoModeActive')})` : tChat('writeMessage')}
              className="w-full h-12 px-12 py-3 bg-gray-800 rounded-lg text-white resize-none scrollbar-hide outline-none text-sm leading-6"
            />

            {/* Botón de modo incógnito integrado en el textarea */}
            <button
              onClick={() => setAnonymous(!anonymous)}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 p-1 rounded-md hover:bg-gray-700/50 transition-colors z-10"
              title={anonymous ? tChat('deactivateIncognitoMode') : tChat('activateIncognitoMode')}
            >
              {anonymous ? (
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <FiUser className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
         <button
           onClick={handleSendMessage}
           disabled={!newMessage.trim() || isSending}
           className="h-12 w-12 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex-shrink-0 flex items-center justify-center"
         >
           <FiSend className="w-5 h-5" />
         </button>
        </div>
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
              <h2 className="text-lg font-semibold text-white">{tChat('participants')}</h2>
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
                    <p className="text-sm text-gray-400">{t('block')} {participant.blockNumber}, {t('lot')} {participant.lotNumber}</p>
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
