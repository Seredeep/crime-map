// scripts/sync-user-firestore.js
require('dotenv').config({ path: '../.env.local' });
const { MongoClient, ObjectId } = require('mongodb');
const admin = require('firebase-admin');

// Inicializar Firebase si no está inicializado
if (!admin.apps.length) {
  const serviceAccount = require('../service-account-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const firestore = admin.firestore();
const MONGO_URI = process.env.MONGODB_URI;

async function syncUserFirestore(email) {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db();

    console.log(`🔄 Sincronizando usuario: ${email}`);
    console.log('==========================================');

    // 1. Obtener datos de MongoDB
    const mongoUser = await db.collection('users').findOne({ email: email });

    if (!mongoUser) {
      console.log('❌ Usuario no encontrado en MongoDB');
      return;
    }

    console.log('✅ Usuario encontrado en MongoDB:');
    console.log(`   Barrio: ${mongoUser.neighborhood}`);
    console.log(`   Chat ID: ${mongoUser.chatId}`);
    console.log(`   Onboarded: ${mongoUser.onboarded}`);

    // 2. Buscar usuario en Firestore
    const firestoreUserSnapshot = await firestore.collection('users').where('email', '==', email).limit(1).get();

    if (firestoreUserSnapshot.empty) {
      console.log('❌ Usuario no encontrado en Firestore');
      return;
    }

    const firestoreUserDoc = firestoreUserSnapshot.docs[0];
    const firestoreUserData = firestoreUserDoc.data();
    const firestoreUserId = firestoreUserDoc.id;

    console.log('\n📋 Datos actuales en Firestore:');
    console.log(`   Barrio: ${firestoreUserData.neighborhood}`);
    console.log(`   Chat ID: ${firestoreUserData.chatId}`);
    console.log(`   Onboarded: ${firestoreUserData.onboarded}`);

    // 3. Actualizar Firestore con datos de MongoDB
    const updateData = {
      neighborhood: mongoUser.neighborhood,
      chatId: mongoUser.chatId,
      onboarded: mongoUser.onboarded || mongoUser.isOnboarded || false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await firestore.collection('users').doc(firestoreUserId).update(updateData);

    console.log('\n✅ Firestore actualizado con datos de MongoDB:');
    console.log(`   Barrio: ${updateData.neighborhood}`);
    console.log(`   Chat ID: ${updateData.chatId}`);
    console.log(`   Onboarded: ${updateData.onboarded}`);

    // 4. Verificar si existe el chat en Firestore
    if (mongoUser.chatId) {
      const chatDoc = await firestore.collection('chats').doc(mongoUser.chatId).get();

      if (!chatDoc.exists) {
        console.log('\n⚠️  Chat no existe en Firestore, creándolo...');

        // Crear el chat en Firestore
        await firestore.collection('chats').doc(mongoUser.chatId).set({
          neighborhood: mongoUser.neighborhood,
          participants: [firestoreUserId],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Chat creado en Firestore');
      } else {
        console.log('\n✅ Chat ya existe en Firestore');

        // Verificar si el usuario está en la lista de participantes
        const chatData = chatDoc.data();
        if (!chatData.participants.includes(firestoreUserId)) {
          console.log('⚠️  Usuario no está en la lista de participantes, agregándolo...');

          await firestore.collection('chats').doc(mongoUser.chatId).update({
            participants: admin.firestore.FieldValue.arrayUnion(firestoreUserId),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          console.log('✅ Usuario agregado a la lista de participantes');
        } else {
          console.log('✅ Usuario ya está en la lista de participantes');
        }
      }
    }

    console.log('\n🎉 Sincronización completada exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la sincronización:', error.message);
  } finally {
    await client.close();
  }
}

const email = process.argv[2];
if (!email) {
  console.log('Uso: node sync-user-firestore.js <email>');
  process.exit(1);
}

syncUserFirestore(email);
