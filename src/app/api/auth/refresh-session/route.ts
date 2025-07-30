import clientPromise from '@/lib/config/db/mongodb';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '../[...nextauth]/auth.config';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Buscar el usuario en la base de datos
    const user = await db.collection('users').findOne({
      email: session.user.email
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Devolver el estado actual del usuario
    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        onboarded: user.onboarded || user.isOnboarded || false,
        enabled: user.enabled,
        role: user.role,
        blockNumber: user.blockNumber,
        lotNumber: user.lotNumber,
        neighborhood: user.neighborhood
      }
    });

  } catch (error) {
    console.error('Error refreshing session:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
