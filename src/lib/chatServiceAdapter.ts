import { FirestoreMessage } from './firestoreChatService';

// Adaptador para mensajes que funciona con ambos sistemas
export interface AdaptedMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'normal' | 'panic';
  isOwn: boolean;
  metadata?: Record<string, any>;
}

export interface ChatServiceAdapter {
  messages: AdaptedMessage[];
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  typingUsers: string[];
  sendMessage: (message: string) => Promise<boolean>;
  sendPanicMessage: (message: string, location?: { lat: number; lng: number }) => Promise<boolean>;
  startTyping: () => Promise<void>;
  stopTyping: () => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  refresh: () => void;
}

// Función para determinar si Firebase está disponible
const isFirebaseAvailable = (): boolean => {
  return typeof window !== 'undefined' &&
         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== 'demo-project' &&
         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== undefined;
};

// Función para convertir mensajes de Firestore al formato esperado
const adaptFirestoreMessage = (msg: FirestoreMessage, currentUserId?: string): AdaptedMessage => {
  // Convertir timestamp de Firestore a Date
  let timestamp: Date;
  if (msg.timestamp?.toDate) {
    timestamp = msg.timestamp.toDate();
  } else if (msg.timestamp instanceof Date) {
    timestamp = msg.timestamp;
  } else {
    timestamp = new Date();
  }

  return {
    id: msg.id,
    userId: msg.userId,
    userName: msg.userName,
    message: msg.message,
    timestamp,
    type: msg.type,
    isOwn: msg.userId === currentUserId || msg.userName === currentUserId,
    metadata: msg.metadata
  };
};

// Servicio de fallback que simula mensajes cuando Firebase no está disponible
class FallbackChatService {
  private messages: AdaptedMessage[] = [
    {
      id: 'demo-1',
      userId: 'demo-user',
      userName: 'Sistema',
      message: '¡Bienvenido! Firebase no está configurado. Configura Firebase para usar el chat en tiempo real.',
      timestamp: new Date(),
      type: 'normal',
      isOwn: false,
      metadata: {}
    }
  ];

  private listeners: ((messages: AdaptedMessage[]) => void)[] = [];

  subscribeToMessages(callback: (messages: AdaptedMessage[]) => void) {
    this.listeners.push(callback);
    callback(this.messages);

    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  async sendMessage(userId: string, userName: string, message: string): Promise<boolean> {
    const newMessage: AdaptedMessage = {
      id: `demo-${Date.now()}`,
      userId,
      userName,
      message,
      timestamp: new Date(),
      type: 'normal',
      isOwn: true,
      metadata: {}
    };

    this.messages.push(newMessage);
    this.notifyListeners();
    return true;
  }

  async sendPanicMessage(userId: string, userName: string, message: string): Promise<boolean> {
    const newMessage: AdaptedMessage = {
      id: `panic-${Date.now()}`,
      userId,
      userName,
      message,
      timestamp: new Date(),
      type: 'panic',
      isOwn: true,
      metadata: {}
    };

    this.messages.push(newMessage);
    this.notifyListeners();
    return true;
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback([...this.messages]));
  }

  subscribeToTypingUsers(callback: (users: string[]) => void) {
    callback([]);
    return () => {};
  }

  async startTyping(): Promise<void> {
    // No-op en modo demo
  }

  async stopTyping(): Promise<void> {
    // No-op en modo demo
  }
}

const fallbackService = new FallbackChatService();

export { adaptFirestoreMessage, fallbackService, isFirebaseAvailable };
