import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const since = searchParams.get('since'); // Timestamp para obtener mensajes desde cierta fecha
    const chatId = searchParams.get('chatId'); // Chat ID específico (opcional)

    const client = await clientPromise;
    const db = client.db();

    // Buscar usuario por email
    const user = await db.collection('users').findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Determinar el chatId a usar
    const targetChatId = chatId || user.chatId;

    if (!targetChatId) {
      return NextResponse.json(
        { success: false, error: 'Usuario no asignado a ningún chat' },
        { status: 400 }
      );
    }

    // Construir query para mensajes
    const query: any = { chatId: targetChatId };

    // Si se especifica 'since', obtener mensajes desde esa fecha
    if (since) {
      const sinceTimestamp = parseInt(since);
      if (!isNaN(sinceTimestamp)) {
        query.timestamp = { $gt: new Date(sinceTimestamp) };
      }
    }

    // Obtener mensajes del chat
    const messages = await db.collection('messages')
      .find(query)
      .sort({ timestamp: since ? 1 : -1 }) // Ascendente si hay 'since', descendente si no
      .skip(since ? 0 : offset) // No usar offset con 'since'
      .limit(limit)
      .toArray();

    // Formatear mensajes
    const formattedMessages = messages.map(msg => ({
      id: msg._id.toString(),
      userId: msg.userId,
      userName: msg.userName,
      message: msg.message,
      timestamp: msg.timestamp.toISOString(),
      type: msg.type || 'normal',
      metadata: msg.metadata || {}
    }));

    // Solo revertir si no hay 'since' (para mantener orden cronológico en polling)
    const finalMessages = since ? formattedMessages : formattedMessages.reverse();

    return NextResponse.json({
      success: true,
      messages: finalMessages, // Cambiar 'data' por 'messages' para consistencia
      data: finalMessages, // Mantener 'data' para compatibilidad
      meta: {
        total: finalMessages.length,
        limit,
        offset: since ? 0 : offset,
        chatId: targetChatId,
        since: since || null
      }
    });

  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      );
    }

    const { message } = await request.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Mensaje requerido' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Obtener usuario actual
    const user = await db.collection('users').findOne({
      email: session.user.email
    });

    if (!user || !user.chatId) {
      return NextResponse.json(
        { success: false, message: 'Usuario no asignado a ningún chat' },
        { status: 404 }
      );
    }

    // Crear nuevo mensaje
    const newMessage = {
      chatId: user.chatId,
      userId: user._id.toString(),
      userName: user.name || user.email,
      message: message.trim(),
      timestamp: new Date(),
      type: 'normal',
      metadata: {}
    };

    // Insertar mensaje en la base de datos
    const result = await db.collection('messages').insertOne(newMessage);

    // Actualizar timestamp del chat
    await db.collection('chats').updateOne(
      { _id: new ObjectId(user.chatId) },
      { $set: { lastActivity: new Date() } }
    );

    // Retornar mensaje creado
    const createdMessage = {
      id: result.insertedId.toString(),
      userId: newMessage.userId,
      userName: newMessage.userName,
      message: newMessage.message,
      timestamp: newMessage.timestamp,
      type: newMessage.type,
      isOwn: true,
      metadata: newMessage.metadata
    };

    return NextResponse.json({
      success: true,
      data: createdMessage
    });

  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
