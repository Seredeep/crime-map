// scripts/migrate-chat-system.js
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

/**
 * Función para normalizar el nombre de un barrio a un chatId
 */
function normalizeNeighborhoodToChatId(neighborhood) {
  if (!neighborhood) return null;
  return `chat_${neighborhood.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '')}`;
}

/**
 * Función para detectar si un chatId es de la lógica antigua
 */
function isOldChatId(chatId) {
  if (!chatId) return false;
  // Los chatIds antiguos eran ObjectIds de MongoDB (24 caracteres hexadecimales)
  return /^[0-9a-f]{24}$/i.test(chatId);
}

async function migrateChatSystem() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db();

    console.log('🔄 Iniciando migración del sistema de chat...');
    console.log('=============================================');

    // 1. Obtener todos los usuarios de MongoDB con onboarding completo
    const mongoUsers = await db.collection('users').find({
      onboarded: true,
      neighborhood: { $exists: true, $ne: null }
    }).toArray();

    console.log(`📊 Total de usuarios a procesar: ${mongoUsers.length}`);

    const migrated = [];
    const errors = [];

    for (const mongoUser of mongoUsers) {
      const email = mongoUser.email;

      try {
        // 2. Verificar si el usuario necesita migración
        const needsMigration = isOldChatId(mongoUser.chatId);

        if (!needsMigration) {
          // Usuario ya tiene el formato correcto
          continue;
        }

        console.log(`\n🔄 Migrando usuario: ${email}`);
        console.log(`   ChatId antiguo: ${mongoUser.chatId}`);

        // 3. Generar nuevo chatId
        const newChatId = normalizeNeighborhoodToChatId(mongoUser.neighborhood);

        if (!newChatId) {
          console.log(`   ⚠️  No se pudo generar chatId para barrio: ${mongoUser.neighborhood}`);
          errors.push({
            email,
            error: `No se pudo generar chatId para barrio: ${mongoUser.neighborhood}`
          });
          continue;
        }

        console.log(`   Nuevo ChatId: ${newChatId}`);

        // 4. Actualizar MongoDB
        await db.collection('users').updateOne(
          { _id: mongoUser._id },
          {
            $set: {
              chatId: newChatId,
              updatedAt: new Date()
            }
          }
        );

        // 5. Buscar y actualizar Firestore
        const firestoreUserSnapshot = await firestore.collection('users').where('email', '==', email).limit(1).get();

        if (!firestoreUserSnapshot.empty) {
          const firestoreUserDoc = firestoreUserSnapshot.docs[0];
          const firestoreUserId = firestoreUserDoc.id;

          // Actualizar usuario en Firestore
          await firestore.collection('users').doc(firestoreUserId).update({
            chatId: newChatId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          // 6. Manejar el chat en Firestore
          const oldChatDoc = await firestore.collection('chats').doc(mongoUser.chatId).get();
          const newChatDoc = await firestore.collection('chats').doc(newChatId).get();

          if (oldChatDoc.exists && !newChatDoc.exists) {
            // Migrar chat antiguo a nuevo
            const oldChatData = oldChatDoc.data();
            console.log(`   🔄 Migrando chat de ${mongoUser.chatId} a ${newChatId}`);

            // Crear nuevo chat con los datos del antiguo
            await firestore.collection('chats').doc(newChatId).set({
              neighborhood: mongoUser.neighborhood,
              participants: oldChatData.participants || [firestoreUserId],
              createdAt: oldChatData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              lastMessage: oldChatData.lastMessage || null,
              lastMessageAt: oldChatData.lastMessageAt || null
            });

            // Eliminar chat antiguo
            await firestore.collection('chats').doc(mongoUser.chatId).delete();
            console.log(`   ✅ Chat migrado y antiguo eliminado`);

          } else if (!newChatDoc.exists) {
            // Crear nuevo chat si no existe
            console.log(`   🔧 Creando nuevo chat: ${newChatId}`);
            await firestore.collection('chats').doc(newChatId).set({
              neighborhood: mongoUser.neighborhood,
              participants: [firestoreUserId],
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          } else {
            // Agregar usuario al chat existente
            console.log(`   🔧 Agregando usuario al chat existente: ${newChatId}`);
            await firestore.collection('chats').doc(newChatId).update({
              participants: admin.firestore.FieldValue.arrayUnion(firestoreUserId),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }

        migrated.push({
          email,
          oldChatId: mongoUser.chatId,
          newChatId,
          neighborhood: mongoUser.neighborhood
        });

        console.log(`   ✅ Migración completada`);

      } catch (error) {
        console.error(`❌ Error migrando ${email}:`, error.message);
        errors.push({
          email,
          error: error.message
        });
      }
    }

    // 7. Reporte final
    console.log('\n📋 REPORTE DE MIGRACIÓN');
    console.log('========================');
    console.log(`✅ Usuarios migrados: ${migrated.length}`);
    console.log(`❌ Errores: ${errors.length}`);
    console.log(`📊 Total procesados: ${mongoUsers.length}`);

    if (migrated.length > 0) {
      console.log('\n🔄 Usuarios migrados:');
      migrated.forEach(user => {
        console.log(`   ${user.email}:`);
        console.log(`     Barrio: ${user.neighborhood}`);
        console.log(`     ChatId: ${user.oldChatId} → ${user.newChatId}`);
      });
    }

    if (errors.length > 0) {
      console.log('\n❌ Errores encontrados:');
      errors.forEach(error => {
        console.log(`   ${error.email}: ${error.error}`);
      });
    }

    console.log('\n🎉 Migración completada!');

  } catch (error) {
    console.error('❌ Error general en migración:', error.message);
  } finally {
    await client.close();
  }
}

// Ejecutar migración
migrateChatSystem();
