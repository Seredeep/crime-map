// scripts/restore-argentina-users.js
require('dotenv').config({ path: '../.env.local' });
const { MongoClient } = require('mongodb');

// Importar Firebase Admin
const admin = require('firebase-admin');

// Inicializar Firebase Admin si no está inicializado
const { initializeFirebaseAdmin } = require('./firebase-service-account');

// Inicializar Firebase
initializeFirebaseAdmin();

const firestore = admin.firestore();
const MONGO_URI = process.env.MONGODB_URI;

async function restoreArgentinaUsers() {
  const client = new MongoClient(MONGO_URI);

  try {
    console.log('🔄 RESTAURANDO USUARIOS DE ARGENTINA');
    console.log('====================================');

    await client.connect();
    const db = client.db();

    // Verificar si existe el backup
    const backupCollection = db.collection('users_argentina_backup');
    const backupUsers = await backupCollection.find({}).toArray();

    if (backupUsers.length === 0) {
      console.log('❌ No se encontró backup de usuarios de Argentina');
      console.log('💡 Si tienes un backup manual, puedes restaurarlo manualmente');
      return;
    }

    console.log(`📊 Encontrados ${backupUsers.length} usuarios en el backup`);

    // Mostrar usuarios que se van a restaurar
    console.log('\n📋 USUARIOS A RESTAURAR:');
    console.log('==========================');
    backupUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.name || 'Sin nombre'})`);
    });

    let restoredCount = 0;
    let errorCount = 0;

    for (const user of backupUsers) {
      try {
        console.log(`🔄 Restaurando usuario: ${user.email}`);

        // Verificar si el usuario ya existe
        const existingUser = await db.collection('users').findOne({ email: user.email });

        if (existingUser) {
          console.log(`⚠️  Usuario ${user.email} ya existe, omitiendo...`);
          continue;
        }

        // Restaurar en MongoDB
        const result = await db.collection('users').insertOne(user);

        if (result.insertedId) {
          console.log(`✅ Restaurado en MongoDB: ${user.email}`);
        }

        // Restaurar en Firestore
        try {
          const userDocRef = firestore.collection('users').doc(user._id.toString());
          await userDocRef.set({
            ...user,
            _id: user._id.toString()
          });
          console.log(`✅ Restaurado en Firestore: ${user.email}`);
        } catch (firestoreError) {
          console.log(`⚠️  No se pudo restaurar en Firestore: ${user.email} - ${firestoreError.message}`);
        }

        restoredCount++;

      } catch (error) {
        console.error(`❌ Error restaurando usuario ${user.email}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📈 RESUMEN DE RESTAURACIÓN:');
    console.log('=============================');
    console.log(`✅ Usuarios restaurados exitosamente: ${restoredCount}`);
    console.log(`❌ Errores durante restauración: ${errorCount}`);
    console.log(`📊 Total procesados: ${backupUsers.length}`);

    // Verificar usuarios totales
    const allUsers = await db.collection('users').find({}).toArray();
    console.log(`\n👥 TOTAL DE USUARIOS: ${allUsers.length}`);

    // Agrupar por país
    const usersByCountry = {};
    allUsers.forEach(user => {
      const country = user.country || 'No especificado';
      if (!usersByCountry[country]) {
        usersByCountry[country] = [];
      }
      usersByCountry[country].push(user);
    });

    console.log('\n📊 USUARIOS POR PAÍS:');
    console.log('=======================');
    Object.entries(usersByCountry).forEach(([country, users]) => {
      console.log(`${country}: ${users.length} usuarios`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

// Función para verificar el estado actual
async function checkCurrentStatus() {
  const client = new MongoClient(MONGO_URI);

  try {
    console.log('🔍 VERIFICANDO ESTADO ACTUAL');
    console.log('=============================');

    await client.connect();
    const db = client.db();

    const allUsers = await db.collection('users').find({}).toArray();

    console.log(`📊 Total de usuarios: ${allUsers.length}`);

    if (allUsers.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
      return;
    }

    // Agrupar por país
    const usersByCountry = {};
    allUsers.forEach(user => {
      const country = user.country || 'No especificado';
      if (!usersByCountry[country]) {
        usersByCountry[country] = [];
      }
      usersByCountry[country].push(user);
    });

    console.log('\n📊 USUARIOS POR PAÍS:');
    console.log('=======================');
    Object.entries(usersByCountry).forEach(([country, users]) => {
      console.log(`${country}: ${users.length} usuarios`);
      users.forEach(user => {
        console.log(`  - ${user.email} (${user.name || 'Sin nombre'}) - Enabled: ${user.enabled}`);
      });
    });

    // Verificar backup
    const backupCollection = db.collection('users_argentina_backup');
    const backupUsers = await backupCollection.find({}).toArray();

    console.log(`\n💾 BACKUP DISPONIBLE: ${backupUsers.length} usuarios de Argentina`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

// Procesar argumentos de línea de comandos
const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.log('Uso del script:');
  console.log('  node restore-argentina-users.js --check              // Verificar estado actual');
  console.log('  node restore-argentina-users.js --restore            // Restaurar usuarios de Argentina');
  process.exit(1);
}

if (command === '--check') {
  checkCurrentStatus();
} else if (command === '--restore') {
  restoreArgentinaUsers();
} else {
  console.error('Comando no reconocido. Usa --check o --restore');
  process.exit(1);
}
