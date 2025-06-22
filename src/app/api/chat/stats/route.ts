import clientPromise from '@/lib/mongodb';
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

    const client = await clientPromise;
    const db = client.db('crime-map');

    // Obtener usuario actual
    const user = await db.collection('users').findOne({
      email: session.user.email
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Obtener chat del usuario
    const chat = await db.collection('chats').findOne({
      participants: user._id
    });

    if (!chat) {
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

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Estadísticas de mensajes
    const [totalMessages, todayMessages, recentMessages] = await Promise.all([
      // Total de mensajes del chat
      db.collection('messages').countDocuments({ chatId: chat._id }),

      // Mensajes de hoy
      db.collection('messages').countDocuments({
        chatId: chat._id,
        timestamp: { $gte: startOfDay }
      }),

      // Mensajes de la última semana para actividad
      db.collection('messages').find({
        chatId: chat._id,
        timestamp: { $gte: weekAgo }
      }).sort({ timestamp: -1 }).limit(100).toArray()
    ]);

    // Última actividad
    const lastMessage = await db.collection('messages')
      .findOne({ chatId: chat._id }, { sort: { timestamp: -1 } });

    // Usuarios activos (que han enviado mensajes en las últimas 24h)
    const activeUsers = await db.collection('messages').distinct('userId', {
      chatId: chat._id,
      timestamp: { $gte: startOfDay }
    });

    // Incidentes recientes en el área (últimos 7 días)
    const recentIncidents = await db.collection('incidents').countDocuments({
      neighborhood: chat.neighborhood,
      createdAt: { $gte: weekAgo }
    });

    // Calcular nivel de seguridad basado en incidentes recientes
    let safetyLevel: 'high' | 'medium' | 'low' = 'high';
    let emergencyLevel: 'normal' | 'elevated' | 'high' = 'normal';

    if (recentIncidents > 10) {
      safetyLevel = 'low';
      emergencyLevel = 'high';
    } else if (recentIncidents > 5) {
      safetyLevel = 'medium';
      emergencyLevel = 'elevated';
    }

    // Mensajes de pánico recientes
    const panicMessages = await db.collection('messages').countDocuments({
      chatId: chat._id,
      type: 'panic',
      timestamp: { $gte: weekAgo }
    });

    if (panicMessages > 0) {
      safetyLevel = 'low';
      emergencyLevel = 'high';
    }

    // Actividad semanal (mensajes por día)
    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const dayMessages = await db.collection('messages').countDocuments({
        chatId: chat._id,
        timestamp: { $gte: dayStart, $lt: dayEnd }
      });

      weeklyActivity.push({
        date: dayStart.toISOString().split('T')[0],
        messages: dayMessages
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        totalMessages,
        todayMessages,
        activeUsers: activeUsers.length,
        lastActivity: lastMessage?.timestamp || null,
        safetyLevel,
        emergencyLevel,
        weeklyActivity,
        recentIncidents,
        panicMessages,
        neighborhood: chat.neighborhood,
        participantCount: chat.participants.length
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
