import { firestoreChatService } from '@/lib/firestoreChatService';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener datos del cuerpo
    const body = await request.json();
    const { message, type = 'normal', chatId = 'default-neighborhood-chat', metadata = {} } = body;

    // Validar mensaje
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Mensaje requerido' },
        { status: 400 }
      );
    }

    // Obtener datos del usuario
    const userId = session.user.id || session.user.email || '';
    const userName = session.user.name || 'Usuario';

    let success = false;

    // Enviar según el tipo
    if (type === 'panic') {
      const { location, alertType } = metadata;
      success = await firestoreChatService.sendPanicMessage(
        chatId,
        userId,
        userName,
        message.trim(),
        location,
        alertType
      );
    } else {
      success = await firestoreChatService.sendMessage(
        chatId,
        userId,
        userName,
        message.trim(),
        metadata
      );
    }

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Mensaje enviado correctamente'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Error enviando mensaje' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error en API de envío de mensajes:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
