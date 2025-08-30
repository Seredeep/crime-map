'use client';

import { firestoreClient } from '@/lib/config/firebase-client';
import { collection, limit as fsLimit, onSnapshot, orderBy, query, where, type DocumentData, type QuerySnapshot } from 'firebase/firestore';
import { AnimatePresence, PanInfo, motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FiAlertTriangle, FiArrowLeft, FiMic, FiPaperclip, FiSend, FiUser, FiUsers } from 'react-icons/fi';
import NotificationToaster from '../../lib/components/NotificationToaster';
import { useNotificationsStore } from '../../lib/contexts/notificationsStore';
import { MessageMetadata } from '../../lib/types/global';
import AudioRecorder from './AudioRecorder';
import LazyImage from './LazyImage';
import LocationPicker from './LocationPicker';
import LocationPreview from './LocationPreview';
import MediaPicker from './MediaPicker';

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
  chatId: string;
  neighborhood: string;
  participants: ChatParticipant[];
}

interface Message {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'normal' | 'panic' | 'system' | 'incident';
  isOwn: boolean;
  metadata?: MessageMetadata;
  senderProfileImage?: string;
}

const MobileFullScreenChatView = ({ onBack, className = '' }: MobileFullScreenChatViewProps) => {
  const { data: session } = useSession();
  const t = useTranslations('States');
  const tErrors = useTranslations('Errors');
  const tChat = useTranslations('Chat');
  const [chat, setChat] = useState<ChatInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<Date | null>(null);

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
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showLocationPreview, setShowLocationPreview] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    hasMore: true,
    isLoading: false
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Track seen messages to detect new arrivals for in-app notifications
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const addNotification = useNotificationsStore((s) => s.add);
  // Usar dependencias estables para evitar re-renders por sesión
  const userId = session?.user?.id ?? null;
  // Guards y throttling
  const isFetchingChatRef = useRef(false);
  const lastChatFetchAtRef = useRef(0);
  const isFetchingMessagesRef = useRef(false);
  const lastMessagesFetchAtRef = useRef(0);
  const initializedRef = useRef(false);

  const loadChatInfo = useCallback(async () => {
    if (!userId) return;

    try {
      // Throttle cada 60s
      const now = Date.now();
      if (now - lastChatFetchAtRef.current < 60000) return;
      if (isFetchingChatRef.current) return;
      isFetchingChatRef.current = true;
      const response = await fetch('/api/chat/my-chat');

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
    } finally {
      isFetchingChatRef.current = false;
      lastChatFetchAtRef.current = Date.now();
    }
  }, [userId, tErrors]);

  const loadMessages = useCallback(async (loadMore = false) => {
    if (!userId) return;

    try {
      // Throttle cada 8s (solo para actualizaciones automáticas, no para carga manual)
      const now = Date.now();
      if (!loadMore && now - lastMessagesFetchAtRef.current < 8000) return;
      if (isFetchingMessagesRef.current) return;
      isFetchingMessagesRef.current = true;

      setPagination(prev => ({ ...prev, isLoading: true }));

      const page = loadMore ? pagination.page + 1 : 1;
      const limit = pagination.pageSize;

      const url = new URL('/api/chat/firestore-messages', window.location.origin);
      url.searchParams.append('limit', limit.toString());

      // Si es una carga de más mensajes, usa el timestamp del mensaje más antiguo
      if (loadMore && messages.length > 0) {
        const oldestMessage = messages[0];
        url.searchParams.append('beforeTimestamp', oldestMessage.timestamp.toISOString());
      }

      const response = await fetch(url.toString());

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.messages) {
          const newMessages = result.data.messages
            .filter((msg: any) => !messages.some((m: any) => m.id === msg.id)) // Filter out messages we already have
            .map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
              isOwn: msg.userId === session?.user?.id || msg.userName === session?.user?.name
            }));
          if (newMessages.length === 0) return; // No new messages
          // Detect new messages since last fetch
          const seen = seenMessageIdsRef.current;
          const incoming = newMessages.filter((m: any) => !seen.has(m.id));

          // Update seen set with all current messages
          newMessages.forEach((m: any) => seen.add(m.id));

          // Notify only for messages authored by others
          incoming
            .filter((m: any) => !m.isOwn)
            .forEach((m: any) => {
              const isPanic = m.type === 'panic';
              addNotification({
                type: isPanic ? 'panic' : 'chat',
                title: isPanic ? 'Alerta de pánico' : m.userName || 'Nuevo mensaje',
                message: isPanic ? (m?.metadata?.address || 'Nueva alerta de pánico') : m.message,
                data: { messageId: m.id, chatId: chat?.chatId },
                autoHideMs: isPanic ? 7000 : 4500,
              });
            });

          // Update messages based on load more or initial load
          setMessages(prevMessages => {
            // If loading more, prepend new messages, otherwise replace
            const updatedMessages = loadMore
              ? [...newMessages, ...prevMessages]
              : newMessages;

            // Update pagination state
            setPagination(prev => ({
              ...prev,
              page,
              hasMore: newMessages.length >= limit,
              isLoading: false
            }));

            // Update last message timestamp if we have messages
            if (updatedMessages.length > 0) {
              const latestMessage = updatedMessages[updatedMessages.length - 1];
              setLastMessageTimestamp(latestMessage.timestamp);
            }

            return updatedMessages;
          });

          setIsConnected(true);
          setError(null);
        }
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
      setError(tErrors('messagesLoadError'));
      setIsConnected(false);
    } finally {
      isFetchingMessagesRef.current = false;
      lastMessagesFetchAtRef.current = Date.now();
    }
  }, [userId, tErrors, session?.user?.name, chat?.chatId, addNotification, session?.user?.id]);

  // Cargar información del chat y mensajes en paralelo sólo una vez por sesión
  useEffect(() => {
    if (userId && !initializedRef.current) {
      initializedRef.current = true;
      setLoading(true);
      Promise.all([loadChatInfo(), loadMessages()])
        .finally(() => setLoading(false));
    }
  }, [userId, loadChatInfo, loadMessages]);

  // Suscripción en tiempo real a Firestore para mensajes
  useEffect(() => {
    if (!userId || !chat?.chatId) {
      console.debug('ChatView:onSnapshot SKIPPED - missing identifiers', { hasUserId: !!userId, chatId: chat?.chatId });
      return;
    }

    // Consulta: mensajes del chat ordenados por timestamp asc
    // Only get messages newer than our last known message
    const q = query(
      collection(firestoreClient, 'chats', chat.chatId, 'messages'),
      orderBy('timestamp', 'asc'),
      lastMessageTimestamp ?
        where('timestamp', '>', lastMessageTimestamp) :
        where('timestamp', '>', new Date(0)),
      fsLimit(500)
    );
    console.info('ChatView:onSnapshot SUBSCRIBE', { chatId: chat.chatId });

    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      console.debug('ChatView:onSnapshot RECEIVED', { size: snapshot.size, chatId: chat.chatId });

      // Process only new messages
      const newMessages = snapshot.docs
        .filter(doc => !messages.some(m => m.id === doc.id)) // Filter out messages we already have
        .map((doc) => {
          const data: any = doc.data();
          return {
            id: doc.id,
            message: data.message,
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp),
            type: data.type,
            userId: data.userId,
            userName: data.userName,
            metadata: data.metadata || {},
            isOwn: data.userId === session?.user?.id || data.userName === session?.user?.name,
          } as Message;
        });

      if (newMessages.length === 0) return; // No new messages

      // Update seen messages set
      const seen = seenMessageIdsRef.current;
      newMessages.forEach(m => seen.add(m.id));

      // Notify only for new messages from others
      newMessages
        .filter(m => !m.isOwn)
        .forEach(m => {
          const isPanic = m.type === 'panic';
          addNotification({
            type: isPanic ? 'panic' : 'chat',
            title: isPanic ? 'Alerta de pánico' : m.userName || 'Nuevo mensaje',
            message: isPanic ? (m.metadata?.address || 'Nueva alerta de pánico') : m.message,
            data: { messageId: m.id, chatId: chat.chatId },
            autoHideMs: isPanic ? 7000 : 4500,
          });
        });

      // Update messages state with new messages
      setMessages(prevMessages => {
        // Create a map of existing messages by ID for quick lookup
        const messageMap = new Map(prevMessages.map(msg => [msg.id, msg]));

        // Add or update messages from the snapshot
        newMessages.forEach(msg => {
          messageMap.set(msg.id, msg);
        });

        // Convert back to array and sort by timestamp
        const updatedMessages = Array.from(messageMap.values())
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        // Update last message timestamp if we have messages
        if (updatedMessages.length > 0) {
          const latestMessage = updatedMessages[updatedMessages.length - 1];
          setLastMessageTimestamp(latestMessage.timestamp);
        }

        return updatedMessages;
      });

      setIsConnected(true);
      setError(null);
    }, (err: unknown) => {
      console.error('ChatView:onSnapshot ERROR', err);
      // Fallback: intentar una carga manual si falla la suscripción
      loadMessages();
    });

    return () => {
      console.info('ChatView:onSnapshot UNSUBSCRIBE', { chatId: chat.chatId });
      unsubscribe();
    };
  }, [userId, chat?.chatId, session?.user?.id, session?.user?.name, addNotification, loadMessages]);

  // Function to handle loading more messages
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !pagination.hasMore || !messages.length) return;

    try {
      setIsLoadingMore(true);
      const oldestMessage = messages[0];

      // Load older messages
      const url = new URL('/api/chat/firestore-messages', window.location.origin);
      url.searchParams.append('beforeTimestamp', oldestMessage.timestamp.toISOString());

      const response = await fetch(url.toString());

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.messages?.length) {
          const newMessages = result.data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
            isOwn: msg.userId === session?.user?.id || msg.userName === session?.user?.name
          }));

          setMessages(prevMessages => {
            // Filter out any duplicates that might already be in the list
            const existingIds = new Set(prevMessages.map(m => m.id));
            const uniqueNewMessages = newMessages.filter((msg: any) => !existingIds.has(msg.id));

            // Combine and sort messages
            const combined = [...uniqueNewMessages, ...prevMessages];
            return combined.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          });

          // Update pagination state
          setPagination(prev => ({
            ...prev,
            hasMore: newMessages.length >= prev.pageSize,
            page: prev.page + 1
          }));
        }
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, messages, pagination.hasMore, pagination.pageSize, session?.user?.id, session?.user?.name]);

  // Auto-scroll a mensajes nuevos (solo cuando se añaden mensajes nuevos, no al cargar más)
  useEffect(() => {
    // Only auto-scroll if we're not loading more messages
    if (!isLoadingMore) {
      scrollToBottom();
    }
  }, [messages, isLoadingMore]);

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
        // Si hay una ubicación seleccionada, incluirla en el mensaje
        if (selectedLocation) {
          // Generar URL del mapa estático
          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
          if (apiKey) {
            const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
            const params = new URLSearchParams({
              center: `${selectedLocation.lat},${selectedLocation.lng}`,
              zoom: '15',
              size: '300x200',
              scale: '2',
              maptype: 'roadmap',
              markers: `color:red|label:L|${selectedLocation.lat},${selectedLocation.lng}`,
              key: apiKey
            });

            const staticMapUrl = `${baseUrl}?${params.toString()}`;

            // Enviar mensaje con imagen del mapa
            await sendMessageWithMedia(
              `${newMessage}\n\n📍 Ubicación: ${selectedLocation.address || `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`}`,
              {
                type: 'image',
                url: staticMapUrl,
                filename: 'location-map.png',
                size: 0
              }
            );
          } else {
            // Fallback sin imagen si no hay API key
            const locationMessage = `📍 Ubicación: ${selectedLocation.address || `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`}\n\n${newMessage}`;
            await sendMessage(locationMessage);
          }
          setSelectedLocation(null); // Limpiar ubicación después de enviar
        } else {
          await sendMessage(newMessage);
        }

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

  // Función helper para generar mensajes según el tipo de medio
  const getMediaMessage = (type: 'image' | 'video' | 'document') => {
    switch (type) {
      case 'image':
        return '🖼️ Imagen';
      case 'video':
        return '🎥 Video';
      case 'document':
        return '📄 Documento';
      default:
        return '📎 Archivo';
    }
  };

  const handleMediaSelect = async (file: File, type: 'image' | 'video' | 'document') => {
    try {
      setIsUploading(true);

      // Crear FormData para subir el archivo
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      // Subir archivo a Supabase Storage
      const uploadResponse = await fetch('/api/chat/upload-media', {
        method: 'POST',
        body: formData,
      });

      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json();
        console.log(`${type} uploaded successfully:`, uploadResult);

        // Enviar mensaje con el archivo adjunto
        await sendMessageWithMedia(newMessage || getMediaMessage(type), {
          type,
          url: uploadResult.url,
          filename: file.name,
          size: file.size
        });

        setNewMessage('');
      } else {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || `Error al subir ${type}`);
      }
    } catch (error) {
      console.error(`Error al procesar ${type}:`, error);
      setError(tErrors('sendMessageError'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleAudioSend = async (audioBlob: Blob) => {
    try {
      setIsUploading(true);

      // Obtener la duración real del audio antes de enviarlo
      let audioDuration = null;
      try {
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        // Esperar a que se cargue el metadata del audio
        await new Promise((resolve, reject) => {
          audio.addEventListener('loadedmetadata', resolve);
          audio.addEventListener('error', reject);
          audio.load();
        });

        audioDuration = audio.duration;
        URL.revokeObjectURL(audioUrl);
        console.log('Audio duration detected:', audioDuration);
      } catch (error) {
        console.warn('No se pudo obtener la duración del audio:', error);
      }

      // Crear FormData para subir el audio
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('type', 'audio');

      // Subir audio a Supabase Storage
      const uploadResponse = await fetch('/api/chat/upload-media', {
        method: 'POST',
        body: formData,
      });

      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json();
        console.log('Audio uploaded successfully:', uploadResult);

        // Enviar mensaje con el audio adjunto
        await sendMessageWithMedia(newMessage || '🎵 Audio', {
          type: 'audio',
          url: uploadResult.url,
          filename: 'audio.webm',
          size: audioBlob.size,
          duration: audioDuration || uploadResult.duration
        });

        setNewMessage('');
      } else {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Error al subir audio');
      }
    } catch (error) {
      console.error('Error al procesar audio:', error);
      setError(tErrors('sendMessageError'));
    } finally {
      setIsUploading(false);
    }
  };

  const formatAudioDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts = [];
    if (h > 0) {
      parts.push(`${h}h`);
    }
    if (m > 0) {
      parts.push(`${m}m`);
    }
    if (s > 0 || parts.length === 0) { // Show seconds only if no hours or minutes
      parts.push(`${s}s`);
    }
    return parts.join('');
  };

  // Helper para convertir Firestore Timestamp u otros formatos a Date
  const tsToDate = (v: any): Date | null => {
    if (!v) return null;
    if (v instanceof Date) return v;
    if (typeof v?.toDate === 'function') return v.toDate();
    if (typeof v === 'string') {
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof v?.seconds === 'number') {
      // Timestamp serializado { seconds, nanoseconds }
      return new Date(v.seconds * 1000);
    }
    return null;
  };

  const formatRemaining = (future: Date | null) => {
    if (!future) return '';
    const now = new Date();
    const diff = future.getTime() - now.getTime();
    if (diff <= 0) return 'expirado';
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours > 0) return `${hours}h ${remMins}m`;
    return `${remMins}m`;
  };

  const sendMessageWithMedia = async (message: string, media: { type: 'image' | 'video' | 'audio' | 'document'; url: string; filename?: string; size?: number; duration?: number }): Promise<boolean> => {
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
            } : {}),
            media: {
              type: media.type,
              url: media.url,
              filename: media.filename,
              size: media.size,
              duration: media.duration
            }
          }
        }),
      });

      if (response.ok) {
        await loadMessages();
        setReplyingTo(null);
        return true;
      } else {
        setError(tErrors('sendMessageError'));
        return false;
      }
    } catch (error) {
      console.error('Error enviando mensaje con multimedia:', error);
      setError(tErrors('sendMessageError'));
      return false;
    } finally {
      setIsSending(false);
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



  const handleLocationSelect = () => {
    setShowLocationPicker(true);
    setShowMenu(false);
  };

  const handleLocationConfirm = (location: { lat: number; lng: number; address?: string }) => {
    setSelectedLocation(location);
    setShowLocationPicker(false);
    setShowLocationPreview(true);
  };

  const handleLocationPreviewConfirm = () => {
    setShowLocationPreview(false);
    // La ubicación ya está en selectedLocation, listo para usar
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
      } as React.CSSProperties}
    >
      {/* Notifications Toaster */}
      <NotificationToaster />
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
      <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide flex flex-col">
        {pagination.hasMore && (
          <div className="flex justify-center mb-4">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="px-4 py-2 bg-gray-800/50 text-white rounded-full text-sm font-medium hover:bg-gray-700/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoadingMore ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  <span>{tChat('loading')}...</span>
                </>
              ) : (
                <span>{tChat('loadMore')}</span>
              )}
            </button>
          </div>
        )}
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

                    {/* Contenido multimedia */}
                    {message.metadata?.media && (
                      <div className="mb-2">
                        {message.metadata.media.type === 'image' && (
                          <div className="relative bg-gray-800/50 p-3 rounded-lg border border-gray-600/50">
                            <Image
                              src={message.metadata?.media?.url || ''}
                              alt="Imagen"
                              width={400}
                              height={300}
                              className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => message.metadata?.media?.url && window.open(message.metadata.media.url, '_blank')}
                            />
                            <div className="text-xs text-gray-400 mt-2 flex items-center justify-between">
                              <span>🖼️ {message.metadata?.media?.filename || 'imagen'}</span>
                              {message.metadata?.media?.size && (
                                <span>{(message.metadata.media.size / 1024 / 1024).toFixed(2)} MB</span>
                              )}
                            </div>
                          </div>
                        )}

                        {message.metadata?.media?.type === 'video' && (
                          <div className="relative bg-gray-800/50 p-3 rounded-lg border border-gray-600/50">
                            <video
                              src={message.metadata?.media?.url || ''}
                              controls
                              className="max-w-full h-auto rounded-lg"
                              preload="metadata"
                            />
                            <div className="text-xs text-gray-400 mt-2 flex items-center justify-between">
                              <span>🎥 {message.metadata?.media?.filename || 'video'}</span>
                              {message.metadata?.media?.size && (
                                <span>{(message.metadata.media.size / 1024 / 1024).toFixed(2)} MB</span>
                              )}
                            </div>
                          </div>
                        )}

                        {message.metadata?.media?.type === 'audio' && (
                          <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-600/50">
                            <audio
                              src={message.metadata?.media?.url || ''}
                              controls
                              className="w-full"
                              preload="metadata"
                            />
                            <div className="text-xs text-gray-400 mt-2 flex items-center justify-between">
                              <span>🎵 {message.metadata?.media?.filename || 'audio.webm'}</span>
                              {message.metadata?.media?.duration && (
                                <span>• {formatAudioDuration(message.metadata.media.duration)}</span>
                              )}
                              {message.metadata?.media?.size && (
                                <span>• {(message.metadata.media.size / 1024 / 1024).toFixed(2)} MB</span>
                              )}
                            </div>
                          </div>
                        )}

                        {message.metadata?.media?.type === 'document' && (
                          <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-600/50">
                            <div className="flex items-center space-x-3">
                              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white truncate">
                                  {message.metadata?.media?.filename || 'Documento'}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {message.metadata?.media?.size ? `${(message.metadata.media.size / 1024 / 1024).toFixed(2)} MB` : 'Documento'}
                                </div>
                              </div>
                              <button
                                onClick={() => message.metadata?.media?.url && window.open(message.metadata.media.url, '_blank')}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                              >
                                Abrir
                              </button>
                            </div>
                          </div>
                        )}
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
                    ) : message.type === 'incident' ? (
                      <>
                        {(() => {
                          const inc: any = message.metadata?.incident || {};
                          const activeUntil = tsToDate(inc?.activeUntil) || tsToDate((message as any)?.metadata?.activeUntil) || null;
                          return (
                            <div className="bg-gray-800/60 border border-yellow-600/50 rounded-xl p-3 mb-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-semibold text-yellow-300">Incidente: {inc?.type || '-'}</span>
                                <span className="text-xs text-yellow-200/90">{activeUntil ? `⏳ ${formatRemaining(activeUntil)}` : ''}</span>
                              </div>
                              {inc?.description && (
                                <div className="text-sm text-gray-100 mb-1">{inc.description}</div>
                              )}
                              {inc?.location?.coordinates && Array.isArray(inc.location.coordinates) && (
                                <div className="text-xs text-gray-400">📍 {inc.location.coordinates[1]?.toFixed?.(5)}, {inc.location.coordinates[0]?.toFixed?.(5)}</div>
                              )}
                            </div>
                          );
                        })()}
                        <span className={`text-xs text-gray-300 mt-1 block ${isOwn ? 'text-right' : 'text-left'}`}>
                          {formatTime(message.timestamp)}
                        </span>
                      </>
                    ) : message.type === 'system' ? (
                      <>
                        <span className="text-sm leading-tight block opacity-90">{message.message}</span>
                        <span className={`text-xs text-gray-400 mt-1 block ${isOwn ? 'text-right' : 'text-left'}`}>
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
          {/* Indicador de carga cuando se está subiendo un archivo */}
          {isUploading && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-blue-600/20 rounded-lg border border-blue-500/40">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-blue-300">Subiendo archivo...</span>
            </div>
          )}

          {/* Botón de adjuntar multimedia */}
          <button
            onClick={() => setShowMediaPicker(true)}
            disabled={isUploading}
            className="h-12 w-12 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            title={isUploading ? 'Subiendo archivo...' : tChat('attachMedia')}
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FiPaperclip className="w-5 h-5" />
            )}
          </button>

          {/* Botón de ubicación */}
          <button
            onClick={handleLocationSelect}
            className="h-12 w-12 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-200 flex items-center justify-center"
            title={tChat('location')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Contenedor del textarea con botón de incógnito integrado */}
          <div className="flex-1 relative h-12">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
              }}
              onKeyPress={handleKeyPress}
              placeholder={
                selectedLocation
                  ? `${tChat('writeMessage')} (ubicación seleccionada)`
                  : anonymous
                    ? `${tChat('writeMessage')} (${tChat('incognitoModeActive')})`
                    : tChat('writeMessage')
              }
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

            {/* Indicador de ubicación seleccionada */}
            {selectedLocation && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                <div className="flex items-center space-x-1 px-2 py-1 bg-green-600/20 border border-green-500/40 rounded-md max-w-[120px]">
                  <svg className="w-3 h-3 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span className="text-xs text-green-400 font-medium truncate">
                    {selectedLocation.address ?
                      selectedLocation.address.split(',')[0] :
                      'Ubicación'
                    }
                  </span>
                </div>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="p-1 rounded-md hover:bg-gray-700/50 transition-colors flex-shrink-0"
                  title="Eliminar ubicación seleccionada"
                >
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
         <button
           onClick={newMessage.trim() ? handleSendMessage : () => setShowAudioRecorder(true)}
           disabled={isSending || isUploading}
           className={`h-12 w-12 rounded-lg flex-shrink-0 flex items-center justify-center transition-colors ${
             newMessage.trim()
               ? 'bg-blue-600 text-white hover:bg-blue-700'
               : 'bg-gray-600 text-white hover:bg-gray-700'
           } disabled:opacity-50 disabled:cursor-not-allowed`}
         >
           {isSending || isUploading ? (
             <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
           ) : newMessage.trim() ? (
             <FiSend className="w-5 h-5" />
           ) : (
             <FiMic className="w-5 h-5" />
           )}
         </button>
        </div>
      </div>
      {/* #endregion */}

      {/* #region Location Picker Modal */}
      <AnimatePresence>
        {showLocationPicker && (
          <LocationPicker
            onClose={() => setShowLocationPicker(false)}
            onLocationSelect={handleLocationConfirm}
          />
        )}
      </AnimatePresence>
      {/* #endregion */}

      {/* #region Location Preview Modal */}
      <AnimatePresence>
        {showLocationPreview && selectedLocation && (
          <LocationPreview
            location={selectedLocation}
            onClose={() => setShowLocationPreview(false)}
            onConfirm={handleLocationPreviewConfirm}
          />
        )}
      </AnimatePresence>
      {/* #endregion */}

      {/* #region Media Picker Modal */}
      <AnimatePresence>
        {showMediaPicker && (
          <MediaPicker
            onClose={() => setShowMediaPicker(false)}
            onMediaSelect={handleMediaSelect}
          />
        )}
      </AnimatePresence>
      {/* #endregion */}

      {/* #region Audio Recorder Modal */}
      <AnimatePresence>
        {showAudioRecorder && (
          <AudioRecorder
            onClose={() => setShowAudioRecorder(false)}
            onAudioSend={handleAudioSend}
          />
        )}
      </AnimatePresence>
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
