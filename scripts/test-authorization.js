// scripts/test-authorization.js
require('dotenv').config({ path: '../.env.local' });
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;

// Agregar información de depuración
console.log('🔍 Información de depuración:');
console.log('============================');
console.log('Directorio actual:', process.cwd());
console.log('MONGODB_URI definida:', !!MONGO_URI);
console.log('MONGODB_URI valor:', MONGO_URI ? MONGO_URI.substring(0, 20) + '...' : 'undefined');
console.log('Variables de entorno disponibles:', Object.keys(process.env).filter(key => key.includes('MONGO')).join(', '));
console.log('');

/**
 * Script de prueba para verificar la funcionalidad de autorización
 *
 * Este script:
 * 1. Conecta a MongoDB
 * 2. Verifica la estructura de la colección users
 * 3. Muestra estadísticas de usuarios
 * 4. Prueba las consultas de autorización
 */

async function testAuthorization() {
  if (!MONGO_URI) {
    console.error('❌ Error: MONGODB_URI no está definida en las variables de entorno');
    console.log('💡 Solución: Verifica que el archivo .env.local contenga MONGODB_URI');
    return;
  }

  const client = new MongoClient(MONGO_URI);

  try {
    console.log('🔍 Iniciando pruebas de autorización...\n');

    await client.connect();
    const db = client.db();

    console.log('✅ Conexión a MongoDB establecida\n');

    // 1. Verificar que la colección users existe
    const collections = await db.listCollections().toArray();
    const usersCollectionExists = collections.some(col => col.name === 'users');

    if (!usersCollectionExists) {
      console.log('⚠️  La colección "users" no existe. Creando...');
      await db.createCollection('users');
      console.log('✅ Colección "users" creada');
    } else {
      console.log('✅ Colección "users" encontrada');
    }

    // 2. Obtener estadísticas de usuarios
    const totalUsers = await db.collection('users').countDocuments();
    const enabledUsers = await db.collection('users').countDocuments({ enabled: true });
    const disabledUsers = await db.collection('users').countDocuments({ enabled: false });
    const undefinedUsers = await db.collection('users').countDocuments({
      $or: [
        { enabled: { $exists: false } },
        { enabled: null }
      ]
    });

    console.log('\n📊 Estadísticas de usuarios:');
    console.log('============================');
    console.log(`Total de usuarios: ${totalUsers}`);
    console.log(`Usuarios habilitados: ${enabledUsers} ✅`);
    console.log(`Usuarios deshabilitados: ${disabledUsers} ❌`);
    console.log(`Usuarios sin estado definido: ${undefinedUsers} ❓`);

    // 3. Probar consultas de autorización
    console.log('\n🔍 Probando consultas de autorización...');

    // Usuarios pendientes (no habilitados)
    const pendingUsers = await db.collection('users')
      .find({ enabled: { $ne: true } })
      .project({ _id: 1, name: 1, email: 1, enabled: 1 })
      .limit(5)
      .toArray();

    console.log(`\n📋 Primeros 5 usuarios pendientes:`);
    if (pendingUsers.length === 0) {
      console.log('   No hay usuarios pendientes');
    } else {
      pendingUsers.forEach((user, index) => {
        const status = user.enabled === false ? '❌ Deshabilitado' : '❓ No definido';
        console.log(`   ${index + 1}. ${user.email || 'Sin email'} - ${status}`);
      });
    }

    // 4. Verificar estructura de documentos
    console.log('\n🔍 Verificando estructura de documentos...');

    const sampleUser = await db.collection('users').findOne({});
    if (sampleUser) {
      console.log('✅ Estructura de documento de usuario:');
      console.log('   Campos disponibles:', Object.keys(sampleUser).join(', '));

      const hasEnabledField = 'enabled' in sampleUser;
      console.log(`   Campo 'enabled' presente: ${hasEnabledField ? '✅' : '❌'}`);

      if (hasEnabledField) {
        console.log(`   Valor de 'enabled': ${sampleUser.enabled} (tipo: ${typeof sampleUser.enabled})`);
      }
    } else {
      console.log('ℹ️  No hay usuarios en la base de datos para verificar estructura');
    }

    // 5. Probar operación de actualización (simulación)
    console.log('\n🔍 Probando operación de actualización...');

    if (pendingUsers.length > 0) {
      const testUser = pendingUsers[0];
      console.log(`   Usuario de prueba: ${testUser.email || testUser._id}`);
      console.log(`   Estado actual: ${testUser.enabled === false ? 'Deshabilitado' : 'No definido'}`);
      console.log('   ✅ Operación de actualización disponible (simulación)');
    } else {
      console.log('   ℹ️  No hay usuarios pendientes para probar actualización');
    }

    console.log('\n✅ Todas las pruebas completadas exitosamente!');
    console.log('\n📝 Para usar los scripts de autorización:');
    console.log('   node scripts/authorize-user.js --list-pending');
    console.log('   node scripts/enable-user.js <email|id>');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);

    if (error.message.includes('MONGODB_URI')) {
      console.log('\n💡 Solución: Verifica que MONGODB_URI esté definida en tu archivo .env.local');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Solución: Verifica que MongoDB esté ejecutándose');
    }
  } finally {
    await client.close();
  }
}

// Ejecutar las pruebas
testAuthorization();
