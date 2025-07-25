// scripts/set-onboarding.js
require('dotenv').config({ path: '../.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;

async function setOnboarding(email, onboarded = true) {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db();

    console.log(`🔧 Configurando onboarding para: ${email}`);
    console.log('==========================================');

    // Buscar el usuario
    const user = await db.collection('users').findOne({ email: email });

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    console.log('📋 Usuario encontrado:');
    console.log(`   Nombre: ${user.name || 'No especificado'}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Onboarded actual: ${user.onboarded}`);
    console.log(`   isOnboarded actual: ${user.isOnboarded}`);

    // Actualizar el estado de onboarding
    const result = await db.collection('users').updateOne(
      { email: email },
      {
        $set: {
          onboarded: onboarded,
          isOnboarded: onboarded,
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`✅ Onboarding configurado a: ${onboarded}`);
      console.log('💡 Ahora puedes iniciar sesión sin problemas');
    } else {
      console.log('⚠️  No se pudo actualizar el onboarding');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

const email = process.argv[2];
const onboarded = process.argv[3] === 'false' ? false : true;

if (!email) {
  console.log('Uso: node set-onboarding.js <email> [true|false]');
  console.log('Ejemplo: node set-onboarding.js usuario@ejemplo.com true');
  process.exit(1);
}

setOnboarding(email, onboarded);
