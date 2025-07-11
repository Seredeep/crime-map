import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { firestore } from '@/lib/config/db/firebase';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Obtener sesión del usuario
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      );
    }

    const { location, address } = await request.json();

    // Buscar usuario para obtener información del barrio y chat en Firestore
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

    if (!userData.chatId || !userData.neighborhood) {
      return NextResponse.json(
        { success: false, message: 'Usuario no asignado a un barrio o chat' },
        { status: 400 }
      );
    }

    // Crear mensaje de pánico
    const locationText = address
      ? `📍 Ubicación: ${address}`
      : location
        ? `📍 Ubicación: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
        : `📍 Manzana ${userData.blockNumber || 'N/A'}, Lote ${userData.lotNumber || 'N/A'}`;

    const panicMessageData = {
      chatId: userData.chatId,
      userId: userId,
      userName: `${userData.name} ${userData.surname || ''}`,
      message: `🚨 ¡ALERTA DE PÁNICO! 🚨\n\nNecesito ayuda urgente.\n${locationText}\n\n⚠️ Esta es una situación de emergencia. Por favor, contacten a las autoridades si es necesario.`,
      timestamp: new Date(),
      type: 'panic',
      isOwn: false,
      metadata: {
        alertType: 'panic',
        location,
        address,
        blockNumber: userData.blockNumber || null,
        lotNumber: userData.lotNumber || null,
        neighborhood: userData.neighborhood
      }
    };

    // Guardar mensaje en la colección de mensajes de Firestore
    const messageRef = await firestore.collection('chats').doc(userData.chatId).collection('messages').add(panicMessageData);

    // También crear un registro en panic_alerts en Firestore para tracking
    const panicAlertData = {
      userId: userId,
      userEmail: userData.email,
      userName: `${userData.name} ${userData.surname || ''}`,
      neighborhood: userData.neighborhood,
      chatId: userData.chatId,
      messageId: messageRef.id,
      blockNumber: userData.blockNumber || null,
      lotNumber: userData.lotNumber || null,
      timestamp: new Date(),
      location,
      address,
      status: 'active',
      createdAt: new Date(),
      resolved: false,
      resolvedAt: null,
      resolvedBy: null
    };

    await firestore.collection('panic_alerts').add(panicAlertData);

    // Actualizar el chat con el último mensaje en Firestore
    await firestore.collection('chats').doc(userData.chatId).update({
      lastMessage: panicMessageData.message,
      lastMessageAt: panicMessageData.timestamp,
      updatedAt: new Date()
    });

    console.log(`🚨 MENSAJE DE PÁNICO ENVIADO - ${userData.neighborhood}:`, {
      user: `${userData.name} ${userData.surname}`,
      chatId: userData.chatId,
      messageId: messageRef.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Mensaje de pánico enviado al chat del barrio',
      data: {
        messageId: messageRef.id,
        chatId: userData.chatId,
        neighborhood: userData.neighborhood,
        timestamp: panicMessageData.timestamp
      }
    });

  } catch (error) {
    console.error('Error al enviar mensaje de pánico:', error);
    return NextResponse.json(
      { success: false, message: 'Error al enviar el mensaje de pánico' },
      { status: 500 }
    );
  }
}
