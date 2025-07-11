import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { firestore } from '@/lib/config/db/firebase';
import { assignUserToNeighborhood } from '@/lib/services/chat/chatService';
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

    // Buscar usuario por email en Firestore
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

    // Verificar que el usuario tenga onboarding completo y neighborhood
    if (!userData.onboarded || !userData.neighborhood) {
      return NextResponse.json(
        { success: false, message: 'El usuario debe completar el onboarding primero y tener un barrio asignado' },
        { status: 400 }
      );
    }

    // Verificar si ya tiene chat asignado
    if (userData.neighborhood && userData.chatId) {
      return NextResponse.json({
        success: true,
        message: 'El usuario ya tiene un chat asignado',
        data: {
          currentNeighborhood: userData.neighborhood,
          currentChatId: userData.chatId,
          // blockNumber: userData.blockNumber, // Estos campos ya no se usan para la asignación de chat
          // lotNumber: userData.lotNumber
        }
      });
    }

    // Asignar neighborhood y agregar al chat correspondiente
    const { neighborhood, chatId } = await assignUserToNeighborhood(
      userId,
      userData.neighborhood
    );

    return NextResponse.json({
      success: true,
      message: 'Usuario asignado exitosamente al chat de su barrio',
      data: {
        userEmail: userData.email,
        userName: `${userData.name}`,
        userId: userId,
        neighborhood,
        chatId,
        blockNumber: userData.blockNumber || null,
        lotNumber: userData.lotNumber || null
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

    // Buscar usuario por email en Firestore
    const userSnapshot = await firestore.collection('users').where('email', '==', session.user.email).limit(1).get();

    if (userSnapshot.empty) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado en Firestore' },
        { status: 404 }
      );
    }

    const userData = userSnapshot.docs[0].data();

    const status = {
      hasOnboarding: userData.onboarded || false,
      // hasBlockNumber: !!userData.blockNumber, // Estos campos ya no se usan para la asignación de chat
      // hasLotNumber: !!userData.lotNumber,
      hasNeighborhood: !!userData.neighborhood,
      hasChatId: !!userData.chatId,
      currentData: {
        // blockNumber: userData.blockNumber,
        // lotNumber: userData.lotNumber,
        neighborhood: userData.neighborhood,
        chatId: userData.chatId
      }
    };

    const needsAssignment = status.hasOnboarding &&
                           status.hasNeighborhood &&
                           (!status.hasChatId);

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
