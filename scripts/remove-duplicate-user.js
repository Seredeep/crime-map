// scripts/remove-duplicate-user.js
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

async function removeDuplicateUser(userId) {
  try {
    console.log(`🗑️  Eliminando usuario duplicado: ${userId}`);
    console.log('==========================================');

    // 1. Verificar que el usuario existe
    const userDoc = await firestore.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    const userData = userDoc.data();
    console.log('📋 Información del usuario a eliminar:');
    console.log(`   Nombre: ${userData.name}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Barrio: ${userData.neighborhood}`);
    console.log(`   ChatId: ${userData.chatId}`);
    console.log(`   Role: ${userData.role}`);

    // 2. Remover al usuario de la lista de participantes del chat
    if (userData.chatId) {
      const chatDoc = await firestore.collection('chats').doc(userData.chatId).get();

      if (chatDoc.exists) {
        const chatData = chatDoc.data();
        const participants = chatData.participants || [];

        if (participants.includes(userId)) {
          const updatedParticipants = participants.filter(id => id !== userId);

          await firestore.collection('chats').doc(userData.chatId).update({
            participants: updatedParticipants,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          console.log(`✅ Usuario removido de la lista de participantes del chat: ${userData.chatId}`);
        } else {
          console.log(`⚠️  Usuario no estaba en la lista de participantes del chat`);
        }
      } else {
        console.log(`⚠️  Chat ${userData.chatId} no encontrado`);
      }
    }

    // 3. Eliminar el usuario
    await firestore.collection('users').doc(userId).delete();
    console.log(`✅ Usuario eliminado exitosamente`);

    console.log('\n🎉 Proceso completado!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

const userId = process.argv[2];
if (!userId) {
  console.log('Uso: node remove-duplicate-user.js <userId>');
  console.log('Ejemplo: node remove-duplicate-user.js 6883c47f234069d1849f51ca');
  process.exit(1);
}

removeDuplicateUser(userId);
