import { firestore } from '@/lib/config/db/firebase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { chatId, userId, userName, isTyping } = await request.json();

    if (!chatId || !userId) {
      return NextResponse.json(
        { success: false, error: 'chatId y userId son requeridos' },
        { status: 400 }
      );
    }

    const userTypingRef = firestore.collection('chats').doc(chatId).collection('typingUsers').doc(userId);

    if (isTyping) {
      // Agregar o actualizar usuario que está escribiendo en Firestore
      await userTypingRef.set({
        userId,
        userName: userName || 'Usuario',
        timestamp: new Date(),
      }, { merge: true });
    } else {
      // Remover usuario que dejó de escribir de Firestore
      await userTypingRef.delete();
    }

    return NextResponse.json({
      success: true,
      message: isTyping ? 'Typing status set' : 'Typing status removed'
    });

  } catch (error) {
    console.error('Error managing typing status:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json(
        { success: false, error: 'chatId es requerido' },
        { status: 400 }
      );
    }

    const typingUsersSnapshot = await firestore.collection('chats').doc(chatId).collection('typingUsers').get();
    const activeUsers: Array<{
      userId: string;
      userName: string;
      timestamp: number;
    }> = [];
    const now = Date.now();

    typingUsersSnapshot.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      // Filtrar usuarios con timestamp muy antiguo (más de 10 segundos)
      if (data.timestamp && (now - data.timestamp.toDate().getTime() < 10000)) {
        activeUsers.push({
          userId: data.userId,
          userName: data.userName,
          timestamp: data.timestamp.toDate().getTime()
        });
      }
    });

    return NextResponse.json({
      success: true,
      typingUsers: activeUsers
    });

  } catch (error) {
    console.error('Error getting typing users:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
