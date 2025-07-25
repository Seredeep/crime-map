// scripts/maintenance-chat-system.js
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
  return /^[0-9a-f]{24}$/i.test(chatId);
}

/**
 * Función para validar formato de chatId
 */
function isValidChatId(chatId) {
  if (!chatId || typeof chatId !== 'string') {
    return false;
  }
  return /^chat_[a-z0-9_]+$/i.test(chatId);
}

async function maintenanceChatSystem() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db();

    console.log('🔧 Iniciando mantenimiento del sistema de chat...');
    console.log('================================================');

    // 1. Obtener todos los usuarios de MongoDB con onboarding completo
    const mongoUsers = await db.collection('users').find({
      onboarded: true,
      neighborhood: { $exists: true, $ne: null }
    }).toArray();

    console.log(`📊 Total de usuarios a verificar: ${mongoUsers.length}`);

    const issues = [];
    const fixed = [];
    const warnings = [];

    for (const mongoUser of mongoUsers) {
      const email = mongoUser.email;

      try {
        // 2. Verificar configuración del usuario
        const userIssues = [];

        // Verificar formato del chatId
        if (mongoUser.chatId && isOldChatId(mongoUser.chatId)) {
          userIssues.push('ChatId en formato antiguo (ObjectId)');
        }

        if (mongoUser.chatId && !isValidChatId(mongoUser.chatId) && !isOldChatId(mongoUser.chatId)) {
          userIssues.push('ChatId en formato inválido');
        }

        // Verificar consistencia entre barrio y chatId
        if (mongoUser.neighborhood && mongoUser.chatId) {
          const expectedChatId = normalizeNeighborhoodToChatId(mongoUser.neighborhood);
          if (mongoUser.chatId !== expectedChatId && !isOldChatId(mongoUser.chatId)) {
            userIssues.push('ChatId no coincide con el barrio asignado');
          }
        }

        // 3. Buscar usuario en Firestore
        const firestoreUserSnapshot = await firestore.collection('users').where('email', '==', email).limit(1).get();

        if (firestoreUserSnapshot.empty) {
          userIssues.push('Usuario no existe en Firestore');
        } else {
          const firestoreUserData = firestoreUserSnapshot.docs[0].data();

          // Verificar inconsistencias entre MongoDB y Firestore
          if (firestoreUserData.neighborhood !== mongoUser.neighborhood) {
            userIssues.push('Barrio inconsistente entre MongoDB y Firestore');
          }

          if (firestoreUserData.chatId !== mongoUser.chatId) {
            userIssues.push('ChatId inconsistente entre MongoDB y Firestore');
          }
        }

        // 4. Verificar si existe el chat
        if (mongoUser.chatId) {
          const chatDoc = await firestore.collection('chats').doc(mongoUser.chatId).get();
          if (!chatDoc.exists) {
            userIssues.push('Chat no existe en Firestore');
          }
        }

        // 5. Clasificar y reportar problemas
        if (userIssues.length > 0) {
          console.log(`\n⚠️  Problemas encontrados en: ${email}`);
          userIssues.forEach(issue => console.log(`   - ${issue}`));

          // Intentar corregir automáticamente
          const canAutoFix = userIssues.some(issue =>
            issue.includes('ChatId en formato antiguo') ||
            issue.includes('ChatId no coincide') ||
            issue.includes('inconsistente entre MongoDB y Firestore')
          );

          if (canAutoFix) {
            console.log(`   🔧 Intentando corrección automática...`);

            // Generar chatId correcto
            const correctChatId = normalizeNeighborhoodToChatId(mongoUser.neighborhood);

            // Actualizar MongoDB
            await db.collection('users').updateOne(
              { _id: mongoUser._id },
              {
                $set: {
                  chatId: correctChatId,
                  updatedAt: new Date()
                }
              }
            );

            // Actualizar Firestore si existe
            if (!firestoreUserSnapshot.empty) {
              const firestoreUserId = firestoreUserSnapshot.docs[0].id;
              await firestore.collection('users').doc(firestoreUserId).update({
                neighborhood: mongoUser.neighborhood,
                chatId: correctChatId,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
            }

            // Verificar/crear chat
            const chatDoc = await firestore.collection('chats').doc(correctChatId).get();
            if (!chatDoc.exists) {
              await firestore.collection('chats').doc(correctChatId).set({
                neighborhood: mongoUser.neighborhood,
                participants: firestoreUserSnapshot.empty ? [] : [firestoreUserSnapshot.docs[0].id],
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
            }

            fixed.push({
              email,
              issues: userIssues,
              oldChatId: mongoUser.chatId,
              newChatId: correctChatId
            });

            console.log(`   ✅ Corregido automáticamente`);
          } else {
            issues.push({
              email,
              issues: userIssues
            });
          }
        } else {
          // Verificar si hay advertencias menores
          if (mongoUser.chatId && !mongoUser.chatId.startsWith('chat_')) {
            warnings.push({
              email,
              warning: 'ChatId no sigue el formato estándar pero es funcional'
            });
          }
        }

      } catch (error) {
        console.error(`❌ Error procesando ${email}:`, error.message);
        issues.push({
          email,
          issues: [`Error: ${error.message}`]
        });
      }
    }

    // 6. Reporte final
    console.log('\n📋 REPORTE DE MANTENIMIENTO');
    console.log('============================');
    console.log(`✅ Problemas corregidos automáticamente: ${fixed.length}`);
    console.log(`❌ Problemas que requieren atención manual: ${issues.length}`);
    console.log(`⚠️  Advertencias: ${warnings.length}`);
    console.log(`📊 Total procesados: ${mongoUsers.length}`);

    if (fixed.length > 0) {
      console.log('\n🔧 Problemas corregidos automáticamente:');
      fixed.forEach(user => {
        console.log(`   ${user.email}:`);
        console.log(`     ChatId: ${user.oldChatId} → ${user.newChatId}`);
        console.log(`     Problemas: ${user.issues.join(', ')}`);
      });
    }

    if (issues.length > 0) {
      console.log('\n❌ Problemas que requieren atención manual:');
      issues.forEach(user => {
        console.log(`   ${user.email}:`);
        user.issues.forEach(issue => console.log(`     - ${issue}`));
      });
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  Advertencias:');
      warnings.forEach(user => {
        console.log(`   ${user.email}: ${user.warning}`);
      });
    }

    console.log('\n🎉 Mantenimiento completado!');

  } catch (error) {
    console.error('❌ Error general en mantenimiento:', error.message);
  } finally {
    await client.close();
  }
}

// Ejecutar mantenimiento
maintenanceChatSystem();
