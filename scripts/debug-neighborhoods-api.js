// scripts/debug-neighborhoods-api.js
require('dotenv').config({ path: '../.env.local' });
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;

async function debugNeighborhoodsAPI() {
  console.log('🔍 DEBUG NEIGHBORHOODS API');
  console.log('==========================\n');

  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db();

    console.log('📊 VERIFICANDO DATOS EN LA BASE DE DATOS:');
    console.log('==========================================\n');

    // Contar total de neighborhoods
    const totalCount = await db.collection('neighborhoods').countDocuments();
    console.log(`📊 Total de neighborhoods en DB: ${totalCount}`);

    // Contar por país
    const argentinaCount = await db.collection('neighborhoods').countDocuments({
      'properties.country': 'Argentina'
    });
    const usaCount = await db.collection('neighborhoods').countDocuments({
      'properties.country': 'USA'
    });

    console.log(`🇦🇷 Argentina: ${argentinaCount} neighborhoods`);
    console.log(`🇺🇸 USA: ${usaCount} neighborhoods`);

    // Verificar si hay neighborhoods sin país
    const noCountryCount = await db.collection('neighborhoods').countDocuments({
      $or: [
        { 'properties.country': { $exists: false } },
        { 'properties.country': null },
        { 'properties.country': '' }
      ]
    });
    console.log(`❓ Sin país definido: ${noCountryCount} neighborhoods`);

    // Simular la consulta exacta del endpoint
    console.log('\n🔍 SIMULANDO CONSULTA DEL ENDPOINT:');
    console.log('====================================');

    // Consulta sin filtros (como cuando no hay parámetros)
    const allNeighborhoods = await db.collection('neighborhoods').find({}).toArray();
    console.log(`📊 Consulta sin filtros: ${allNeighborhoods.length} neighborhoods`);

    // Verificar países en la consulta sin filtros
    const countriesInQuery = [...new Set(allNeighborhoods.map(n => n.properties?.country).filter(Boolean))];
    console.log(`🌍 Países en consulta sin filtros: ${countriesInQuery.join(', ')}`);

    // Verificar si hay algún problema con la estructura de datos
    console.log('\n🔍 VERIFICANDO ESTRUCTURA DE DATOS:');
    console.log('=====================================');

    // Tomar algunos ejemplos
    const argentinaSample = await db.collection('neighborhoods').findOne({
      'properties.country': 'Argentina'
    });

    const usaSample = await db.collection('neighborhoods').findOne({
      'properties.country': 'USA'
    });

    if (argentinaSample) {
      console.log('🇦🇷 Ejemplo Argentina:');
      console.log('   - ID:', argentinaSample._id);
      console.log('   - Properties:', JSON.stringify(argentinaSample.properties, null, 2));
    }

    if (usaSample) {
      console.log('🇺🇸 Ejemplo USA:');
      console.log('   - ID:', usaSample._id);
      console.log('   - Properties:', JSON.stringify(usaSample.properties, null, 2));
    }

    // Verificar si hay algún problema con índices o consultas
    console.log('\n🔍 VERIFICANDO POSIBLES PROBLEMAS:');
    console.log('===================================');

    // Verificar si hay neighborhoods con country en diferentes ubicaciones
    const differentStructure = await db.collection('neighborhoods').findOne({
      $or: [
        { country: { $exists: true } },
        { 'properties.country': { $exists: false } }
      ]
    });

    if (differentStructure) {
      console.log('⚠️  WARNING: Se encontraron neighborhoods con estructura diferente');
      console.log('   - Estructura encontrada:', Object.keys(differentStructure));
    }

    // Verificar si hay algún problema con la colección
    const collectionStats = await db.collection('neighborhoods').stats();
    console.log('\n📊 ESTADÍSTICAS DE LA COLECCIÓN:');
    console.log('=================================');
    console.log('   - Nombre:', collectionStats.ns);
    console.log('   - Tamaño:', collectionStats.size, 'bytes');
    console.log('   - Documentos:', collectionStats.count);
    console.log('   - Índices:', collectionStats.nindexes);

    // Conclusión
    console.log('\n🎯 CONCLUSIÓN:');
    console.log('===============');

    if (argentinaCount > 0 && usaCount > 0) {
      console.log('✅ Los datos están correctos en la base de datos');
      console.log('💡 El problema está en la API o en el frontend');

      if (allNeighborhoods.length < totalCount) {
        console.log('⚠️  La consulta sin filtros no está devolviendo todos los datos');
        console.log('   - Posible problema con la consulta o índices');
      } else {
        console.log('✅ La consulta sin filtros devuelve todos los datos');
        console.log('💡 El problema podría estar en el frontend o en la caché');
      }
    } else {
      console.log('❌ Hay un problema con los datos en la base de datos');
      console.log('   - Argentina:', argentinaCount);
      console.log('   - USA:', usaCount);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

// Ejecutar el debug
debugNeighborhoodsAPI().catch(console.error);
