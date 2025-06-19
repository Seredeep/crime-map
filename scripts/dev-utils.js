#!/usr/bin/env node

/**
 * 🛠️ CRIME MAP - UTILIDADES DE DESARROLLO
 *
 * Script con funciones útiles para desarrollo y mantenimiento
 * Uso: node scripts/dev-utils.js [comando]
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// #region Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = process.env.DATABASE_NAME || 'crime-map';
// #endregion

// #region Database Utilities
async function connectDB() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    return { client, db: client.db(DATABASE_NAME) };
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
}

async function resetUsers() {
  console.log('🔄 Reseteando usuarios...');
  const { client, db } = await connectDB();

  try {
    const result = await db.collection('users').deleteMany({});
    console.log(`✅ ${result.deletedCount} usuarios eliminados`);
  } catch (error) {
    console.error('❌ Error reseteando usuarios:', error.message);
  } finally {
    await client.close();
  }
}

async function resetIncidents() {
  console.log('🔄 Reseteando incidentes...');
  const { client, db } = await connectDB();

  try {
    const result = await db.collection('incidents').deleteMany({});
    console.log(`✅ ${result.deletedCount} incidentes eliminados`);
  } catch (error) {
    console.error('❌ Error reseteando incidentes:', error.message);
  } finally {
    await client.close();
  }
}

async function showStats() {
  console.log('📊 Estadísticas de la base de datos...');
  const { client, db } = await connectDB();

  try {
    const users = await db.collection('users').countDocuments();
    const incidents = await db.collection('incidents').countDocuments();
    const neighborhoods = await db.collection('neighborhoods').countDocuments();

    console.log(`👥 Usuarios: ${users}`);
    console.log(`🚨 Incidentes: ${incidents}`);
    console.log(`🏘️ Barrios: ${neighborhoods}`);
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error.message);
  } finally {
    await client.close();
  }
}

async function seedTestData() {
  console.log('🌱 Sembrando datos de prueba...');
  const { client, db } = await connectDB();

  try {
    // Crear usuario de prueba
    const testUser = {
      email: 'test@example.com',
      name: 'Usuario de Prueba',
      role: 'user',
      createdAt: new Date(),
      isActive: true
    };

    await db.collection('users').insertOne(testUser);

    // Crear incidentes de prueba
    const testIncidents = [
      {
        type: 'robo',
        description: 'Robo de bicicleta en zona céntrica',
        location: {
          type: 'Point',
          coordinates: [-57.5426, -38.0055]
        },
        address: 'Centro, Mar del Plata',
        severity: 'media',
        status: 'pendiente',
        tags: ['dia', 'zona_comercial', 'testigos'],
        createdAt: new Date(),
        reportedBy: testUser._id
      },
      {
        type: 'hurto',
        description: 'Hurto de celular en transporte público',
        location: {
          type: 'Point',
          coordinates: [-57.5500, -38.0100]
        },
        address: 'Güemes, Mar del Plata',
        severity: 'baja',
        status: 'verificado',
        tags: ['noche', 'transporte_publico'],
        createdAt: new Date(),
        reportedBy: testUser._id
      }
    ];

    await db.collection('incidents').insertMany(testIncidents);

    console.log('✅ Datos de prueba creados exitosamente');
  } catch (error) {
    console.error('❌ Error sembrando datos:', error.message);
  } finally {
    await client.close();
  }
}
// #endregion

// #region File Utilities
function cleanBuildFiles() {
  console.log('🧹 Limpiando archivos de build...');

  const filesToDelete = [
    '.next',
    'node_modules/.cache',
    'tsconfig.tsbuildinfo'
  ];

  filesToDelete.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ Eliminado: ${file}`);
    }
  });
}

function showProjectInfo() {
  console.log('📋 Información del proyecto...');

  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log(`📦 Nombre: ${packageJson.name}`);
    console.log(`🔢 Versión: ${packageJson.version}`);
    console.log(`📝 Descripción: ${packageJson.description || 'N/A'}`);

    // Mostrar scripts disponibles
    console.log('\n🚀 Scripts disponibles:');
    Object.entries(packageJson.scripts || {}).forEach(([name, script]) => {
      console.log(`  ${name}: ${script}`);
    });
  } catch (error) {
    console.error('❌ Error leyendo package.json:', error.message);
  }
}
// #endregion

// #region Main CLI
function showHelp() {
  console.log(`
🛠️  CRIME MAP - UTILIDADES DE DESARROLLO

Comandos disponibles:

📊 Base de datos:
  stats              - Mostrar estadísticas de la DB
  reset-users        - Eliminar todos los usuarios
  reset-incidents    - Eliminar todos los incidentes
  seed               - Crear datos de prueba

🧹 Limpieza:
  clean              - Limpiar archivos de build

📋 Información:
  info               - Información del proyecto
  help               - Mostrar esta ayuda

Uso: node scripts/dev-utils.js [comando]
`);
}

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'stats':
      await showStats();
      break;
    case 'reset-users':
      await resetUsers();
      break;
    case 'reset-incidents':
      await resetIncidents();
      break;
    case 'seed':
      await seedTestData();
      break;
    case 'clean':
      cleanBuildFiles();
      break;
    case 'info':
      showProjectInfo();
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}
// #endregion

module.exports = {
  connectDB,
  resetUsers,
  resetIncidents,
  showStats,
  seedTestData,
  cleanBuildFiles,
  showProjectInfo
};
