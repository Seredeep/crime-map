/**
 * SERVICIOS DE CHAT
 * =================
 *
 * Servicios para manejo de chat, mensajería y comunicación entre usuarios
 */

// Exportar tipos específicos de chat
export * from './types';

// Exportar servicios principales
export * from './chatService';
export * from './chatServiceOptimized';
export * from './firestoreChatService';

// Exportar sistema de caché
export * from './chatCache';
