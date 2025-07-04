const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function createTestData() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'crime-map');
    console.log('🧪 Creando datos de prueba...');
    const users = [
      { name: 'Juan Pérez', email: 'juan@test.com', neighborhood: 'Barrio 1', blockNumber: 15, lotNumber: 5, createdAt: new Date(), updatedAt: new Date() },
      { name: 'María García', email: 'maria@test.com', neighborhood: 'Barrio 1', blockNumber: 18, lotNumber: 3, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Carlos López', email: 'carlos@test.com', neighborhood: 'Barrio 2', blockNumber: 25, lotNumber: 7, createdAt: new Date(), updatedAt: new Date() }
    ];
    const userResults = await db.collection('users').insertMany(users);
    console.log(`✅ ${userResults.insertedCount} usuarios creados`);
    const chats = [
      { neighborhood: 'Barrio 1', participants: [userResults.insertedIds[0].toString(), userResults.insertedIds[1].toString()], lastMessage: 'Hola vecinos!', lastMessageAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { neighborhood: 'Barrio 2', participants: [userResults.insertedIds[2].toString()], lastMessage: 'Todo tranquilo por aquí', lastMessageAt: new Date(), createdAt: new Date(), updatedAt: new Date() }
    ];
    const chatResults = await db.collection('chats').insertMany(chats);
    console.log(`✅ ${chatResults.insertedCount} chats creados`);
    await db.collection('users').updateOne({ _id: userResults.insertedIds[0] }, { $set: { chatId: chatResults.insertedIds[0].toString() } });
    await db.collection('users').updateOne({ _id: userResults.insertedIds[1] }, { $set: { chatId: chatResults.insertedIds[0].toString() } });
    await db.collection('users').updateOne({ _id: userResults.insertedIds[2] }, { $set: { chatId: chatResults.insertedIds[1].toString() } });
    const messages = [
      { chatId: chatResults.insertedIds[0], userId: userResults.insertedIds[0].toString(), userName: 'Juan Pérez', message: 'Hola vecinos! ¿Cómo están?', timestamp: new Date(Date.now() - 3600000), type: 'normal' },
      { chatId: chatResults.insertedIds[0], userId: userResults.insertedIds[1].toString(), userName: 'María García', message: '¡Hola Juan! Todo bien por aquí', timestamp: new Date(Date.now() - 1800000), type: 'normal' },
      { chatId: chatResults.insertedIds[0], userId: userResults.insertedIds[0].toString(), userName: 'Juan Pérez', message: 'Me alegra escuchar eso', timestamp: new Date(Date.now() - 900000), type: 'normal' },
      { chatId: chatResults.insertedIds[1], userId: userResults.insertedIds[2].toString(), userName: 'Carlos López', message: 'Todo tranquilo por aquí en el Barrio 2', timestamp: new Date(Date.now() - 600000), type: 'normal' }
    ];
    const messageResults = await db.collection('messages').insertMany(messages);
    console.log(`✅ ${messageResults.insertedCount} mensajes creados`);
    console.log('🎉 Datos de prueba creados exitosamente!');
    console.log(`📊 Resumen:`);
    console.log(`   - Usuarios: ${userResults.insertedCount}`);
    console.log(`   - Chats: ${chatResults.insertedCount}`);
    console.log(`   - Mensajes: ${messageResults.insertedCount}`);
  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
  } finally {
    await client.close();
  }
}

createTestData();
