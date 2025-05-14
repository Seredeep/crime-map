import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener datos del formulario
    const { name, surname, blockNumber, lotNumber } = await request.json();

    // Validar datos requeridos
    if (!name || !surname || !blockNumber || !lotNumber) {
      return NextResponse.json(
        { success: false, message: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Conectar a la base de datos
    const client = await clientPromise;
    const db = client.db();

    // Actualizar usuario
    const result = await db.collection('users').updateOne(
      { _id: ObjectId.createFromHexString(session.user.id) },
      {
        $set: {
          name,
          surname,
          blockNumber,
          lotNumber,
          onboarded: true,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Información de perfil actualizada correctamente'
    });
  } catch (error) {
    console.error('Error en onboarding:', error);
    return NextResponse.json(
      { success: false, message: 'Error al actualizar la información del perfil' },
      { status: 500 }
    );
  }
} 