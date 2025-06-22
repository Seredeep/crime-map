import { ObjectId } from 'mongodb';
import clientPromise from './mongodb';
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
export async function assignUserToNeighborhood(userId: string, blockNumber: number, lotNumber: number): Promise<{ neighborhood: string; chatId: string }> {
  const client = await clientPromise;
  const db = client.db();

  // Calcular neighborhood
  const neighborhood = calculateNeighborhood(blockNumber, lotNumber);

  // Buscar si ya existe un chat para este neighborhood
  let chat = await db.collection('chats').findOne({ neighborhood });

  if (!chat) {
    // Crear nuevo chat para el neighborhood
    const newChat = {
      neighborhood,
      participants: [userId],
      createdAt: new Date(),
    };

    const result = await db.collection('chats').insertOne(newChat);
    chat = { _id: result.insertedId, ...newChat };
  } else {
    // Verificar si el usuario ya está en el chat
    if (!chat.participants.includes(userId)) {
      // Agregar usuario al chat existente
      await db.collection('chats').updateOne(
        { _id: chat._id },
        {
          $push: { participants: userId } as any,
          $set: { updatedAt: new Date() }
        }
      );
    }
  }

  // Actualizar usuario con neighborhood y chatId
  await db.collection('users').updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        neighborhood,
        chatId: chat._id.toString(),
        updatedAt: new Date()
      }
    }
  );

  return {
    neighborhood,
    chatId: chat._id.toString()
  };
}

/**
 * Obtiene todos los participantes de un chat por chatId
 */
export async function getChatParticipants(chatId: string): Promise<User[]> {
  const client = await clientPromise;
  const db = client.db();

  // Buscar el chat
  const chat = await db.collection('chats').findOne({ _id: new ObjectId(chatId) });

  if (!chat) {
    throw new Error('Chat no encontrado');
  }

  // Obtener información de todos los participantes
  const participants = await db.collection('users')
    .find({
      _id: { $in: chat.participants.map((id: string) => new ObjectId(id)) }
    })
    .toArray();

  return participants.map(user => ({
    ...user,
    _id: user._id.toString()
  })) as User[];
}

/**
 * Obtiene el chat de un usuario por su email
 */
export async function getUserChat(userEmail: string): Promise<ChatWithParticipants | null> {
  const client = await clientPromise;
  const db = client.db();

  // Buscar usuario por email
  const user = await db.collection('users').findOne({ email: userEmail });

  if (!user || !user.chatId) {
    return null;
  }

  // Buscar el chat
  const chat = await db.collection('chats').findOne({ _id: new ObjectId(user.chatId) });

  if (!chat) {
    return null;
  }

  // Obtener participantes
  const participants = await getChatParticipants(user.chatId);

  return {
    _id: chat._id.toString(),
    neighborhood: chat.neighborhood,
    participants,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt
  };
}

/**
 * Obtiene el chat de un usuario por su ID
 */
export async function getUserChatById(userId: string): Promise<ChatWithParticipants | null> {
  const client = await clientPromise;
  const db = client.db();

  // Buscar usuario por ID
  const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

  if (!user || !user.chatId) {
    return null;
  }

  // Buscar el chat
  const chat = await db.collection('chats').findOne({ _id: new ObjectId(user.chatId) });

  if (!chat) {
    return null;
  }

  // Obtener participantes
  const participants = await getChatParticipants(user.chatId);

  return {
    _id: chat._id.toString(),
    neighborhood: chat.neighborhood,
    participants,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt
  };
}
