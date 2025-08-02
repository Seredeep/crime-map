'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { simpleChatCache } from '../services/chat/chatCache';
import { OnlineUser, TypingUser, chatServiceOptimized } from '../services/chat/chatServiceOptimized';
import { Message } from '../services/chat/types';

export function useChatOptimized() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheStats, setCacheStats] = useState<any>({});

  // Refs para manejar typing y optimizar renders
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const lastMessageCountRef = useRef(0);
  const lastTypingHashRef = useRef('');
  const lastOnlineHashRef = useRef('');

  // Memoizar funciones para evitar re-renders innecesarios
  const handleNewMessages = useCallback((newMessages: Message[]) => {
    setMessages(prev => {
      // Verificar si realmente hay cambios
      if (newMessages.length === 0) return prev;

      // Si es la primera carga, reemplazar todo
      if (prev.length === 0) {
        lastMessageCountRef.current = newMessages.length;
        return newMessages;
      }

      // Para actualizaciones incrementales, agregar solo nuevos mensajes
      const existingIds = new Set(prev.map(m => m.id));
      const uniqueNewMessages = newMessages.filter(m => !existingIds.has(m.id));

      if (uniqueNewMessages.length > 0) {
        const combined = [...prev, ...uniqueNewMessages].sort((a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        lastMessageCountRef.current = combined.length;
        return combined;
      }

      return prev;
    });
  }, []);

  const handleTypingUpdate = useCallback((users: TypingUser[]) => {
    const hash = JSON.stringify(users.map(u => u.userId).sort());

    // Solo actualizar si hay cambios reales
    if (hash !== lastTypingHashRef.current) {
      lastTypingHashRef.current = hash;
      setTypingUsers(users);
    }
  }, []);

  const handleOnlineUpdate = useCallback((users: OnlineUser[]) => {
    const hash = JSON.stringify(users.map(u => u.userId).sort());

    // Solo actualizar si hay cambios reales
    if (hash !== lastOnlineHashRef.current) {
      lastOnlineHashRef.current = hash;
      setOnlineUsers(users);
    }
  }, []);

  // Inicializar servicio con caché
  useEffect(() => {
    if (session?.user?.id && session?.user?.name) {
      const initialize = async () => {
        try {
          setLoading(true);
          setError(null);

          console.log('🚀 Initializing optimized chat with cache...');

          await chatServiceOptimized.initialize(
            session.user.id,
            session.user.name || session.user.email || 'Usuario'
          );

          // Configurar callbacks optimizados
          chatServiceOptimized.onMessages(handleNewMessages);
          chatServiceOptimized.onTyping(handleTypingUpdate);
          chatServiceOptimized.onOnline(handleOnlineUpdate);

          // Actualizar estadísticas del caché
          setCacheStats(chatServiceOptimized.getCacheStats());

          setLoading(false);

        } catch (err) {
          console.error('Error initializing optimized chat:', err);
          setError('Error al inicializar el chat');
          setLoading(false);
        }
      };

      initialize();

      // Actualizar estadísticas del caché cada 30 segundos
      const statsInterval = setInterval(() => {
        setCacheStats(chatServiceOptimized.getCacheStats());
      }, 30000);

      // Cleanup al desmontar
      return () => {
        chatServiceOptimized.cleanup();
        clearInterval(statsInterval);
      };
    }
  }, [session?.user?.id, session?.user?.name, session?.user?.email, handleNewMessages, handleTypingUpdate, handleOnlineUpdate]);

  // Enviar mensaje optimizado
  const sendMessage = useCallback(async (message: string, type: 'normal' | 'panic' = 'normal') => {
    if (!message.trim()) return;

    try {
      // Marcar actividad inmediatamente
      chatServiceOptimized.markActivity();

      // Detener typing si estaba escribiendo
      if (isTypingRef.current) {
        await chatServiceOptimized.stopTyping();
        isTypingRef.current = false;
      }

      // Enviar mensaje
      const result = await chatServiceOptimized.sendMessage(message, type);

      // Actualizar estadísticas
      setCacheStats(chatServiceOptimized.getCacheStats());

      return result;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Error al enviar mensaje');
      return null;
    }
  }, []);

  // Manejar typing optimizado
  const handleTyping = useCallback(async () => {
    try {
      if (!isTypingRef.current) {
        await chatServiceOptimized.startTyping();
        isTypingRef.current = true;
      }

      // Resetear timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Detener typing después de 3 segundos de inactividad
      typingTimeoutRef.current = setTimeout(async () => {
        if (isTypingRef.current) {
          await chatServiceOptimized.stopTyping();
          isTypingRef.current = false;
        }
      }, 3000);

      // Marcar actividad
      chatServiceOptimized.markActivity();
    } catch (err) {
      console.error('Error handling typing:', err);
    }
  }, []);

  // Detener typing manualmente
  const stopTyping = useCallback(async () => {
    try {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (isTypingRef.current) {
        await chatServiceOptimized.stopTyping();
        isTypingRef.current = false;
      }
    } catch (err) {
      console.error('Error stopping typing:', err);
    }
  }, []);

  // Marcar actividad del usuario
  const markActivity = useCallback(() => {
    chatServiceOptimized.markActivity();
  }, []);

  // Limpiar caché manualmente
  const clearCache = useCallback((type?: 'messages' | 'chatInfo' | 'typing' | 'online' | 'all') => {
    simpleChatCache.clearCache(type);
    setCacheStats(chatServiceOptimized.getCacheStats());
    console.log(`🗑️ Cache cleared: ${type || 'all'}`);
  }, []);

  // Estadísticas memoizadas
  const stats = useMemo(() => ({
    messageCount: messages.length,
    typingCount: typingUsers.length,
    onlineCount: onlineUsers.length,
    cacheStats,
    isConnected: !loading && !error
  }), [messages.length, typingUsers.length, onlineUsers.length, cacheStats, loading, error]);

  // Información de typing formateada
  const typingInfo = useMemo(() => {
    if (typingUsers.length === 0) return null;

    if (typingUsers.length === 1) {
      return `${typingUsers[0].userName} está escribiendo...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].userName} y ${typingUsers[1].userName} están escribiendo...`;
    } else {
      return `${typingUsers[0].userName} y ${typingUsers.length - 1} más están escribiendo...`;
    }
  }, [typingUsers]);

  return {
    // Datos principales
    messages,
    typingUsers,
    onlineUsers,
    loading,
    error,

    // Funciones principales
    sendMessage,
    handleTyping,
    stopTyping,
    markActivity,

    // Utilidades
    clearCache,
    stats,
    typingInfo,

    // Estado del caché
    cacheStats
  };
}
