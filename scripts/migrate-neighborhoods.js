const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '../.env.local' });

const SOURCE_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const SOURCE_DB = 'test';
const TARGET_DB = 'demo';
const COLLECTION_NAME = 'neighborhoods';

async function migrateNeighborhoods() {
  const sourceClient = new MongoClient(SOURCE_URI);
  const targetClient = new MongoClient(SOURCE_URI);

  try {
    console.log('🔄 Iniciando migración de neighborhoods...');
    console.log(`📤 Origen: ${SOURCE_DB}/${COLLECTION_NAME}`);
    console.log(`📥 Destino: ${TARGET_DB}/${COLLECTION_NAME}`);

    // Conectar a ambas bases de datos
    await sourceClient.connect();
    await targetClient.connect();

    const sourceDb = sourceClient.db(SOURCE_DB);
    const targetDb = targetClient.db(TARGET_DB);

    // Verificar si la colección origen existe
    const sourceCollections = await sourceDb.listCollections({ name: COLLECTION_NAME }).toArray();
    if (sourceCollections.length === 0) {
      console.error(`❌ La colección ${COLLECTION_NAME} no existe en ${SOURCE_DB}`);
      return;
    }

    // Obtener todos los documentos de la colección origen
    const neighborhoods = await sourceDb.collection(COLLECTION_NAME).find({}).toArray();
    console.log(`📊 Encontrados ${neighborhoods.length} neighborhoods para migrar`);

    if (neighborhoods.length === 0) {
      console.log('⚠️ No hay datos para migrar');
      return;
    }

    // Verificar si la colección destino existe y limpiarla
    const targetCollections = await targetDb.listCollections({ name: COLLECTION_NAME }).toArray();
    if (targetCollections.length > 0) {
      console.log('🗑️ Limpiando colección destino existente...');
      await targetDb.collection(COLLECTION_NAME).deleteMany({});
    }

    // Insertar los documentos en la base de datos destino
    if (neighborhoods.length > 0) {
      const result = await targetDb.collection(COLLECTION_NAME).insertMany(neighborhoods);
      console.log(`✅ Migración completada: ${result.insertedCount} neighborhoods migrados`);
    }

    // Verificar la migración
    const migratedCount = await targetDb.collection(COLLECTION_NAME).countDocuments();
    console.log(`🔍 Verificación: ${migratedCount} neighborhoods en ${TARGET_DB}/${COLLECTION_NAME}`);

    if (migratedCount === neighborhoods.length) {
      console.log('🎉 ¡Migración exitosa!');
    } else {
      console.log('⚠️ Advertencia: El número de documentos no coincide');
    }

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await sourceClient.close();
    await targetClient.close();
    console.log('🔌 Conexiones cerradas');
  }
}

// Ejecutar la migración
migrateNeighborhoods().then(() => {
  console.log('🏁 Script de migración finalizado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
