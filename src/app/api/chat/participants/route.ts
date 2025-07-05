import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { getChatParticipants } from '@/lib/chatService';
import { firestore } from '@/lib/firebase';
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

    // Verificar que el usuario pertenece a este chat usando Firestore
    const userSnapshot = await firestore.collection('users').where('email', '==', session.user.email).limit(1).get();

    if (userSnapshot.empty) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado en Firestore' },
        { status: 404 }
      );
    }

    const userData = userSnapshot.docs[0].data();

    // Verificar que el usuario tiene acceso a este chat
    if (userData.chatId !== chatId) {
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
          email: participant.email,
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
