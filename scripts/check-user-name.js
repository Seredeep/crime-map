const { MongoClient } = require('mongodb');

async function checkAndUpdateUserName() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crime-map';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Conectado a MongoDB');

    const db = client.db();
    const usersCollection = db.collection('users');

    // Buscar usuarios que no tengan nombre o tengan nombre vacío
    const usersWithoutName = await usersCollection.find({
      $or: [
        { name: { $exists: false } },
        { name: null },
        { name: '' },
        { name: 'Usuario' }
      ]
    }).toArray();

    console.log(`Encontrados ${usersWithoutName.length} usuarios sin nombre válido:`);

    for (const user of usersWithoutName) {
      console.log(`\nUsuario ID: ${user._id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Nombre actual: ${user.name || 'NO DEFINIDO'}`);
      console.log(`Creado: ${user.createdAt}`);

      // Si el usuario tiene email, intentar extraer un nombre del email
      if (user.email && !user.name) {
        const emailName = user.email.split('@')[0];
        const suggestedName = emailName.charAt(0).toUpperCase() + emailName.slice(1);

        console.log(`Nombre sugerido del email: ${suggestedName}`);

        // Preguntar si actualizar
        // Por ahora, actualizar automáticamente si no hay nombre
        if (!user.name || user.name === 'Usuario') {
          await usersCollection.updateOne(
            { _id: user._id },
            { $set: { name: suggestedName } }
          );
          console.log(`✅ Actualizado nombre a: ${suggestedName}`);
        }
      }
    }

    // Mostrar todos los usuarios con sus nombres
    console.log('\n=== TODOS LOS USUARIOS ===');
    const allUsers = await usersCollection.find({}).toArray();

    for (const user of allUsers) {
      console.log(`ID: ${user._id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Nombre: ${user.name || 'NO DEFINIDO'}`);
      console.log(`Rol: ${user.role}`);
      console.log(`Habilitado: ${user.enabled}`);
      console.log('---');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkAndUpdateUserName();
