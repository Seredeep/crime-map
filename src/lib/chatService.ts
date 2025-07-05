import { firestore } from './firebase';
import { addParticipantToChatInFirestore, chatExistsInFirestore, createChatInFirestore, getChatParticipantsFromFirestore, getUserChatFromFirestore, updateUserChatIdInFirestore } from './firestoreChatService';
import { ChatWithParticipants, User } from './types';

/**
 * Calcula el neighborhood basado en blockNumber y lotNumber
 * Agrupa cada 10 bloques en un neighborhood
 */
export function calculateNeighborhood(blockNumber: number, lotNumber: number): string {
  const neighborhoodId = Math.floor(blockNumber / 10);
  return `Barrio ${neighborhoodId}`;
}

/**
 * Asigna un neighborhood a un usuario y lo agrega al chat correspondiente
 */
export async function assignUserToNeighborhood(userId: string, neighborhoodName: string): Promise<{ neighborhood: string; chatId: string }> {
  try {
    // El chatId será el nombre del barrio normalizado
    const chatId = `chat_${neighborhoodName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '')}`;

    // Verificar si el chat existe en Firestore
    const chatExists = await chatExistsInFirestore(chatId);
    if (!chatExists) {
      // Si no existe, crearlo
      await createChatInFirestore(chatId, neighborhoodName, [userId]);
    } else {
      // Si existe, agregar al participante si no está ya
      await addParticipantToChatInFirestore(chatId, userId);
    }

    // Actualizar usuario con neighborhood y chatId en Firestore
    await updateUserChatIdInFirestore(userId, chatId);

    return {
      neighborhood: neighborhoodName,
      chatId,
    };
  } catch (error) {
    console.error('Error asignando usuario a barrio en Firestore:', error);
    throw error;
  }
}

/**
 * Obtiene todos los participantes de un chat por chatId desde Firestore
 */
export async function getChatParticipants(chatId: string): Promise<User[]> {
  return getChatParticipantsFromFirestore([chatId]);
}

/**
 * Obtiene el chat de un usuario por su email desde Firestore
 */
export async function getUserChat(userEmail: string): Promise<ChatWithParticipants | null> {
  return getUserChatFromFirestore(userEmail);
}

/**
 * Obtiene el chat de un usuario por su ID desde Firestore
 */
export async function getUserChatById(userId: string): Promise<ChatWithParticipants | null> {
  try {
    // Buscar usuario en Firestore por ID
    const userDoc = await firestore.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return null;
    }

    const userData = userDoc.data();

    if (!userData || !userData.chatId) {
      return null;
    }

    // Buscar chat en Firestore
    const chatDoc = await firestore.collection('chats').doc(userData.chatId).get();

    if (!chatDoc.exists) {
      console.log(`Chat ${userData.chatId} no encontrado en Firestore`);
      return null;
    }

    const chatData = chatDoc.data();

    // Obtener participantes
    const participants = await getChatParticipantsFromFirestore(chatData.participants);

    return {
      _id: userData.chatId,
      neighborhood: chatData.neighborhood,
      participants,
      createdAt: chatData.createdAt?.toDate(),
      updatedAt: chatData.updatedAt?.toDate(),
    } as ChatWithParticipants;
  } catch (error) {
    console.error('Error obteniendo chat por ID de usuario desde Firestore:', error);
    return null;
  }
}
