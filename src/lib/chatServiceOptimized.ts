import { simpleChatCache as intelligentChatCache } from './chatCache';
import { ChatData, Message } from './types';

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

interface OnlineUser {
  userId: string;
  userName: string;
  lastSeen: number;
}

class ChatServiceOptimized {
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastMessageTimestamp: number = 0;
  private isPolling: boolean = false;
  private chatId: string | null = null;
  private userId: string | null = null;
  private userName: string | null = null;

  // Estados reactivos
  private onMessagesUpdate: ((messages: Message[]) => void) | null = null;
  private onTypingUpdate: ((users: TypingUser[]) => void) | null = null;
  private onOnlineUpdate: ((users: OnlineUser[]) => void) | null = null;

  // Configuración de polling inteligente
  private readonly POLLING_INTERVALS = {
    ACTIVE: 5000,    // 5 segundos cuando hay actividad reciente (más conservador)
    NORMAL: 12000,   // 12 segundos en modo normal (aumentado)
    IDLE: 30000,     // 30 segundos cuando no hay actividad (aumentado)
  };

  // Configuración específica para plan gratuito
  private readonly FREE_TIER_CONFIG = {
    MAX_OPERATIONS_PER_SECOND: 80, // 80% del límite de Atlas
    BATCH_SIZE: 25, // Reducir batch size
    CACHE_TTL_MULTIPLIER: 1.5, // Cachear más tiempo
    AGGRESSIVE_IDLE_MODE: true, // Modo idle más agresivo
  };

  private lastActivity: number = Date.now();
  private currentInterval: number = this.POLLING_INTERVALS.NORMAL;
  private consecutiveEmptyPolls: number = 0;
  private operationsCounter: number = 0; // Nuevo: contador de operaciones
  private operationsWindow: number = Date.now(); // Nuevo: ventana de tiempo

