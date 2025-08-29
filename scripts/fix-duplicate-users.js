// scripts/fix-duplicate-users.js
require('dotenv').config({ path: '../.env.local' });
const { MongoClient } = require('mongodb');
const admin = require('firebase-admin');

// Inicializar Firebase si no está inicializado
const { initializeFirebaseAdmin } = require('./firebase-service-account');

// Inicializar Firebase
initializeFirebaseAdmin();

const firestore = admin.firestore();
const MONGO_URI = process.env.MONGODB_URI;

async function fixDuplicateUsers() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db();

    console.log('🔍 Buscando usuarios duplicados...');
    console.log('================================');

    // 1. Buscar usuarios duplicados por email en MongoDB
    const mongoUsers = await db.collection('users').find({
      onboarded: true,
      email: { $exists: true, $ne: null }
    }).toArray();

    // Agrupar por email
    const emailGroups = {};
    mongoUsers.forEach(user => {
      if (!emailGroups[user.email]) {
        emailGroups[user.email] = [];
      }
      emailGroups[user.email].push(user);
    });

    // Encontrar duplicados
    const duplicates = Object.entries(emailGroups).filter(([email, users]) => users.length > 1);

    if (duplicates.length === 0) {
      console.log('✅ No se encontraron usuarios duplicados en MongoDB');
    } else {
      console.log(`⚠️  Se encontraron ${duplicates.length} emails con usuarios duplicados:`);

      for (const [email, users] of duplicates) {
        console.log(`\n📧 Email: ${email}`);
        console.log(`   Usuarios encontrados: ${users.length}`);

        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ID: ${user._id}`);
          console.log(`      Nombre: ${user.name || 'No especificado'}`);
          console.log(`      Barrio: ${user.neighborhood || 'No asignado'}`);
          console.log(`      ChatId: ${user.chatId || 'No asignado'}`);
          console.log(`      Role: ${user.role || 'default'}`);
          console.log(`      Creado: ${user.createdAt}`);
        });
      }
    }

    // 2. Buscar usuarios duplicados en Firestore
    console.log('\n🔍 Verificando duplicados en Firestore...');

    const firestoreUsers = await firestore.collection('users').get();
    const firestoreEmailGroups = {};

    firestoreUsers.forEach(doc => {
      const userData = doc.data();
      if (userData.email) {
        if (!firestoreEmailGroups[userData.email]) {
          firestoreEmailGroups[userData.email] = [];
        }
        firestoreEmailGroups[userData.email].push({
          id: doc.id,
          ...userData
        });
      }
    });

    const firestoreDuplicates = Object.entries(firestoreEmailGroups).filter(([email, users]) => users.length > 1);

    if (firestoreDuplicates.length === 0) {
      console.log('✅ No se encontraron usuarios duplicados en Firestore');
    } else {
      console.log(`⚠️  Se encontraron ${firestoreDuplicates.length} emails con usuarios duplicados en Firestore:`);

      for (const [email, users] of firestoreDuplicates) {
        console.log(`\n📧 Email: ${email}`);
        console.log(`   Usuarios encontrados: ${users.length}`);

        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ID: ${user.id}`);
          console.log(`      Nombre: ${user.name || 'No especificado'}`);
          console.log(`      Barrio: ${user.neighborhood || 'No asignado'}`);
          console.log(`      ChatId: ${user.chatId || 'No asignado'}`);
          console.log(`      Role: ${user.role || 'default'}`);
          console.log(`      Onboarded: ${user.onboarded || false}`);
        });

        // Preguntar al usuario qué hacer
        console.log(`\n💡 Recomendación para ${email}:`);
        console.log(`   - Mantener el usuario con role más alto (admin > default)`);
        console.log(`   - Mantener el usuario más reciente`);
        console.log(`   - Eliminar los duplicados`);
      }
    }

    // 3. Procesar el caso específico de sanchezguevaravalentin@gmail.com
    const targetEmail = 'sanchezguevaravalentin@gmail.com';
    const targetFirestoreUsers = firestoreEmailGroups[targetEmail] || [];

    if (targetFirestoreUsers.length > 1) {
      console.log(`\n🔧 Procesando duplicados para ${targetEmail}...`);

      // Ordenar por role (admin primero) y luego por fecha de creación
      const sortedUsers = targetFirestoreUsers.sort((a, b) => {
        // Priorizar admin sobre default
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (b.role === 'admin' && a.role !== 'admin') return 1;

        // Si tienen el mismo role, ordenar por fecha de creación (más reciente primero)
        const aDate = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
        const bDate = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
        return bDate - aDate;
      });

      const userToKeep = sortedUsers[0];
      const usersToRemove = sortedUsers.slice(1);

      console.log(`\n✅ Usuario a mantener:`);
      console.log(`   ID: ${userToKeep.id}`);
      console.log(`   Nombre: ${userToKeep.name}`);
      console.log(`   Role: ${userToKeep.role}`);

      console.log(`\n❌ Usuarios a eliminar:`);
      usersToRemove.forEach(user => {
        console.log(`   ID: ${user.id}`);
        console.log(`   Nombre: ${user.name}`);
        console.log(`   Role: ${user.role}`);
      });

      // Preguntar confirmación
      console.log(`\n⚠️  ¿Deseas proceder con la eliminación? (s/n)`);
      console.log(`   Esto eliminará ${usersToRemove.length} usuarios duplicados`);
      console.log(`   y mantendrá solo el usuario con ID: ${userToKeep.id}`);

      // Por ahora, solo mostrar la información sin eliminar
      console.log(`\n💡 Para eliminar manualmente, ejecuta:`);
      usersToRemove.forEach(user => {
        console.log(`   firestore.collection('users').doc('${user.id}').delete()`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

fixDuplicateUsers();
