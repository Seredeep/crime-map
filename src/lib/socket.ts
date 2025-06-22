import { io, Socket } from 'socket.io-client';

/**
 * Interface defining all socket events and their payloads
 * Used for type safety in socket communication
 */
export interface SocketEvents {
  // Message events - Handle chat message operations
  'message:new': (message: any) => void;
  'message:sent': (message: any) => void;
  'message:error': (error: string) => void;

  // Chat events - Handle chat room operations
  'chat:join': (data: { chatId: string; userId: string }) => void;
  'chat:leave': (data: { chatId: string; userId: string }) => void;
  'chat:typing': (data: { chatId: string; userId: string; userName: string }) => void;
  'chat:stop-typing': (data: { chatId: string; userId: string }) => void;

  // Panic events - Handle emergency messages
  'panic:alert': (data: any) => void;

  // Connection events - Handle socket connection state
  'connect': () => void;
  'disconnect': () => void;
  'reconnect': () => void;
  'connect_error': (error: Error) => void;
}

/**
 * WebSocket service class that manages real-time communication
 * Implements singleton pattern for global socket management
 * Features: auto-reconnection, fallback handling, connection state management
 */
class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  /**
   * Establishes WebSocket connection to the server
   * @param userId - Optional user ID for authentication
   * @returns Socket instance for event handling
   *
   * Connection strategy:
   * 1. Check if already connected - return existing socket
   * 2. Create new socket with environment-specific URL
   * 3. Configure transports (WebSocket preferred, polling fallback)
   * 4. Set up event listeners for connection management
   */
  connect(userId?: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    // Socket configuration with environment-specific URL and transport options
    this.socket = io(process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
      : 'http://localhost:3000', {
      transports: ['websocket', 'polling'], // WebSocket preferred, polling as fallback
      upgrade: true, // Allow transport upgrades
      timeout: 20000, // Connection timeout
      query: userId ? { userId } : undefined, // Pass user ID in query params
      auth: userId ? { userId } : undefined, // Authentication data
    });

    this.setupEventListeners();
    return this.socket;
  }

  /**
   * Sets up core socket event listeners for connection management
   * Handles connect, disconnect, errors, and reconnection events
   */
  private setupEventListeners() {
    if (!this.socket) return;

    // Connection established successfully
    this.socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      this.reconnectAttempts = 0; // Reset reconnection counter
    });

    // Connection lost
    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from WebSocket server:', reason);
    });

    // Connection failed - trigger reconnection logic
    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      this.handleReconnect();
    });

    // Successfully reconnected after failure
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconnected to WebSocket server (attempt ${attemptNumber})`);
    });
  }

  /**
   * Handles automatic reconnection with exponential backoff
   * Implements retry logic with increasing delays to avoid overwhelming the server
   */
  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      setTimeout(() => {
        console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.socket?.connect();
      }, delay);
    }
  }

  /**
   * Joins a specific chat room
   * @param chatId - Chat room identifier
   * @param userId - User identifier for authorization
   */
  joinChat(chatId: string, userId: string) {
    this.socket?.emit('chat:join', { chatId, userId });
  }

  /**
   * Leaves a specific chat room
   * @param chatId - Chat room identifier
   * @param userId - User identifier
   */
  leaveChat(chatId: string, userId: string) {
    this.socket?.emit('chat:leave', { chatId, userId });
  }

  /**
   * Sends a regular chat message
   * @param chatId - Target chat room ID
   * @param message - Message content
   * @param userId - Sender's user ID
   * @param userName - Sender's display name
   * @returns Promise resolving to the sent message data
   *
   * Process:
   * 1. Validates socket connection
   * 2. Emits message with callback for acknowledgment
   * 3. Handles server response (success/error)
   */
  sendMessage(chatId: string, message: string, userId: string, userName: string) {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('message:send', {
        chatId,
        message,
        userId,
        userName,
        timestamp: new Date().toISOString()
      }, (response: any) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.message));
        }
      });
    });
  }

  /**
   * Sends a panic/emergency message with high priority
   * @param chatId - Target chat room ID
   * @param message - Emergency message content
   * @param userId - Sender's user ID
   * @param userName - Sender's display name
   * @param location - Optional GPS coordinates for emergency location
   * @returns Promise resolving to the sent panic message data
   *
   * Panic messages are treated with high priority and trigger special alerts
   */
  sendPanicMessage(chatId: string, message: string, userId: string, userName: string, location?: { lat: number; lng: number }) {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('panic:send', {
        chatId,
        message,
        userId,
        userName,
        location,
        timestamp: new Date().toISOString()
      }, (response: any) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.message));
        }
      });
    });
  }

  /**
   * Indicates that user is currently typing a message
   * @param chatId - Chat room ID
   * @param userId - User ID of the person typing
   * @param userName - Display name of the person typing
   */
  startTyping(chatId: string, userId: string, userName: string) {
    this.socket?.emit('chat:typing', { chatId, userId, userName });
  }

  /**
   * Indicates that user stopped typing
   * @param chatId - Chat room ID
   * @param userId - User ID of the person who stopped typing
   */
  stopTyping(chatId: string, userId: string) {
    this.socket?.emit('chat:stop-typing', { chatId, userId });
  }

  /**
   * Registers an event listener for socket events
   * @param event - Event name to listen for
   * @param callback - Function to call when event is received
   */
  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  /**
   * Removes an event listener
   * @param event - Event name to stop listening for
   * @param callback - Optional specific callback to remove
   */
  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  /**
   * Disconnects from the WebSocket server and cleans up
   */
  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  /**
   * Returns current connection status
   */
  get connected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Returns the raw socket instance for advanced operations
   */
  get socket_instance(): Socket | null {
    return this.socket;
  }
}

// Singleton instance - ensures single WebSocket connection across the app
export const socketService = new SocketService();
export default socketService;
