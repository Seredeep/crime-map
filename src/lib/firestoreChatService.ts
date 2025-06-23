// Solo importar Firebase en el cliente
let firestoreModule: any = null;
let db: any = null;

if (typeof window !== 'undefined') {
  try {
    firestoreModule = require('firebase/firestore');
    const { db: firebaseDb } = require('./firebase');
    db = firebaseDb;
  } catch (error) {
    console.warn('Firebase no disponible:', error);
  }
}

// Tipos para el chat
export interface FirestoreMessage {
  id: string;
  chatId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: any; // Flexible para manejar diferentes tipos
  type: 'normal' | 'panic';
  metadata: {
    location?: { lat: number; lng: number };
    priority?: string;
    alertType?: string;
  };
}

export interface TypingIndicator {
  chatId: string;
  userId: string;
  userName: string;
  timestamp: any;
  isTyping: boolean;
}

export interface ChatStats {
  chatId: string;
  lastMessage: string;
  lastMessageBy: string;
  lastMessageAt: any;
  messageCount: number;
  createdAt: any;
  updatedAt: any;
}

class FirestoreChatService {
  private isFirebaseConfigured(): boolean {
    return typeof window !== 'undefined' && db !== null && firestoreModule !== null;
  }

  private get messagesCollection() {
    if (!this.isFirebaseConfigured()) {
      throw new Error('Firebase no está configurado');
    }
    return firestoreModule.collection(db, 'messages');
  }

  private get typingCollection() {
    if (!this.isFirebaseConfigured()) {
      throw new Error('Firebase no está configurado');
    }
    return firestoreModule.collection(db, 'typing');
  }

  private get statsCollection() {
    if (!this.isFirebaseConfigured()) {
      throw new Error('Firebase no está configurado');
    }
    return firestoreModule.collection(db, 'chat_stats');
  }

  // Escuchar mensajes en tiempo real
  subscribeToMessages(
    chatId: string,
    callback: (messages: FirestoreMessage[]) => void,
    messageLimit: number = 50
  ) {
    if (!this.isFirebaseConfigured()) {
      // Usar el sistema anterior como fallback
      this.loadMessagesFromAPI(chatId, callback);

      // Configurar polling para simular tiempo real
      const interval = setInterval(() => {
        this.loadMessagesFromAPI(chatId, callback);
      }, 5000); // Cada 5 segundos

      return () => clearInterval(interval);
    }

    try {
      const q = firestoreModule.query(
        this.messagesCollection,
        firestoreModule.where('chatId', '==', chatId),
        firestoreModule.orderBy('timestamp', 'desc'),
        firestoreModule.limit(messageLimit)
      );

      return firestoreModule.onSnapshot(q,
        (snapshot: any) => {
          const messages: FirestoreMessage[] = [];
          snapshot.forEach((doc: any) => {
            messages.push({
              id: doc.id,
              ...doc.data()
            } as FirestoreMessage);
          });

          // Revertir orden para mostrar más recientes al final
          callback(messages.reverse());
        },
        (error: any) => {
          // Silenciar errores de permisos en modo demo
          if (error.code === 'permission-denied') {
            console.log('🔄 Modo demo: usando fallback API...');
            this.loadMessagesFromAPI(chatId, callback);
          } else {
            console.error('Error en suscripción de mensajes:', error);
          }
        }
      );
    } catch (error) {
      console.error('Error suscribiéndose a mensajes:', error);
      // Fallback a API
      this.loadMessagesFromAPI(chatId, callback);
      return () => {};
    }
  }

  // Fallback: cargar mensajes desde la API existente
  private async loadMessagesFromAPI(chatId: string, callback: (messages: FirestoreMessage[]) => void) {
    try {
      const response = await fetch('/api/chat/messages');
      const result = await response.json();

      if (result.success && result.data.messages) {
        const adaptedMessages: FirestoreMessage[] = result.data.messages.map((msg: any) => ({
          id: msg._id || msg.id,
          chatId: msg.chatId || 'default',
          userId: msg.userId,
          userName: msg.userName,
          message: msg.message,
          timestamp: new Date(msg.timestamp || msg.createdAt),
          type: msg.type || 'normal',
          metadata: msg.metadata || {}
        }));

        callback(adaptedMessages);
      } else {
        console.warn('No se pudieron cargar mensajes desde API');
        callback([]);
      }
    } catch (error) {
      console.error('Error cargando mensajes desde API:', error);
      callback([]);
    }
  }

