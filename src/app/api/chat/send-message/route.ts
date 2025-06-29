import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener datos del cuerpo
    const body = await request.json();
    const { message, type = 'normal', metadata = {} } = body;

    // Validar mensaje
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Mensaje requerido' },
        { status: 400 }
      );
    }

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

    // Verificar que el usuario tenga un chatId asignado
    if (!user.chatId) {
      return NextResponse.json(
        { success: false, error: 'Usuario no asignado a ningún chat' },
        { status: 400 }
      );
    }

    // Crear el mensaje
    const newMessage = {
      chatId: user.chatId,
      userId: user._id.toString(),
      userName: user.name || user.email.split('@')[0],
      message: message.trim(),
      type,
      timestamp: new Date(),
      metadata
    };

    // Insertar mensaje en la base de datos
    const result = await db.collection('messages').insertOne(newMessage);

    // Actualizar el último mensaje del chat
    await db.collection('chats').updateOne(
      { _id: new ObjectId(user.chatId) },
      {
        $set: {
          lastMessage: {
            text: message.trim(),
            userName: newMessage.userName,
            timestamp: new Date()
          },
          updatedAt: new Date()
        }
      }
    );

    console.log(`💬 Mensaje enviado: ${newMessage.userName} → ${user.chatId}`);

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        message: 'Mensaje enviado correctamente'
      }
    });

  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
