import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { assignUserToNeighborhood } from '@/lib/chatService';
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

    // Conectar a la base de datos
    const client = await clientPromise;
    const db = client.db();

    // Buscar usuario por email
    const user = await db.collection('users').findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el usuario tenga onboarding completo
    if (!user.onboarded || !user.blockNumber || !user.lotNumber) {
      return NextResponse.json(
        { success: false, message: 'El usuario debe completar el onboarding primero' },
        { status: 400 }
      );
    }

    // Verificar si ya tiene chat asignado
    if (user.neighborhood && user.chatId) {
      return NextResponse.json({
        success: true,
        message: 'El usuario ya tiene un chat asignado',
        data: {
          currentNeighborhood: user.neighborhood,
          currentChatId: user.chatId,
          blockNumber: user.blockNumber,
          lotNumber: user.lotNumber
        }
      });
    }

    // Asignar neighborhood y agregar al chat correspondiente
    const { neighborhood, chatId } = await assignUserToNeighborhood(
      user._id.toString(),
      parseInt(user.blockNumber),
      parseInt(user.lotNumber)
    );

    return NextResponse.json({
      success: true,
      message: 'Usuario asignado exitosamente al chat de su barrio',
      data: {
        userEmail: user.email,
        userName: `${user.name} ${user.surname}`,
        userId: user._id.toString(),
        neighborhood,
        chatId,
        blockNumber: user.blockNumber,
        lotNumber: user.lotNumber
      }
    });

  } catch (error) {
    console.error('Error al asignar usuario a chat:', error);
    return NextResponse.json(
      { success: false, message: 'Error al asignar el usuario al chat' },
      { status: 500 }
    );
  }
}

// Endpoint para verificar el estado del chat del usuario
export async function GET() {
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

    const user = await db.collection('users').findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const status = {
      hasOnboarding: user.onboarded || false,
      hasBlockNumber: !!user.blockNumber,
      hasLotNumber: !!user.lotNumber,
      hasNeighborhood: !!user.neighborhood,
      hasChatId: !!user.chatId,
      currentData: {
        blockNumber: user.blockNumber,
        lotNumber: user.lotNumber,
        neighborhood: user.neighborhood,
        chatId: user.chatId
      }
    };

    const needsAssignment = status.hasOnboarding &&
                           status.hasBlockNumber &&
                           status.hasLotNumber &&
                           (!status.hasNeighborhood || !status.hasChatId);

    return NextResponse.json({
      success: true,
      message: 'Estado del usuario obtenido',
      data: {
        ...status,
        needsAssignment,
        recommendedAction: needsAssignment ? 'POST a este mismo endpoint para asignar chat' : 'Usuario ya configurado correctamente'
      }
    });

  } catch (error) {
    console.error('Error al verificar estado del usuario:', error);
    return NextResponse.json(
      { success: false, message: 'Error al verificar el estado del usuario' },
      { status: 500 }
    );
  }
}
