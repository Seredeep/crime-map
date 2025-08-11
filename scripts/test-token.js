// scripts/test-token.js
require('dotenv').config({ path: '../.env.local' });
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

const MONGO_URI = process.env.MONGODB_URI;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

async function testToken(email) {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db();

    console.log(`🔍 Probando token para: ${email}`);
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
    console.log(`   Email: ${user.email}`);
    console.log(`   Rol: ${user.role || 'default'}`);
    console.log(`   Estado enabled: ${user.enabled}`);
    console.log(`   Onboarded: ${user.onboarded}`);
    console.log(`   isOnboarded: ${user.isOnboarded}`);

    // Crear un token de prueba
    const tokenData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role || 'default',
      enabled: user.enabled,
      onboarded: user.onboarded || user.isOnboarded || false,
      createdAt: user.createdAt || new Date(),
      neighborhood: user.neighborhood || null,
      notificationsEnabled: user.notificationsEnabled ?? true,
      privacyPublic: user.privacyPublic ?? true,
      autoLocationEnabled: user.autoLocationEnabled ?? true,
      profileImage: user.profileImage ?? undefined,
    };

    console.log('\n📋 Datos del token:');
    console.log('===================');
    Object.keys(tokenData).forEach(key => {
      console.log(`${key}: ${tokenData[key]}`);
    });

    if (NEXTAUTH_SECRET) {
      console.log('\n✅ NEXTAUTH_SECRET encontrado');

      // Crear token JWT
      const token = jwt.sign(tokenData, NEXTAUTH_SECRET, { expiresIn: '7d' });
      console.log('\n🔐 Token JWT generado:');
      console.log(token.substring(0, 50) + '...');

      // Decodificar token
      const decoded = jwt.verify(token, NEXTAUTH_SECRET);
      console.log('\n📖 Token decodificado:');
      console.log('onboarded:', decoded.onboarded);
      console.log('enabled:', decoded.enabled);

    } else {
      console.log('\n❌ NEXTAUTH_SECRET no encontrado');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

const email = process.argv[2];
if (!email) {
  console.log('Uso: node test-token.js <email>');
  process.exit(1);
}

testToken(email);
