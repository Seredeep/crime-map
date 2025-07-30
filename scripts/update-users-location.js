const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function updateUsersLocation() {
  let client;

  try {
    console.log('🔗 Conectando a MongoDB...');
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const db = client.db();
    const usersCollection = db.collection('users');

    console.log('📊 Buscando usuarios sin información de ubicación...');

    // Buscar usuarios que no tienen country o city
    const usersToUpdate = await usersCollection.find({
      $or: [
        { country: { $exists: false } },
        { city: { $exists: false } },
        { country: null },
        { city: null }
      ]
    }).toArray();

    console.log(`📋 Encontrados ${usersToUpdate.length} usuarios para actualizar`);

    if (usersToUpdate.length === 0) {
      console.log('✅ Todos los usuarios ya tienen información de ubicación');
      return;
    }

    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of usersToUpdate) {
      try {
        // Determinar país y ciudad basado en el barrio existente
        let country = 'USA';
        let city = 'San Francisco';

        // Si el usuario ya tiene un barrio, intentar determinar la ubicación
        if (user.neighborhood) {
          // Buscar el barrio en la colección de barrios para obtener información
          const neighborhoodDoc = await db.collection('neighborhoods').findOne({
            $or: [
              { 'properties.name': user.neighborhood },
              { 'properties.soc_fomen': user.neighborhood }
            ]
          });

          if (neighborhoodDoc) {
            country = neighborhoodDoc.properties.country || 'USA';
            city = neighborhoodDoc.properties.city || 'San Francisco';
          }
        }

        // Actualizar el usuario
        await usersCollection.updateOne(
          { _id: user._id },
          {
            $set: {
              country,
              city,
              updatedAt: new Date()
            }
          }
        );

        console.log(`✅ Usuario ${user.email} actualizado: ${country}, ${city}`);
        updatedCount++;

      } catch (error) {
        console.error(`❌ Error actualizando usuario ${user.email}:`, error.message);
        skippedCount++;
      }
    }

    console.log('\n📈 Resumen de actualización:');
    console.log(`✅ Usuarios actualizados: ${updatedCount}`);
    console.log(`⏭️ Usuarios omitidos: ${skippedCount}`);
    console.log(`📊 Total procesados: ${usersToUpdate.length}`);

  } catch (error) {
    console.error('❌ Error en la actualización:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Conexión a MongoDB cerrada');
    }
  }
}

// Función para mostrar estadísticas de usuarios
async function showUserStats() {
  let client;

  try {
    console.log('🔗 Conectando a MongoDB...');
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const db = client.db();
    const usersCollection = db.collection('users');

    console.log('\n📊 Estadísticas de usuarios:');

    const totalUsers = await usersCollection.countDocuments();
    const usersWithCountry = await usersCollection.countDocuments({ country: { $exists: true, $ne: null } });
    const usersWithCity = await usersCollection.countDocuments({ city: { $exists: true, $ne: null } });
    const usersWithNeighborhood = await usersCollection.countDocuments({ neighborhood: { $exists: true, $ne: null } });
    const onboardedUsers = await usersCollection.countDocuments({ onboarded: true });

    console.log(`👥 Total de usuarios: ${totalUsers}`);
    console.log(`🌍 Usuarios con país: ${usersWithCountry}`);
    console.log(`🏙️ Usuarios con ciudad: ${usersWithCity}`);
    console.log(`🏘️ Usuarios con barrio: ${usersWithNeighborhood}`);
    console.log(`✅ Usuarios con onboarding: ${onboardedUsers}`);

    // Mostrar distribución por países
    const countries = await usersCollection.aggregate([
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    console.log('\n🌍 Distribución por países:');
    countries.forEach(country => {
      if (country._id) {
        console.log(`  ${country._id}: ${country.count} usuarios`);
      }
    });

    // Mostrar distribución por ciudades
    const cities = await usersCollection.aggregate([
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    console.log('\n🏙️ Distribución por ciudades:');
    cities.forEach(city => {
      if (city._id) {
        console.log(`  ${city._id}: ${city.count} usuarios`);
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Ejecutar el script
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--stats') || args.includes('-s')) {
    await showUserStats();
  } else {
    console.log('🚀 Iniciando actualización de usuarios...\n');
    await updateUsersLocation();
    console.log('\n📊 Mostrando estadísticas después de la actualización...');
    await showUserStats();
  }
}

main().catch(console.error);
