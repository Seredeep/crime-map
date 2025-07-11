import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import { firestore } from "@/lib/config/db/firebase";
import clientPromise from '@/lib/config/db/mongodb';
import {
  addParticipantToChatInFirestore,
  chatExistsInFirestore,
  createChatInFirestore
} from '@/lib/services/chat/firestoreChatService';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener datos del cuerpo de la petición: ahora esperamos 'neighborhood'
    const body = await request.json();
    const { name, surname, blockNumber, lotNumber, neighborhood: selectedNeighborhood } = body;

    // Validar que se haya proporcionado un barrio
    if (!selectedNeighborhood || typeof selectedNeighborhood !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Debe proporcionar un barrio válido' },
        { status: 400 }
      );
    }

    // Conectar a MongoDB
    const client = await clientPromise;
    const db = client.db();

    // Buscar usuario por email en MongoDB (para obtener el _id original)
    const mongoUser = await db.collection('users').findOne({ email: session.user.email });

    if (!mongoUser) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado en MongoDB' },
        { status: 404 }
      );
    }
    const userIdString = mongoUser._id.toString();

    // Generar chatId en base al barrio seleccionado
    const normalizedNeighborhood = selectedNeighborhood.toLowerCase().replace(/ /g, '_');
    const chatId = `chat_${normalizedNeighborhood}`;

    // Actualizar información del usuario en MongoDB
    await db.collection('users').updateOne(
      { _id: mongoUser._id },
      {
        $set: {
          name,
          surname,
          blockNumber: blockNumber || null,
          lotNumber: lotNumber || null,
          neighborhood: selectedNeighborhood,
          onboarded: true,
          isOnboarded: true,
          updatedAt: new Date(),
          chatId: chatId,
        }
      }
    );

    // Actualizar información del usuario en Firestore
    const userDocRef = firestore.collection('users').doc(userIdString);
    await userDocRef.update({
      name,
      surname,
      blockNumber: blockNumber || null,
      lotNumber: lotNumber || null,
      neighborhood: selectedNeighborhood,
      onboarded: true,
      isOnboarded: true,
      updatedAt: new Date(),
      chatId: chatId,
    });

    // Asignar usuario al chat del neighborhood en Firestore
    try {
      const chatExists = await chatExistsInFirestore(chatId);

      if (!chatExists) {
        // Crear nuevo chat en Firestore si no existe
        await createChatInFirestore(chatId, selectedNeighborhood, [userIdString]);
        console.log(`✅ Nuevo chat ${chatId} creado en Firestore para ${selectedNeighborhood}`);
      } else {
        // Agregar usuario al chat existente en Firestore
        await addParticipantToChatInFirestore(chatId, userIdString);
        console.log(`✅ Usuario ${userIdString} agregado al chat existente ${chatId}`);
      }

      console.log(`✅ Usuario asignado al chat: ${selectedNeighborhood} con Chat ID: ${chatId}`);

      return NextResponse.json({
        success: true,
        data: {
          neighborhood: selectedNeighborhood,
          chatId,
          message: 'Onboarding completado exitosamente y chat asignado'
        }
      });

    } catch (chatError) {
      console.error('Error al asignar usuario al chat de Firestore:', chatError);

      return NextResponse.json({
        success: false,
        error: 'Error al asignar usuario al chat de barrio',
        data: {
          neighborhood: selectedNeighborhood,
          message: 'Onboarding completado pero hubo un error al asignar al chat de barrio.'
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error en onboarding:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