  // Enviar mensaje normal
  async sendMessage(
    chatId: string,
    userId: string,
    userName: string,
    message: string,
    metadata: any = {}
  ): Promise<boolean> {
    if (!this.isFirebaseConfigured()) {
      return this.sendMessageToAPI(message, 'normal', metadata);
    }

    try {
      await firestoreModule.addDoc(this.messagesCollection, {
        chatId,
        userId,
        userName,
        message,
        timestamp: firestoreModule.serverTimestamp(),
        type: 'normal',
        metadata
      });

      // Actualizar estadísticas
      await this.updateChatStats(chatId, message, userName);

      return true;
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      // Fallback a API
      return this.sendMessageToAPI(message, 'normal', metadata);
    }
  }

  // Fallback: enviar mensaje a la API existente
  private async sendMessageToAPI(message: string, type: string = 'normal', metadata: any = {}): Promise<boolean> {
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          type,
          metadata
        }),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error enviando mensaje a API:', error);
      return false;
    }
  }

  // Enviar mensaje de pánico
  async sendPanicMessage(
    chatId: string,
    userId: string,
    userName: string,
    message: string,
    location?: { lat: number; lng: number },
    alertType?: string
  ): Promise<boolean> {
    if (!this.isFirebaseConfigured()) {
      return this.sendMessageToAPI(message, 'panic', { location, alertType });
    }

    try {
      await firestoreModule.addDoc(this.messagesCollection, {
        chatId,
        userId,
        userName,
        message,
        timestamp: firestoreModule.serverTimestamp(),
        type: 'panic',
        metadata: {
          location,
          priority: 'high',
          alertType
        }
      });

      // Actualizar estadísticas
      await this.updateChatStats(chatId, `🚨 ${message}`, userName);

      return true;
    } catch (error) {
      console.error('Error enviando mensaje de pánico:', error);
      return this.sendMessageToAPI(message, 'panic', { location, alertType });
    }
  }

  // Indicadores de escritura (solo con Firebase)
  subscribeToTypingUsers(
    chatId: string,
    currentUserId: string,
    callback: (typingUsers: TypingIndicator[]) => void
  ) {
    if (!this.isFirebaseConfigured()) {
      callback([]);
      return () => {};
    }

    try {
      const q = firestoreModule.query(
        this.typingCollection,
        firestoreModule.where('chatId', '==', chatId),
        firestoreModule.where('isTyping', '==', true),
        firestoreModule.where('userId', '!=', currentUserId)
      );

      return firestoreModule.onSnapshot(q,
        (snapshot: any) => {
          const typingUsers: TypingIndicator[] = [];
          snapshot.forEach((doc: any) => {
            const data = doc.data() as TypingIndicator;
            // Solo mostrar usuarios que escribieron en los últimos 10 segundos
            const now = new Date();
            const typingTime = data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
            if (now.getTime() - typingTime.getTime() < 10000) {
              typingUsers.push(data);
            }
          });
          callback(typingUsers);
        },
        (error: any) => {
          // Silenciar errores de permisos en modo demo
          if (error.code === 'permission-denied') {
            console.log('🔇 Modo demo: indicadores de escritura no disponibles');
            callback([]);
          } else {
            console.error('Error en suscripción de indicadores de escritura:', error);
          }
        }
      );
    } catch (error) {
      console.error('Error suscribiéndose a indicadores de escritura:', error);
      callback([]);
      return () => {};
    }
  }

  // Iniciar indicador de escritura
  async startTyping(chatId: string, userId: string, userName: string): Promise<void> {
    if (!this.isFirebaseConfigured()) return;

    try {
      const typingDocRef = firestoreModule.doc(this.typingCollection, `${chatId}_${userId}`);
      await firestoreModule.setDoc(typingDocRef, {
        chatId,
        userId,
        userName,
        timestamp: firestoreModule.serverTimestamp(),
        isTyping: true
      });
    } catch (error: any) {
      // Silenciar errores de permisos en modo demo
      if (error.code === 'permission-denied') {
        console.log('🔇 Modo demo: ignorando error de permisos al iniciar escritura');
      } else {
        console.error('Error iniciando indicador de escritura:', error);
      }
    }
  }

  // Detener indicador de escritura
  async stopTyping(chatId: string, userId: string): Promise<void> {
    if (!this.isFirebaseConfigured()) return;

    try {
      const typingDocRef = firestoreModule.doc(this.typingCollection, `${chatId}_${userId}`);
      await firestoreModule.deleteDoc(typingDocRef);
    } catch (error: any) {
      // Silenciar errores de permisos en modo demo
      if (error.code === 'permission-denied') {
        console.log('🔇 Modo demo: ignorando error de permisos al detener escritura');
      } else {
        console.error('Error deteniendo indicador de escritura:', error);
      }
    }
  }

  // Limpiar indicadores de escritura antiguos
  async cleanupOldTypingIndicators(): Promise<void> {
    // Deshabilitar limpieza automática para evitar errores internos de Firebase
    if (!this.isFirebaseConfigured()) return;

    try {
      // Solo proceder si Firebase está completamente configurado y funcionando
      if (!db || !firestoreModule) {
        console.log('🔇 Limpieza de indicadores deshabilitada - Firebase no disponible');
        return;
      }

      const tenSecondsAgo = new Date(Date.now() - 10000);
      const q = firestoreModule.query(
        this.typingCollection,
        firestoreModule.where('timestamp', '<', firestoreModule.Timestamp.fromDate(tenSecondsAgo))
      );

      const snapshot = await firestoreModule.getDocs(q);
      const batch = firestoreModule.writeBatch(db);

      snapshot.forEach((doc: any) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error: any) {
      // Silenciar todos los errores de limpieza para evitar ruido
      if (error.message?.includes('INTERNAL ASSERTION FAILED')) {
        console.log('🔇 Limpieza de indicadores deshabilitada - Firebase en estado inconsistente');
      } else {
        console.log('🔇 Error en limpieza de indicadores (silenciado):', error.code || 'unknown');
      }
    }
  }

  // Actualizar estadísticas del chat
  private async updateChatStats(
    chatId: string,
    lastMessage: string,
    lastMessageBy: string
  ): Promise<void> {
    if (!this.isFirebaseConfigured()) return;

    try {
      const statsDocRef = firestoreModule.doc(this.statsCollection, chatId);
      await firestoreModule.setDoc(statsDocRef, {
        chatId,
        lastMessage,
        lastMessageBy,
        lastMessageAt: firestoreModule.serverTimestamp(),
        updatedAt: firestoreModule.serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error actualizando estadísticas:', error);
    }
  }

  // Obtener estadísticas del chat
  async getChatStats(chatId: string): Promise<ChatStats | null> {
    if (!this.isFirebaseConfigured()) return null;

    try {
      const snapshot = await firestoreModule.getDocs(
        firestoreModule.query(
          firestoreModule.collection(db, 'chat_stats'),
          firestoreModule.where('chatId', '==', chatId)
        )
      );

      if (!snapshot.empty) {
        const docData = snapshot.docs[0];
        const data = docData.data();
        return {
          chatId: data.chatId,
          lastMessage: data.lastMessage,
          lastMessageBy: data.lastMessageBy,
          lastMessageAt: data.lastMessageAt,
          messageCount: data.messageCount || 0,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        } as ChatStats;
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return null;
    }
  }

  // Obtener mensajes históricos (paginación)
  async getHistoricalMessages(
    chatId: string,
    beforeTimestamp?: any,
    limitCount: number = 20
  ): Promise<FirestoreMessage[]> {
    if (!this.isFirebaseConfigured()) return [];

    try {
      let q = firestoreModule.query(
        this.messagesCollection,
        firestoreModule.where('chatId', '==', chatId),
        firestoreModule.orderBy('timestamp', 'desc'),
        firestoreModule.limit(limitCount)
      );

      if (beforeTimestamp) {
        q = firestoreModule.query(
          this.messagesCollection,
          firestoreModule.where('chatId', '==', chatId),
          firestoreModule.where('timestamp', '<', beforeTimestamp),
          firestoreModule.orderBy('timestamp', 'desc'),
          firestoreModule.limit(limitCount)
        );
      }

      const snapshot = await firestoreModule.getDocs(q);
      const messages: FirestoreMessage[] = [];

      snapshot.forEach((doc: any) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        } as FirestoreMessage);
      });

      return messages.reverse(); // Más antiguos primero
    } catch (error) {
      console.error('Error obteniendo mensajes históricos:', error);
      return [];
    }
  }
}

export const firestoreChatService = new FirestoreChatService();
