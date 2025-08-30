import { firestore } from '@/lib/config/db/firebase';
import clientPromise from '@/lib/config/db/mongodb';
import { sendMessageToFirestore } from '@/lib/services/chat/firestoreChatService';
import { sendPushToUsers } from '@/lib/services/notifications/pushService';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener datos del cuerpo
    const body = await request.json();
    const { message, type = 'normal', metadata = {} } = body;

    // Validar mensaje
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Mensaje requerido' },
        { status: 400 }
      );
    }

    // Buscar usuario en MongoDB
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

    // Preparar nombre público (anonimato opcional)
    const isAnonymous = Boolean(metadata?.anonymous);
    const publicUserName = isAnonymous
      ? 'Anonymous'
      : (user.name || user.email.split('@')[0]);

    // Enriquecer metadata con nombre real si se envía anónimo
    const finalMetadata = isAnonymous
      ? { ...metadata, originalUserName: (user.name || user.email.split('@')[0]) }
      : metadata;

    // Enviar mensaje a Firestore
    const messageId = await sendMessageToFirestore(
      user.chatId,
      user._id.toString(),
      publicUserName,
      message.trim(),
      type,
      finalMetadata
    );



    console.log(`💬 Mensaje enviado a Firestore: ${user.name || user.email} → ${user.chatId}`);

    // Trigger push notifications to other chat participants (best-effort)
    try {
      const chatDoc = await firestore.collection('chats').doc(user.chatId).get();
      const chatData = chatDoc.exists ? chatDoc.data() as any : null;
      const participantIds: string[] = chatData?.participants || [];
      const targets = participantIds
        .map(String)
        .filter((id) => id !== user._id.toString());

      if (targets.length) {
        const payload = {
          title: chatData?.neighborhood ? `Chat ${chatData.neighborhood}` : 'Nuevo mensaje',
          body: type === 'panic' ? 'Alerta de pánico' : message.trim().slice(0, 120),
          data: {
            type: type === 'panic' ? 'panic' : 'chat',
            chatId: String(user.chatId),
            messageId: String(messageId),
          },
          android: { priority: type === 'panic' ? 'high' : 'normal', channelId: type === 'panic' ? 'panic' : 'default' },
        } as const;
        await sendPushToUsers(targets, payload);
      }
    } catch (e) {
      console.warn('No se pudieron enviar notificaciones push:', e);
    }

    // Process new message asynchronously (fire-and-forget)
    const processMessagePayload = {
      messageId,
      chatId: user.chatId,
      userId: user._id.toString(),
      userName: publicUserName,
      message: message.trim(),
      type,
      metadata: finalMetadata,
      timestamp: new Date().toISOString()
    };

    // Fire and forget - don't await this request
    fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/chat/process-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(processMessagePayload),
    }).catch((error) => {
      console.error('Error calling message processing API:', error);
    });
    return NextResponse.json({
      success: true,
      data: {
        id: messageId,
        message: 'Mensaje enviado correctamente'
      }
    });

  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
