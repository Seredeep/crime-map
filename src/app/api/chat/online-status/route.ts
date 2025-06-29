import { NextRequest, NextResponse } from 'next/server';

// Almacén temporal en memoria para usuarios online (en producción usar Redis)
const onlineUsers = new Map<string, Array<{
  userId: string;
  userName: string;
  lastSeen: number;
}>>();

export async function POST(request: NextRequest) {
  try {
    const { chatId, userId, userName, isOnline } = await request.json();

    if (!chatId || !userId) {
      return NextResponse.json(
        { success: false, error: 'chatId y userId son requeridos' },
        { status: 400 }
      );
    }

    const currentUsers = onlineUsers.get(chatId) || [];

    if (isOnline) {
      // Agregar o actualizar usuario online
      const existingIndex = currentUsers.findIndex(u => u.userId === userId);
      const userOnline = {
        userId,
        userName: userName || 'Usuario',
        lastSeen: Date.now()
      };

      if (existingIndex >= 0) {
        currentUsers[existingIndex] = userOnline;
      } else {
        currentUsers.push(userOnline);
      }
    } else {
      // Marcar como offline (no remover inmediatamente)
      const existingIndex = currentUsers.findIndex(u => u.userId === userId);
      if (existingIndex >= 0) {
        currentUsers[existingIndex].lastSeen = Date.now() - 300000; // 5 minutos atrás
      }
    }

    // Limpiar usuarios offline por más de 5 minutos
    const now = Date.now();
    const activeUsers = currentUsers.filter(u => now - u.lastSeen < 300000);
    onlineUsers.set(chatId, activeUsers);

    return NextResponse.json({
      success: true,
      message: isOnline ? 'User marked as online' : 'User marked as offline'
    });

  } catch (error) {
    console.error('Error managing online status:', error);
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

    const currentUsers = onlineUsers.get(chatId) || [];

    // Limpiar usuarios offline por más de 5 minutos
    const now = Date.now();
    const activeUsers = currentUsers.filter(u => now - u.lastSeen < 300000);
    onlineUsers.set(chatId, activeUsers);

    // Clasificar usuarios por estado
    const online = activeUsers.filter(u => now - u.lastSeen < 60000); // Online en último minuto
    const away = activeUsers.filter(u => now - u.lastSeen >= 60000); // Away entre 1-5 minutos

    return NextResponse.json({
      success: true,
      onlineUsers: online,
      awayUsers: away,
      totalActive: activeUsers.length
    });

  } catch (error) {
    console.error('Error getting online users:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
