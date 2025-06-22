import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { assignUserToNeighborhood } from '@/lib/chatService';
import clientPromise from '@/lib/mongodb';
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

    const { userEmail, forceReassign = false } = await request.json();

    if (!userEmail) {
      return NextResponse.json(
        { success: false, message: 'userEmail es requerido' },
        { status: 400 }
      );
    }

    // Conectar a la base de datos
    const client = await clientPromise;
    const db = client.db();

    // Buscar usuario por email
    const user = await db.collection('users').findOne({ email: userEmail });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si el usuario ya tiene un chat asignado
    if (user.chatId && !forceReassign) {
      return NextResponse.json({
        success: false,
        message: 'El usuario ya tiene un chat asignado. Usa forceReassign=true para reasignar',
        data: {
          currentChatId: user.chatId,
          currentNeighborhood: user.neighborhood
        }
      });
    }

    // Verificar que el usuario tenga blockNumber y lotNumber
    if (!user.blockNumber || !user.lotNumber) {
      return NextResponse.json(
        { success: false, message: 'El usuario debe completar el onboarding primero (blockNumber y lotNumber requeridos)' },
        { status: 400 }
      );
    }

    // Asignar neighborhood y agregar al chat correspondiente
    const { neighborhood, chatId } = await assignUserToNeighborhood(
      user._id.toString(),
      user.blockNumber,
      user.lotNumber
    );

    return NextResponse.json({
      success: true,
      message: forceReassign ? 'Usuario reasignado exitosamente' : 'Usuario asignado exitosamente',
      data: {
        userEmail,
        userId: user._id.toString(),
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

    // Conectar a la base de datos
    const client = await clientPromise;
    const db = client.db();

    // Obtener usuarios sin chat asignado pero con onboarding completo
    const usersWithoutChat = await db.collection('users')
      .find({
        onboarded: true,
        blockNumber: { $exists: true },
        lotNumber: { $exists: true },
        $or: [
          { chatId: { $exists: false } },
          { chatId: null },
          { neighborhood: { $exists: false } },
          { neighborhood: null }
        ]
      })
      .toArray();

    return NextResponse.json({
      success: true,
      message: 'Usuarios sin chat obtenidos exitosamente',
      data: {
        count: usersWithoutChat.length,
        users: usersWithoutChat.map(user => ({
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          surname: user.surname,
          blockNumber: user.blockNumber,
          lotNumber: user.lotNumber,
          currentNeighborhood: user.neighborhood,
          currentChatId: user.chatId
        }))
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
