import { ChatMessage } from './hooks/useChatMessages';

/**
 * Represents a single cache entry for a chat
 */
interface CacheEntry {
  messages: ChatMessage[];
  timestamp: number;
  chatId: string;
  lastMessageId: string | null;
  total: number;
}

/**
 * Metadata for cache management and statistics
 */
interface CacheMetadata {
  size: number;
  lastCleanup: number;
  entries: { [chatId: string]: { lastAccess: number; size: number } };
}

/**
 * Intelligent chat cache system using localStorage
 * Features:
 * - Automatic size management with LRU eviction
 * - Expiration-based cleanup
 * - Memory optimization with message limits
 * - Statistics tracking for monitoring
 */
class ChatCache {
  // Cache configuration constants
  private readonly CACHE_PREFIX = 'chat_cache_';
  private readonly METADATA_KEY = 'chat_cache_metadata';
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB total cache limit
  private readonly MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 hours expiration
  private readonly MAX_MESSAGES_PER_CHAT = 500; // Max messages per chat in cache
  private readonly CLEANUP_INTERVAL = 6 * 60 * 60 * 1000; // Cleanup every 6 hours

  private metadata: CacheMetadata = {
    size: 0,
    lastCleanup: Date.now(),
    entries: {}
  };

  constructor() {
    this.loadMetadata();
    this.scheduleCleanup();
  }

  private loadMetadata(): void {
    try {
      const stored = localStorage.getItem(this.METADATA_KEY);
      if (stored) {
        this.metadata = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Error al cargar metadata del cache:', error);
      this.metadata = {
        size: 0,
        lastCleanup: Date.now(),
        entries: {}
      };
    }
  }

  private saveMetadata(): void {
    try {
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(this.metadata));
    } catch (error) {
      console.warn('Error al guardar metadata del cache:', error);
    }
  }

  private getCacheKey(chatId: string): string {
    return `${this.CACHE_PREFIX}${chatId}`;
  }

  private estimateSize(data: any): number {
    return JSON.stringify(data).length * 2; // Aproximación en bytes
  }

