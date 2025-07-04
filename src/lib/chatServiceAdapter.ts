// Adaptador para mensajes que funciona con el sistema de chat basado en API
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

// Servicio de chat basado en API REST
class ChatService {
  private messages: AdaptedMessage[] = [];
  private listeners: ((messages: AdaptedMessage[]) => void)[] = [];
  private isLoading = false;

  subscribeToMessages(callback: (messages: AdaptedMessage[]) => void) {
    this.listeners.push(callback);
    this.loadMessages().then(() => {
      callback(this.messages);
    });

    // Simular actualizaciones en tiempo real cada 5 segundos
    const interval = setInterval(() => {
      this.loadMessages().then(() => {
        callback(this.messages);
      });
    }, 5000);

    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
      clearInterval(interval);
    };
  }

  private async loadMessages(): Promise<void> {
    try {
      const response = await fetch('/api/chat/firestore-messages');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.messages) {
          this.messages = result.data.messages.map((msg: any) => ({
            id: msg.id,
            userId: msg.userId,
            userName: msg.userName,
            message: msg.message,
            timestamp: new Date(msg.timestamp),
            type: msg.type || 'normal',
            isOwn: false, // Se determinará en el componente
            metadata: msg.metadata || {}
          }));
        }
      }
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    }
  }

  async sendMessage(userId: string, userName: string, message: string): Promise<boolean> {
    try {
      const response = await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          type: 'normal'
        }),
      });

      if (response.ok) {
        // Recargar mensajes después de enviar
        await this.loadMessages();
        this.notifyListeners();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      return false;
    }
  }

  async sendPanicMessage(userId: string, userName: string, message: string, location?: { lat: number; lng: number }): Promise<boolean> {
    try {
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
        await this.loadMessages();
        this.notifyListeners();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error enviando mensaje de pánico:', error);
      return false;
    }
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback([...this.messages]));
  }

  subscribeToTypingUsers(callback: (users: string[]) => void) {
    // No implementado para el sistema basado en API
    callback([]);
    return () => {};
  }

  async startTyping(): Promise<void> {
    // No implementado para el sistema basado en API
  }

  async stopTyping(): Promise<void> {
    // No implementado para el sistema basado en API
  }

  async getHistoricalMessages(limit: number = 50): Promise<AdaptedMessage[]> {
    await this.loadMessages();
    return this.messages.slice(-limit);
  }
}

const chatService = new ChatService();

export { chatService };
