import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { getChatParticipants } from '@/lib/chatService';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Obtener sesión del usuario
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener chatId de los parámetros de la URL
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json(
        { success: false, message: 'chatId es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el usuario pertenece a este chat
    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection('users').findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el usuario tiene acceso a este chat
    if (user.chatId !== chatId) {
      return NextResponse.json(
        { success: false, message: 'No tienes acceso a este chat' },
        { status: 403 }
      );
    }

    // Obtener participantes del chat
    const participants = await getChatParticipants(chatId);

    return NextResponse.json({
      success: true,
      message: 'Participantes obtenidos exitosamente',
      data: {
        chatId,
        participantsCount: participants.length,
        participants: participants.map(participant => ({
          id: participant._id,
          name: participant.name,
          surname: participant.surname,
          email: participant.email,
          blockNumber: participant.blockNumber,
          lotNumber: participant.lotNumber,
          neighborhood: participant.neighborhood
        }))
      }
    });
  } catch (error) {
    console.error('Error al obtener participantes del chat:', error);
    return NextResponse.json(
      { success: false, message: 'Error al obtener los participantes del chat' },
      { status: 500 }
    );
  }
}
