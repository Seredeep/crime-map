// scripts/send-correct-format.js
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

// Mensaje con formato correcto usando saltos de línea reales
const correctMessage = `🚨 CITIZEN SECURITY SYSTEM - ZACAGNINI JOSE MANUEL

Hello neighbors! 👋

This is the official chat of our neighborhood to report incidents and keep us informed about the security of our community.

📱 AVAILABLE FEATURES:
    • Report incidents in real-time
    • Panic button for emergencies
    • Neighborhood statistics
    • Interactive incident map
    • Automatic notifications

✅ SYSTEM STATUS:
    ✅ Chat working correctly
    ✅ 3 active participants
    ✅ Notifications enabled
    ✅ Map updated

📊 RECENT STATISTICS:
    • Incidents reported this month: 12
    • Average response time: 3 min
    • Active neighbors: 3/15

🔧 TECHNICAL INFORMATION:
    • Chat ID: chat_zacagnini_jose_manuel
    • Database: MongoDB + Firestore
    • Real-time: ✅ Active
    • Participants: 3 users

🎯 TESTED FUNCTIONALITIES:
    ✅ Message sending
    ✅ Real-time reception
    ✅ Participant list
    ✅ User roles
    ✅ Geolocation

Does anyone have questions about how to use the system? 🤔

This message demonstrates the improved formatting with proper indentation and structure.`;

async function sendCorrectFormatMessage(chatId = 'chat_zacagnini_jose_manuel') {
  try {
    console.log(`📤 Sending correctly formatted message to chat: ${chatId}`);
    console.log('==========================================');

    // Buscar el usuario admin
    const userSnapshot = await firestore.collection('users').where('email', '==', 'sanchezguevaravalentin@gmail.com').limit(1).get();

    if (userSnapshot.empty) {
      console.log('❌ User not found');
      return;
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    console.log(`✅ User found: ${userData.name} (${userData.role})`);

    // Crear el mensaje en Firestore
    const messageData = {
      userId: userId,
      userName: userData.name,
      message: correctMessage,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      type: 'normal',
      metadata: {}
    };

    // Agregar el mensaje a la subcolección del chat
    await firestore.collection('chats').doc(chatId).collection('messages').add(messageData);

    // Actualizar el chat con el último mensaje
    await firestore.collection('chats').doc(chatId).update({
      lastMessage: correctMessage.substring(0, 100) + '...',
      lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Correctly formatted message sent successfully');
    console.log(`💬 Chat: ${chatId}`);
    console.log(`👤 User: ${userData.name}`);
    console.log(`📝 Message length: ${correctMessage.length} characters`);
    console.log('🎨 Message uses real line breaks and spaces');
    console.log('🔍 Message preview:');
    console.log(correctMessage.substring(0, 200) + '...');

  } catch (error) {
    console.error('❌ Error sending message:', error.message);
  }
}

sendCorrectFormatMessage();
