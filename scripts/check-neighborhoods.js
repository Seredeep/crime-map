// scripts/check-neighborhoods.js
require('dotenv').config({ path: '../.env.local' });
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;

async function checkNeighborhoods() {
  const client = new MongoClient(MONGO_URI);

  try {
    console.log('🔍 VERIFICANDO DATOS DE NEIGHBORHOODS');
    console.log('=====================================');

    await client.connect();
    const db = client.db();

    // Obtener todos los neighborhoods
    const neighborhoods = await db.collection('neighborhoods').find({}).toArray();

    console.log(`📊 Total de neighborhoods: ${neighborhoods.length}`);

    if (neighborhoods.length === 0) {
      console.log('❌ No hay datos de neighborhoods en la base de datos');
      console.log('💡 Necesitas cargar los datos de neighborhoods para ambos países');
      return;
    }

    // Agrupar por país
    const neighborhoodsByCountry = {};
    neighborhoods.forEach(n => {
      const country = n.properties?.country || 'No especificado';
      if (!neighborhoodsByCountry[country]) {
        neighborhoodsByCountry[country] = [];
      }
      neighborhoodsByCountry[country].push(n);
    });

    console.log('\n📊 NEIGHBORHOODS POR PAÍS:');
    console.log('============================');
    Object.entries(neighborhoodsByCountry).forEach(([country, neighborhoodsList]) => {
      console.log(`${country}: ${neighborhoodsList.length} neighborhoods`);

      // Agrupar por ciudad
      const byCity = {};
      neighborhoodsList.forEach(n => {
        const city = n.properties?.city || 'No especificado';
        if (!byCity[city]) {
          byCity[city] = [];
        }
        byCity[city].push(n);
      });

      Object.entries(byCity).forEach(([city, cityNeighborhoods]) => {
        console.log(`  📍 ${city}: ${cityNeighborhoods.length} neighborhoods`);
      });
    });

    // Verificar países únicos
    const uniqueCountries = [...new Set(neighborhoods.map(n => n.properties?.country).filter(Boolean))];
    console.log('\n🌍 PAÍSES DISPONIBLES:');
    console.log('=======================');
    uniqueCountries.forEach(country => {
      console.log(`- ${country}`);
    });

    // Verificar ciudades únicas
    const uniqueCities = [...new Set(neighborhoods.map(n => n.properties?.city).filter(Boolean))];
    console.log('\n🏙️  CIUDADES DISPONIBLES:');
    console.log('=========================');
    uniqueCities.forEach(city => {
      const cityNeighborhoods = neighborhoods.filter(n => n.properties?.city === city);
      const country = cityNeighborhoods[0]?.properties?.country || 'No especificado';
      console.log(`- ${city} (${country}): ${cityNeighborhoods.length} neighborhoods`);
    });

    // Verificar si tenemos datos para ambos países
    const hasArgentina = uniqueCountries.includes('Argentina');
    const hasUSA = uniqueCountries.includes('USA');

    console.log('\n✅ VERIFICACIÓN DE PAÍSES:');
    console.log('===========================');
    console.log(`🇦🇷 Argentina: ${hasArgentina ? '✅ Disponible' : '❌ No disponible'}`);
    console.log(`🇺🇸 USA: ${hasUSA ? '✅ Disponible' : '❌ No disponible'}`);

    if (!hasArgentina || !hasUSA) {
      console.log('\n⚠️  PROBLEMAS DETECTADOS:');
      console.log('=========================');
      if (!hasArgentina) {
        console.log('❌ No hay datos de neighborhoods para Argentina');
        console.log('💡 Ejecuta: node load-san-francisco-neighborhoods.js');
      }
      if (!hasUSA) {
        console.log('❌ No hay datos de neighborhoods para USA');
        console.log('💡 Ejecuta: node load-san-francisco-neighborhoods.js');
      }
    } else {
      console.log('\n🎉 ¡Todo está configurado correctamente!');
      console.log('Los usuarios podrán seleccionar Argentina y USA en el onboarding');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

// Función para cargar datos de ejemplo si no existen
async function loadSampleNeighborhoods() {
  const client = new MongoClient(MONGO_URI);

  try {
    console.log('📥 CARGANDO DATOS DE EJEMPLO DE NEIGHBORHOODS');
    console.log('==============================================');

    await client.connect();
    const db = client.db();

    // Verificar si ya existen datos
    const existingCount = await db.collection('neighborhoods').countDocuments();

    if (existingCount > 0) {
      console.log(`ℹ️  Ya existen ${existingCount} neighborhoods en la base de datos`);
      console.log('💡 Si quieres recargar los datos, elimina la colección primero');
      return;
    }

    // Datos de ejemplo para Argentina (Mar del Plata)
    const argentinaNeighborhoods = [
      {
        type: 'Feature',
        properties: {
          name: 'Centro',
          city: 'Mar del Plata',
          country: 'Argentina',
          state: 'Buenos Aires'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[[-57.5426, -38.0055], [-57.5326, -38.0055], [-57.5326, -38.0155], [-57.5426, -38.0155], [-57.5426, -38.0055]]]
        }
      },
      {
        type: 'Feature',
        properties: {
          name: 'La Perla',
          city: 'Mar del Plata',
          country: 'Argentina',
          state: 'Buenos Aires'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[[-57.5426, -38.0055], [-57.5326, -38.0055], [-57.5326, -38.0155], [-57.5426, -38.0155], [-57.5426, -38.0055]]]
        }
      },
      {
        type: 'Feature',
        properties: {
          name: 'Playa Grande',
          city: 'Mar del Plata',
          country: 'Argentina',
          state: 'Buenos Aires'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[[-57.5426, -38.0055], [-57.5326, -38.0055], [-57.5326, -38.0155], [-57.5426, -38.0155], [-57.5426, -38.0055]]]
        }
      }
    ];

    // Datos de ejemplo para USA (San Francisco)
    const usaNeighborhoods = [
      {
        type: 'Feature',
        properties: {
          name: 'Downtown',
          city: 'San Francisco',
          country: 'USA',
          state: 'California'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[[-122.4194, 37.7749], [-122.4094, 37.7749], [-122.4094, 37.7849], [-122.4194, 37.7849], [-122.4194, 37.7749]]]
        }
      },
      {
        type: 'Feature',
        properties: {
          name: 'Mission District',
          city: 'San Francisco',
          country: 'USA',
          state: 'California'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[[-122.4194, 37.7749], [-122.4094, 37.7749], [-122.4094, 37.7849], [-122.4194, 37.7849], [-122.4194, 37.7749]]]
        }
      },
      {
        type: 'Feature',
        properties: {
          name: 'North Beach',
          city: 'San Francisco',
          country: 'USA',
          state: 'California'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[[-122.4194, 37.7749], [-122.4094, 37.7749], [-122.4094, 37.7849], [-122.4194, 37.7849], [-122.4194, 37.7749]]]
        }
      }
    ];

    // Insertar datos
    const allNeighborhoods = [...argentinaNeighborhoods, ...usaNeighborhoods];

    const result = await db.collection('neighborhoods').insertMany(allNeighborhoods);

    console.log(`✅ Se cargaron ${result.insertedCount} neighborhoods de ejemplo`);
    console.log(`🇦🇷 Argentina (Mar del Plata): ${argentinaNeighborhoods.length} neighborhoods`);
    console.log(`🇺🇸 USA (San Francisco): ${usaNeighborhoods.length} neighborhoods`);

  } catch (error) {
    console.error('❌ Error cargando datos:', error.message);
  } finally {
    await client.close();
  }
}

// Procesar argumentos de línea de comandos
const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.log('Uso del script:');
  console.log('  node check-neighborhoods.js --check              // Verificar datos existentes');
  console.log('  node check-neighborhoods.js --load-sample        // Cargar datos de ejemplo');
  process.exit(1);
}

if (command === '--check') {
  checkNeighborhoods();
} else if (command === '--load-sample') {
  loadSampleNeighborhoods();
} else {
  console.error('Comando no reconocido. Usa --check o --load-sample');
  process.exit(1);
}
