// scripts/check-chat-participants.js
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

async function checkChatParticipants(chatId) {
  try {
    console.log(`🔍 Verificando participantes del chat: ${chatId}`);
    console.log('==============================================');

    // Obtener el chat
    const chatDoc = await firestore.collection('chats').doc(chatId).get();

    if (!chatDoc.exists) {
      console.log('❌ Chat no encontrado');
      return;
    }

    const chatData = chatDoc.data();
    console.log(`📋 Información del chat:`);
    console.log(`   Barrio: ${chatData.neighborhood}`);
    console.log(`   Participantes: ${chatData.participants ? chatData.participants.length : 0}`);

    if (!chatData.participants || chatData.participants.length === 0) {
      console.log('❌ No hay participantes en este chat');
      return;
    }

    console.log('\n👥 Lista de participantes:');
    console.log('==========================');

    // Obtener información de cada participante
    for (let i = 0; i < chatData.participants.length; i++) {
      const participantId = chatData.participants[i];

      try {
        const userDoc = await firestore.collection('users').doc(participantId).get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          console.log(`\n${i + 1}. ID: ${participantId}`);
          console.log(`   Nombre: ${userData.name || 'No especificado'}`);
          console.log(`   Email: ${userData.email || 'No especificado'}`);
          console.log(`   Barrio: ${userData.neighborhood || 'No asignado'}`);
          console.log(`   ChatId: ${userData.chatId || 'No asignado'}`);
          console.log(`   Onboarded: ${userData.onboarded || false}`);
          console.log(`   Role: ${userData.role || 'default'}`);

          if (userData.blockNumber || userData.lotNumber) {
            console.log(`   Ubicación: Manzana ${userData.blockNumber || 'N/A'}, Lote ${userData.lotNumber || 'N/A'}`);
          }
        } else {
          console.log(`\n${i + 1}. ID: ${participantId} - ❌ Usuario no encontrado`);
        }
      } catch (error) {
        console.log(`\n${i + 1}. ID: ${participantId} - ❌ Error: ${error.message}`);
      }
    }

    // Verificar duplicados por nombre
    console.log('\n🔍 Verificando duplicados por nombre...');
    const names = [];
    const duplicates = [];

    for (const participantId of chatData.participants) {
      try {
        const userDoc = await firestore.collection('users').doc(participantId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          const name = userData.name || 'Sin nombre';

          if (names.includes(name)) {
            duplicates.push({
              name,
              email: userData.email,
              id: participantId
            });
          } else {
            names.push(name);
          }
        }
      } catch (error) {
        console.log(`Error verificando participante ${participantId}: ${error.message}`);
      }
    }

    if (duplicates.length > 0) {
      console.log('\n⚠️  DUPLICADOS ENCONTRADOS:');
      console.log('==========================');
      duplicates.forEach(dup => {
        console.log(`   Nombre: ${dup.name}`);
        console.log(`   Email: ${dup.email}`);
        console.log(`   ID: ${dup.id}`);
        console.log('');
      });
    } else {
      console.log('\n✅ No se encontraron duplicados por nombre');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

const chatId = process.argv[2];
if (!chatId) {
  console.log('Uso: node check-chat-participants.js <chatId>');
  console.log('Ejemplo: node check-chat-participants.js chat_zacagnini_jose_manuel');
  process.exit(1);
}

checkChatParticipants(chatId);
