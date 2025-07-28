// scripts/delete-last-4-messages.js
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

async function deleteLast5Messages(chatId = 'chat_zacagnini_jose_manuel') {
  try {
    console.log(`🗑️  Borrando últimos 5 mensajes del chat: ${chatId}`);
    console.log('==========================================');

    // Obtener los últimos 5 mensajes ordenados por timestamp
    const messagesSnapshot = await firestore
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();

    if (messagesSnapshot.empty) {
      console.log('❌ No hay mensajes para borrar');
      return;
    }

    console.log(`📋 Encontrados ${messagesSnapshot.docs.length} mensajes para borrar:`);

    // Mostrar información de los mensajes que se van a borrar
    messagesSnapshot.docs.forEach((doc, index) => {
      const messageData = doc.data();
      console.log(`   ${index + 1}. ID: ${doc.id} | Usuario: ${messageData.userName} | Mensaje: ${messageData.message.substring(0, 50)}...`);
    });

    // Borrar cada mensaje
    const deletePromises = messagesSnapshot.docs.map(async (doc) => {
      await firestore
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .doc(doc.id)
        .delete();
    });

    await Promise.all(deletePromises);

    console.log('✅ Últimos 5 mensajes borrados exitosamente');

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
    console.error('❌ Error borrando mensajes:', error.message);
  }
}

deleteLast5Messages();
