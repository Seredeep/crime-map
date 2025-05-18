import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    // Obtener datos del formulario
    const { name, surname, blockNumber, lotNumber, email } = await request.json();

    // Validar datos requeridos
    if (!name || !surname || !blockNumber || !lotNumber || !email) {
      return NextResponse.json(
        { success: false, message: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Conectar a la base de datos
    const client = await clientPromise;
    const db = client.db();

    // Buscar usuario por email
    const user = await db.collection('users').findOne({ email });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar usuario
    const result = await db.collection('users').updateOne(
      { email },
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
        { success: false, message: 'Error al actualizar el usuario' },
        { status: 500 }
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