  private scheduleCleanup(): void {
    setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Retrieves cached messages for a specific chat
   * @param chatId - Chat identifier
   * @returns Cache entry with messages or null if not found/expired
   *
   * Process:
   * 1. Check if cache entry exists in localStorage
   * 2. Validate expiration (24 hours)
   * 3. Convert timestamp strings back to Date objects
   * 4. Update access metadata for LRU tracking
   */
  get(chatId: string): CacheEntry | null {
    try {
      const key = this.getCacheKey(chatId);
      const stored = localStorage.getItem(key);

      if (!stored) {
        return null;
      }

      const entry: CacheEntry = JSON.parse(stored);

      // Check if cache has expired (24 hours)
      if (Date.now() - entry.timestamp > this.MAX_CACHE_AGE) {
        this.remove(chatId);
        return null;
      }

      // Convert timestamp strings back to Date objects for proper handling
      entry.messages = entry.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));

      // Update last access time for LRU tracking
      this.metadata.entries[chatId] = {
        lastAccess: Date.now(),
        size: this.metadata.entries[chatId]?.size || this.estimateSize(entry)
      };
      this.saveMetadata();

      return entry;
    } catch (error) {
      console.warn('Error al obtener del cache:', error);
      return null;
    }
  }

  /**
   * Stores messages in cache with intelligent size management
   * @param chatId - Chat identifier
   * @param messages - Array of messages to cache
   * @param lastMessageId - ID of the most recent message
   * @param total - Total message count for this chat
   *
   * Features:
   * - Limits messages per chat to prevent excessive memory usage
   * - Checks available space and makes room if needed
   * - Updates metadata for size tracking and LRU management
   * - Handles localStorage quota exceeded errors gracefully
   */
  set(chatId: string, messages: ChatMessage[], lastMessageId: string | null, total: number): void {
    try {
      // Limit number of messages to prevent excessive memory usage
      const limitedMessages = messages.slice(-this.MAX_MESSAGES_PER_CHAT);

      const entry: CacheEntry = {
        messages: limitedMessages,
        timestamp: Date.now(),
        chatId,
        lastMessageId,
        total
      };

      const key = this.getCacheKey(chatId);
      const serialized = JSON.stringify(entry);
      const size = this.estimateSize(entry);

      // Check if we need to make space before storing
      if (this.metadata.size + size > this.MAX_CACHE_SIZE) {
        this.makeSpace(size);
      }

      // Store in localStorage
      localStorage.setItem(key, serialized);

      // Update metadata for size tracking and LRU management
      const oldSize = this.metadata.entries[chatId]?.size || 0;
      this.metadata.size = this.metadata.size - oldSize + size;
      this.metadata.entries[chatId] = {
        lastAccess: Date.now(),
        size
      };

      this.saveMetadata();
    } catch (error) {
      console.warn('Error al guardar en cache:', error);
      // Si falla por espacio, intentar limpiar y reintentar
      if (error instanceof DOMException && error.code === 22) {
        this.cleanup();
        try {
          const entry: CacheEntry = {
            messages: messages.slice(-Math.floor(this.MAX_MESSAGES_PER_CHAT / 2)),
            timestamp: Date.now(),
            chatId,
            lastMessageId,
            total
          };
          localStorage.setItem(this.getCacheKey(chatId), JSON.stringify(entry));
        } catch (retryError) {
          console.error('Error al reintentar guardar en cache:', retryError);
        }
      }
    }
  }

  /**
   * Agrega nuevos mensajes al cache existente
   */
  append(chatId: string, newMessages: ChatMessage[], lastMessageId: string | null): void {
    const existing = this.get(chatId);
    if (existing) {
      // Combinar mensajes evitando duplicados
      const existingIds = new Set(existing.messages.map(msg => msg.id));
      const uniqueNewMessages = newMessages.filter(msg => !existingIds.has(msg.id));

      const allMessages = [...existing.messages, ...uniqueNewMessages];
      this.set(chatId, allMessages, lastMessageId, existing.total + uniqueNewMessages.length);
    } else {
      this.set(chatId, newMessages, lastMessageId, newMessages.length);
    }
  }

  /**
   * Prepende mensajes más antiguos al cache
   */
  prepend(chatId: string, olderMessages: ChatMessage[]): void {
    const existing = this.get(chatId);
    if (existing) {
      // Combinar mensajes evitando duplicados
      const existingIds = new Set(existing.messages.map(msg => msg.id));
      const uniqueOlderMessages = olderMessages.filter(msg => !existingIds.has(msg.id));

      const allMessages = [...uniqueOlderMessages, ...existing.messages];
      this.set(chatId, allMessages, existing.lastMessageId, existing.total);
    }
  }

  /**
   * Remueve un chat del cache
   */
  remove(chatId: string): void {
    try {
      const key = this.getCacheKey(chatId);
      localStorage.removeItem(key);

      if (this.metadata.entries[chatId]) {
        this.metadata.size -= this.metadata.entries[chatId].size;
        delete this.metadata.entries[chatId];
        this.saveMetadata();
      }
    } catch (error) {
      console.warn('Error al remover del cache:', error);
    }
  }

  /**
   * Limpia el cache eliminando entradas antiguas
   */
  cleanup(): void {
    const now = Date.now();
    const expiredEntries: string[] = [];

    // Encontrar entradas expiradas
    Object.entries(this.metadata.entries).forEach(([chatId, meta]) => {
      if (now - meta.lastAccess > this.MAX_CACHE_AGE) {
        expiredEntries.push(chatId);
      }
    });

    // Remover entradas expiradas
    expiredEntries.forEach(chatId => this.remove(chatId));

    this.metadata.lastCleanup = now;
    this.saveMetadata();

    console.log(`🧹 Cache limpiado: ${expiredEntries.length} entradas removidas`);
  }

  /**
   * Hace espacio en el cache removiendo entradas menos usadas
   */
  private makeSpace(requiredSize: number): void {
    const entries = Object.entries(this.metadata.entries)
      .sort(([, a], [, b]) => a.lastAccess - b.lastAccess); // Ordenar por último acceso

    let freedSpace = 0;
    const toRemove: string[] = [];

    for (const [chatId, meta] of entries) {
      toRemove.push(chatId);
      freedSpace += meta.size;

      if (freedSpace >= requiredSize || this.metadata.size - freedSpace < this.MAX_CACHE_SIZE * 0.8) {
        break;
      }
    }

    toRemove.forEach(chatId => this.remove(chatId));
    console.log(`💾 Espacio liberado: ${toRemove.length} entradas removidas`);
  }

  /**
   * Obtiene estadísticas del cache
   */
  getStats(): {
    totalSize: number;
    totalEntries: number;
    maxSize: number;
    lastCleanup: Date;
  } {
    return {
      totalSize: this.metadata.size,
      totalEntries: Object.keys(this.metadata.entries).length,
      maxSize: this.MAX_CACHE_SIZE,
      lastCleanup: new Date(this.metadata.lastCleanup)
    };
  }

  /**
   * Limpia todo el cache
   */
  clear(): void {
    try {
      Object.keys(this.metadata.entries).forEach(chatId => {
        localStorage.removeItem(this.getCacheKey(chatId));
      });

      localStorage.removeItem(this.METADATA_KEY);

      this.metadata = {
        size: 0,
        lastCleanup: Date.now(),
        entries: {}
      };

      console.log('🗑️ Cache completamente limpiado');
    } catch (error) {
      console.error('Error al limpiar cache:', error);
    }
  }
}

// Singleton instance
export const chatCache = new ChatCache();
export default chatCache;
