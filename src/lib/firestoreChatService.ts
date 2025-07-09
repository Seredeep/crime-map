import * as admin from 'firebase-admin';
import { firestore } from './firebase';
import { ChatWithParticipants, LastChatMessage, User } from './types';

export interface FirestoreMessage {
  id?: string;
  message: string;
  timestamp: any; // Firestore Timestamp
  type: 'normal' | 'panic';
  userId: string;
  userName: string;
  metadata?: any;
}

export interface FirestoreChat {
  neighborhood: string;
  participants: string[];
  lastMessageAt?: any; // Firestore Timestamp
  lastMessage?: LastChatMessage;
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
}

/**
 * Obtiene el chat de un usuario desde Firestore
 */
export async function getUserChatFromFirestore(userEmail: string): Promise<ChatWithParticipants | null> {
  try {
    // Buscar usuario en Firestore
    const userSnapshot = await firestore.collection('users').where('email', '==', userEmail).limit(1).get();

    if (userSnapshot.empty) {
      console.log(`Usuario con email ${userEmail} no encontrado.`);
      return null;
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    let chatDoc;

    // 1. Intentar obtener el chat con el chatId del usuario
    if (userData.chatId) {
      const chatDocRef = firestore.collection('chats').doc(userData.chatId);
      chatDoc = await chatDocRef.get();
    }

    // 2. Si el chat no se encontró con el chatId, intentar buscar por barrio
    if (!chatDoc || !chatDoc.exists) {
      if (userData.chatId) {
        console.warn(`Chat con ID ${userData.chatId} no encontrado. Buscando por barrio: ${userData.neighborhood}`);
      } else {
        console.log(`Usuario no tiene chatId. Buscando por barrio: ${userData.neighborhood}`);
      }

      if (!userData.neighborhood) {
        console.log(`El usuario ${userEmail} no tiene barrio asignado, no se puede buscar chat.`);
        return null;
      }

      const neighborhoodChatSnapshot = await firestore
        .collection('chats')
        .where('neighborhood', '==', userData.neighborhood)
        .limit(1)
        .get();

      if (!neighborhoodChatSnapshot.empty) {
        chatDoc = neighborhoodChatSnapshot.docs[0];
        const correctChatId = chatDoc.id;
        console.log(`Chat encontrado por barrio: ${correctChatId}. Actualizando ID de chat del usuario ${userId}.`);

        // Actualizar el chatId en el documento del usuario para futuras búsquedas
        await firestore.collection('users').doc(userId).update({ chatId: correctChatId });
      } else {
        console.log(`No se encontró ningún chat para el barrio: ${userData.neighborhood}`);
        return null;
      }
    }

    const chatData = chatDoc.data() as FirestoreChat;

    // Obtener participantes desde Firestore
    const participants = await getChatParticipantsFromFirestore(chatData.participants);

    return {
      _id: chatDoc.id,
      neighborhood: chatData.neighborhood,
      participants,
      lastMessageAt: chatData.lastMessageAt?.toDate(),
      lastMessage: chatData.lastMessage,
      createdAt: chatData.createdAt?.toDate(),
      updatedAt: chatData.updatedAt?.toDate()
    };
  } catch (error) {
    console.error('Error obteniendo chat desde Firestore:', error);
    return null;
  }
}

/**
 * Obtiene participantes de un chat desde Firestore
 */
export async function getChatParticipantsFromFirestore(participantIds: string[]): Promise<User[]> {
  try {
    if (participantIds.length === 0) {
      return [];
    }

    const usersSnapshot = await firestore.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', participantIds).get();
    const participants: User[] = [];
    usersSnapshot.forEach((doc: any) => {
      const data = doc.data();
      participants.push({
        _id: doc.id,
        email: data.email,
        name: data.name,
        surname: data.surname || '',
        blockNumber: data.blockNumber || null,
        lotNumber: data.lotNumber || null,
        neighborhood: data.neighborhood,
        role: data.role,
        chatId: data.chatId,
        profileImage: data.profileImage || null,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        onboarded: data.onboarded || false,
      } as User);
    });
    return participants;
  } catch (error) {
    console.error('Error obteniendo participantes desde Firestore:', error);
    return [];
  }
}

/**
 * Envía un mensaje a Firestore
 */
export async function sendMessageToFirestore(
  chatId: string,
  userId: string,
  userName: string,
  message: string,
  type: 'normal' | 'panic' = 'normal',
  metadata: any = {}
): Promise<string> {
  try {
    const messageData: FirestoreMessage = {
      message: message.trim(),
      timestamp: new Date(),
      type,
      userId,
      userName,
      metadata
    };

    // Crear documento de mensaje en Firestore
    const messageRef = await firestore
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .add(messageData);

    // Actualizar último mensaje del chat con la nueva estructura
    await firestore.collection('chats').doc(chatId).update({
      lastMessage: {
        userId: userId,
        userName: userName,
        message: message.trim(),
      },
      lastMessageAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`💬 Mensaje enviado a Firestore: ${userName} → ${chatId}`);
    return messageRef.id;
  } catch (error) {
    console.error('Error enviando mensaje a Firestore:', error);
    throw error;
  }
}

/**
 * Obtiene mensajes de un chat desde Firestore
 */
export async function getChatMessagesFromFirestore(
  chatId: string,
  limit: number = 0
): Promise<FirestoreMessage[]> {
  try {
    const messagesSnapshot = await firestore
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const messages: FirestoreMessage[] = [];
    messagesSnapshot.forEach((doc: any) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        message: data.message,
        timestamp: data.timestamp,
        type: data.type,
        userId: data.userId,
        userName: data.userName,
        metadata: data.metadata
      } as FirestoreMessage);
    });

    return messages.reverse(); // Ordenar por timestamp ascendente
  } catch (error) {
    console.error('Error obteniendo mensajes desde Firestore:', error);
    return [];
  }
}

