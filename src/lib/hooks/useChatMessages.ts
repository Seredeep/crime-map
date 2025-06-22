'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useRef, useState } from 'react';

// Importar WebSocket solo si está disponible
let socketService: any = null;
let chatCache: any = null;

try {
  socketService = require('../socket').default;
} catch (error) {
  console.warn('⚠️ WebSocket no disponible, usando solo polling');
}

try {
  chatCache = require('../chatCache').default;
} catch (error) {
  console.warn('⚠️ Cache no disponible');
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'normal' | 'panic';
  isOwn: boolean;
  metadata: Record<string, any>;
}

export interface ChatData {
  messages: ChatMessage[];
  hasMore: boolean;
  total: number;
  chatId: string;
  neighborhood: string;
}

interface UseChatMessagesOptions {
  pollingInterval?: number;
  enabled?: boolean;
  useWebSockets?: boolean;
}

export const useChatMessages = (options: UseChatMessagesOptions = {}) => {
  const { pollingInterval = 3000, enabled = true, useWebSockets = true } = options;
  const { data: session } = useSession();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatData, setChatData] = useState<Partial<ChatData>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ [userId: string]: string }>({});

  const lastMessageIdRef = useRef<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);
  const socketConnectedRef = useRef(false);
  const currentUserRef = useRef<{ id: string; name: string } | null>(null);
  const chatIdRef = useRef<string | null>(null);
  const cacheLoadedRef = useRef(false);

  // Cargar mensajes desde cache si está disponible
  const loadFromCache = useCallback((chatId: string) => {
    if (!chatCache) return false;

    try {
      const cached = chatCache.get(chatId);
      if (cached) {
        console.log('📦 Cargando mensajes desde cache:', cached.messages.length, 'mensajes');
        setMessages(cached.messages);
        lastMessageIdRef.current = cached.lastMessageId;
        setChatData({
          hasMore: true,
          total: cached.total,
          chatId: cached.chatId,
          neighborhood: ''
        });
        cacheLoadedRef.current = true;
        return true;
      }
    } catch (error) {
      console.warn('⚠️ Error cargando cache:', error);
    }
    return false;
  }, []);

  // Función para obtener mensajes via HTTP
  const fetchMessages = useCallback(async (isPolling = false) => {
    if (!enabled) return;

    console.log('🔄 fetchMessages llamado:', { isPolling, cacheLoaded: cacheLoadedRef.current });

    try {
      // Intentar cargar desde cache primero (solo en carga inicial)
      if (!isPolling && chatIdRef.current && !cacheLoadedRef.current) {
        const cacheLoaded = loadFromCache(chatIdRef.current);
        if (cacheLoaded) {
          setLoading(false);
          // Continuar con la carga desde servidor en segundo plano
          setTimeout(() => fetchMessages(true), 100);
          return;
        }
      }

      if (!isPolling && !cacheLoadedRef.current) {
        setLoading(true);
        setError(null);
      }

      const url = new URL('/api/chat/messages', window.location.origin);
      if (isPolling && lastMessageIdRef.current) {
        url.searchParams.set('lastMessageId', lastMessageIdRef.current);
      }

      const response = await fetch(url.toString());
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Error al obtener mensajes');
      }

      const newMessages = result.data.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
        // Fix: Use session email/name for more reliable ownership detection
        isOwn: msg.userId === currentUserRef.current?.id ||
               (session?.user?.name && msg.userName === session.user.name) ||
               (session?.user?.email && msg.userEmail === session.user.email)
      }));

      console.log('📨 Mensajes obtenidos del servidor:', newMessages.length);

      if (isPolling && newMessages.length > 0) {
        // Agregar solo mensajes nuevos
        setMessages(prev => {
          const updated = [...prev, ...newMessages];
          // Actualizar cache si está disponible
          if (chatCache && chatIdRef.current) {
            try {
              chatCache.append(chatIdRef.current, newMessages, newMessages[newMessages.length - 1].id);
            } catch (error) {
              console.warn('⚠️ Error actualizando cache:', error);
            }
          }
          return updated;
        });
        lastMessageIdRef.current = newMessages[newMessages.length - 1].id;
      } else if (!isPolling) {
        // Manejo de carga inicial
        if (cacheLoadedRef.current) {
          // Si ya cargamos desde cache, solo agregar mensajes nuevos
          setMessages(prev => {
            const cachedIds = new Set(prev.map((msg: ChatMessage) => msg.id));
            const newUniqueMessages = newMessages.filter((msg: ChatMessage) => !cachedIds.has(msg.id));
            if (newUniqueMessages.length > 0) {
              const updated = [...prev, ...newUniqueMessages];
              // Actualizar cache
              if (chatCache && chatIdRef.current) {
                try {
                  chatCache.set(chatIdRef.current, updated, lastMessageIdRef.current, result.data.total);
                } catch (error) {
                  console.warn('⚠️ Error guardando en cache:', error);
                }
              }
              return updated;
            }
            return prev;
          });
        } else {
          // Carga inicial completa
          setMessages(newMessages);
          // Guardar en cache si está disponible
          if (chatCache && chatIdRef.current) {
            try {
              chatCache.set(chatIdRef.current, newMessages, lastMessageIdRef.current, result.data.total);
            } catch (error) {
              console.warn('⚠️ Error guardando en cache:', error);
            }
          }
        }

        if (newMessages.length > 0) {
          lastMessageIdRef.current = newMessages[newMessages.length - 1].id;
        }
      }

      setChatData({
        hasMore: result.data.hasMore,
        total: result.data.total,
        chatId: result.data.chatId,
        neighborhood: result.data.neighborhood
      });

      chatIdRef.current = result.data.chatId;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error al obtener mensajes:', err);
    } finally {
      if (!isPolling) {
        setLoading(false);
      }
    }
  }, [enabled, loadFromCache]);

  // Configurar WebSocket si está disponible
  const setupWebSocket = useCallback(async () => {
    if (!useWebSockets || !socketService || !session?.user?.email || socketConnectedRef.current) return;

    try {
      // Obtener información del usuario actual
      const userResponse = await fetch('/api/chat/mine');
      const userResult = await userResponse.json();

      if (!userResult.success || !userResult.data) {
        console.log('Usuario no tiene chat asignado, usando polling');
        return;
      }

      const userData = userResult.data;
      currentUserRef.current = {
        id: userData.userId,
        name: userData.userName
      };
      chatIdRef.current = userData.chatId;

      // Conectar WebSocket
      const socket = socketService.connect(userData.userId);

      // Configurar event listeners
      socket.on('connect', () => {
        console.log('✅ WebSocket conectado');
        setIsConnected(true);
        socketConnectedRef.current = true;

        // Unirse al chat
        if (chatIdRef.current && currentUserRef.current) {
          socketService.joinChat(chatIdRef.current, currentUserRef.current.id);
        }

        // Detener polling si está activo
        stopPolling();
      });

      socket.on('disconnect', () => {
        console.log('❌ WebSocket desconectado');
        setIsConnected(false);
        socketConnectedRef.current = false;

        // Reanudar polling como fallback
        startPolling();
      });

      socket.on('message:new', (message: any) => {
        const formattedMessage = {
          ...message,
          timestamp: new Date(message.timestamp),
          // Fix: Use session email/name for more reliable ownership detection
          isOwn: message.userId === currentUserRef.current?.id ||
                 (session?.user?.name && message.userName === session.user.name) ||
                 (session?.user?.email && message.userEmail === session.user.email)
        };

        setMessages(prev => {
          // Evitar duplicados con verificación más robusta
          const isDuplicate = prev.some(msg =>
            msg.id === formattedMessage.id ||
            (msg.message === formattedMessage.message &&
             msg.userId === formattedMessage.userId &&
             Math.abs(new Date(msg.timestamp).getTime() - new Date(formattedMessage.timestamp).getTime()) < 1000)
          );

          if (isDuplicate) {
            console.log('🔄 Mensaje duplicado detectado, ignorando:', formattedMessage.id);
            return prev;
          }

          const updated = [...prev, formattedMessage];

          // Actualizar cache si está disponible
          if (chatCache && chatIdRef.current) {
            try {
              chatCache.append(chatIdRef.current, [formattedMessage], formattedMessage.id);
            } catch (error) {
              console.warn('⚠️ Error actualizando cache:', error);
            }
          }

          return updated;
        });

        lastMessageIdRef.current = formattedMessage.id;
      });

      socket.on('panic:alert', (message: any) => {
        const formattedMessage = {
          ...message,
          timestamp: new Date(message.timestamp),
          // Fix: Use session email/name for more reliable ownership detection
          isOwn: message.userId === currentUserRef.current?.id ||
                 (session?.user?.name && message.userName === session.user.name) ||
                 (session?.user?.email && message.userEmail === session.user.email)
        };

        setMessages(prev => {
          // Evitar duplicados con verificación más robusta
          const isDuplicate = prev.some(msg =>
            msg.id === formattedMessage.id ||
            (msg.message === formattedMessage.message &&
             msg.userId === formattedMessage.userId &&
             msg.type === 'panic' &&
             Math.abs(new Date(msg.timestamp).getTime() - new Date(formattedMessage.timestamp).getTime()) < 1000)
          );

          if (isDuplicate) {
            console.log('🚨 Mensaje de pánico duplicado detectado, ignorando:', formattedMessage.id);
            return prev;
          }

          const updated = [...prev, formattedMessage];

          // Actualizar cache si está disponible
          if (chatCache && chatIdRef.current) {
            try {
              chatCache.append(chatIdRef.current, [formattedMessage], formattedMessage.id);
            } catch (error) {
              console.warn('⚠️ Error actualizando cache:', error);
            }
          }

          return updated;
        });

        lastMessageIdRef.current = formattedMessage.id;
      });

      socket.on('chat:typing', ({ userId, userName }: { userId: string; userName: string }) => {
        if (userId !== currentUserRef.current?.id) {
          setTypingUsers(prev => ({ ...prev, [userId]: userName }));
        }
      });

      socket.on('chat:stop-typing', ({ userId }: { userId: string }) => {
        setTypingUsers(prev => {
          const newTyping = { ...prev };
          delete newTyping[userId];
          return newTyping;
        });
      });

      socket.on('message:error', (error: string) => {
        setError(error);
        console.error('Error del WebSocket:', error);
      });

    } catch (error) {
      console.error('Error al configurar WebSocket:', error);
      // Usar polling como fallback
      startPolling();
    }
  }, [useWebSockets, session?.user?.email]);

  // Función para enviar mensaje
  const sendMessage = useCallback(async (message: string) => {
    try {
      if (useWebSockets && socketService?.connected && chatIdRef.current && currentUserRef.current) {
        // Enviar via WebSocket
        const result = await socketService.sendMessage(
          chatIdRef.current,
          message,
          currentUserRef.current.id,
          currentUserRef.current.name
        );
        return result;
      } else {
        // Enviar via HTTP (fallback)
        const response = await fetch('/api/chat/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Error al enviar mensaje');
        }

        const newMessage = {
          ...result.data,
          timestamp: new Date(result.data.timestamp),
          isOwn: true
        };

        // Agregar mensaje inmediatamente al estado local y cache
        setMessages(prev => {
          const updated = [...prev, newMessage];
          if (chatCache && chatIdRef.current) {
            try {
              chatCache.append(chatIdRef.current, [newMessage], newMessage.id);
            } catch (error) {
              console.warn('⚠️ Error actualizando cache:', error);
            }
          }
          return updated;
        });
        lastMessageIdRef.current = newMessage.id;

        return newMessage;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al enviar mensaje';
      setError(errorMessage);
      throw err;
    }
  }, [useWebSockets]);

  // Función para enviar mensaje de pánico
  const sendPanicMessage = useCallback(async (message: string, location?: { lat: number; lng: number }) => {
    try {
      if (useWebSockets && socketService?.connected && chatIdRef.current && currentUserRef.current) {
        // Enviar via WebSocket
        const result = await socketService.sendPanicMessage(
          chatIdRef.current,
          message,
          currentUserRef.current.id,
          currentUserRef.current.name,
          location
        );
        return result;
      } else {
        // Enviar via HTTP (fallback)
        const response = await fetch('/api/chat/panic-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message, location }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Error al enviar mensaje de pánico');
        }

        const newMessage = {
          ...result.data,
          timestamp: new Date(result.data.timestamp),
          isOwn: true
        };

        setMessages(prev => {
          const updated = [...prev, newMessage];
          if (chatCache && chatIdRef.current) {
            try {
              chatCache.append(chatIdRef.current, [newMessage], newMessage.id);
            } catch (error) {
              console.warn('⚠️ Error actualizando cache:', error);
            }
          }
          return updated;
        });
        lastMessageIdRef.current = newMessage.id;

        return newMessage;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al enviar mensaje de pánico';
      setError(errorMessage);
      throw err;
    }
  }, [useWebSockets]);

  // Funciones de indicador de escritura
  const startTyping = useCallback(() => {
    if (useWebSockets && socketService?.connected && chatIdRef.current && currentUserRef.current) {
      try {
        socketService.startTyping(chatIdRef.current, currentUserRef.current.id, currentUserRef.current.name);
      } catch (error) {
        console.warn('⚠️ Error enviando indicador de escritura:', error);
      }
    }
  }, [useWebSockets]);

  const stopTyping = useCallback(() => {
    if (useWebSockets && socketService?.connected && chatIdRef.current && currentUserRef.current) {
      try {
        socketService.stopTyping(chatIdRef.current, currentUserRef.current.id);
      } catch (error) {
        console.warn('⚠️ Error deteniendo indicador de escritura:', error);
      }
    }
  }, [useWebSockets]);

  // Iniciar polling (fallback)
  const startPolling = useCallback(() => {
    if (pollingRef.current || !enabled || (useWebSockets && socketConnectedRef.current)) return;

    console.log('📡 Iniciando polling cada', pollingInterval, 'ms');
    pollingRef.current = setInterval(() => {
      if (!isPollingRef.current) {
        isPollingRef.current = true;
        fetchMessages(true).finally(() => {
          isPollingRef.current = false;
        });
      }
    }, pollingInterval);
  }, [fetchMessages, pollingInterval, enabled, useWebSockets]);

  // Detener polling
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      console.log('🛑 Deteniendo polling');
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Refrescar mensajes manualmente
  const refresh = useCallback(() => {
    lastMessageIdRef.current = null;
    cacheLoadedRef.current = false;
    if (chatCache && chatIdRef.current) {
      try {
        chatCache.remove(chatIdRef.current);
      } catch (error) {
        console.warn('⚠️ Error limpiando cache:', error);
      }
    }
    return fetchMessages(false);
  }, [fetchMessages]);

  // Cargar mensajes más antiguos (paginación)
  const loadMoreMessages = useCallback(async () => {
    if (!chatData.hasMore || loading) return;

    try {
      setLoading(true);
      const url = new URL('/api/chat/messages', window.location.origin);
      url.searchParams.set('before', messages[0]?.id || '');
      url.searchParams.set('limit', '20');

      const response = await fetch(url.toString());
      const result = await response.json();

      if (result.success) {
        const olderMessages = result.data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
          isOwn: msg.userId === currentUserRef.current?.id
        }));

        setMessages(prev => {
          const updated = [...olderMessages, ...prev];
          // Actualizar cache con mensajes antiguos
          if (chatCache && chatIdRef.current) {
            try {
              chatCache.prepend(chatIdRef.current, olderMessages);
            } catch (error) {
              console.warn('⚠️ Error actualizando cache:', error);
            }
          }
          return updated;
        });
        setChatData(prev => ({ ...prev, hasMore: result.data.hasMore }));
      }
    } catch (error) {
      console.error('Error al cargar mensajes antiguos:', error);
    } finally {
      setLoading(false);
    }
  }, [chatData.hasMore, loading, messages]);

    // Efecto principal
  useEffect(() => {
    if (enabled && session?.user?.email) {
      console.log('🚀 Iniciando sistema de chat...');

      // Limpiar estado previo
      setMessages([]);
      setError(null);
      setLoading(true);
      lastMessageIdRef.current = null;
      cacheLoadedRef.current = false;

      // Cargar mensajes iniciales
      fetchMessages(false).then(() => {
        if (useWebSockets && socketService) {
          // Intentar conectar WebSocket
          setupWebSocket();
        } else {
          // Usar solo polling
          console.log('📡 WebSockets no disponibles, usando polling');
          startPolling();
        }
      });
    }

    return () => {
      stopPolling();
      if (socketService?.connected) {
        try {
          if (chatIdRef.current && currentUserRef.current) {
            socketService.leaveChat(chatIdRef.current, currentUserRef.current.id);
          }
          socketService.disconnect();
        } catch (error) {
          console.warn('⚠️ Error desconectando WebSocket:', error);
        }
      }
    };
  }, [enabled, session?.user?.email, useWebSockets, fetchMessages, setupWebSocket, startPolling, stopPolling]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      stopPolling();
      if (socketService) {
        try {
          socketService.disconnect();
        } catch (error) {
          console.warn('⚠️ Error limpiando WebSocket:', error);
        }
      }
    };
  }, [stopPolling]);

  return {
    messages,
    loading,
    error,
    chatData,
    isConnected: socketService ? isConnected : false,
    typingUsers: Object.values(typingUsers),
    sendMessage,
    sendPanicMessage,
    startTyping,
    stopTyping,
    refresh,
    loadMoreMessages,
    startPolling,
    stopPolling
  };
};
