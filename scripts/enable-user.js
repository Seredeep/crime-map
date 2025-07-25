// scripts/enable-user.js
require('dotenv').config({ path: '../.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;

/**
 * Script simple para habilitar usuarios en MongoDB
 *
 * Uso:
 * node enable-user.js <userId>
 * node enable-user.js <email>
 */

async function enableUser(identifier) {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db();

    let query;
    let isEmail = identifier.includes('@');

    if (isEmail) {
      query = { email: identifier };
      console.log(`🔐 Habilitando usuario por email: ${identifier}`);
    } else {
      try {
        const objectId = new ObjectId(identifier);
        query = { _id: objectId };
        console.log(`🔐 Habilitando usuario por ID: ${identifier}`);
      } catch (error) {
        console.error('❌ Error: El ID proporcionado no es válido.');
        return;
      }
    }

    // Buscar el usuario
    const user = await db.collection('users').findOne(query);

    if (!user) {
      console.error('❌ Usuario no encontrado.');
      return;
    }

    // Verificar si ya está habilitado
    if (user.enabled === true) {
      console.log('ℹ️  El usuario ya está habilitado.');
      console.log(`   Nombre: ${user.name || 'No especificado'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rol: ${user.role || 'default'}`);
      return;
    }

    // Habilitar el usuario
    const result = await db.collection('users').updateOne(
      query,
      { $set: { enabled: true } }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Usuario habilitado exitosamente!');
      console.log(`   Nombre: ${user.name || 'No especificado'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rol: ${user.role || 'default'}`);
      console.log(`   ID: ${user._id}`);
    } else {
      console.log('⚠️  No se pudo habilitar el usuario.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

// Obtener el identificador desde los argumentos de línea de comandos
const identifier = process.argv[2];

if (!identifier) {
  console.log('Uso: node enable-user.js <userId|email>');
  console.log('Ejemplos:');
  console.log('  node enable-user.js 507f1f77bcf86cd799439011');
  console.log('  node enable-user.js usuario@ejemplo.com');
  process.exit(1);
}

enableUser(identifier);
