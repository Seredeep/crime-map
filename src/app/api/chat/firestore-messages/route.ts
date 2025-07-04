import { getChatMessagesFromFirestore } from '@/lib/firestoreChatService';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

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

    // Buscar usuario en MongoDB
    const client = await clientPromise;
    const db = client.db();
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

    // Obtener mensajes desde Firestore
    const messages = await getChatMessagesFromFirestore(user.chatId, limit);

    // Formatear mensajes para el frontend
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      userId: msg.userId,
      userName: msg.userName,
      message: msg.message,
      timestamp: msg.timestamp?.toDate?.() || msg.timestamp,
      type: msg.type,
      isOwn: msg.userId === user._id.toString(),
      metadata: msg.metadata
    }));

    return NextResponse.json({
      success: true,
      data: {
        messages: formattedMessages,
        chatId: user.chatId,
        neighborhood: user.neighborhood
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
