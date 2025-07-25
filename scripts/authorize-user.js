// scripts/authorize-user.js
require('dotenv').config({ path: '../.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;

/**
 * Script para autorizar usuarios en MongoDB estableciendo la propiedad 'enable' a true
 *
 * Uso:
 * node authorize-user.js <userId>                    // Autorizar por ID
 * node authorize-user.js --email <email>            // Autorizar por email
 * node authorize-user.js --list-pending             // Listar usuarios pendientes
 * node authorize-user.js --list-all                 // Listar todos los usuarios
 */

async function main() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db();

    const args = process.argv.slice(2);
    const command = args[0];

    if (!command) {
      console.log('Uso del script:');
      console.log('  node authorize-user.js <userId>                    // Autorizar por ID');
      console.log('  node authorize-user.js --email <email>            // Autorizar por email');
      console.log('  node authorize-user.js --list-pending             // Listar usuarios pendientes');
      console.log('  node authorize-user.js --list-all                 // Listar todos los usuarios');
      return;
    }

    if (command === '--list-pending') {
      await listPendingUsers(db);
    } else if (command === '--list-all') {
      await listAllUsers(db);
    } else if (command === '--email') {
      const email = args[1];
      if (!email) {
        console.error('Error: Debe proporcionar un email después de --email');
        return;
      }
      await authorizeUserByEmail(db, email);
    } else {
      // Asumir que es un userId
      const userId = command;
      await authorizeUserById(db, userId);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

async function listPendingUsers(db) {
  console.log('\n📋 Usuarios pendientes de autorización:');
  console.log('=====================================');

  const pendingUsers = await db.collection('users')
    .find({ enabled: { $ne: true } })
    .project({
      _id: 1,
      name: 1,
      email: 1,
      role: 1,
      enabled: 1,
      createdAt: 1
    })
    .sort({ createdAt: 1 })
    .toArray();

  if (pendingUsers.length === 0) {
    console.log('✅ No hay usuarios pendientes de autorización.');
    return;
  }

  pendingUsers.forEach((user, index) => {
    console.log(`${index + 1}. ID: ${user._id}`);
    console.log(`   Nombre: ${user.name || 'No especificado'}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rol: ${user.role || 'default'}`);
    console.log(`   Estado: ${user.enabled === false ? '❌ Deshabilitado' : '❓ No definido'}`);
    console.log(`   Creado: ${user.createdAt ? new Date(user.createdAt).toLocaleString('es-ES') : 'No especificado'}`);
    console.log('');
  });
}

async function listAllUsers(db) {
  console.log('\n📋 Todos los usuarios:');
  console.log('=====================');

  const allUsers = await db.collection('users')
    .find({})
    .project({
      _id: 1,
      name: 1,
      email: 1,
      role: 1,
      enabled: 1,
      createdAt: 1
    })
    .sort({ createdAt: 1 })
    .toArray();

  if (allUsers.length === 0) {
    console.log('❌ No hay usuarios en la base de datos.');
    return;
  }

  allUsers.forEach((user, index) => {
    const status = user.enabled === true ? '✅ Autorizado' :
                   user.enabled === false ? '❌ Deshabilitado' : '❓ No definido';

    console.log(`${index + 1}. ID: ${user._id}`);
    console.log(`   Nombre: ${user.name || 'No especificado'}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rol: ${user.role || 'default'}`);
    console.log(`   Estado: ${status}`);
    console.log(`   Creado: ${user.createdAt ? new Date(user.createdAt).toLocaleString('es-ES') : 'No especificado'}`);
    console.log('');
  });
}

async function authorizeUserById(db, userId) {
  console.log(`\n🔐 Autorizando usuario por ID: ${userId}`);
  console.log('=====================================');

  try {
    // Validar que el ID sea válido
    const objectId = new ObjectId(userId);

    // Buscar el usuario
    const user = await db.collection('users').findOne({ _id: objectId });

    if (!user) {
      console.error('❌ Usuario no encontrado con ese ID.');
      return;
    }

    // Verificar si ya está autorizado
    if (user.enabled === true) {
      console.log('ℹ️  El usuario ya está autorizado.');
      console.log(`   Nombre: ${user.name || 'No especificado'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rol: ${user.role || 'default'}`);
      return;
    }

    // Autorizar el usuario
    const result = await db.collection('users').updateOne(
      { _id: objectId },
      { $set: { enabled: true } }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Usuario autorizado exitosamente!');
      console.log(`   Nombre: ${user.name || 'No especificado'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rol: ${user.role || 'default'}`);
      console.log(`   ID: ${user._id}`);
    } else {
      console.log('⚠️  No se pudo autorizar el usuario.');
    }

  } catch (error) {
    if (error.message.includes('ObjectId')) {
      console.error('❌ Error: El ID proporcionado no es válido.');
    } else {
      console.error('❌ Error al autorizar usuario:', error.message);
    }
  }
}

async function authorizeUserByEmail(db, email) {
  console.log(`\n🔐 Autorizando usuario por email: ${email}`);
  console.log('==========================================');

  try {
    // Buscar el usuario por email
    const user = await db.collection('users').findOne({ email: email });

    if (!user) {
      console.error('❌ Usuario no encontrado con ese email.');
      return;
    }

    // Verificar si ya está autorizado
    if (user.enabled === true) {
      console.log('ℹ️  El usuario ya está autorizado.');
      console.log(`   Nombre: ${user.name || 'No especificado'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rol: ${user.role || 'default'}`);
      console.log(`   ID: ${user._id}`);
      return;
    }

    // Autorizar el usuario
    const result = await db.collection('users').updateOne(
      { email: email },
      { $set: { enabled: true } }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Usuario autorizado exitosamente!');
      console.log(`   Nombre: ${user.name || 'No especificado'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rol: ${user.role || 'default'}`);
      console.log(`   ID: ${user._id}`);
    } else {
      console.log('⚠️  No se pudo autorizar el usuario.');
    }

  } catch (error) {
    console.error('❌ Error al autorizar usuario:', error.message);
  }
}

// Ejecutar el script
main().catch(console.error);
