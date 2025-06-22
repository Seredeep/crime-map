import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// Función para obtener la dirección usando geocodificación inversa
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  // Validar que lat y lng sean números válidos
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return 'Ubicación no disponible';
  }

  try {
    // Usar el endpoint interno de geocodificación
    const response = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/geocode/reverse?lat=${lat}&lon=${lng}`
    );

    if (!response.ok) {
      console.error('Error en geocodificación inversa:', response.statusText);
      return `Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }

    const data = await response.json();

    if (!data.success) {
      console.error('Error en geocodificación inversa:', data.error);
      return `Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }

    // Usar la dirección formateada o el display_name
    return data.formatted_address || data.display_name || `Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (error) {
    console.error('Error al obtener dirección:', error);
    return `Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

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

    const { timestamp, location } = await request.json();

    // Conectar a la base de datos
    const client = await clientPromise;
    const db = client.db();

    // Buscar usuario para obtener información del barrio
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

    // Obtener dirección usando geocodificación inversa si hay coordenadas GPS
    let address = 'Ubicación GPS no disponible';
    let locationData = null;

    if (location && location.lat && location.lng) {
      // Usar la ubicación GPS real donde se ejecutó la alerta
      address = await reverseGeocode(location.lat, location.lng);
      locationData = {
        ...location,
        address: address
      };
      console.log(`📍 Alerta de pánico con GPS: ${address}`);
    } else {
      // Si no hay GPS, informar que no se pudo obtener ubicación exacta
      address = 'No se pudo obtener ubicación GPS exacta';
      console.log('⚠️ Alerta de pánico sin ubicación GPS');
    }

    // Crear registro de alerta de pánico con ubicación GPS
    const panicAlert = {
      userId: user._id,
      userEmail: user.email,
      userName: `${user.name} ${user.surname}`,
      neighborhood: user.neighborhood || 'Sin asignar',
      chatId: user.chatId,
      timestamp: new Date(timestamp),
      // Ubicación GPS real donde se ejecutó la alerta
      gpsLocation: locationData, // Coordenadas GPS exactas
      gpsAddress: address, // Dirección GPS geocodificada
      hasGPS: !!(locationData && locationData.lat && locationData.lng),
      // Información del usuario solo como referencia
      userInfo: {
        blockNumber: user.blockNumber,
        lotNumber: user.lotNumber,
        registeredAddress: user.blockNumber && user.lotNumber
          ? `Manzana ${user.blockNumber}, Lote ${user.lotNumber}`
          : null
      },
      status: 'active',
      createdAt: new Date(),
      resolved: false,
      resolvedAt: null,
      resolvedBy: null
    };

    // Guardar la alerta en la base de datos
    const alertResult = await db.collection('panic_alerts').insertOne(panicAlert);

            // Crear mensaje de pánico para el chat
    let messageContent;

    if (locationData && locationData.lat && locationData.lng) {
      // Con ubicación GPS exacta
      const locationText = `📍 Ubicación GPS: ${address}`;
      const accuracyText = locationData.accuracy
        ? `\n🎯 Precisión: ${Math.round(locationData.accuracy)}m`
        : '';
      const coordinatesText = `\n🗺️ Coordenadas: ${locationData.lat.toFixed(6)}, ${locationData.lng.toFixed(6)}`;
      const timeText = `⏰ Hora: ${new Date().toLocaleString('es-AR')}`;

      messageContent = `🚨 ¡ALERTA DE PÁNICO! 🚨\n\n❗ Necesito ayuda urgente\n\n${locationText}${accuracyText}${coordinatesText}\n${timeText}\n\n⚠️ Esta es una situación de emergencia. Por favor, contacten a las autoridades si es necesario.\n\n🚓 Servicios de emergencia: 911`;
    } else {
      // Sin ubicación GPS
      const userLocationText = user.blockNumber && user.lotNumber
        ? `\n🏠 Domicilio registrado: Manzana ${user.blockNumber}, Lote ${user.lotNumber}`
        : '';
      const timeText = `⏰ Hora: ${new Date().toLocaleString('es-AR')}`;

      messageContent = `🚨 ¡ALERTA DE PÁNICO! 🚨\n\n❗ Necesito ayuda urgente\n\n⚠️ No se pudo obtener ubicación GPS exacta${userLocationText}\n${timeText}\n\n⚠️ Esta es una situación de emergencia. Por favor, contacten a las autoridades si es necesario.\n\n🚓 Servicios de emergencia: 911`;
    }

    const panicMessage = {
      chatId: user.chatId,
      userId: user._id.toString(),
      userName: `${user.name} ${user.surname}`,
      message: messageContent,
      timestamp: new Date(),
      type: 'panic',
      isOwn: false,
      metadata: {
        alertType: 'panic',
        alertId: alertResult.insertedId.toString(),
        location: locationData,
        address: address,
        hasGPS: !!(locationData && locationData.lat && locationData.lng),
        neighborhood: user.neighborhood,
        accuracy: locationData?.accuracy || null,
        // Solo incluir datos del usuario como referencia, no como ubicación principal
        userBlockNumber: user.blockNumber,
        userLotNumber: user.lotNumber
      }
    };

    // Guardar mensaje en la colección de mensajes
    const messageResult = await db.collection('messages').insertOne(panicMessage);

    // Actualizar la alerta con el ID del mensaje
    await db.collection('panic_alerts').updateOne(
      { _id: alertResult.insertedId },
      { $set: { messageId: messageResult.insertedId } }
    );

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

    console.log(`🚨 ALERTA DE PÁNICO COMPLETA - ${user.neighborhood}:`, {
      user: `${user.name} ${user.surname}`,
      hasGPS: !!(locationData && locationData.lat && locationData.lng),
      gpsLocation: locationData ? `${locationData.lat.toFixed(6)}, ${locationData.lng.toFixed(6)}` : 'No disponible',
      gpsAddress: address,
      chatId: user.chatId,
      alertId: alertResult.insertedId.toString(),
      messageId: messageResult.insertedId.toString(),
      time: new Date(timestamp).toLocaleString('es-ES')
    });

    return NextResponse.json({
      success: true,
      message: locationData && locationData.lat && locationData.lng
        ? 'Alerta de pánico enviada con ubicación GPS exacta'
        : 'Alerta de pánico enviada (sin ubicación GPS)',
      data: {
        alertId: alertResult.insertedId.toString(),
        messageId: messageResult.insertedId.toString(),
        chatId: user.chatId,
        neighborhood: user.neighborhood,
        hasGPS: !!(locationData && locationData.lat && locationData.lng),
        gpsLocation: locationData,
        gpsAddress: address,
        timestamp: panicAlert.timestamp,
        status: 'sent'
      }
    });

  } catch (error) {
    console.error('Error al enviar alerta de pánico:', error);
    return NextResponse.json(
      { success: false, message: 'Error al enviar la alerta de pánico' },
      { status: 500 }
    );
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
