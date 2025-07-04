const { MongoClient, ObjectId } = require('mongodb');
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

class ChatMigrator {
  constructor() {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI no está definida en las variables de entorno');
    }
    if (!process.env.FIREBASE_PROJECT_ID) {
      throw new Error('FIREBASE_PROJECT_ID no está definida en las variables de entorno');
    }
    if (!admin.apps.length) {
      const serviceAccountPath = path.join(__dirname, '..', 'service-account-key.json');
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
        credential: admin.credential.cert(serviceAccountPath),
      });
    }
    this.firestore = admin.firestore();
  }
  async connect() {
    console.log('🔌 Conectando a MongoDB...');
    this.mongoClient = new MongoClient(process.env.MONGODB_URI);
    await this.mongoClient.connect();
    this.db = this.mongoClient.db(process.env.MONGODB_DB || 'crime-map');
    console.log('✅ Conectado a MongoDB');
  }
  async disconnect() {
    if (this.mongoClient) {
      await this.mongoClient.close();
      console.log('🔌 Desconectado de MongoDB');
    }
  }
  convertToFirestoreTimestamp(date) {
    if (!date) return undefined;
    return admin.firestore.Timestamp.fromDate(date);
  }
  convertToFirestoreChat(mongoChat) {
    return {
      neighborhood: mongoChat.neighborhood,
      participants: mongoChat.participants,
      lastMessage: mongoChat.lastMessage,
      lastMessageAt: this.convertToFirestoreTimestamp(mongoChat.lastMessageAt),
      createdAt: this.convertToFirestoreTimestamp(mongoChat.createdAt),
      updatedAt: this.convertToFirestoreTimestamp(mongoChat.updatedAt),
    };
  }
  convertToFirestoreMessage(mongoMessage) {
    return {
      message: mongoMessage.message,
      timestamp: this.convertToFirestoreTimestamp(mongoMessage.timestamp),
      type: mongoMessage.type || 'normal',
      userId: mongoMessage.userId,
      userName: mongoMessage.userName,
      metadata: mongoMessage.metadata,
    };
  }
  async migrateChats() {
    console.log('🚀 Iniciando migración de chats...');
    const chatsCollection = this.db.collection('chats');
    const messagesCollection = this.db.collection('messages');
    const mongoChats = await chatsCollection.find({}).toArray();
    console.log(`📊 Encontrados ${mongoChats.length} chats para migrar`);
    let migratedChats = 0;
    let skippedChats = 0;
    let totalMessages = 0;
    let migratedMessages = 0;
    let skippedMessages = 0;
    for (const mongoChat of mongoChats) {
      const chatId = mongoChat._id.toString();
      try {
        const existingChat = await this.firestore.collection('chats').doc(chatId).get();
        if (existingChat.exists) {
          console.log(`⏭️  Chat ${chatId} ya existe en Firestore, omitiendo...`);
          skippedChats++;
          continue;
        }
        console.log(`📝 Migrando chat ${chatId} (${mongoChat.neighborhood})...`);
        const firestoreChat = this.convertToFirestoreChat(mongoChat);
        await this.firestore.collection('chats').doc(chatId).set(firestoreChat);
        migratedChats++;
        const chatMessages = await messagesCollection.find({ chatId: mongoChat._id }).toArray();
        console.log(`💬 Encontrados ${chatMessages.length} mensajes para el chat ${chatId}`);
        totalMessages += chatMessages.length;
        for (const mongoMessage of chatMessages) {
          const messageId = mongoMessage._id.toString();
          try {
            const existingMessage = await this.firestore
              .collection('chats')
              .doc(chatId)
              .collection('messages')
              .doc(messageId)
              .get();
            if (existingMessage.exists) {
              console.log(`⏭️  Mensaje ${messageId} ya existe, omitiendo...`);
              skippedMessages++;
              continue;
            }
            const firestoreMessage = this.convertToFirestoreMessage(mongoMessage);
            await this.firestore
              .collection('chats')
              .doc(chatId)
              .collection('messages')
              .doc(messageId)
              .set(firestoreMessage);
            migratedMessages++;
            console.log(`✅ Mensaje ${messageId} migrado`);
          } catch (error) {
            console.error(`❌ Error migrando mensaje ${messageId}:`, error);
          }
        }
        console.log(`✅ Chat ${chatId} migrado exitosamente con ${chatMessages.length} mensajes`);
      } catch (error) {
        console.error(`❌ Error migrando chat ${chatId}:`, error);
      }
    }
    console.log('\n📊 RESUMEN DE MIGRACIÓN:');
    console.log(`📝 Chats migrados: ${migratedChats}`);
    console.log(`⏭️  Chats omitidos: ${skippedChats}`);
    console.log(`💬 Mensajes migrados: ${migratedMessages}`);
    console.log(`⏭️  Mensajes omitidos: ${skippedMessages}`);
    console.log(`📊 Total de mensajes procesados: ${totalMessages}`);
  }
  async run() {
    try {
      await this.connect();
      await this.migrateChats();
    } catch (error) {
      console.error('❌ Error durante la migración:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

async function main() {
  console.log('🔥 Iniciando migración de MongoDB a Firestore...');
  console.log('📋 Configuración:');
  console.log(`   - MongoDB URI: ${process.env.MONGODB_URI ? '✅ Configurada' : '❌ No configurada'}`);
  console.log(`   - Firebase Project ID: ${process.env.FIREBASE_PROJECT_ID ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`   - MongoDB Database: ${process.env.MONGODB_DB || 'crime-map'}`);
  console.log('');
  const migrator = new ChatMigrator();
  await migrator.run();
  console.log('\n🎉 ¡Migración completada exitosamente!');
}

if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}
