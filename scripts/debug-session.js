const { MongoClient } = require('mongodb');
require('dotenv').config();

async function debugSession() {
  // Usar la misma URI que la aplicación
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('MONGODB_URI no está definida en las variables de entorno');
    return;
  }

  console.log('URI de MongoDB:', uri);

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');

    const db = client.db();
    const usersCollection = db.collection('users');

    // Buscar todos los usuarios
    const users = await usersCollection.find({}).toArray();

    console.log(`\n📊 Total de usuarios: ${users.length}`);

    for (const user of users) {
      console.log('\n--- Usuario ---');
      console.log(`ID: ${user._id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Nombre: ${user.name || 'NO DEFINIDO'}`);
      console.log(`Rol: ${user.role}`);
      console.log(`Habilitado: ${user.enabled}`);
      console.log(`Onboarded: ${user.onboarded}`);
      console.log(`Creado: ${user.createdAt}`);

      // Si no tiene nombre, sugerir uno
      if (!user.name || user.name === 'Usuario') {
        if (user.email) {
          const emailName = user.email.split('@')[0];
          const suggestedName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
          console.log(`💡 Nombre sugerido: ${suggestedName}`);

          // Actualizar automáticamente
          await usersCollection.updateOne(
            { _id: user._id },
            { $set: { name: suggestedName } }
          );
          console.log(`✅ Actualizado nombre a: ${suggestedName}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugSession();
