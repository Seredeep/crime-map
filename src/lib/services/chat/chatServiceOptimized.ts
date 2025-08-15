import { firestore } from '../../config/db/firebase'; // Import Firestore
import { simpleChatCache as intelligentChatCache } from './chatCache';
import { ChatData, Message, OnlineUser, TypingUser } from './types';

class ChatServiceOptimized {
  private chatId: string | null = null;
  private userId: string | null = null;
  private userName: string | null = null;

  // Estados reactivos
  private onMessagesUpdate: ((messages: Message[]) => void) | null = null;
  private onTypingUpdate: ((users: TypingUser[]) => void) | null = null;
  private onOnlineUpdate: ((users: OnlineUser[]) => void) | null = null;

  // Listener de Firestore
  private unsubscribeFromMessages: (() => void) | null = null;
  private unsubscribeFromTyping: (() => void) | null = null;
  private unsubscribeFromOnline: (() => void) | null = null;

  // Inicializar el servicio
  async initialize(userId: string, userName: string) {
    this.userId = userId;
    this.userName = userName;

    // Obtener chat del usuario (con caché)
    const chatData = await this.getUserChatWithCache();
    if (chatData) {
      this.chatId = chatData.id;

      // Configurar oyente de Firestore para mensajes
      this.setupFirestoreMessageListener();
      // TODO: Migrar `online-status` y `typing` a Firestore para habilitar estos oyentes
      // this.setupFirestoreTypingListener();
      // this.setupFirestoreOnlineListener();
    }
  }

  // Configurar oyente de Firestore para mensajes
  private setupFirestoreMessageListener() {
    if (!this.chatId) {
      console.warn('No chatId available to set up Firestore listener.');
      return;
    }

    // Limpiar oyente anterior si existe
    if (this.unsubscribeFromMessages) {
      this.unsubscribeFromMessages();
    }

    console.log(`👂 Configurando oyente de Firestore para el chat: ${this.chatId}`);

    const messagesCollection = firestore.collection('chats').doc(this.chatId).collection('messages');

    this.unsubscribeFromMessages = messagesCollection
      .orderBy('timestamp', 'asc') // Asegurar orden cronológico
      .onSnapshot((snapshot: any) => {
        const messages: Message[] = [];
        snapshot.forEach((doc: any) => {
          const data = doc.data();
          messages.push({
            id: doc.id,
            userId: data.userId,
            userName: data.userName,
            message: data.message,
            timestamp: data.timestamp.toDate(), // Convertir Timestamp de Firestore a Date
            type: data.type || 'normal',
            isOwn: data.userId === this.userId,
            metadata: data.metadata || {},
          });
        });
        // Actualizar caché y notificar a los listeners
        intelligentChatCache.setCachedMessages(this.chatId!, messages);
        if (this.onMessagesUpdate) {
          this.onMessagesUpdate(messages);
        }
      }, (error: any) => {
        console.error('Error en el oyente de Firestore:', error);
        // Manejar el error, quizás notificar al frontend
      });
  }

  // Obtener chat del usuario con caché
  private async getUserChatWithCache(): Promise<ChatData | null> {
    if (!this.chatId) {
      // Primera vez, obtener desde API
      const chatData = await this.getUserChat();
      if (chatData) {
        this.chatId = chatData.id;
        intelligentChatCache.setCachedChatInfo(this.chatId, chatData);
      }
      return chatData;
    }

    // Verificar caché primero
    const cached = intelligentChatCache.getCachedChatInfo(this.chatId);
    if (cached) {
      return {
        id: cached.id,
        neighborhood: cached.neighborhood,
        participants: cached.participants
      } as ChatData;
    }

    // Si no hay caché, obtener desde API
    const chatData = await this.getUserChat();
    if (chatData && this.chatId) {
      intelligentChatCache.setCachedChatInfo(this.chatId, chatData);
    }
    return chatData;
  }

  // Obtener chat del usuario (método original)
  private async getUserChat(): Promise<ChatData | null> {
    try {
      const response = await fetch('/api/chat/my-chat');
      if (response.ok) {
        const data = await response.json();
        return data.success ? data.data : null; // Cambiado de data.chat a data.data
      }
    } catch (error) {
      console.error('Error getting user chat:', error);
    }
    return null;
  }

  // *** MÉTODOS DE MENSAJES (AHORA BASADOS EN FIRESTORE) ***

  // No necesitamos `loadInitialMessagesWithCache` ni `loadMessagesFromAPI`
  // ya que `onSnapshot` maneja la carga inicial y las actualizaciones.

