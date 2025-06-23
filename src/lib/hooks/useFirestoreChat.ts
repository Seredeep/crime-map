import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FirestoreMessage, TypingIndicator, firestoreChatService } from '../firestoreChatService';

interface ChatData {
  messages: FirestoreMessage[];
  chatId: string;
  isLoading: boolean;
}

interface UseFirestoreChatOptions {
  chatId?: string;
  messageLimit?: number;
  enabled?: boolean;
}

interface UseFirestoreChatReturn {
  chatData: ChatData;
  typingUsers: TypingIndicator[];
  isConnected: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<boolean>;
  sendPanicMessage: (message: string, location?: { lat: number; lng: number }, alertType?: string) => Promise<boolean>;
  startTyping: () => Promise<void>;
  stopTyping: () => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  refresh: () => void;
}

export const useFirestoreChat = (options: UseFirestoreChatOptions = {}): UseFirestoreChatReturn => {
  const { data: session } = useSession();
  const {
    chatId = 'default-neighborhood-chat',
    messageLimit = 50,
    enabled = true
  } = options;

  // Estados
  const [chatData, setChatData] = useState<ChatData>({
    messages: [],
    chatId,
    isLoading: true
  });
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  // Referencias para limpieza
  const messagesUnsubscribeRef = useRef<(() => void) | null>(null);
  const typingUnsubscribeRef = useRef<(() => void) | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Limpiar suscripciones
  const cleanup = useCallback(() => {
    try {
      messagesUnsubscribeRef.current?.();
    } catch (e) {
      console.warn('🧹 Error limpiando mensajes', e);
    }

    if (messagesUnsubscribeRef.current) {
      messagesUnsubscribeRef.current();
      messagesUnsubscribeRef.current = null;
    }
    if (typingUnsubscribeRef.current) {
      typingUnsubscribeRef.current();
      typingUnsubscribeRef.current = null;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (cleanupIntervalRef.current) {
      clearInterval(cleanupIntervalRef.current);
      cleanupIntervalRef.current = null;
    }


  }, []);

  // Inicializar suscripciones
  const initializeSubscriptions = useCallback(() => {
    if (!enabled || !session?.user) return;

    // Evitar múltiples suscripciones simultáneas
    if (messagesUnsubscribeRef.current) {
      return;
    }

    cleanup();

    try {
      // Usar directamente el fallback de API sin intentar Firebase
      messagesUnsubscribeRef.current = firestoreChatService.subscribeToMessages(
        chatId,
        (messages) => {
          setChatData(prev => ({
            ...prev,
            messages: messages.map(msg => ({
              ...msg,
              isOwn: msg.userId === session.user?.id || msg.userName === session.user?.name
            })),
            isLoading: false
          }));
          setIsConnected(true);
          setError(null);
        },
        messageLimit
      );

      // No intentar indicadores de escritura en modo API
      setTypingUsers([]);

    } catch (err) {
      console.error('❌ Error inicializando desde API:', err);
      setError('Error conectando con el chat');
      setIsConnected(false);
    }
  }, [enabled, session, chatId, messageLimit]);

  // Enviar mensaje
  const sendMessage = useCallback(async (message: string): Promise<boolean> => {
    if (!session?.user || !message.trim()) return false;

    try {
      // Detener indicador de escritura
      await stopTyping();

      const success = await firestoreChatService.sendMessage(
        chatId,
        session.user.id || session.user.email || '',
        session.user.name || 'Usuario',
        message.trim()
      );

      if (success) {
        // Mensaje enviado correctamente
      } else {
        console.error('❌ Error enviando mensaje');
        setError('Error enviando mensaje');
      }

      return success;
    } catch (err) {
      console.error('❌ Error enviando mensaje:', err);
      setError('Error enviando mensaje');
      return false;
    }
  }, [session, chatId]);

  // Enviar mensaje de pánico
  const sendPanicMessage = useCallback(async (
    message: string,
    location?: { lat: number; lng: number },
    alertType?: string
  ): Promise<boolean> => {
    if (!session?.user || !message.trim()) return false;

    try {
      const success = await firestoreChatService.sendPanicMessage(
        chatId,
        session.user.id || session.user.email || '',
        session.user.name || 'Usuario',
        message.trim(),
        location,
        alertType
      );

      if (success) {
        console.log('🚨 Mensaje de pánico enviado correctamente');
      } else {
        console.error('❌ Error enviando mensaje de pánico');
        setError('Error enviando mensaje de pánico');
      }

      return success;
    } catch (err) {
      console.error('❌ Error enviando mensaje de pánico:', err);
      setError('Error enviando mensaje de pánico');
      return false;
    }
  }, [session, chatId]);

  // Iniciar indicador de escritura
  const startTyping = useCallback(async (): Promise<void> => {
    if (!session?.user) return;

    try {
      await firestoreChatService.startTyping(
        chatId,
        session.user.id || session.user.email || '',
        session.user.name || 'Usuario'
      );

      // Auto-detener después de 10 segundos
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(stopTyping, 10000);
    } catch (err) {
      console.error('❌ Error iniciando indicador de escritura:', err);
    }
  }, [session, chatId]);

  // Detener indicador de escritura
  const stopTyping = useCallback(async (): Promise<void> => {
    if (!session?.user) return;

    try {
      await firestoreChatService.stopTyping(
        chatId,
        session.user.id || session.user.email || ''
      );

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    } catch (err) {
      // Silenciar errores de permisos en modo demo
      if (err instanceof Error && err.message.includes('Missing or insufficient permissions')) {
        console.log('🔇 Modo demo: ignorando error de permisos de escritura');
      } else {
        console.error('❌ Error deteniendo indicador de escritura:', err);
      }
    }
  }, [session, chatId]);

  // Cargar más mensajes (paginación)
  const loadMoreMessages = useCallback(async (): Promise<void> => {
    if (!hasMoreMessages || chatData.isLoading) return;

    try {
      const oldestMessage = chatData.messages[0];
      if (!oldestMessage) return;

      const olderMessages = await firestoreChatService.getHistoricalMessages(
        chatId,
        oldestMessage.timestamp,
        20
      );

      if (olderMessages.length === 0) {
        setHasMoreMessages(false);
        return;
      }

      setChatData(prev => ({
        ...prev,
        messages: [
          ...olderMessages.map(msg => ({
            ...msg,
            isOwn: msg.userId === session?.user?.id || msg.userName === session?.user?.name
          })),
          ...prev.messages
        ]
      }));

      console.log(`📚 Cargados ${olderMessages.length} mensajes adicionales`);
    } catch (err) {
      console.error('❌ Error cargando más mensajes:', err);
      setError('Error cargando mensajes anteriores');
    }
  }, [chatData.messages, chatData.isLoading, hasMoreMessages, chatId, session]);

  // Refrescar chat
  const refresh = useCallback(() => {
    console.log('🔄 Refrescando chat...');
    cleanup();
    setChatData(prev => ({ ...prev, isLoading: true, messages: [] }));
    setTypingUsers([]);
    setError(null);
    setHasMoreMessages(true);
    setTimeout(initializeSubscriptions, 100);
  }, [cleanup, initializeSubscriptions]);

  // Efectos
  useEffect(() => {
    initializeSubscriptions();
    return cleanup;
  }, [initializeSubscriptions, cleanup]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      stopTyping();
      cleanup();
    };
  }, [stopTyping, cleanup]);

  return {
    chatData,
    typingUsers,
    isConnected,
    error,
    sendMessage,
    sendPanicMessage,
    startTyping,
    stopTyping,
    loadMoreMessages,
    refresh
  };
};
