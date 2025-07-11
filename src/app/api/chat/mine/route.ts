import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { getUserChatFromFirestore } from '@/lib/services/chat/firestoreChatService';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Obtener sesión del usuario
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener el chat del usuario desde Firestore
    const userChat = await getUserChatFromFirestore(session.user.email);

    if (!userChat) {
      return NextResponse.json({
        success: true,
        message: 'No tienes un chat asignado aún',
        data: null
      });
    }

    // Encontrar al usuario actual dentro de los participantes del chat
    const currentUserInChat = userChat.participants.find(
      (p) => p.email === session.user.email
    );

    // Si no se encuentra el usuario en el chat, puede ser un problema de sincronización o datos
    if (!currentUserInChat) {
      console.error('Usuario actual no encontrado en la lista de participantes del chat.');
      return NextResponse.json(
        { success: false, message: 'Error al obtener datos del usuario en el chat' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Chat obtenido exitosamente',
      data: {
        chatId: userChat._id,
        userId: currentUserInChat._id,
        userName: currentUserInChat.name || currentUserInChat.email,
        neighborhood: userChat.neighborhood,
        participantsCount: userChat.participants.length,
        participants: userChat.participants.map(participant => ({
          id: participant._id,
          name: participant.name,
          email: participant.email,
        })),
        createdAt: userChat.createdAt,
        updatedAt: userChat.updatedAt
      }
    });
  } catch (error) {
    console.error('Error al obtener chat del usuario:', error);
    return NextResponse.json(
      { success: false, message: 'Error al obtener el chat del usuario' },
      { status: 500 }
    );
  }
}
