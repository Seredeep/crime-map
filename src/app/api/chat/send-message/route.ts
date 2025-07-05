import { sendMessageToFirestore } from '@/lib/firestoreChatService';
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

    // Obtener datos del cuerpo
    const body = await request.json();
    const { message, type = 'normal', metadata = {} } = body;

    // Validar mensaje
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Mensaje requerido' },
        { status: 400 }
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

    // Enviar mensaje a Firestore
    const messageId = await sendMessageToFirestore(
      user.chatId,
      user._id.toString(),
      user.name || user.email.split('@')[0],
      message.trim(),
      type,
      metadata
    );

    console.log(`💬 Mensaje enviado a Firestore: ${user.name || user.email} → ${user.chatId}`);

    return NextResponse.json({
      success: true,
      data: {
        id: messageId,
        message: 'Mensaje enviado correctamente'
      }
    });

  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
