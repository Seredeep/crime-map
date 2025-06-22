import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
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

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const lastMessageId = searchParams.get('lastMessageId');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Construir query para mensajes
    const query: any = { chatId: user.chatId };

    if (lastMessageId) {
      // Para polling: obtener solo mensajes más nuevos que el último conocido
      query._id = { $gt: new ObjectId(lastMessageId) };
    }

    // Obtener mensajes
    const messages = await db.collection('messages')
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    // Convertir a formato esperado por el frontend
    const formattedMessages = messages.map(msg => ({
      id: msg._id.toString(),
      userId: msg.userId,
      userName: msg.userName,
      message: msg.message,
      timestamp: msg.timestamp,
      type: msg.type || 'normal',
      isOwn: msg.userId === user._id.toString(),
      metadata: msg.metadata || {}
    }));

    // Obtener información del chat
    const chat = await db.collection('chats').findOne({
      _id: new ObjectId(user.chatId)
    });

    // Contar total de mensajes
    const total = await db.collection('messages').countDocuments({
      chatId: user.chatId
    });

    return NextResponse.json({
      success: true,
      data: {
        messages: formattedMessages.reverse(), // Ordenar cronológicamente
        hasMore: messages.length === limit,
        total,
        chatId: user.chatId,
        neighborhood: chat?.neighborhood || 'Barrio desconocido'
      }
    });

  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
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
