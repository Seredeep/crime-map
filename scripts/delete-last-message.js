// scripts/delete-last-message.js
require('dotenv').config({ path: '../.env.local' });
const admin = require('firebase-admin');

// Inicializar Firebase si no está inicializado
if (!admin.apps.length) {
  const serviceAccount = require('../service-account-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const firestore = admin.firestore();

async function deleteLastMessage(chatId = 'chat_zacagnini_jose_manuel') {
  try {
    console.log(`🗑️  Borrando último mensaje del chat: ${chatId}`);
    console.log('==========================================');

    // Obtener todos los mensajes ordenados por timestamp
    const messagesSnapshot = await firestore
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (messagesSnapshot.empty) {
      console.log('❌ No hay mensajes para borrar');
      return;
    }

    const lastMessage = messagesSnapshot.docs[0];
    const messageData = lastMessage.data();

    console.log('📋 Información del mensaje a borrar:');
    console.log(`   ID: ${lastMessage.id}`);
    console.log(`   Usuario: ${messageData.userName}`);
    console.log(`   Mensaje: ${messageData.message.substring(0, 50)}...`);
    console.log(`   Timestamp: ${messageData.timestamp?.toDate?.() || messageData.timestamp}`);

    // Borrar el mensaje
    await firestore
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .doc(lastMessage.id)
      .delete();

    console.log('✅ Último mensaje borrado exitosamente');

    // Actualizar el chat con el nuevo último mensaje
    const remainingMessages = await firestore
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (!remainingMessages.empty) {
      const newLastMessage = remainingMessages.docs[0].data();
      await firestore.collection('chats').doc(chatId).update({
        lastMessage: newLastMessage.message.substring(0, 100) + '...',
        lastMessageAt: newLastMessage.timestamp,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Chat actualizado con nuevo último mensaje');
    } else {
      // Si no quedan mensajes, limpiar el chat
      await firestore.collection('chats').doc(chatId).update({
        lastMessage: null,
        lastMessageAt: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Chat limpiado (no quedan mensajes)');
    }

  } catch (error) {
    console.error('❌ Error borrando mensaje:', error.message);
  }
}

deleteLastMessage();
