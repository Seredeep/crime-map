/**
 * TIPOS ESPECÍFICOS DE CHAT
 * =========================
 *
 * Tipos e interfaces específicas para el sistema de chat
 */

import { MessageMetadata, User } from "@/lib/types/global";

// #region Chats y Mensajería
/**
 * Representa un chat de barrio
 */
export interface Chat {
  _id: string;
  neighborhood: string;
  participants: string[];
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Información del último mensaje enviado en un chat
 */
export interface LastChatMessage {
  userId: string;
  userName: string;
  message: string;
  profileImage: string;
}

/**
 * Chat con información completa de participantes
 */
export interface ChatWithParticipants {
  _id: string;
  neighborhood: string;
  participants: User[];
  lastMessageAt?: Date;
  lastMessage?: LastChatMessage;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Representa un mensaje individual en un chat
 */
export interface Message {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date | string;
  type: 'normal' | 'panic';
  isOwn?: boolean;
  metadata?: MessageMetadata;
}

/**
 * Datos de chat para el servicio optimizado
 */
export interface ChatData {
  id: string;
  neighborhood: string;
  participants: any[];
  createdAt?: Date;
  updatedAt?: Date;
}
// #endregion

// #region Tipos específicos de Firestore
export interface FirestoreMessage {
  id?: string;
  message: string;
  timestamp: any; // Firestore Timestamp
  type: 'normal' | 'panic';
  userId: string;
  userName: string;
  metadata?: MessageMetadata;
}

export interface FirestoreChat {
  neighborhood: string;
  participants: string[];
  lastMessageAt?: any; // Firestore Timestamp
  lastMessage?: any;
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
}
// #endregion

// #region Tipos de Usuario en Chat
export interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

export interface OnlineUser {
  userId: string;
  userName: string;
  lastSeen: number;
}
// #endregion
