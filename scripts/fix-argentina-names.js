// scripts/fix-argentina-names.js
require('dotenv').config({ path: '../.env.local' });
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;

async function fixArgentinaNames() {
  const client = new MongoClient(MONGO_URI);

  try {
    console.log('🔧 ARREGLANDO NOMBRES DE BARRIOS DE ARGENTINA');
    console.log('=============================================');

    await client.connect();
    const db = client.db();

    // Obtener todos los neighborhoods de Argentina
    const argentinaNeighborhoods = await db.collection('neighborhoods').find({
      'properties.country': 'Argentina'
    }).toArray();

    console.log(`📊 Total de barrios de Argentina: ${argentinaNeighborhoods.length}`);

    if (argentinaNeighborhoods.length === 0) {
      console.log('❌ No hay neighborhoods de Argentina en la base de datos');
      return;
    }

    // Verificar cuántos tienen soc_fomen
    const withSocFomen = argentinaNeighborhoods.filter(n => n.properties?.soc_fomen);
    console.log(`📊 Barrios con soc_fomen: ${withSocFomen.length}`);

    if (withSocFomen.length === 0) {
      console.log('❌ No hay barrios con el campo soc_fomen');
      return;
    }

    // Mostrar algunos ejemplos antes de arreglar
    console.log('\n📋 EJEMPLOS ANTES DE ARREGLAR:');
    console.log('================================');

    withSocFomen.slice(0, 5).forEach((n, index) => {
      console.log(`${index + 1}. soc_fomen: "${n.properties.soc_fomen}"`);
    });

    // Actualizar los barrios para copiar soc_fomen a name
    console.log('\n🔧 ARREGLANDO NOMBRES...');
    console.log('==========================');

    let updatedCount = 0;

    for (const neighborhood of withSocFomen) {
      const result = await db.collection('neighborhoods').updateOne(
        { _id: neighborhood._id },
        {
          $set: {
            'properties.name': neighborhood.properties.soc_fomen
          }
        }
      );

      if (result.modifiedCount > 0) {
        updatedCount++;
      }
    }

    console.log(`✅ ${updatedCount} barrios actualizados`);

    // Verificar el resultado
    console.log('\n📋 VERIFICANDO RESULTADO:');
    console.log('===========================');

    const updatedNeighborhoods = await db.collection('neighborhoods').find({
      'properties.country': 'Argentina',
      'properties.name': { $exists: true }
    }).limit(10).toArray();

    console.log('Ejemplos después de arreglar:');
    updatedNeighborhoods.forEach((n, index) => {
      console.log(`${index + 1}. ${n.properties.name} (${n.properties.city})`);
    });

    // Conteo final
    const finalCount = await db.collection('neighborhoods').countDocuments({
      'properties.country': 'Argentina',
      'properties.name': { $exists: true }
    });

    console.log(`\n📊 Total de barrios con nombres: ${finalCount}`);

    // Conclusión
    console.log('\n🎯 CONCLUSIÓN:');
    console.log('===============');

    if (finalCount > 0) {
      console.log('✅ Los barrios de Argentina ahora tienen nombres correctos');
      console.log('💡 El onboarding debería mostrar los nombres reales de los barrios');
    } else {
      console.log('❌ No se pudieron arreglar los nombres');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

fixArgentinaNames();
