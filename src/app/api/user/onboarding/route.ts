import { assignUserToNeighborhood, calculateNeighborhood } from '@/lib/chatService';
import clientPromise from '@/lib/mongodb';
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

    // Obtener datos del cuerpo de la petición
    const body = await request.json();
    const { blockNumber: blockNumberRaw, lotNumber: lotNumberRaw } = body;

    // Convertir a números y validar
    const blockNumber = parseInt(blockNumberRaw, 10);
    const lotNumber = parseInt(lotNumberRaw, 10);

    if (isNaN(blockNumber) || isNaN(lotNumber) || blockNumber <= 0 || lotNumber <= 0) {
      return NextResponse.json(
        { success: false, error: 'Número de manzana y lote deben ser números válidos mayores a 0' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Buscar usuario por email
    const user = await db.collection('users').findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Calcular neighborhood
    const neighborhood = calculateNeighborhood(blockNumber, lotNumber);

    // Actualizar información del usuario
    await db.collection('users').updateOne(
      { email: session.user.email },
      {
        $set: {
          blockNumber,
          lotNumber,
          neighborhood,
          onboarded: true,
          isOnboarded: true,
          updatedAt: new Date()
        }
      }
    );

    // Asignar usuario al chat del neighborhood usando el servicio original
    try {
      const chatAssignment = await assignUserToNeighborhood(
        user._id.toString(),
        blockNumber,
        lotNumber
      );

      console.log(`✅ Usuario asignado al chat: ${chatAssignment.neighborhood}`);

      return NextResponse.json({
        success: true,
        data: {
          blockNumber,
          lotNumber,
          neighborhood: chatAssignment.neighborhood,
          chatId: chatAssignment.chatId,
          message: 'Onboarding completado exitosamente'
        }
      });

    } catch (chatError) {
      console.error('Error al asignar usuario al chat:', chatError);

      // Aunque falle la asignación al chat, el onboarding se considera exitoso
      return NextResponse.json({
        success: true,
        data: {
          blockNumber,
          lotNumber,
          neighborhood,
          message: 'Onboarding completado (chat no disponible temporalmente)'
        }
      });
    }

  } catch (error) {
    console.error('Error en onboarding:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
