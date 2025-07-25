// scripts/check-user-details.js
require('dotenv').config({ path: '../.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;

async function checkUserDetails(email) {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db();

    console.log(`🔍 Verificando detalles del usuario: ${email}`);
    console.log('==========================================');

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
    console.log(`Creado: ${user.createdAt ? new Date(user.createdAt).toLocaleString('es-ES') : 'No especificado'}`);
    console.log(`Actualizado: ${user.updatedAt ? new Date(user.updatedAt).toLocaleString('es-ES') : 'No especificado'}`);

    console.log('\n📋 Todos los campos disponibles:');
    console.log('===============================');
    Object.keys(user).forEach(key => {
      console.log(`${key}: ${user[key]}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

const email = process.argv[2];
if (!email) {
  console.log('Uso: node check-user-details.js <email>');
  process.exit(1);
}

checkUserDetails(email);
