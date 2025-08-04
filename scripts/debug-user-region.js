// scripts/debug-user-region.js
require('dotenv').config({ path: '../.env.local' });
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;

async function debugUserRegion() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');

    const db = client.db('crime-map');
    const usersCollection = db.collection('users');

    // Buscar usuarios de Argentina
    const argentinaUsers = await usersCollection.find({ country: 'Argentina' }).toArray();
    console.log(`\n📊 Usuarios de Argentina encontrados: ${argentinaUsers.length}`);

    if (argentinaUsers.length > 0) {
      console.log('\n👥 Usuarios de Argentina:');
      argentinaUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. Usuario: ${user.email}`);
        console.log(`   País: ${user.country}`);
        console.log(`   Nombre: ${user.name || 'N/A'}`);
        console.log(`   Barrio: ${user.neighborhood || 'N/A'}`);
        console.log(`   Rol: ${user.role || 'user'}`);
        console.log(`   Estado: ${user.status || 'active'}`);
        console.log(`   Creado: ${user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}`);
      });
    }

    // Buscar todos los usuarios para ver la distribución por país
    const allUsers = await usersCollection.find({}).toArray();
    const countryDistribution = {};

    allUsers.forEach(user => {
      const country = user.country || 'Sin país';
      countryDistribution[country] = (countryDistribution[country] || 0) + 1;
    });

    console.log('\n🌍 Distribución por países:');
    Object.entries(countryDistribution).forEach(([country, count]) => {
      console.log(`   ${country}: ${count} usuarios`);
    });

    // Verificar configuración de región
    console.log('\n🔧 Configuración de región:');
    console.log('   Región actual en config: argentina');
    console.log('   Tipos específicos de Argentina: motochorro');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n✅ Conexión cerrada');
  }
}

debugUserRegion();
