// scripts/delete-user.js
require('dotenv').config({ path: '../.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;

/**
 * Script para eliminar usuarios de MongoDB
 *
 * Uso:
 * node delete-user.js <email>
 * node delete-user.js <userId>
 * node delete-user.js --list-users
 * node delete-user.js --confirm <email>
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
      console.log('  node delete-user.js <email>                    // Buscar usuario por email');
      console.log('  node delete-user.js <userId>                   // Buscar usuario por ID');
      console.log('  node delete-user.js --list-users               // Listar todos los usuarios');
      console.log('  node delete-user.js --confirm <email>          // Eliminar usuario por email');
      console.log('  node delete-user.js --confirm-id <userId>      // Eliminar usuario por ID');
      return;
    }

    if (command === '--list-users') {
      await listAllUsers(db);
    } else if (command === '--confirm') {
      const email = args[1];
      if (!email) {
        console.error('Error: Debe proporcionar un email después de --confirm');
        return;
      }
      await deleteUserByEmail(db, email, true);
    } else if (command === '--confirm-id') {
      const userId = args[1];
      if (!userId) {
        console.error('Error: Debe proporcionar un ID después de --confirm-id');
        return;
      }
      await deleteUserById(db, userId, true);
    } else {
      // Asumir que es un email o userId para buscar
      const identifier = command;
      if (identifier.includes('@')) {
        await searchUserByEmail(db, identifier);
      } else {
        await searchUserById(db, identifier);
      }
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
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
      createdAt: 1,
      provider: 1
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
    const provider = user.provider || 'credentials';

    console.log(`${index + 1}. ID: ${user._id}`);
    console.log(`   Nombre: ${user.name || 'No especificado'}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rol: ${user.role || 'default'}`);
    console.log(`   Estado: ${status}`);
    console.log(`   Proveedor: ${provider}`);
    console.log(`   Creado: ${user.createdAt ? new Date(user.createdAt).toLocaleString('es-ES') : 'No especificado'}`);
    console.log('');
  });
}

async function searchUserByEmail(db, email) {
  console.log(`\n🔍 Buscando usuario por email: ${email}`);
  console.log('=====================================');

  const user = await db.collection('users').findOne({ email: email });

  if (!user) {
    console.log('❌ Usuario no encontrado con ese email.');
    return;
  }

  console.log('✅ Usuario encontrado:');
  console.log(`   ID: ${user._id}`);
  console.log(`   Nombre: ${user.name || 'No especificado'}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Rol: ${user.role || 'default'}`);
  console.log(`   Estado: ${user.enabled === true ? 'Autorizado' : user.enabled === false ? 'Deshabilitado' : 'No definido'}`);
  console.log(`   Proveedor: ${user.provider || 'credentials'}`);
  console.log(`   Creado: ${user.createdAt ? new Date(user.createdAt).toLocaleString('es-ES') : 'No especificado'}`);
  console.log('');
  console.log('💡 Para eliminar este usuario, ejecuta:');
  console.log(`   node delete-user.js --confirm ${email}`);
}

async function searchUserById(db, userId) {
  console.log(`\n🔍 Buscando usuario por ID: ${userId}`);
  console.log('=====================================');

  try {
    const objectId = new ObjectId(userId);
    const user = await db.collection('users').findOne({ _id: objectId });

    if (!user) {
      console.log('❌ Usuario no encontrado con ese ID.');
      return;
    }

    console.log('✅ Usuario encontrado:');
    console.log(`   ID: ${user._id}`);
    console.log(`   Nombre: ${user.name || 'No especificado'}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rol: ${user.role || 'default'}`);
    console.log(`   Estado: ${user.enabled === true ? 'Autorizado' : user.enabled === false ? 'Deshabilitado' : 'No definido'}`);
    console.log(`   Proveedor: ${user.provider || 'credentials'}`);
    console.log(`   Creado: ${user.createdAt ? new Date(user.createdAt).toLocaleString('es-ES') : 'No especificado'}`);
    console.log('');
    console.log('💡 Para eliminar este usuario, ejecuta:');
    console.log(`   node delete-user.js --confirm-id ${userId}`);

  } catch (error) {
    console.error('❌ Error: El ID proporcionado no es válido.');
  }
}

async function deleteUserByEmail(db, email, confirmed = false) {
  console.log(`\n🗑️  Eliminando usuario por email: ${email}`);
  console.log('==========================================');

  if (!confirmed) {
    console.log('⚠️  Para confirmar la eliminación, ejecuta:');
    console.log(`   node delete-user.js --confirm ${email}`);
    return;
  }

  try {
    // Buscar el usuario primero
    const user = await db.collection('users').findOne({ email: email });

    if (!user) {
      console.error('❌ Usuario no encontrado con ese email.');
      return;
    }

    console.log('📋 Usuario a eliminar:');
    console.log(`   ID: ${user._id}`);
    console.log(`   Nombre: ${user.name || 'No especificado'}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rol: ${user.role || 'default'}`);
    console.log(`   Proveedor: ${user.provider || 'credentials'}`);

    // Eliminar el usuario
    const result = await db.collection('users').deleteOne({ email: email });

    if (result.deletedCount > 0) {
      console.log('✅ Usuario eliminado exitosamente!');

      // También eliminar de la colección accounts si existe
      try {
        const accountsResult = await db.collection('accounts').deleteMany({
          userId: user._id.toString()
        });
        if (accountsResult.deletedCount > 0) {
          console.log(`✅ También se eliminaron ${accountsResult.deletedCount} registros de accounts`);
        }
      } catch (error) {
        console.log('ℹ️  No se encontraron registros en accounts para eliminar');
      }

    } else {
      console.log('⚠️  No se pudo eliminar el usuario.');
    }

  } catch (error) {
    console.error('❌ Error al eliminar usuario:', error.message);
  }
}

async function deleteUserById(db, userId, confirmed = false) {
  console.log(`\n🗑️  Eliminando usuario por ID: ${userId}`);
  console.log('=====================================');

  if (!confirmed) {
    console.log('⚠️  Para confirmar la eliminación, ejecuta:');
    console.log(`   node delete-user.js --confirm-id ${userId}`);
    return;
  }

  try {
    const objectId = new ObjectId(userId);

    // Buscar el usuario primero
    const user = await db.collection('users').findOne({ _id: objectId });

    if (!user) {
      console.error('❌ Usuario no encontrado con ese ID.');
      return;
    }

    console.log('📋 Usuario a eliminar:');
    console.log(`   ID: ${user._id}`);
    console.log(`   Nombre: ${user.name || 'No especificado'}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rol: ${user.role || 'default'}`);
    console.log(`   Proveedor: ${user.provider || 'credentials'}`);

    // Eliminar el usuario
    const result = await db.collection('users').deleteOne({ _id: objectId });

    if (result.deletedCount > 0) {
      console.log('✅ Usuario eliminado exitosamente!');

      // También eliminar de la colección accounts si existe
      try {
        const accountsResult = await db.collection('accounts').deleteMany({
          userId: user._id.toString()
        });
        if (accountsResult.deletedCount > 0) {
          console.log(`✅ También se eliminaron ${accountsResult.deletedCount} registros de accounts`);
        }
      } catch (error) {
        console.log('ℹ️  No se encontraron registros en accounts para eliminar');
      }

    } else {
      console.log('⚠️  No se pudo eliminar el usuario.');
    }

  } catch (error) {
    if (error.message.includes('ObjectId')) {
      console.error('❌ Error: El ID proporcionado no es válido.');
    } else {
      console.error('❌ Error al eliminar usuario:', error.message);
    }
  }
}

// Ejecutar el script
main().catch(console.error);