  async sendMessage(message: string, type: 'normal' | 'panic' = 'normal', metadata?: Record<string, any>) {
    if (!this.chatId || !this.userId || !this.userName) return null;

    try {
      const response = await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          type,
          userId: this.userId, // Añadir userId para que el backend lo use en FirestoreMessage
          userName: this.userName,
          metadata: metadata || {}
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`💬 Mensaje enviado via API: ${data.data.id}`);
        // No necesitamos forzar un poll/listener update aquí, Firestore se encargará
        return data.success;
      }
      return false;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  async sendPanicMessage(message: string, location?: { lat: number; lng: number }) {
    if (!this.chatId || !this.userId || !this.userName) return null;

    try {
      const response = await fetch('/api/chat/panic-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          type: 'panic',
          location,
          userId: this.userId, // Añadir userId
          userName: this.userName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`🚨 Panic message sent via API: ${data.data.messageId}`);
        return data.success;
      }
      return false;
    } catch (error) {
      console.error('Error enviando mensaje de pánico:', error);
      return false;
    }
  }

  // *** MÉTODOS DE TYPING Y ONLINE STATUS (PENDIENTES DE MIGRAR A FIRESTORE) ***

  async startTyping() {
    // console.log(`⌨️ ${this.userName} is typing...`);
    if (!this.chatId || !this.userId) return;
    try {
      await fetch('/api/chat/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: this.chatId,
          userId: this.userId,
          userName: this.userName,
          isTyping: true
        })
      });
    } catch (error) {
      console.error('Error al enviar estado de escritura:', error);
    }
  }

  async stopTyping() {
    // console.log(`⌨️ ${this.userName} stopped typing.`);
    if (!this.chatId || !this.userId) return;
    try {
      await fetch('/api/chat/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: this.chatId,
          userId: this.userId,
          userName: this.userName,
          isTyping: false
        })
      });
    } catch (error) {
      console.error('Error al detener estado de escritura:', error);
    }
  }

  private async updateTypingUsersWithCache() {
    if (!this.chatId) return;
    try {
      const response = await fetch(`/api/chat/typing?chatId=${this.chatId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.typingUsers) {
          const typingUsers = data.typingUsers as TypingUser[];
          intelligentChatCache.setCachedTyping(this.chatId, typingUsers);
          if (this.onTypingUpdate) {
            this.onTypingUpdate(typingUsers);
          }
        }
      }
    } catch (error) {
      console.error('Error actualizando usuarios escribiendo:', error);
    }
  }

  private async updateOnlineStatus() {
    if (!this.chatId || !this.userId) return;
    try {
      await fetch('/api/chat/online-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: this.chatId,
          userId: this.userId,
          userName: this.userName,
          isOnline: true
        })
      });
    } catch (error) {
      console.error('Error al actualizar estado online:', error);
    }
  }

  private async updateOnlineUsersWithCache() {
    if (!this.chatId) return;
    try {
      const response = await fetch(`/api/chat/online-status?chatId=${this.chatId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.onlineUsers) {
          const onlineUsers = data.onlineUsers as OnlineUser[];
          intelligentChatCache.setCachedOnlineStatus(this.chatId, onlineUsers);
          if (this.onOnlineUpdate) {
            this.onOnlineUpdate(onlineUsers);
          }
        }
      }
    } catch (error) {
      console.error('Error actualizando usuarios online:', error);
    }
  }

  // *** GENERAL LISTENERS AND UTILITIES ***

  onMessages(callback: (messages: Message[]) => void) {
    this.onMessagesUpdate = callback;
    // Cargar mensajes iniciales desde caché al suscribirse
    if (this.chatId) {
      const cached = intelligentChatCache.getCachedMessages(this.chatId);
      if (cached && cached.messages.length > 0) {
        callback(cached.messages);
      }
    }
  }

  onTyping(callback: (users: TypingUser[]) => void) {
    this.onTypingUpdate = callback;
    if (this.chatId) {
      const cached = intelligentChatCache.getCachedTyping(this.chatId);
      if (cached && cached.length > 0) {
        callback(cached);
      }
    }
  }

  onOnline(callback: (users: OnlineUser[]) => void) {
    this.onOnlineUpdate = callback;
    if (this.chatId) {
      const cached = intelligentChatCache.getCachedOnlineStatus(this.chatId);
      if (cached && cached.length > 0) {
        callback(cached);
      }
    }
  }

  markActivity() {
    // Con la migración a Firestore, la actividad se infiere del listener de mensajes.
    // Las funciones de typing y online status mantendrán su propia lógica hasta ser migradas.
  }

  getCacheStats() {
    return intelligentChatCache.getCacheStats();
  }

  cleanup() {
    // Limpiar oyentes de Firestore
    if (this.unsubscribeFromMessages) {
      this.unsubscribeFromMessages();
      this.unsubscribeFromMessages = null;
    }
    if (this.unsubscribeFromTyping) {
      this.unsubscribeFromTyping();
      this.unsubscribeFromTyping = null;
    }
    if (this.unsubscribeFromOnline) {
      this.unsubscribeFromOnline();
      this.unsubscribeFromOnline = null;
    }

    // Marcar como offline al limpiar (si la lógica de online status se mantiene via API)
    if (this.chatId && this.userId) {
      fetch('/api/chat/online-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: this.chatId,
          userId: this.userId,
          isOnline: false
        })
      }).catch(console.error);
    }
  }
}

const chatServiceOptimized = new ChatServiceOptimized();

export { chatServiceOptimized };
export type { OnlineUser, TypingUser };

