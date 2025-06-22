import clientPromise from '@/lib/mongodb';
import { Server as HTTPServer } from 'http';
import { ObjectId } from 'mongodb';
import { NextRequest } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';

// Tipos para el servidor WebSocket
interface SocketData {
  userId?: string;
  userName?: string;
  chatId?: string;
}

interface ServerToClientEvents {
  'message:new': (message: any) => void;
  'message:sent': (message: any) => void;
  'message:error': (error: string) => void;
  'chat:user-joined': (data: { userId: string; userName: string }) => void;
  'chat:user-left': (data: { userId: string; userName: string }) => void;
  'chat:typing': (data: { userId: string; userName: string }) => void;
  'chat:stop-typing': (data: { userId: string }) => void;
  'panic:alert': (data: any) => void;
}

interface ClientToServerEvents {
  'chat:join': (data: { chatId: string; userId: string }) => void;
  'chat:leave': (data: { chatId: string; userId: string }) => void;
  'message:send': (data: any, callback: (response: any) => void) => void;
  'panic:send': (data: any, callback: (response: any) => void) => void;
  'chat:typing': (data: { chatId: string; userId: string; userName: string }) => void;
  'chat:stop-typing': (data: { chatId: string; userId: string }) => void;
}

// Variable global para el servidor Socket.IO
let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, any, SocketData>;

// Función para inicializar Socket.IO
export function initializeSocket(server: HTTPServer) {
  if (io) return io;

  io = new SocketIOServer(server, {
    path: '/api/socket',
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? [process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com']
        : ['http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    console.log(`✅ Usuario conectado: ${socket.id}`);

    // Manejar unión a chat
    socket.on('chat:join', async ({ chatId, userId }) => {
      try {
        const client = await clientPromise;
        const db = client.db();

        // Verificar que el usuario pertenece al chat
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        if (!user || user.chatId !== chatId) {
          socket.emit('message:error', 'No tienes acceso a este chat');
          return;
        }

        // Unirse a la sala del chat
        await socket.join(chatId);
        socket.data.chatId = chatId;
        socket.data.userId = userId;
        socket.data.userName = user.name || user.email;

        // Notificar a otros usuarios
        socket.to(chatId).emit('chat:user-joined', {
          userId,
          userName: user.name || user.email
        });

        console.log(`👥 Usuario ${user.name || user.email} se unió al chat ${chatId}`);
      } catch (error) {
        console.error('Error al unirse al chat:', error);
        socket.emit('message:error', 'Error al unirse al chat');
      }
    });

    // Manejar salida del chat
    socket.on('chat:leave', ({ chatId, userId }) => {
      socket.leave(chatId);
      socket.to(chatId).emit('chat:user-left', {
        userId,
        userName: socket.data.userName || 'Usuario'
      });
      console.log(`👋 Usuario ${socket.data.userName} salió del chat ${chatId}`);
    });

    // Manejar envío de mensajes
    socket.on('message:send', async (data, callback) => {
      try {
        const { chatId, message, userId, userName } = data;
        const client = await clientPromise;
        const db = client.db();

        // Verificar que el usuario pertenece al chat
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        if (!user || user.chatId !== chatId) {
          callback({ success: false, message: 'No tienes acceso a este chat' });
          return;
        }

        // Guardar mensaje en la base de datos
        const newMessage = {
          chatId,
          userId,
          userName: user.name || user.email,
          message,
          timestamp: new Date(),
          type: 'normal'
        };

        const result = await db.collection('messages').insertOne(newMessage);
        const savedMessage = {
          ...newMessage,
          id: result.insertedId.toString(),
          _id: result.insertedId,
          isOwn: false // Se determinará en el cliente
        };

        // Enviar mensaje a todos los usuarios del chat
        io.to(chatId).emit('message:new', savedMessage);

        // Confirmar al remitente
        callback({ success: true, data: savedMessage });

        console.log(`💬 Mensaje enviado en chat ${chatId} por ${userName}`);
      } catch (error) {
        console.error('Error al enviar mensaje:', error);
        callback({ success: false, message: 'Error al enviar mensaje' });
      }
    });

    // Manejar mensajes de pánico
    socket.on('panic:send', async (data, callback) => {
      try {
        const { chatId, message, userId, userName, location } = data;
        const client = await clientPromise;
        const db = client.db();

        // Verificar que el usuario pertenece al chat
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        if (!user || user.chatId !== chatId) {
          callback({ success: false, message: 'No tienes acceso a este chat' });
          return;
        }

        // Guardar mensaje de pánico
        const panicMessage = {
          chatId,
          userId,
          userName: user.name || user.email,
          message,
          timestamp: new Date(),
          type: 'panic',
          metadata: {
            location: location || null,
            priority: 'high'
          }
        };

        const result = await db.collection('messages').insertOne(panicMessage);
        const savedMessage = {
          ...panicMessage,
          id: result.insertedId.toString(),
          _id: result.insertedId,
          isOwn: false
        };

        // Enviar alerta de pánico a todos los usuarios del chat
        io.to(chatId).emit('panic:alert', savedMessage);

        // Confirmar al remitente
        callback({ success: true, data: savedMessage });

        console.log(`🚨 Mensaje de pánico enviado en chat ${chatId} por ${userName}`);
      } catch (error) {
        console.error('Error al enviar mensaje de pánico:', error);
        callback({ success: false, message: 'Error al enviar mensaje de pánico' });
      }
    });

    // Manejar indicador de escritura
    socket.on('chat:typing', ({ chatId, userId, userName }) => {
      socket.to(chatId).emit('chat:typing', { userId, userName });
    });

    socket.on('chat:stop-typing', ({ chatId, userId }) => {
      socket.to(chatId).emit('chat:stop-typing', { userId });
    });

    // Manejar desconexión
    socket.on('disconnect', (reason) => {
      console.log(`❌ Usuario desconectado: ${socket.id} (${reason})`);

      if (socket.data.chatId && socket.data.userId) {
        socket.to(socket.data.chatId).emit('chat:user-left', {
          userId: socket.data.userId,
          userName: socket.data.userName || 'Usuario'
        });
      }
    });
  });

  return io;
}

// Endpoint para manejar solicitudes HTTP (requerido por Next.js)
export async function GET(req: NextRequest) {
  return new Response('WebSocket server running', { status: 200 });
}

export async function POST(req: NextRequest) {
  return new Response('WebSocket server running', { status: 200 });
}
