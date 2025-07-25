// scripts/debug-auth.js
require('dotenv').config({ path: '../.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;

async function debugAuth(email) {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db();

    console.log(`🔍 Depurando autenticación para: ${email}`);
    console.log('==========================================');

    // Buscar el usuario
    const user = await db.collection('users').findOne({ email: email });

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    console.log('✅ Usuario encontrado:');
    console.log('=====================');
    console.log(`ID: ${user._id}`);
    console.log(`Nombre: ${user.name || 'No especificado'}`);
    console.log(`Email: ${user.email}`);
    console.log(`Rol: ${user.role || 'default'}`);
    console.log(`Estado enabled: ${user.enabled}`);
    console.log(`Onboarded: ${user.onboarded}`);
    console.log(`isOnboarded: ${user.isOnboarded}`);
    console.log(`Proveedor: ${user.provider || 'credentials'}`);

    // Verificar si hay problemas de consistencia
    console.log('\n🔍 Verificando consistencia:');
    console.log('============================');

    if (user.enabled === false) {
      console.log('❌ PROBLEMA: Usuario deshabilitado');
    } else {
      console.log('✅ Usuario habilitado');
    }

    if (user.onboarded === undefined && user.isOnboarded === undefined) {
      console.log('❌ PROBLEMA: Campo onboarded no definido');
    } else {
      console.log('✅ Campo onboarded definido');
    }

    // Verificar si hay registros en accounts
    const accounts = await db.collection('accounts').find({
      userId: user._id.toString()
    }).toArray();

    console.log(`\n📋 Registros en accounts: ${accounts.length}`);
    if (accounts.length > 0) {
      accounts.forEach((acc, index) => {
        console.log(`   ${index + 1}. Provider: ${acc.provider}, Type: ${acc.type}`);
      });
    }

    // Verificar si hay sesiones activas
    const sessions = await db.collection('sessions').find({
      userId: user._id.toString()
    }).toArray();

    console.log(`\n📋 Sesiones activas: ${sessions.length}`);
    if (sessions.length > 0) {
      sessions.forEach((session, index) => {
        console.log(`   ${index + 1}. Expires: ${session.expires}`);
      });
    }

    console.log('\n💡 Soluciones posibles:');
    console.log('=======================');
    console.log('1. Limpiar cookies del navegador');
    console.log('2. Verificar que enabled = true');
    console.log('3. Verificar que onboarded esté definido');
    console.log('4. Eliminar sesiones antiguas si es necesario');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

const email = process.argv[2];
if (!email) {
  console.log('Uso: node debug-auth.js <email>');
  process.exit(1);
}

debugAuth(email);
