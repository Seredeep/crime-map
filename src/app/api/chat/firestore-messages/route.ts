import { firestore } from '@/lib/config/db/firebase'; // Importar firestore para obtener usuarios
import clientPromise from '@/lib/config/db/mongodb';
import { getChatMessagesFromFirestore } from '@/lib/services/chat/firestoreChatService';
import admin from 'firebase-admin'; // Importar admin
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

    // Buscar usuario en MongoDB (para obtener chatId, aunque ahora usaremos Firestore para esto)
    // NOTA: Idealmente, el chatId del usuario debería obtenerse de una forma más consistente (ej. del token de sesión o un lookup en Firestore si es el source de verdad)
    // Por ahora, asumimos que `user.chatId` de MongoDB es el correcto para Firestore.
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

    // Obtener perfiles de los remitentes para incluir la imagen
    const uniqueUserIds = [...new Set(messages.map(msg => msg.userId))];
    const usersMap = new Map();

    if (uniqueUserIds.length > 0) {
      const usersSnapshot = await firestore.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', uniqueUserIds).get();
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        usersMap.set(doc.id, userData);
      });
    }

    // Formatear mensajes para el frontend incluyendo la imagen de perfil del remitente
    const formattedMessages = messages.map(msg => {
      const sender = usersMap.get(msg.userId);
      const senderProfileImage = sender?.profileImage || null; // Obtener profileImage

      return {
        id: msg.id,
        userId: msg.userId,
        userName: msg.userName,
        message: msg.message,
        timestamp: msg.timestamp?.toDate?.() || msg.timestamp,
        type: msg.type,
        isOwn: msg.userId === user._id.toString(),
        metadata: msg.metadata,
        senderProfileImage: senderProfileImage, // <-- Nueva propiedad
      };
    });

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
