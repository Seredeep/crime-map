import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { getUserChat } from '@/lib/chatService';
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

    // Obtener el chat del usuario
    const userChat = await getUserChat(session.user.email);

    if (!userChat) {
      return NextResponse.json({
        success: true,
        message: 'No tienes un chat asignado aún',
        data: null
      });
    }

    // Obtener información del usuario actual para debugging
    const client = await (await import('@/lib/mongodb')).default;
    const db = client.db();
    const currentUser = await db.collection('users').findOne({ email: session.user.email });

    return NextResponse.json({
      success: true,
      message: 'Chat obtenido exitosamente',
      data: {
        chatId: userChat._id,
        userId: currentUser?._id?.toString(),
        userName: currentUser?.name || currentUser?.email,
        neighborhood: userChat.neighborhood,
        participantsCount: userChat.participants.length,
        participants: userChat.participants.map(participant => ({
          id: participant._id,
          name: participant.name,
          surname: participant.surname,
          email: participant.email,
          blockNumber: participant.blockNumber,
          lotNumber: participant.lotNumber
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
