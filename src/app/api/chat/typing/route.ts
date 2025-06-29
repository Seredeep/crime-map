import { NextRequest, NextResponse } from 'next/server';

// Almacén temporal en memoria para typing (en producción usar Redis)
const typingUsers = new Map<string, Array<{
  userId: string;
  userName: string;
  timestamp: number;
}>>();

export async function POST(request: NextRequest) {
  try {
    const { chatId, userId, userName, isTyping } = await request.json();

    if (!chatId || !userId) {
      return NextResponse.json(
        { success: false, error: 'chatId y userId son requeridos' },
        { status: 400 }
      );
    }

    const currentUsers = typingUsers.get(chatId) || [];

    if (isTyping) {
      // Agregar o actualizar usuario que está escribiendo
      const existingIndex = currentUsers.findIndex(u => u.userId === userId);
      const userTyping = {
        userId,
        userName: userName || 'Usuario',
        timestamp: Date.now()
      };

      if (existingIndex >= 0) {
        currentUsers[existingIndex] = userTyping;
      } else {
        currentUsers.push(userTyping);
      }
    } else {
      // Remover usuario que dejó de escribir
      const filteredUsers = currentUsers.filter(u => u.userId !== userId);
      typingUsers.set(chatId, filteredUsers);
    }

    // Limpiar usuarios con timestamp muy antiguo (más de 10 segundos)
    const now = Date.now();
    const activeUsers = currentUsers.filter(u => now - u.timestamp < 10000);
    typingUsers.set(chatId, activeUsers);

    return NextResponse.json({
      success: true,
      message: isTyping ? 'Typing status set' : 'Typing status removed'
    });

  } catch (error) {
    console.error('Error managing typing status:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json(
        { success: false, error: 'chatId es requerido' },
        { status: 400 }
      );
    }

    const currentUsers = typingUsers.get(chatId) || [];

    // Limpiar usuarios con timestamp muy antiguo
    const now = Date.now();
    const activeUsers = currentUsers.filter(u => now - u.timestamp < 10000);
    typingUsers.set(chatId, activeUsers);

    return NextResponse.json({
      success: true,
      typingUsers: activeUsers
    });

  } catch (error) {
    console.error('Error getting typing users:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
