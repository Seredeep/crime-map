// scripts/remove-argentina-users.js
require('dotenv').config({ path: '../.env.local' });
const { MongoClient } = require('mongodb');

// Importar Firebase Admin
const admin = require('firebase-admin');

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  const serviceAccount = require('../service-account-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const firestore = admin.firestore();
const MONGO_URI = process.env.MONGODB_URI;

async function removeArgentinaUsers() {
  const client = new MongoClient(MONGO_URI);

  try {
    console.log('🗑️  ELIMINANDO USUARIOS DE ARGENTINA');
    console.log('====================================');

    await client.connect();
    const db = client.db();

    // Buscar usuarios de Argentina
    const argentinaUsers = await db.collection('users').find({
      $or: [
        { country: 'Argentina' },
        { city: 'Mar del Plata' }
      ]
    }).toArray();

    console.log(`📊 Encontrados ${argentinaUsers.length} usuarios de Argentina`);

    if (argentinaUsers.length === 0) {
      console.log('✅ No hay usuarios de Argentina para eliminar');
      return;
    }

    // Mostrar usuarios que se van a eliminar
    console.log('\n📋 USUARIOS A ELIMINAR:');
    console.log('========================');
    argentinaUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.name || 'Sin nombre'})`);
    });

    // Confirmar eliminación
    console.log('\n⚠️  ADVERTENCIA: Esta acción eliminará permanentemente todos los usuarios de Argentina');
    console.log('¿Estás seguro de que quieres continuar? (escribe "SI" para confirmar)');

    // En un script automatizado, procedemos directamente
    console.log('Procediendo con la eliminación...');

    let deletedCount = 0;
    let errorCount = 0;

    for (const user of argentinaUsers) {
      try {
        console.log(`🗑️  Eliminando usuario: ${user.email}`);

        // Eliminar de MongoDB
        const mongoResult = await db.collection('users').deleteOne({ _id: user._id });

        if (mongoResult.deletedCount > 0) {
          console.log(`✅ Eliminado de MongoDB: ${user.email}`);
        }

        // Eliminar de Firestore
        try {
          const userDocRef = firestore.collection('users').doc(user._id.toString());
          await userDocRef.delete();
          console.log(`✅ Eliminado de Firestore: ${user.email}`);
        } catch (firestoreError) {
          console.log(`⚠️  No se pudo eliminar de Firestore: ${user.email} - ${firestoreError.message}`);
        }

        // Eliminar sesiones relacionadas
        const sessionsResult = await db.collection('sessions').deleteMany({
          userId: user._id.toString()
        });
        if (sessionsResult.deletedCount > 0) {
          console.log(`🗑️  Eliminadas ${sessionsResult.deletedCount} sesiones de: ${user.email}`);
        }

        // Eliminar cuentas relacionadas
        const accountsResult = await db.collection('accounts').deleteMany({
          userId: user._id.toString()
        });
        if (accountsResult.deletedCount > 0) {
          console.log(`🗑️  Eliminadas ${accountsResult.deletedCount} cuentas de: ${user.email}`);
        }

        deletedCount++;

      } catch (error) {
        console.error(`❌ Error eliminando usuario ${user.email}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📈 RESUMEN DE ELIMINACIÓN:');
    console.log('===========================');
    console.log(`✅ Usuarios eliminados exitosamente: ${deletedCount}`);
    console.log(`❌ Errores durante eliminación: ${errorCount}`);
    console.log(`📊 Total procesados: ${argentinaUsers.length}`);

    // Verificar usuarios restantes
    const remainingUsers = await db.collection('users').find({}).toArray();
    console.log(`\n👥 USUARIOS RESTANTES: ${remainingUsers.length}`);

    if (remainingUsers.length > 0) {
      console.log('\n📋 LISTA DE USUARIOS RESTANTES:');
      console.log('===============================');
      remainingUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.name || 'Sin nombre'}) - ${user.country || 'No especificado'}, ${user.city || 'No especificado'}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

// Función para hacer backup antes de eliminar
async function backupArgentinaUsers() {
  const client = new MongoClient(MONGO_URI);

  try {
    console.log('💾 CREANDO BACKUP DE USUARIOS DE ARGENTINA');
    console.log('==========================================');

    await client.connect();
    const db = client.db();

    const argentinaUsers = await db.collection('users').find({
      $or: [
        { country: 'Argentina' },
        { city: 'Mar del Plata' }
      ]
    }).toArray();

    if (argentinaUsers.length === 0) {
      console.log('✅ No hay usuarios de Argentina para hacer backup');
      return;
    }

    // Crear colección de backup
    const backupCollection = db.collection('users_argentina_backup');

    // Eliminar backup anterior si existe
    await backupCollection.drop().catch(() => {
      console.log('ℹ️  No había backup anterior');
    });

    // Crear nuevo backup
    if (argentinaUsers.length > 0) {
      await backupCollection.insertMany(argentinaUsers);
      console.log(`✅ Backup creado: ${argentinaUsers.length} usuarios guardados en 'users_argentina_backup'`);
    }

  } catch (error) {
    console.error('❌ Error creando backup:', error.message);
  } finally {
    await client.close();
  }
}

// Procesar argumentos de línea de comandos
const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.log('Uso del script:');
  console.log('  node remove-argentina-users.js --backup              // Crear backup antes de eliminar');
  console.log('  node remove-argentina-users.js --remove              // Eliminar usuarios de Argentina');
  console.log('  node remove-argentina-users.js --backup-and-remove   // Crear backup y luego eliminar');
  process.exit(1);
}

if (command === '--backup') {
  backupArgentinaUsers();
} else if (command === '--remove') {
  removeArgentinaUsers();
} else if (command === '--backup-and-remove') {
  backupArgentinaUsers().then(() => {
    console.log('\n' + '='.repeat(50) + '\n');
    return removeArgentinaUsers();
  });
} else {
  console.error('Comando no reconocido. Usa --backup, --remove, o --backup-and-remove');
  process.exit(1);
}
