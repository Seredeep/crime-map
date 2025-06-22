import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
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

    const { location } = await request.json();

    // Conectar a la base de datos
    const client = await clientPromise;
    const db = client.db();

    // Buscar usuario para obtener información del barrio y chat
    const user = await db.collection('users').findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    if (!user.chatId || !user.neighborhood) {
      return NextResponse.json(
        { success: false, message: 'Usuario no asignado a un barrio' },
        { status: 400 }
      );
    }

    // Crear mensaje de pánico
    const locationText = location
      ? `📍 Ubicación: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
      : `📍 Manzana ${user.blockNumber || 'N/A'}, Lote ${user.lotNumber || 'N/A'}`;

    const panicMessage = {
      chatId: user.chatId,
      userId: user._id.toString(),
      userName: `${user.name} ${user.surname}`,
      message: `🚨 ¡ALERTA DE PÁNICO! 🚨\n\nNecesito ayuda urgente.\n${locationText}\n\n⚠️ Esta es una situación de emergencia. Por favor, contacten a las autoridades si es necesario.`,
      timestamp: new Date(),
      type: 'panic',
      isOwn: false,
      metadata: {
        alertType: 'panic',
        location,
        blockNumber: user.blockNumber,
        lotNumber: user.lotNumber,
        neighborhood: user.neighborhood
      }
    };

    // Guardar mensaje en la colección de mensajes
    const messageResult = await db.collection('messages').insertOne(panicMessage);

    // También crear un registro en panic_alerts para tracking
    const panicAlert = {
      userId: user._id,
      userEmail: user.email,
      userName: `${user.name} ${user.surname}`,
      neighborhood: user.neighborhood,
      chatId: user.chatId,
      messageId: messageResult.insertedId,
      blockNumber: user.blockNumber,
      lotNumber: user.lotNumber,
      timestamp: new Date(),
      location,
      status: 'active',
      createdAt: new Date(),
      resolved: false,
      resolvedAt: null,
      resolvedBy: null
    };

    await db.collection('panic_alerts').insertOne(panicAlert);

    // Actualizar el chat con el último mensaje
    await db.collection('chats').updateOne(
      { _id: new ObjectId(user.chatId) },
      {
        $set: {
          lastMessage: panicMessage.message,
          lastMessageAt: panicMessage.timestamp,
          updatedAt: new Date()
        }
      }
    );

    console.log(`🚨 MENSAJE DE PÁNICO ENVIADO - ${user.neighborhood}:`, {
      user: `${user.name} ${user.surname}`,
      chatId: user.chatId,
      messageId: messageResult.insertedId.toString()
    });

    return NextResponse.json({
      success: true,
      message: 'Mensaje de pánico enviado al chat del barrio',
      data: {
        messageId: messageResult.insertedId.toString(),
        chatId: user.chatId,
        neighborhood: user.neighborhood,
        timestamp: panicMessage.timestamp
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
