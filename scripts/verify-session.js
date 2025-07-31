const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function verifySession() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI no está definida en las variables de entorno');
    return;
  }

  console.log('🔗 Conectando a MongoDB...');
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');

    const db = client.db();
    const usersCollection = db.collection('users');
    const sessionsCollection = db.collection('sessions');
    const accountsCollection = db.collection('accounts');

    // Verificar usuarios
    const users = await usersCollection.find({}).toArray();
    console.log(`\n📊 Total de usuarios: ${users.length}`);

    // Verificar sesiones
    const sessions = await sessionsCollection.find({}).toArray();
    console.log(`📊 Total de sesiones: ${sessions.length}`);

    // Verificar cuentas
    const accounts = await accountsCollection.find({}).toArray();
    console.log(`📊 Total de cuentas: ${accounts.length}`);

    // Mostrar algunos usuarios de ejemplo
    console.log('\n👥 Ejemplos de usuarios:');
    users.slice(0, 5).forEach(user => {
      console.log(`- ${user.name || 'Sin nombre'} (${user.email}) - Rol: ${user.role}`);
    });

    // Verificar si hay usuarios sin nombre
    const usersWithoutName = users.filter(user => !user.name || user.name === 'Usuario');
    if (usersWithoutName.length > 0) {
      console.log(`\n⚠️ Usuarios sin nombre válido: ${usersWithoutName.length}`);
      usersWithoutName.forEach(user => {
        console.log(`- ${user.email} (ID: ${user._id})`);
      });
    } else {
      console.log('\n✅ Todos los usuarios tienen nombres válidos');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Conexión cerrada');
  }
}

verifySession();
