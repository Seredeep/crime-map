// scripts/check-firestore-user.js
require('dotenv').config({ path: '../.env.local' });

// Importar Firebase Admin
const admin = require('firebase-admin');

// Inicializar Firebase si no está inicializado
const { initializeFirebaseAdmin } = require('./firebase-service-account');

// Inicializar Firebase
initializeFirebaseAdmin();

const firestore = admin.firestore();

async function checkFirestoreUser(email) {
  try {
    console.log(`🔍 Verificando usuario en Firestore: ${email}`);
    console.log('==========================================');

    // Buscar usuario en Firestore
    const userSnapshot = await firestore.collection('users').where('email', '==', email).limit(1).get();

    if (userSnapshot.empty) {
      console.log('❌ Usuario no encontrado en Firestore');
      return;
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    console.log('✅ Usuario encontrado en Firestore:');
    console.log('===================================');
    console.log(`ID: ${userId}`);
    console.log(`Nombre: ${userData.name || 'No especificado'}`);
    console.log(`Email: ${userData.email}`);
    console.log(`Barrio: ${userData.neighborhood || 'No asignado'}`);
    console.log(`Chat ID: ${userData.chatId || 'No asignado'}`);
    console.log(`Onboarded: ${userData.onboarded}`);
    console.log(`Block Number: ${userData.blockNumber || 'No especificado'}`);
    console.log(`Lot Number: ${userData.lotNumber || 'No especificado'}`);

    // Verificar si existe el chat
    if (userData.chatId) {
      const chatDoc = await firestore.collection('chats').doc(userData.chatId).get();

      if (chatDoc.exists) {
        const chatData = chatDoc.data();
        console.log('\n✅ Chat encontrado:');
        console.log(`   Chat ID: ${chatDoc.id}`);
        console.log(`   Barrio: ${chatData.neighborhood}`);
        console.log(`   Participantes: ${chatData.participants ? chatData.participants.length : 0}`);
      } else {
        console.log('\n❌ Chat no encontrado con el ID:', userData.chatId);

        // Buscar por barrio
        if (userData.neighborhood) {
          const neighborhoodChatSnapshot = await firestore
            .collection('chats')
            .where('neighborhood', '==', userData.neighborhood)
            .limit(1)
            .get();

          if (!neighborhoodChatSnapshot.empty) {
            const correctChatDoc = neighborhoodChatSnapshot.docs[0];
            const correctChatData = correctChatDoc.data();
            console.log('\n✅ Chat encontrado por barrio:');
            console.log(`   Chat ID: ${correctChatDoc.id}`);
            console.log(`   Barrio: ${correctChatData.neighborhood}`);
            console.log(`   Participantes: ${correctChatData.participants ? correctChatData.participants.length : 0}`);

            console.log('\n💡 Solución: Actualizar chatId del usuario');
          } else {
            console.log('\n❌ No se encontró ningún chat para el barrio:', userData.neighborhood);
          }
        }
      }
    } else {
      console.log('\n❌ Usuario no tiene chatId asignado');
    }

    console.log('\n📋 Todos los campos disponibles en Firestore:');
    console.log('=============================================');
    Object.keys(userData).forEach(key => {
      console.log(`${key}: ${userData[key]}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

const email = process.argv[2];
if (!email) {
  console.log('Uso: node check-firestore-user.js <email>');
  process.exit(1);
}

checkFirestoreUser(email);
