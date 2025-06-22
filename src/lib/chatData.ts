'use client';

export interface Message {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'normal' | 'panic';
  isOwn: boolean;
  metadata?: Record<string, any>;
}

export interface ChatData {
  chatId: string;
  neighborhood: string;
  participants: Array<{
    id: string;
    name: string;
    email: string;
    isOnline: boolean;
  }>;
  messages: Message[];
  hasMore: boolean;
  total: number;
}

// Datos mock para desarrollo
const mockChatData: ChatData = {
  chatId: 'chat-barrio-5',
  neighborhood: 'Barrio 5',
  participants: [
    {
      id: '1',
      name: 'María González',
      email: 'maria@example.com',
      isOnline: true
    },
    {
      id: '2',
      name: 'Carlos Rodríguez',
      email: 'carlos@example.com',
      isOnline: false
    },
    {
      id: '3',
      name: 'Ana López',
      email: 'ana@example.com',
      isOnline: true
    },
    {
      id: '4',
      name: 'Pedro Martínez',
      email: 'pedro@example.com',
      isOnline: true
    },
    {
      id: '5',
      name: 'Tú',
      email: 'tu@example.com',
      isOnline: true
    }
  ],
  messages: [
    {
      id: '1',
      userId: '1',
      userName: 'María González',
      message: '¡Hola vecinos! ¿Alguien vio algo extraño anoche?',
      timestamp: new Date(Date.now() - 3600000), // 1 hora atrás
      type: 'normal',
      isOwn: false
    },
    {
      id: '2',
      userId: '2',
      userName: 'Carlos Rodríguez',
      message: 'Yo escuché unos ruidos cerca del parque',
      timestamp: new Date(Date.now() - 3000000), // 50 minutos atrás
      type: 'normal',
      isOwn: false
    },
    {
      id: '3',
      userId: '5',
      userName: 'Tú',
      message: 'Deberíamos estar más atentos. Gracias por avisar.',
      timestamp: new Date(Date.now() - 1800000), // 30 minutos atrás
      type: 'normal',
      isOwn: true
    }
  ],
  hasMore: false,
  total: 3
};

/**
 * Obtiene los datos del chat actual
 */
export function getChatData(): ChatData {
  // En una implementación real, esto haría una llamada a la API
  // Por ahora retornamos datos mock
  return mockChatData;
}

/**
 * Obtiene el último mensaje del chat
 */
export function getLastMessage(): Message | null {
  const chatData = getChatData();
  if (chatData.messages.length === 0) {
    return null;
  }

  // Ordenar mensajes por timestamp y obtener el más reciente
  const sortedMessages = [...chatData.messages].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  return sortedMessages[0];
}

/**
 * Envía un nuevo mensaje al chat
 */
export async function sendMessage(message: string): Promise<Message> {
  // En una implementación real, esto haría una llamada a la API
  const newMessage: Message = {
    id: Date.now().toString(),
    userId: '5',
    userName: 'Tú',
    message,
    timestamp: new Date(),
    type: 'normal',
    isOwn: true
  };

  // Simular envío exitoso
  mockChatData.messages.push(newMessage);
  mockChatData.total++;

  return newMessage;
}

/**
 * Obtiene los participantes del chat
 */
export function getChatParticipants(): ChatData['participants'] {
  return getChatData().participants;
}
