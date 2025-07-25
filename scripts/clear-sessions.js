// scripts/clear-sessions.js
require('dotenv').config({ path: '../.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;

async function clearSessions(email) {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db();

    console.log(`🧹 Limpiando sesiones para: ${email}`);
    console.log('==========================================');

    // Buscar el usuario
    const user = await db.collection('users').findOne({ email: email });

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    console.log('✅ Usuario encontrado:');
    console.log(`   ID: ${user._id}`);
    console.log(`   Nombre: ${user.name || 'No especificado'}`);

    // Eliminar sesiones
    const sessionsResult = await db.collection('sessions').deleteMany({
      userId: user._id.toString()
    });

    console.log(`✅ Sesiones eliminadas: ${sessionsResult.deletedCount}`);

    // Eliminar accounts (si existen)
    const accountsResult = await db.collection('accounts').deleteMany({
      userId: user._id.toString()
    });

    console.log(`✅ Accounts eliminados: ${accountsResult.deletedCount}`);

    console.log('\n💡 Ahora:');
    console.log('1. Limpia las cookies del navegador');
    console.log('2. Intenta iniciar sesión nuevamente');
    console.log('3. Deberías ser redirigido al onboarding');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

const email = process.argv[2];
if (!email) {
  console.log('Uso: node clear-sessions.js <email>');
  process.exit(1);
}

clearSessions(email);
