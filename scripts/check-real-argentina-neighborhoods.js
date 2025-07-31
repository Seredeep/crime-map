// scripts/check-real-argentina-neighborhoods.js
require('dotenv').config({ path: '../.env.local' });
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;

async function checkRealArgentinaNeighborhoods() {
  const client = new MongoClient(MONGO_URI);

  try {
    console.log('🔍 VERIFICANDO BARRIOS REALES DE ARGENTINA');
    console.log('==========================================');

    await client.connect();
    const db = client.db();

    // Obtener todos los neighborhoods de Argentina
    const argentinaNeighborhoods = await db.collection('neighborhoods').find({
      'properties.country': 'Argentina'
    }).toArray();

    console.log(`📊 Total de neighborhoods de Argentina: ${argentinaNeighborhoods.length}`);

    if (argentinaNeighborhoods.length === 0) {
      console.log('❌ No hay neighborhoods de Argentina en la base de datos');
      return;
    }

    // Agrupar por ciudad
    const cities = {};
    argentinaNeighborhoods.forEach(n => {
      const city = n.properties?.city || 'Sin ciudad';
      if (!cities[city]) {
        cities[city] = [];
      }
      cities[city].push(n);
    });

    console.log('\n🏙️  BARRIOS POR CIUDAD:');
    console.log('========================');

    Object.entries(cities).forEach(([city, neighborhoods]) => {
      console.log(`\n📍 ${city}: ${neighborhoods.length} barrios`);
      console.log('   Barrios:');

      neighborhoods.forEach((n, index) => {
        const name = n.properties?.name || 'Sin nombre';
        const state = n.properties?.state || 'Sin estado';
        console.log(`   ${index + 1}. ${name} (${state})`);
      });
    });

    // Verificar si son barrios de prueba o reales
    console.log('\n🔍 ANÁLISIS DE BARRIOS:');
    console.log('=======================');

    const testBarrios = ['Centro', 'La Perla', 'Playa Grande', 'Playa Chica', 'Los Troncos', 'Punta Mogotes', 'San Martín', 'Centro Histórico', 'Puerto', 'Villa Gesell'];

    const foundTestBarrios = argentinaNeighborhoods.filter(n =>
      testBarrios.includes(n.properties?.name)
    );

    const realBarrios = argentinaNeighborhoods.filter(n =>
      !testBarrios.includes(n.properties?.name)
    );

    console.log(`🧪 Barrios de prueba encontrados: ${foundTestBarrios.length}`);
    console.log(`🏘️  Barrios reales encontrados: ${realBarrios.length}`);

    if (foundTestBarrios.length > 0) {
      console.log('\n🧪 BARRIOS DE PRUEBA:');
      foundTestBarrios.forEach(n => {
        console.log(`   - ${n.properties?.name} (${n.properties?.city})`);
      });
    }

    if (realBarrios.length > 0) {
      console.log('\n🏘️  BARRIOS REALES:');
      realBarrios.forEach(n => {
        console.log(`   - ${n.properties?.name} (${n.properties?.city})`);
      });
    }

    // Mostrar estructura de datos de ejemplo
    console.log('\n📋 ESTRUCTURA DE DATOS:');
    console.log('========================');

    if (argentinaNeighborhoods.length > 0) {
      const example = argentinaNeighborhoods[0];
      console.log('Ejemplo de neighborhood:');
      console.log(JSON.stringify(example, null, 2));
    }

    // Conclusión
    console.log('\n🎯 CONCLUSIÓN:');
    console.log('===============');

    if (realBarrios.length > 0) {
      console.log('✅ Tienes barrios reales de Argentina');
      console.log('💡 El onboarding debería mostrar estos barrios reales');
    } else {
      console.log('⚠️  Solo tienes barrios de prueba');
      console.log('💡 Necesitas agregar los barrios reales de Mar del Plata');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkRealArgentinaNeighborhoods();
