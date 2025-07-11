import { Message } from "./types";

/**
 * Sistema de caché simple y eficiente para el chat
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  lastAccessed: number;
}

interface MessageCache {
  messages: Message[];
  lastMessageTimestamp: number;
}

class SimpleChatCache {
  private messageCache = new Map<string, CacheEntry<MessageCache>>();
  private chatInfoCache = new Map<string, CacheEntry<any>>();

  // TTL más corto para mejor rendimiento
  private readonly TTL = {
    MESSAGES: 30000,      // 30 segundos
    CHAT_INFO: 300000,    // 5 minutos
  };

  // === MÉTODOS PARA MENSAJES ===

  getCachedMessages(chatId: string): MessageCache | null {
    const cacheKey = `messages_${chatId}`;
    const cached = this.messageCache.get(cacheKey);

    if (!cached || Date.now() - cached.timestamp > this.TTL.MESSAGES) {
      return null;
    }

    // Actualizar último acceso
    cached.lastAccessed = Date.now();
    return cached.data;
  }

  setCachedMessages(chatId: string, messages: any[]): void {
    const cacheKey = `messages_${chatId}`;
    const lastMessageTimestamp = messages.length > 0
      ? Math.max(...messages.map(m => new Date(m.timestamp).getTime()))
      : 0;

    this.messageCache.set(cacheKey, {
      data: { messages, lastMessageTimestamp },
      timestamp: Date.now(),
      lastAccessed: Date.now()
    });
  }

  appendMessages(chatId: string, newMessages: any[]): any[] {
    if (newMessages.length === 0) return [];

    const cached = this.getCachedMessages(chatId);
    if (!cached) {
      this.setCachedMessages(chatId, newMessages);
      return newMessages;
    }

    // Filtrar mensajes duplicados
    const existingIds = new Set(cached.messages.map(m => m.id));
    const uniqueNewMessages = newMessages.filter(m => !existingIds.has(m.id));

    if (uniqueNewMessages.length > 0) {
      const combined = [...cached.messages, ...uniqueNewMessages];
      this.setCachedMessages(chatId, combined);
    }

    return uniqueNewMessages;
  }

  // === MÉTODOS PARA INFORMACIÓN DEL CHAT ===

  getCachedChatInfo(chatId: string): any | null {
    const cacheKey = `chat_${chatId}`;
    const cached = this.chatInfoCache.get(cacheKey);

    if (!cached || Date.now() - cached.timestamp > this.TTL.CHAT_INFO) {
      return null;
    }

    cached.lastAccessed = Date.now();
    return cached.data;
  }

  setCachedChatInfo(chatId: string, chatInfo: any): void {
    const cacheKey = `chat_${chatId}`;
    this.chatInfoCache.set(cacheKey, {
      data: chatInfo,
      timestamp: Date.now(),
      lastAccessed: Date.now()
    });
  }

  // === MÉTODOS PARA TYPING ===

  private typingCache = new Map<string, CacheEntry<any[]>>();

  getCachedTyping(chatId: string): any[] {
    const cacheKey = `typing_${chatId}`;
    const cached = this.typingCache.get(cacheKey);

    if (!cached || Date.now() - cached.timestamp > 10000) { // TTL 10 segundos
      return [];
    }

    cached.lastAccessed = Date.now();
    return cached.data;
  }

  setCachedTyping(chatId: string, typingUsers: any[]): void {
    const cacheKey = `typing_${chatId}`;
    this.typingCache.set(cacheKey, {
      data: typingUsers,
      timestamp: Date.now(),
      lastAccessed: Date.now()
    });
  }

  shouldUpdateTyping(chatId: string, newData: any[]): boolean {
    const cached = this.getCachedTyping(chatId);
    return JSON.stringify(cached) !== JSON.stringify(newData);
  }

  // === MÉTODOS PARA ONLINE STATUS ===

  private onlineCache = new Map<string, CacheEntry<any[]>>();

  getCachedOnlineStatus(chatId: string): any[] {
    const cacheKey = `online_${chatId}`;
    const cached = this.onlineCache.get(cacheKey);

    if (!cached || Date.now() - cached.timestamp > 30000) { // TTL 30 segundos
      return [];
    }

    cached.lastAccessed = Date.now();
    return cached.data;
  }

  setCachedOnlineStatus(chatId: string, onlineUsers: any[]): void {
    const cacheKey = `online_${chatId}`;
    this.onlineCache.set(cacheKey, {
      data: onlineUsers,
      timestamp: Date.now(),
      lastAccessed: Date.now()
    });
  }

  shouldUpdateOnlineStatus(chatId: string, newData: any[]): boolean {
    const cached = this.getCachedOnlineStatus(chatId);
    return JSON.stringify(cached) !== JSON.stringify(newData);
  }

  // === UTILIDADES ===

  invalidateChatCache(chatId: string): void {
    this.messageCache.delete(`messages_${chatId}`);
    this.chatInfoCache.delete(`chat_${chatId}`);
    this.typingCache.delete(`typing_${chatId}`);
    this.onlineCache.delete(`online_${chatId}`);
  }

  clearCache(type?: 'messages' | 'chatInfo' | 'typing' | 'online' | 'all'): void {
    switch (type) {
      case 'messages':
        this.messageCache.clear();
        break;
      case 'chatInfo':
        this.chatInfoCache.clear();
        break;
      case 'typing':
        this.typingCache.clear();
        break;
      case 'online':
        this.onlineCache.clear();
        break;
      default:
        this.messageCache.clear();
        this.chatInfoCache.clear();
        this.typingCache.clear();
        this.onlineCache.clear();
    }
  }

  getCacheStats() {
    return {
      messages: this.messageCache.size,
      chatInfo: this.chatInfoCache.size,
      typing: this.typingCache.size,
      online: this.onlineCache.size,
      total: this.messageCache.size + this.chatInfoCache.size + this.typingCache.size + this.onlineCache.size
    };
  }

  // Limpiar entradas expiradas automáticamente
  cleanup(): void {
    const now = Date.now();

    // Limpiar mensajes expirados
    for (const [key, entry] of this.messageCache.entries()) {
      if (now - entry.timestamp > this.TTL.MESSAGES) {
        this.messageCache.delete(key);
      }
    }

    // Limpiar info de chat expirada
    for (const [key, entry] of this.chatInfoCache.entries()) {
      if (now - entry.timestamp > this.TTL.CHAT_INFO) {
        this.chatInfoCache.delete(key);
      }
    }

    // Limpiar typing expirado (TTL 10 segundos)
    for (const [key, entry] of this.typingCache.entries()) {
      if (now - entry.timestamp > 10000) {
        this.typingCache.delete(key);
      }
    }

    // Limpiar online status expirado (TTL 30 segundos)
    for (const [key, entry] of this.onlineCache.entries()) {
      if (now - entry.timestamp > 30000) {
        this.onlineCache.delete(key);
      }
    }
  }
}

// Instancia global del caché
export const simpleChatCache = new SimpleChatCache();

// Limpiar caché automáticamente cada 5 minutos
setInterval(() => {
  simpleChatCache.cleanup();
}, 300000);
