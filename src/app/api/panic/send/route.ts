import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { sendMessageToFirestore } from '@/lib/firestoreChatService';
import clientPromise from '@/lib/mongodb';
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

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { location } = await req.json(); // location puede ser null o { lat, lng, accuracy, timestamp, fallback }

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
      gpsAddress: location ? 'Ubicación GPS exacta obtenida' : 'No se pudo obtener ubicación GPS exacta',
      hasGPS: !!location,
      originalLocation: location, // Almacenar el objeto de ubicación completo
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

    console.log(`🚨 ALERTA DE PÁNICO COMPLETA - Barrio ${neighborhood}:`, {
      user: userName || session.user.name,
      hasGPS: !!location,
      gpsLocation: metadata.gpsLocation,
      gpsAddress: metadata.gpsAddress,
      chatId: chatId.toString(),
      messageId: messageId,
      time: new Date().toISOString()
    });

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
