import { firestore } from '@/lib/config/db/firebase';
import clientPromise from '@/lib/config/db/mongodb';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener usuario actual desde Firestore
    const userSnapshot = await firestore.collection('users').where('email', '==', session.user.email).limit(1).get();

    if (userSnapshot.empty) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado en Firestore' },
        { status: 404 }
      );
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    // Obtener chat del usuario desde Firestore
    const chatDoc = await firestore.collection('chats').doc(userData.chatId).get();

    if (!chatDoc.exists) {
      return NextResponse.json({
        success: true,
        data: {
          totalMessages: 0,
          todayMessages: 0,
          activeUsers: 0,
          lastActivity: null,
          safetyLevel: 'medium',
          weeklyActivity: [],
          recentIncidents: 0,
          emergencyLevel: 'normal'
        }
      });
    }

    const chatData = chatDoc.data();
    const chatId = chatDoc.id;

    if (!chatData) {
      // This should ideally not be reached if chatDoc.exists is true, but it acts as a type guard.
      return NextResponse.json(
        { success: false, message: 'Datos del chat no encontrados a pesar de que el chat existe.' },
        { status: 404 }
      );
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Estadísticas de mensajes desde Firestore
    const [totalMessagesSnapshot, todayMessagesSnapshot, recentMessagesSnapshot, lastMessageSnapshot, panicMessagesSnapshot] = await Promise.all([
      // Total de mensajes del chat
      firestore.collection('chats').doc(chatId).collection('messages').get(),

      // Mensajes de hoy
      firestore.collection('chats').doc(chatId).collection('messages').where('timestamp', '>=', startOfDay).get(),

      // Mensajes de la última semana para actividad
      firestore.collection('chats').doc(chatId).collection('messages').where('timestamp', '>=', weekAgo).orderBy('timestamp', 'desc').limit(100).get(),

      // Última actividad
      firestore.collection('chats').doc(chatId).collection('messages').orderBy('timestamp', 'desc').limit(1).get(),

      // Mensajes de pánico recientes
      firestore.collection('chats').doc(chatId).collection('messages').where('type', '==', 'panic').where('timestamp', '>=', weekAgo).get(),
    ]);

    const totalMessages = totalMessagesSnapshot.size;
    const todayMessages = todayMessagesSnapshot.size;
    const recentMessages = recentMessagesSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data());
    const lastMessage = lastMessageSnapshot.docs[0]?.data()?.timestamp?.toDate() || null;
    const panicMessages = panicMessagesSnapshot.size;

    // Usuarios activos (que han enviado mensajes en las últimas 24h) desde Firestore
    const activeUserMessagesSnapshot = await firestore.collection('chats').doc(chatId).collection('messages').where('timestamp', '>=', startOfDay).get();
    const activeUsersSet = new Set<string>();
    activeUserMessagesSnapshot.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => activeUsersSet.add(doc.data().userId));
    const activeUsersCount = activeUsersSet.size;

    // Actividad semanal (mensajes por día) desde Firestore
    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const dayMessagesSnapshot = await firestore.collection('chats').doc(chatId).collection('messages').where('timestamp', '>=', dayStart).where('timestamp', '<', dayEnd).get();
      weeklyActivity.push({
        date: dayStart.toISOString().split('T')[0],
        messages: dayMessagesSnapshot.size
      });
    }

    // Incidentes recientes en el área (últimos 7 días) - Mantiene en MongoDB
    const client = await clientPromise;
    const db = client.db('demo');
    const recentIncidents = await (db.collection('incidents') as any).countDocuments({
      neighborhood: chatData.neighborhood,
      createdAt: { $gte: weekAgo }
    });

    // Calcular nivel de seguridad basado en incidentes recientes y mensajes de pánico
    let safetyLevel: 'high' | 'medium' | 'low' = 'high';
    let emergencyLevel: 'normal' | 'elevated' | 'high' = 'normal';

    if (recentIncidents > 10 || panicMessages > 0) {
      safetyLevel = 'low';
      emergencyLevel = 'high';
    } else if (recentIncidents > 5) {
      safetyLevel = 'medium';
      emergencyLevel = 'elevated';
    }

    return NextResponse.json({
      success: true,
      data: {
        totalMessages,
        todayMessages,
        activeUsers: activeUsersCount,
        lastActivity: lastMessage,
        safetyLevel,
        emergencyLevel,
        weeklyActivity,
        recentIncidents,
        panicMessages,
        neighborhood: chatData.neighborhood,
        participantCount: chatData.participants.length
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas del chat:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
