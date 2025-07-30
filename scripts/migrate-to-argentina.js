const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Importar Firebase Admin
const admin = require('firebase-admin');

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  const serviceAccount = require('../service-account-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const firestore = admin.firestore();

async function migrateToArgentina() {
  let client;

  try {
    console.log('🔗 Conectando a MongoDB...');
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const db = client.db();
    const usersCollection = db.collection('users');

    console.log('📊 Buscando usuarios para migrar a Argentina...');

    // Buscar usuarios que actualmente tienen USA/San Francisco
    const usersToMigrate = await usersCollection.find({
      $or: [
        { country: 'USA' },
        { city: 'San Francisco' }
      ]
    }).toArray();

    console.log(`📋 Encontrados ${usersToMigrate.length} usuarios para migrar`);

    if (usersToMigrate.length === 0) {
      console.log('✅ No hay usuarios para migrar');
      return;
    }

    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of usersToMigrate) {
      try {
        console.log(`🔄 Migrando usuario: ${user.email}`);

        // Actualizar en MongoDB
        await usersCollection.updateOne(
          { _id: user._id },
          {
            $set: {
              country: 'Argentina',
              city: 'Mar del Plata',
              updatedAt: new Date()
            }
          }
        );

        // Actualizar en Firestore
        const userDocRef = firestore.collection('users').doc(user._id.toString());
        await userDocRef.update({
          country: 'Argentina',
          city: 'Mar del Plata',
          updatedAt: new Date()
        });

        console.log(`✅ Usuario ${user.email} migrado: Argentina, Mar del Plata`);
        updatedCount++;

      } catch (error) {
        console.error(`❌ Error migrando usuario ${user.email}:`, error.message);
        skippedCount++;
      }
    }

    console.log('\n📈 Resumen de migración:');
    console.log(`✅ Usuarios migrados: ${updatedCount}`);
    console.log(`⏭️ Usuarios omitidos: ${skippedCount}`);
    console.log(`📊 Total procesados: ${usersToMigrate.length}`);

  } catch (error) {
    console.error('❌ Error en la migración:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Conexión a MongoDB cerrada');
    }
  }
}

// Función para mostrar estadísticas después de la migración
async function showMigrationStats() {
  let client;

  try {
    console.log('🔗 Conectando a MongoDB...');
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const db = client.db();
    const usersCollection = db.collection('users');

    console.log('\n📊 Estadísticas después de la migración:');

    const totalUsers = await usersCollection.countDocuments();
    const argentinaUsers = await usersCollection.countDocuments({ country: 'Argentina' });
    const marDelPlataUsers = await usersCollection.countDocuments({ city: 'Mar del Plata' });
    const usaUsers = await usersCollection.countDocuments({ country: 'USA' });
    const sfUsers = await usersCollection.countDocuments({ city: 'San Francisco' });

    console.log(`👥 Total de usuarios: ${totalUsers}`);
    console.log(`🇦🇷 Usuarios en Argentina: ${argentinaUsers}`);
    console.log(`🏖️ Usuarios en Mar del Plata: ${marDelPlataUsers}`);
    console.log(`🇺🇸 Usuarios en USA: ${usaUsers}`);
    console.log(`🌉 Usuarios en San Francisco: ${sfUsers}`);

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

// Función para verificar Firestore
async function verifyFirestoreMigration() {
  try {
    console.log('\n🔥 Verificando migración en Firestore...');

    const usersSnapshot = await firestore.collection('users').get();
    let argentinaCount = 0;
    let marDelPlataCount = 0;
    let totalCount = 0;

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      totalCount++;

      if (userData.country === 'Argentina') {
        argentinaCount++;
      }
      if (userData.city === 'Mar del Plata') {
        marDelPlataCount++;
      }
    });

    console.log(`📊 Firestore - Total usuarios: ${totalCount}`);
    console.log(`🇦🇷 Firestore - Usuarios en Argentina: ${argentinaCount}`);
    console.log(`🏖️ Firestore - Usuarios en Mar del Plata: ${marDelPlataCount}`);

  } catch (error) {
    console.error('❌ Error verificando Firestore:', error);
  }
}

// Ejecutar el script
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--verify') || args.includes('-v')) {
    await showMigrationStats();
    await verifyFirestoreMigration();
  } else {
    console.log('🚀 Iniciando migración a Argentina...\n');
    await migrateToArgentina();
    console.log('\n📊 Mostrando estadísticas después de la migración...');
    await showMigrationStats();
    await verifyFirestoreMigration();
  }
}

main().catch(console.error);
