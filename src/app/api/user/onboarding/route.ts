import { assignUserToNeighborhood } from '@/lib/chatService';
import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';

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

    // Validar que blockNumber y lotNumber sean números
    if (typeof blockNumber !== 'number' || typeof lotNumber !== 'number') {
      return NextResponse.json(
        { success: false, message: 'El número de manzana y lote deben ser números válidos' },
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

    // Actualizar usuario con la información básica
    const updateResult = await db.collection('users').updateOne(
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

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Error al actualizar el usuario' },
        { status: 500 }
      );
    }

    // Asignar neighborhood y agregar al chat correspondiente
    try {
      const { neighborhood, chatId } = await assignUserToNeighborhood(
        user._id.toString(),
        blockNumber,
        lotNumber
      );

      return NextResponse.json({
        success: true,
        message: 'Información de perfil actualizada correctamente',
        data: {
          neighborhood,
          chatId
        }
      });
    } catch (chatError) {
      console.error('Error al asignar neighborhood:', chatError);
      // Aunque falle la asignación del chat, el onboarding fue exitoso
      return NextResponse.json({
        success: true,
        message: 'Información de perfil actualizada correctamente, pero hubo un error al asignar el chat del barrio',
        warning: 'El chat del barrio se asignará automáticamente más tarde'
      });
    }
  } catch (error) {
    console.error('Error en onboarding:', error);
    return NextResponse.json(
      { success: false, message: 'Error al actualizar la información del perfil' },
      { status: 500 }
    );
  }
}
