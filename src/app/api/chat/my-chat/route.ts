import { getUserChatById } from '@/lib/chatService';
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

    // Obtener el chat del usuario
    const userChat = await getUserChatById(user._id.toString());

    if (!userChat) {
      return NextResponse.json(
        { success: false, error: 'Chat no encontrado' },
        { status: 404 }
      );
    }

    // Formatear la respuesta
    const chatInfo = {
      chatId: userChat._id,
      userId: user._id.toString(),
      userName: user.name || user.email.split('@')[0],
      neighborhood: userChat.neighborhood,
      participantsCount: userChat.participants.length,
      participants: userChat.participants.map(p => ({
        id: p._id,
        name: p.name,
        surname: p.surname || '',
        email: p.email,
        blockNumber: p.blockNumber || 0,
        lotNumber: p.lotNumber || 0
      })),
      createdAt: userChat.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: userChat.updatedAt?.toISOString() || new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: chatInfo
    });

  } catch (error) {
    console.error('Error al obtener información del chat:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
