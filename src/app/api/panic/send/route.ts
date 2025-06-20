import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import clientPromise from '@/lib/mongodb';
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

    // Crear registro de alerta de pánico
    const panicAlert = {
      userId: user._id,
      userEmail: user.email,
      userName: `${user.name} ${user.surname}`,
      neighborhood: user.neighborhood || 'Sin asignar',
      chatId: user.chatId,
      blockNumber: user.blockNumber,
      lotNumber: user.lotNumber,
      timestamp: new Date(timestamp),
      location,
      status: 'active',
      createdAt: new Date(),
      // Información adicional para futuras mejoras
      resolved: false,
      resolvedAt: null,
      resolvedBy: null
    };

    // Guardar la alerta en la base de datos
    const result = await db.collection('panic_alerts').insertOne(panicAlert);

    // TODO: Aquí se podría implementar:
    // - Notificaciones push a los vecinos del barrio
    // - Envío de emails/SMS a contactos de emergencia
    // - Integración con servicios de emergencia
    // - WebSocket para notificaciones en tiempo real

    console.log(`🚨 ALERTA DE PÁNICO - ${user.neighborhood}:`, {
      user: `${user.name} ${user.surname}`,
      location: `Manzana ${user.blockNumber}, Lote ${user.lotNumber}`,
      time: new Date(timestamp).toLocaleString('es-ES'),
      alertId: result.insertedId
    });

    return NextResponse.json({
      success: true,
      message: 'Alerta de pánico enviada exitosamente',
      data: {
        alertId: result.insertedId.toString(),
        neighborhood: user.neighborhood,
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
