import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import clientPromise from '@/lib/config/db/mongodb';
import { Role, ROLES } from '@/lib/config/roles';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Verify session and admin role
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Acceso denegado' },
        { status: 403 }
      );
    }

    // Get request data
    const { userId, role } = await request.json() as { userId: string, role: Role };

    if (!userId || !role) {
      return NextResponse.json(
        { success: false, message: 'ID de usuario y rol requeridos' },
        { status: 400 }
      );
    }

    // Validate role
    if (!Object.values(ROLES).includes(role as Role)) {
      return NextResponse.json(
        { success: false, message: 'Rol inválido' },
        { status: 400 }
      );
    }

    // Connect to database
    const client = await clientPromise;
    const db = client.db();

    // Update user role
    const result = await db.collection('users').updateOne(
      { _id: ObjectId.createFromHexString(userId) },
      { $set: { role: role } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Rol de usuario actualizado correctamente a ${role}`
    });
  } catch (error) {
    console.error('Error al actualizar rol del usuario:', error);
    return NextResponse.json(
      { success: false, message: 'Error al actualizar rol del usuario' },
      { status: 500 }
    );
  }
}