  // Inicializar el servicio
  async initialize(userId: string, userName: string) {
    this.userId = userId;
    this.userName = userName;

    // Obtener chat del usuario (con caché)
    const chatData = await this.getUserChatWithCache();
    if (chatData) {
      this.chatId = chatData.id;

      // Cargar mensajes iniciales desde caché
      await this.loadInitialMessagesWithCache();

      this.startIntelligentPolling();
      this.updateOnlineStatus();
    }
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
        return data.success ? data.chat : null;
      }
    } catch (error) {
      console.error('Error getting user chat:', error);
    }
    return null;
  }

  // Cargar mensajes iniciales con caché
  private async loadInitialMessagesWithCache(): Promise<void> {
    if (!this.chatId) return;

    // Verificar caché primero
    const cached = intelligentChatCache.getCachedMessages(this.chatId);
    if (cached && cached.messages.length > 0) {
      console.log('📦 Cargando mensajes desde caché:', cached.messages.length);

      if (this.onMessagesUpdate) {
        this.onMessagesUpdate(cached.messages);
      }

      this.lastMessageTimestamp = cached.lastMessageTimestamp || 0;
      this.consecutiveEmptyPolls = 0; // Reset contador
      return;
    }

    // Si no hay caché, cargar desde API
    console.log('🌐 Cargando mensajes desde API...');
    await this.loadMessagesFromAPI();
  }

  // Cargar mensajes desde API
  private async loadMessagesFromAPI(since?: number): Promise<Message[]> {
    if (!this.chatId) return [];

    try {
      const url = since
        ? `/api/chat/firestore-messages?limit=50&since=${since}`
        : `/api/chat/firestore-messages?limit=50`;

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.data && data.data.messages) {
          const messages = data.data.messages || [];

          if (since) {
            // Es un polling, agregar a caché existente
            const combinedMessages = intelligentChatCache.appendMessages(this.chatId, messages);

            if (messages.length > 0) {
              console.log('📨 Nuevos mensajes recibidos:', messages.length);
              this.consecutiveEmptyPolls = 0;

              if (this.onMessagesUpdate) {
                this.onMessagesUpdate(messages); // Solo enviar nuevos mensajes
              }
            } else {
              this.consecutiveEmptyPolls++;
            }

            return messages;
          } else {
            // Carga inicial, guardar en caché
            intelligentChatCache.setCachedMessages(this.chatId, messages);

            if (this.onMessagesUpdate) {
              this.onMessagesUpdate(messages);
            }

            if (messages.length > 0) {
              this.lastMessageTimestamp = Math.max(
                ...messages.map((m: Message) => new Date(m.timestamp).getTime())
              );
            }

            return messages;
          }
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }

    return [];
  }

  // Polling inteligente que se adapta a la actividad
  private startIntelligentPolling() {
    if (this.isPolling) return;

    this.isPolling = true;
    this.scheduleNextPoll();
  }

  // Método para verificar rate limiting
  private checkRateLimit(): boolean {
    const now = Date.now();

    // Resetear contador cada segundo
    if (now - this.operationsWindow > 1000) {
      this.operationsCounter = 0;
      this.operationsWindow = now;
    }

    // Verificar si estamos cerca del límite
    if (this.operationsCounter >= this.FREE_TIER_CONFIG.MAX_OPERATIONS_PER_SECOND) {
      console.log('⚠️ Rate limit alcanzado, pausando polling...');
      return false;
    }

    this.operationsCounter++;
    return true;
  }

  private scheduleNextPoll() {
    if (this.pollingInterval) {
      clearTimeout(this.pollingInterval);
    }

    // Ajustar intervalo según actividad y resultados de polling
    const timeSinceActivity = Date.now() - this.lastActivity;

    if (timeSinceActivity < 30000 && this.consecutiveEmptyPolls < 3) {
      // Actividad reciente y hay contenido nuevo
      this.currentInterval = this.POLLING_INTERVALS.ACTIVE;
    } else if (timeSinceActivity < 300000 && this.consecutiveEmptyPolls < 5) {
      // Actividad moderada
      this.currentInterval = this.POLLING_INTERVALS.NORMAL;
    } else {
      // Sin actividad o muchos polls vacíos
      this.currentInterval = this.POLLING_INTERVALS.IDLE;
    }

    // Configuración más agresiva para plan gratuito
    if (this.FREE_TIER_CONFIG.AGGRESSIVE_IDLE_MODE) {
      if (this.consecutiveEmptyPolls > 5) {
        this.currentInterval = Math.min(this.currentInterval * 2, 45000); // Máximo 45 segundos
      }

      if (this.consecutiveEmptyPolls > 15) {
        this.currentInterval = 60000; // 1 minuto para usuarios inactivos
      }
    }

    console.log(`⏱️ Próximo poll en ${this.currentInterval/1000}s (empty polls: ${this.consecutiveEmptyPolls}, ops: ${this.operationsCounter})`);

    this.pollingInterval = setTimeout(() => {
      this.pollForUpdates();
    }, this.currentInterval);
  }

  private async pollForUpdates() {
    if (!this.chatId) return;

    try {
      // Verificar rate limiting antes de hacer cualquier operación
      if (!this.checkRateLimit()) {
        // Si estamos en rate limit, aumentar intervalo y salir
        this.currentInterval = Math.min(this.currentInterval * 2, 60000);
        this.scheduleNextPoll();
        return;
      }

      // Solo hacer polling de mensajes si realmente es necesario
      const shouldPollMessages = this.lastMessageTimestamp > 0;

      if (shouldPollMessages) {
        const newMessages = await this.loadMessagesFromAPI(this.lastMessageTimestamp);

        if (newMessages.length > 0) {
          // Hay nuevos mensajes - activar modo activo
          this.lastActivity = Date.now();
          this.lastMessageTimestamp = Math.max(
            this.lastMessageTimestamp,
            ...newMessages.map((m: Message) => new Date(m.timestamp).getTime())
          );
        }
      }

      // Polling de typing y online solo si hay actividad reciente y rate limit permite
      const timeSinceActivity = Date.now() - this.lastActivity;
      if (timeSinceActivity < 120000 && this.checkRateLimit()) { // Solo si hay actividad en los últimos 2 minutos
        await this.updateTypingUsersWithCache();

        if (this.checkRateLimit()) { // Verificar de nuevo antes del segundo call
          await this.updateOnlineUsersWithCache();
        }
      }

    } catch (error) {
      console.error('Error polling for updates:', error);
      this.consecutiveEmptyPolls++;
    }

    // Programar siguiente poll
    this.scheduleNextPoll();
  }

  // Gestión de typing indicators con caché
  async startTyping() {
    if (!this.chatId || !this.userId) return;

    this.lastActivity = Date.now();
    this.consecutiveEmptyPolls = 0; // Reset contador al interactuar

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
      console.error('Error setting typing status:', error);
    }
  }

  async stopTyping() {
    if (!this.chatId || !this.userId) return;

    try {
      await fetch('/api/chat/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: this.chatId,
          userId: this.userId,
          isTyping: false
        })
      });
    } catch (error) {
      console.error('Error stopping typing status:', error);
    }
  }

  private async updateTypingUsersWithCache() {
    if (!this.chatId) return;

    try {
      // Verificar caché primero
      const cached = intelligentChatCache.getCachedTyping(this.chatId);
      const now = Date.now();

      // Si el caché es muy reciente (menos de 3 segundos), usar caché
      if (cached.length > 0 && !intelligentChatCache.shouldUpdateTyping(this.chatId, [])) {
        if (this.onTypingUpdate) {
          const otherUsers = cached.filter((u: TypingUser) => u.userId !== this.userId);
          this.onTypingUpdate(otherUsers);
        }
        return;
      }

      const response = await fetch(`/api/chat/typing?chatId=${this.chatId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const typingUsers = data.typingUsers || [];

          // Solo actualizar si hay cambios
          if (intelligentChatCache.shouldUpdateTyping(this.chatId, typingUsers)) {
            intelligentChatCache.setCachedTyping(this.chatId, typingUsers);

            if (this.onTypingUpdate) {
              const otherUsers = typingUsers.filter((u: TypingUser) => u.userId !== this.userId);
              this.onTypingUpdate(otherUsers);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error getting typing users:', error);
    }
  }

  // Gestión de status online con caché
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
      console.error('Error updating online status:', error);
    }
  }

  private async updateOnlineUsersWithCache() {
    if (!this.chatId) return;

    try {
      // Verificar caché primero
      const cached = intelligentChatCache.getCachedOnlineStatus(this.chatId);

      if (cached.length > 0 && !intelligentChatCache.shouldUpdateOnlineStatus(this.chatId, [])) {
        if (this.onOnlineUpdate) {
          this.onOnlineUpdate(cached);
        }
        return;
      }

      const response = await fetch(`/api/chat/online-status?chatId=${this.chatId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const onlineUsers = data.onlineUsers || [];

          // Solo actualizar si hay cambios
          if (intelligentChatCache.shouldUpdateOnlineStatus(this.chatId, onlineUsers)) {
            intelligentChatCache.setCachedOnlineStatus(this.chatId, onlineUsers);

            if (this.onOnlineUpdate) {
              this.onOnlineUpdate(onlineUsers);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error getting online users:', error);
    }
  }

  // Enviar mensaje
  async sendMessage(message: string, type: 'normal' | 'panic' = 'normal') {
    if (!this.chatId || !this.userId) return null;

    this.lastActivity = Date.now();
    this.consecutiveEmptyPolls = 0; // Reset contador al enviar mensaje

    try {
      const response = await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: this.chatId,
          message,
          type,
          userId: this.userId,
          userName: this.userName
        })
      });

      if (response.ok) {
        const data = await response.json();

        // Invalidar caché de mensajes para forzar actualización
        if (this.chatId) {
          intelligentChatCache.invalidateChatCache(this.chatId);
        }

        // Forzar actualización inmediata
        setTimeout(() => this.pollForUpdates(), 500);
        return data;
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
    return null;
  }

  // Registrar callbacks
  onMessages(callback: (messages: Message[]) => void) {
    this.onMessagesUpdate = callback;
  }

  onTyping(callback: (users: TypingUser[]) => void) {
    this.onTypingUpdate = callback;
  }

  onOnline(callback: (users: OnlineUser[]) => void) {
    this.onOnlineUpdate = callback;
  }

  // Marcar actividad (llamar cuando el usuario interactúa)
  markActivity() {
    this.lastActivity = Date.now();
    this.consecutiveEmptyPolls = 0; // Reset contador al interactuar
  }

  // Obtener estadísticas del caché
  getCacheStats() {
    return intelligentChatCache.getCacheStats();
  }

  // Limpiar recursos
  cleanup() {
    if (this.pollingInterval) {
      clearTimeout(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;

    // Marcar como offline
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

// Singleton instance
export const chatServiceOptimized = new ChatServiceOptimized();
export type { OnlineUser, TypingUser };

