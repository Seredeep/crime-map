import { firestore } from '@/lib/config/db/firebase';
import { getUserChatById } from '@/lib/services/chat/chatService';
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

    // Buscar usuario por email en Firestore
    const userSnapshot = await firestore.collection('users').where('email', '==', session.user.email).limit(1).get();

    if (userSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado en Firestore' },
        { status: 404 }
      );
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id; // ID del documento de Firestore

    // Obtener el chat del usuario
    const userChat = await getUserChatById(userId);

    if (!userChat) {
      return NextResponse.json(
        { success: false, error: 'Chat no encontrado para este usuario' },
        { status: 404 }
      );
    }

    const chatInfo = {
      chatId: userChat._id,
      userId: userId,
      userName: userData.name || userData.email.split('@')[0],
      neighborhood: userChat.neighborhood,
      participantsCount: userChat.participants.length,
      participants: userChat.participants.map(p => ({
        id: p._id,
        name: p.name,
        surname: p.surname,
        email: p.email,
        neighborhood: p.neighborhood,
        profileImage: p.profileImage || null
      })),
      lastMessage: userChat.lastMessage || null,
      lastMessageAt: userChat.lastMessageAt || null,
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