/**
 * Crea un chat en Firestore si no existe
 */
export async function createChatInFirestore(
  chatId: string,
  neighborhood: string,
  participants: string[]
): Promise<void> {
  try {
    const chatData: FirestoreChat = {
      neighborhood,
      participants,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await firestore.collection('chats').doc(chatId).set(chatData);
    console.log(`✅ Chat creado en Firestore: ${chatId} (${neighborhood})`);
  } catch (error) {
    console.error('Error creando chat en Firestore:', error);
    throw error;
  }
}

/**
 * Verifica si un chat existe en Firestore
 */
export async function chatExistsInFirestore(chatId: string): Promise<boolean> {
  try {
    const chatDoc = await firestore.collection('chats').doc(chatId).get();
    return chatDoc.exists;
  } catch (error) {
    console.error('Error verificando chat en Firestore:', error);
    return false;
  }
}

/**
 * Agrega un participante a un chat existente en Firestore
 */
export async function addParticipantToChatInFirestore(chatId: string, userId: string): Promise<void> {
  try {
    await firestore.collection('chats').doc(chatId).update({
      participants: admin.firestore.FieldValue.arrayUnion(userId),
      updatedAt: new Date()
    });
    console.log(`✅ Usuario ${userId} agregado al chat ${chatId}`);
  } catch (error) {
    console.error(`Error agregando participante ${userId} al chat ${chatId}:`, error);
    throw error;
  }
}

/**
 * Actualiza el chatId de un usuario en Firestore
 */
export async function updateUserChatIdInFirestore(userId: string, chatId: string): Promise<void> {
  try {
    await firestore.collection('users').doc(userId).update({ chatId });
    console.log(`Updated user ${userId} with new chatId: ${chatId}`);
  } catch (error) {
    console.error('Error updating user chatId in Firestore:', error);
    throw error;
  }
}

// Placeholder for syncChatToFirestore - needs actual implementation
export async function syncChatToFirestore(chatId: string): Promise<void> {
  const chatDoc = await firestore.collection('chats').doc(chatId).get();
  const chatData = chatDoc.data() as FirestoreChat;
  const participants = await getChatParticipantsFromFirestore(chatData.participants);
  await firestore.collection('chats').doc(chatId).update({
    participants,
  });
}
