import { firestore } from '@/lib/config/db/firebase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { chatId, userId, userName, isOnline } = await request.json();

    if (!chatId || !userId) {
      return NextResponse.json(
        { success: false, error: 'chatId y userId son requeridos' },
        { status: 400 }
      );
    }

    const userOnlineStatusRef = firestore.collection('chats').doc(chatId).collection('onlineUsers').doc(userId);

    if (isOnline) {
      // Agregar o actualizar usuario online en Firestore
      await userOnlineStatusRef.set({
        userId,
        userName: userName || 'Usuario',
        lastSeen: new Date(),
      }, { merge: true });
    } else {
      // Marcar como offline en Firestore (actualizando lastSeen a un valor antiguo)
      await userOnlineStatusRef.set({
        lastSeen: new Date(Date.now() - 300000), // 5 minutos atrás
      }, { merge: true });
    }

    return NextResponse.json({
      success: true,
      message: isOnline ? 'User marked as online' : 'User marked as offline'
    });

  } catch (error) {
    console.error('Error managing online status:', error);
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

    const onlineUsersSnapshot = await firestore.collection('chats').doc(chatId).collection('onlineUsers').get();
    const activeUsers: Array<{
      userId: string;
      userName: string;
      lastSeen: number;
    }> = [];
    const now = Date.now();

    onlineUsersSnapshot.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      // Filtrar usuarios inactivos por más de 5 minutos (300000 ms)
      if (data.lastSeen && (now - data.lastSeen.toDate().getTime() < 300000)) {
        activeUsers.push({
          userId: data.userId,
          userName: data.userName,
          lastSeen: data.lastSeen.toDate().getTime()
        });
      }
    });

    // Clasificar usuarios por estado
    const online = activeUsers.filter(u => now - u.lastSeen < 60000); // Online en último minuto
    const away = activeUsers.filter(u => now - u.lastSeen >= 60000); // Away entre 1-5 minutos

    return NextResponse.json({
      success: true,
      onlineUsers: online,
      awayUsers: away,
      totalActive: activeUsers.length
    });

  } catch (error) {
    console.error('Error getting online users:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
