import { syncChatToFirestore } from '@/lib/firestoreChatService';
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

    // Buscar usuario en MongoDB
    const client = await clientPromise;
    const db = client.db();
    const user = await db.collection('users').findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el usuario tenga un chatId asignado
    if (!user.chatId) {
      return NextResponse.json(
        { success: false, error: 'Usuario no asignado a ningún chat' },
        { status: 400 }
      );
    }

    // Sincronizar chat a Firestore
    await syncChatToFirestore(user.chatId);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Chat sincronizado exitosamente',
        chatId: user.chatId,
        neighborhood: user.neighborhood
      }
    });

  } catch (error) {
    console.error('Error al sincronizar chat:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Ruta para sincronizar todos los chats (solo para administradores)
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar si es administrador (puedes ajustar esta lógica)
    const client = await clientPromise;
    const db = client.db();
    const user = await db.collection('users').findOne({ email: session.user.email });

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    // Obtener todos los chats de MongoDB
    const chats = await db.collection('chats').find({}).toArray();

    let syncedCount = 0;
    let errorCount = 0;

    for (const chat of chats) {
      try {
        await syncChatToFirestore(chat._id.toString());
        syncedCount++;
      } catch (error) {
        console.error(`Error sincronizando chat ${chat._id}:`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Sincronización completada',
        syncedChats: syncedCount,
        errors: errorCount,
        totalChats: chats.length
      }
    });

  } catch (error) {
    console.error('Error en sincronización masiva:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
