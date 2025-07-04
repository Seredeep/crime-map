import { ObjectId } from 'mongodb';
import { firestore } from './firebase';
import clientPromise from './mongodb';
import { ChatWithParticipants, User } from './types';

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
  lastMessage?: string;
  lastMessageAt?: any; // Firestore Timestamp
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
}

/**
 * Obtiene el chat de un usuario desde Firestore
 * Primero busca el usuario en MongoDB para obtener su chatId
 */
export async function getUserChatFromFirestore(userEmail: string): Promise<ChatWithParticipants | null> {
  try {
    // Buscar usuario en MongoDB
    const client = await clientPromise;
    const db = client.db();
    const user = await db.collection('users').findOne({ email: userEmail });

    if (!user || !user.chatId) {
      return null;
    }

    // Buscar chat en Firestore
    const chatDoc = await firestore.collection('chats').doc(user.chatId).get();

    if (!chatDoc.exists) {
      console.log(`Chat ${user.chatId} no encontrado en Firestore`);
      return null;
    }

    const chatData = chatDoc.data() as FirestoreChat;

    // Obtener participantes desde MongoDB
    const participants = await getChatParticipantsFromMongo(user.chatId);

    return {
      _id: user.chatId,
      neighborhood: chatData.neighborhood,
      participants,
      createdAt: chatData.createdAt?.toDate(),
      updatedAt: chatData.updatedAt?.toDate()
    };
  } catch (error) {
    console.error('Error obteniendo chat desde Firestore:', error);
    return null;
  }
}

/**
 * Obtiene participantes de un chat desde MongoDB
 */
export async function getChatParticipantsFromMongo(chatId: string): Promise<User[]> {
  const client = await clientPromise;
  const db = client.db();

  // Buscar el chat en MongoDB para obtener participantes
  const chat = await db.collection('chats').findOne({ _id: new ObjectId(chatId) });

  if (!chat) {
    throw new Error('Chat no encontrado en MongoDB');
  }

  // Obtener información de todos los participantes
  const participants = await db.collection('users')
    .find({
      _id: { $in: chat.participants.map((id: string) => new ObjectId(id)) }
    })
    .toArray();

  return participants.map((user: any) => ({
    ...user,
    _id: user._id.toString()
  })) as User[];
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

    // Actualizar último mensaje del chat
    await firestore.collection('chats').doc(chatId).update({
      lastMessage: message.trim(),
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
  limit: number = 50
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
 * Sincroniza un chat de MongoDB a Firestore
 */
export async function syncChatToFirestore(chatId: string): Promise<void> {
  try {
    const client = await clientPromise;
    const db = client.db();

    // Obtener chat desde MongoDB
    const mongoChat = await db.collection('chats').findOne({ _id: new ObjectId(chatId) });

    if (!mongoChat) {
      throw new Error(`Chat ${chatId} no encontrado en MongoDB`);
    }

    // Verificar si ya existe en Firestore
    const exists = await chatExistsInFirestore(chatId);
    if (exists) {
      console.log(`Chat ${chatId} ya existe en Firestore`);
      return;
    }

    // Crear chat en Firestore
    await createChatInFirestore(
      chatId,
      mongoChat.neighborhood,
      mongoChat.participants || []
    );

    // Migrar mensajes
    const messages = await db.collection('messages')
      .find({ chatId: new ObjectId(chatId) })
      .sort({ timestamp: 1 })
      .toArray();

    console.log(`📝 Migrando ${messages.length} mensajes para chat ${chatId}`);

    for (const message of messages) {
      await sendMessageToFirestore(
        chatId,
        message.userId,
        message.userName,
        message.message,
        message.type || 'normal',
        message.metadata
      );
    }

    console.log(`✅ Chat ${chatId} sincronizado exitosamente`);
  } catch (error) {
    console.error(`Error sincronizando chat ${chatId}:`, error);
    throw error;
  }
}
