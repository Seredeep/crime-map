import { firestore } from '@/lib/config/db/firebase';
import clientPromise from '@/lib/config/db/mongodb';
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

    // Primero buscar usuario en MongoDB
    const client = await clientPromise;
    const db = client.db();
    const mongoUser = await db.collection('users').findOne({ email: session.user.email });

    if (!mongoUser) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado en MongoDB' },
        { status: 404 }
      );
    }

    const userId = mongoUser._id.toString();

    // Buscar usuario en Firestore también
    const userSnapshot = await firestore.collection('users').where('email', '==', session.user.email).limit(1).get();
    let userData = null;
    let firestoreUserId = null;

    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0];
      userData = userDoc.data();
      firestoreUserId = userDoc.id;
    }

    // Usar datos de MongoDB si no hay datos en Firestore
    if (!userData) {
      userData = {
        name: mongoUser.name,
        email: mongoUser.email,
        neighborhood: mongoUser.neighborhood,
        chatId: mongoUser.chatId
      };
    }

    // Obtener el chat del usuario
    const userChat = await getUserChatById(firestoreUserId || userId);

    if (!userChat) {
      return NextResponse.json(
        { success: false, error: 'Chat no encontrado para este usuario' },
        { status: 404 }
      );
    }

    const chatInfo = {
      chatId: userChat._id,
      userId: firestoreUserId || userId,
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
