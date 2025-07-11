import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { firestore } from '@/lib/config/db/firebase';
import { assignUserToNeighborhood } from '@/lib/services/chat/chatService';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Obtener sesión del usuario (solo admins pueden usar este endpoint)
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      );
    }

    const { userEmail, forceReassign = false, newNeighborhood } = await request.json();

    if (!userEmail) {
      return NextResponse.json(
        { success: false, message: 'userEmail es requerido' },
        { status: 400 }
      );
    }

    // Buscar usuario por email en Firestore
    const userSnapshot = await firestore.collection('users').where('email', '==', userEmail).limit(1).get();

    if (userSnapshot.empty) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado en Firestore' },
        { status: 404 }
      );
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    // Verificar si el usuario ya tiene un chat asignado y no se fuerza la reasignación
    if (userData.chatId && !forceReassign) {
      return NextResponse.json({
        success: false,
        message: 'El usuario ya tiene un chat asignado. Usa forceReassign=true para reasignar',
        data: {
          currentChatId: userData.chatId,
          currentNeighborhood: userData.neighborhood
        }
      });
    }

    // Determinar el barrio a usar para la reasignación
    const targetNeighborhood = newNeighborhood || userData.neighborhood;

    if (!targetNeighborhood) {
      return NextResponse.json(
        { success: false, message: 'El usuario debe tener un barrio asignado o proporcionar un newNeighborhood para reasignar' },
        { status: 400 }
      );
    }

    // Asignar neighborhood y agregar al chat correspondiente en Firestore
    const { neighborhood, chatId } = await assignUserToNeighborhood(
      userId,
      targetNeighborhood
    );

    return NextResponse.json({
      success: true,
      message: forceReassign ? 'Usuario reasignado exitosamente' : 'Usuario asignado exitosamente',
      data: {
        userEmail,
        userId,
        neighborhood,
        chatId
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

export async function GET() {
  try {
    // Obtener sesión del usuario
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener usuarios sin chat asignado pero con onboarding completo desde Firestore
    const usersSnapshot = await firestore.collection('users')
      .where('onboarded', '==', true)
      .where('neighborhood', '!=', null) // Asegurarse de que tienen un barrio asignado
      .where('chatId', '==', null) // Usuarios sin chatId
      .get();

    const usersWithoutChat: any[] = [];
    usersSnapshot.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      usersWithoutChat.push({
        id: doc.id,
        email: data.email,
        name: data.name,
        currentNeighborhood: data.neighborhood,
        currentChatId: data.chatId,
        // Otros campos que sean relevantes para mostrar
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Usuarios sin chat obtenidos exitosamente',
      data: {
        count: usersWithoutChat.length,
        users: usersWithoutChat
      }
    });
  } catch (error) {
    console.error('Error al obtener usuarios sin chat:', error);
    return NextResponse.json(
      { success: false, message: 'Error al obtener usuarios sin chat' },
      { status: 500 }
    );
  }
}
