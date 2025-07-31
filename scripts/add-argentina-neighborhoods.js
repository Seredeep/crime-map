// scripts/add-argentina-neighborhoods.js
require('dotenv').config({ path: '../.env.local' });
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;

async function addArgentinaNeighborhoods() {
  const client = new MongoClient(MONGO_URI);

  try {
    console.log('🇦🇷 AGREGANDO NEIGHBORHOODS DE ARGENTINA');
    console.log('========================================');

    await client.connect();
    const db = client.db();

    // Verificar si ya existen neighborhoods de Argentina
    const existingArgentinaCount = await db.collection('neighborhoods').countDocuments({
      'properties.country': 'Argentina'
    });

    if (existingArgentinaCount > 0) {
      console.log(`ℹ️  Ya existen ${existingArgentinaCount} neighborhoods de Argentina`);
      console.log('💡 No es necesario agregar más datos');
      return;
    }

    // Datos de neighborhoods de Mar del Plata, Argentina
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
      },
      {
        type: 'Feature',
        properties: {
          name: 'Playa Chica',
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
          name: 'Los Troncos',
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
          name: 'Punta Mogotes',
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
          name: 'San Martín',
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
          name: 'Centro Histórico',
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
          name: 'Puerto',
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
          name: 'Villa Gesell',
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

    // Insertar solo los neighborhoods de Argentina
    const result = await db.collection('neighborhoods').insertMany(argentinaNeighborhoods);

    console.log(`✅ Se agregaron ${result.insertedCount} neighborhoods de Argentina`);
    console.log(`🇦🇷 Mar del Plata: ${argentinaNeighborhoods.length} neighborhoods`);

    // Verificar el estado final
    const totalCount = await db.collection('neighborhoods').countDocuments();
    const argentinaCount = await db.collection('neighborhoods').countDocuments({
      'properties.country': 'Argentina'
    });
    const usaCount = await db.collection('neighborhoods').countDocuments({
      'properties.country': 'USA'
    });

    console.log('\n📊 ESTADO FINAL:');
    console.log('=================');
    console.log(`📊 Total de neighborhoods: ${totalCount}`);
    console.log(`🇦🇷 Argentina: ${argentinaCount} neighborhoods`);
    console.log(`🇺🇸 USA: ${usaCount} neighborhoods`);

    console.log('\n🎉 ¡Argentina agregada exitosamente!');
    console.log('Los usuarios ahora podrán seleccionar Argentina en el onboarding');

  } catch (error) {
    console.error('❌ Error agregando neighborhoods de Argentina:', error.message);
  } finally {
    await client.close();
  }
}

// Función para verificar el estado actual
async function checkStatus() {
  const client = new MongoClient(MONGO_URI);

  try {
    console.log('🔍 VERIFICANDO ESTADO ACTUAL');
    console.log('=============================');

    await client.connect();
    const db = client.db();

    const totalCount = await db.collection('neighborhoods').countDocuments();
    const argentinaCount = await db.collection('neighborhoods').countDocuments({
      'properties.country': 'Argentina'
    });
    const usaCount = await db.collection('neighborhoods').countDocuments({
      'properties.country': 'USA'
    });

    console.log(`📊 Total de neighborhoods: ${totalCount}`);
    console.log(`🇦🇷 Argentina: ${argentinaCount} neighborhoods`);
    console.log(`🇺🇸 USA: ${usaCount} neighborhoods`);

    if (argentinaCount > 0 && usaCount > 0) {
      console.log('\n✅ ¡Todo configurado correctamente!');
      console.log('Los usuarios pueden seleccionar Argentina y USA en el onboarding');
    } else {
      console.log('\n⚠️  Configuración incompleta:');
      if (argentinaCount === 0) {
        console.log('❌ Faltan neighborhoods de Argentina');
      }
      if (usaCount === 0) {
        console.log('❌ Faltan neighborhoods de USA');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

// Procesar argumentos de línea de comandos
const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.log('Uso del script:');
  console.log('  node add-argentina-neighborhoods.js --add              // Agregar neighborhoods de Argentina');
  console.log('  node add-argentina-neighborhoods.js --check            // Verificar estado actual');
  process.exit(1);
}

if (command === '--add') {
  addArgentinaNeighborhoods();
} else if (command === '--check') {
  checkStatus();
} else {
  console.error('Comando no reconocido. Usa --add o --check');
  process.exit(1);
}
