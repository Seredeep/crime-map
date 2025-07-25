// scripts/fix-all-users-chat.js
require('dotenv').config({ path: '../.env.local' });
const { MongoClient } = require('mongodb');
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

async function fixAllUsersChat() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db();

    console.log('🔍 Analizando usuarios con problemas de chat...');
    console.log('==============================================');

    // 1. Obtener todos los usuarios de MongoDB que tienen onboarding completo
    const mongoUsers = await db.collection('users').find({
      onboarded: true,
      neighborhood: { $exists: true, $ne: null }
    }).toArray();

    console.log(`📊 Total de usuarios con onboarding en MongoDB: ${mongoUsers.length}`);

    const problems = [];
    const fixed = [];

    for (const mongoUser of mongoUsers) {
      const email = mongoUser.email;

      try {
        // 2. Buscar usuario en Firestore
        const firestoreUserSnapshot = await firestore.collection('users').where('email', '==', email).limit(1).get();

        if (firestoreUserSnapshot.empty) {
          problems.push({
            email,
            problem: 'Usuario no existe en Firestore',
            mongoData: {
              neighborhood: mongoUser.neighborhood,
              chatId: mongoUser.chatId
            }
          });
          continue;
        }

        const firestoreUserDoc = firestoreUserSnapshot.docs[0];
        const firestoreUserData = firestoreUserDoc.data();
        const firestoreUserId = firestoreUserDoc.id;

        // 3. Verificar inconsistencias
        const hasInconsistency =
          firestoreUserData.neighborhood !== mongoUser.neighborhood ||
          firestoreUserData.chatId !== mongoUser.chatId ||
          firestoreUserData.onboarded !== mongoUser.onboarded;

        if (hasInconsistency) {
          console.log(`\n⚠️  Problema encontrado en: ${email}`);
          console.log(`   MongoDB: ${mongoUser.neighborhood} | ${mongoUser.chatId}`);
          console.log(`   Firestore: ${firestoreUserData.neighborhood} | ${firestoreUserData.chatId}`);

          // 4. Corregir Firestore
          const updateData = {
            neighborhood: mongoUser.neighborhood,
            chatId: mongoUser.chatId,
            onboarded: mongoUser.onboarded || mongoUser.isOnboarded || false,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };

          await firestore.collection('users').doc(firestoreUserId).update(updateData);

          // 5. Verificar/corregir chat
          if (mongoUser.chatId) {
            const chatDoc = await firestore.collection('chats').doc(mongoUser.chatId).get();

            if (!chatDoc.exists) {
              console.log(`   🔧 Creando chat faltante: ${mongoUser.chatId}`);
              await firestore.collection('chats').doc(mongoUser.chatId).set({
                neighborhood: mongoUser.neighborhood,
                participants: [firestoreUserId],
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
            } else {
              // Verificar si el usuario está en la lista de participantes
              const chatData = chatDoc.data();
              if (!chatData.participants.includes(firestoreUserId)) {
                console.log(`   🔧 Agregando usuario a participantes del chat`);
                await firestore.collection('chats').doc(mongoUser.chatId).update({
                  participants: admin.firestore.FieldValue.arrayUnion(firestoreUserId),
                  updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
              }
            }
          }

          fixed.push({
            email,
            oldData: {
              neighborhood: firestoreUserData.neighborhood,
              chatId: firestoreUserData.chatId
            },
            newData: {
              neighborhood: mongoUser.neighborhood,
              chatId: mongoUser.chatId
            }
          });

          console.log(`   ✅ Corregido`);
        }

      } catch (error) {
        console.error(`❌ Error procesando ${email}:`, error.message);
        problems.push({
          email,
          problem: `Error: ${error.message}`,
          mongoData: {
            neighborhood: mongoUser.neighborhood,
            chatId: mongoUser.chatId
          }
        });
      }
    }

    // 6. Reporte final
    console.log('\n📋 REPORTE FINAL');
    console.log('================');
    console.log(`✅ Usuarios corregidos: ${fixed.length}`);
    console.log(`❌ Usuarios con problemas: ${problems.length}`);
    console.log(`📊 Total procesados: ${mongoUsers.length}`);

    if (fixed.length > 0) {
      console.log('\n🔧 Usuarios corregidos:');
      fixed.forEach(user => {
        console.log(`   ${user.email}:`);
        console.log(`     Antes: ${user.oldData.neighborhood} | ${user.oldData.chatId}`);
        console.log(`     Después: ${user.newData.neighborhood} | ${user.newData.chatId}`);
      });
    }

    if (problems.length > 0) {
      console.log('\n❌ Usuarios con problemas:');
      problems.forEach(user => {
        console.log(`   ${user.email}: ${user.problem}`);
      });
    }

    console.log('\n🎉 Proceso completado!');

  } catch (error) {
    console.error('❌ Error general:', error.message);
  } finally {
    await client.close();
  }
}

fixAllUsersChat();
