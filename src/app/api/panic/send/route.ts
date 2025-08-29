import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import clientPromise from '@/lib/config/db/mongodb';
import { sendMessageToFirestore } from '@/lib/services/chat/firestoreChatService';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { firestore } from '@/lib/config/db/firebase';
import { sendPushToUsers } from '@/lib/services/notifications/pushService';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { location, address } = await req.json(); // Recibir también la dirección

    const client = await clientPromise;
    const db = client.db();
    const currentUser = await db.collection('users').findOne({ email: session.user.email });

    if (!currentUser) {
      return NextResponse.json({ success: false, message: 'User not found in DB' }, { status: 404 });
    }

    const { _id: userId, name: userName, neighborhood, chatId, blockNumber, lotNumber } = currentUser;

    if (!chatId) {
      return NextResponse.json({ success: false, message: 'User does not have an associated chat ID.' }, { status: 400 });
    }

    const panicMessageText = '🚨 ¡ALERTA DE PÁNICO! 🚨'; // Mensaje de pánico

    const metadata = {
      gpsLocation: location ? `${location.lat},${location.lng}` : 'No disponible',
      gpsAddress: address || (location ? 'Ubicación GPS exacta obtenida' : 'No se pudo obtener ubicación GPS exacta'), // Usar la dirección recibida
      hasGPS: !!location,
      originalLocation: location, // Almacenar el objeto de ubicación completo
      address: address, // Asegurarse de que la dirección se guarde en los metadatos
      blockNumber: blockNumber || null,
      lotNumber: lotNumber || null,
    };

    const messageId = await sendMessageToFirestore(
      chatId.toString(), // Convertir ObjectId a string
      userId.toString(), // Convertir ObjectId a string
      userName || session.user.name || 'Usuario desconocido',
      panicMessageText,
      'panic',
      metadata
    );

    console.log(`🚨 COMPLETE PANIC ALERT - Neighborhood ${neighborhood}:`, {
      user: userName || session.user.name,
      hasGPS: !!location,
      gpsLocation: metadata.gpsLocation,
      gpsAddress: metadata.gpsAddress, // Mostrar la dirección si está disponible
      chatId: chatId.toString(),
      messageId: messageId,
      time: new Date().toISOString()
    });

    // Trigger push notifications (high priority) to other participants
    try {
      const chatDoc = await firestore.collection('chats').doc(String(chatId)).get();
      const chatData = chatDoc.exists ? (chatDoc.data() as any) : null;
      const participantIds: string[] = chatData?.participants || [];
      const targets = participantIds.map(String).filter((id) => id !== String(userId));

      if (targets.length) {
        const payload = {
          title: `🚨 Pánico en ${neighborhood}`,
          body: metadata?.address || 'Alerta de pánico activada',
          data: {
            type: 'panic',
            chatId: String(chatId),
            messageId: String(messageId),
          },
          android: { priority: 'high', channelId: 'panic' },
        } as const;
        await sendPushToUsers(targets, payload);
      }
    } catch (e) {
      console.warn('No se pudieron enviar notificaciones push de pánico:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Alerta de pánico enviada exitosamente a Firestore.',
      data: {
        chatId: chatId.toString(),
        messageId: messageId,
        neighborhood: neighborhood,
        timestamp: new Date().toISOString(),
        status: 'sent'
      }
    });

  } catch (error: any) {
    console.error('Error al manejar la alerta de pánico:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor al procesar la alerta de pánico.',
      error: error.message
    }, { status: 500 });
  }
}

// Endpoint para obtener alertas activas (opcional)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Buscar usuario
    const user = await db.collection('users').findOne({ email: session.user.email });

    if (!user || !user.neighborhood) {
      return NextResponse.json({
        success: true,
        message: 'No hay alertas para mostrar',
        data: { alerts: [] }
      });
    }

    // Obtener alertas activas del barrio (últimas 24 horas)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const alerts = await db.collection('panic_alerts')
      .find({
        neighborhood: user.neighborhood,
        timestamp: { $gte: yesterday },
        status: 'active'
      })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    return NextResponse.json({
      success: true,
      message: 'Alertas obtenidas exitosamente',
      data: {
        alerts: alerts.map(alert => ({
          id: alert._id.toString(),
          userName: alert.userName,
          neighborhood: alert.neighborhood,
          timestamp: alert.timestamp,
          location: `Manzana ${alert.blockNumber}`,
          status: alert.status
        }))
      }
    });

  } catch (error) {
    console.error('Error al obtener alertas:', error);
    return NextResponse.json(
      { success: false, message: 'Error al obtener las alertas' },
      { status: 500 }
    );
  }
}
