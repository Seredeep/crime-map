const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function fixUserNames() {
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

    // Obtener todos los usuarios
    const users = await usersCollection.find({}).toArray();
    console.log(`\n📊 Total de usuarios encontrados: ${users.length}`);

    let updatedCount = 0;

    for (const user of users) {
      console.log(`\n--- Usuario ID: ${user._id} ---`);
      console.log(`Email: ${user.email}`);
      console.log(`Nombre actual: ${user.name || 'NO DEFINIDO'}`);

      // Si el usuario no tiene nombre o tiene "Usuario", intentar generarlo del email
      if (!user.name || user.name === 'Usuario' || user.name === '') {
        if (user.email) {
          const emailName = user.email.split('@')[0];
          const suggestedName = emailName.charAt(0).toUpperCase() + emailName.slice(1);

          console.log(`💡 Generando nombre sugerido: ${suggestedName}`);

          // Actualizar el usuario en la base de datos
          const result = await usersCollection.updateOne(
            { _id: user._id },
            { $set: { name: suggestedName } }
          );

          if (result.modifiedCount > 0) {
            console.log(`✅ Nombre actualizado a: ${suggestedName}`);
            updatedCount++;
          } else {
            console.log(`❌ No se pudo actualizar el nombre`);
          }
        } else {
          console.log(`⚠️ Usuario sin email, no se puede generar nombre`);
        }
      } else {
        console.log(`✅ Usuario ya tiene nombre válido`);
      }
    }

    console.log(`\n🎉 Proceso completado. ${updatedCount} usuarios actualizados.`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Conexión cerrada');
  }
}

fixUserNames();
