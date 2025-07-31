// scripts/check-current-users.js
require('dotenv').config({ path: '../.env.local' });
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;

async function checkCurrentUsers() {
  const client = new MongoClient(MONGO_URI);

  try {
    console.log('🔍 VERIFICANDO USUARIOS ACTUALES');
    console.log('================================');

    await client.connect();
    const db = client.db();

    // Obtener todos los usuarios
    const users = await db.collection('users').find({}).toArray();

    console.log(`📊 Total de usuarios: ${users.length}`);
    console.log('');

    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
      return;
    }

    // Agrupar por país/ciudad
    const usersByLocation = {};
    const usersByStatus = { enabled: 0, disabled: 0, undefined: 0 };

    users.forEach(user => {
      const location = user.country && user.city
        ? `${user.country}, ${user.city}`
        : user.country
        ? user.country
        : user.city
        ? user.city
        : 'No especificado';

      if (!usersByLocation[location]) {
        usersByLocation[location] = [];
      }
      usersByLocation[location].push(user);

      // Contar por estado
      if (user.enabled === true) {
        usersByStatus.enabled++;
      } else if (user.enabled === false) {
        usersByStatus.disabled++;
      } else {
        usersByStatus.undefined++;
      }
    });

    console.log('📍 USUARIOS POR UBICACIÓN:');
    console.log('==========================');
    Object.entries(usersByLocation).forEach(([location, userList]) => {
      console.log(`${location}: ${userList.length} usuarios`);
      userList.forEach(user => {
        console.log(`  - ${user.email} (${user.name || 'Sin nombre'}) - Enabled: ${user.enabled}`);
      });
    });

    console.log('');
    console.log('📋 ESTADO DE USUARIOS:');
    console.log('======================');
    console.log(`✅ Habilitados: ${usersByStatus.enabled}`);
    console.log(`❌ Deshabilitados: ${usersByStatus.disabled}`);
    console.log(`❓ No definido: ${usersByStatus.undefined}`);

    console.log('');
    console.log('🔍 DETALLES COMPLETOS:');
    console.log('======================');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Nombre: ${user.name || 'No especificado'}`);
      console.log(`   País: ${user.country || 'No especificado'}`);
      console.log(`   Ciudad: ${user.city || 'No especificado'}`);
      console.log(`   Enabled: ${user.enabled}`);
      console.log(`   Rol: ${user.role || 'default'}`);
      console.log(`   Creado: ${user.createdAt ? new Date(user.createdAt).toLocaleString('es-ES') : 'No especificado'}`);
      console.log('');
    });

    // Verificar si hay usuarios de Argentina
    const argentinaUsers = users.filter(user =>
      user.country === 'Argentina' || user.city === 'Mar del Plata'
    );

    if (argentinaUsers.length > 0) {
      console.log('🇦🇷 USUARIOS DE ARGENTINA ENCONTRADOS:');
      console.log('=====================================');
      argentinaUsers.forEach(user => {
        console.log(`- ${user.email} (${user.name || 'Sin nombre'})`);
      });
      console.log('');
      console.log('💡 Si quieres eliminar usuarios de Argentina, ejecuta:');
      console.log('   node remove-argentina-users.js');
    } else {
      console.log('✅ No se encontraron usuarios de Argentina');
    }

    // Verificar si hay usuarios de USA
    const usaUsers = users.filter(user =>
      user.country === 'USA' || user.city === 'San Francisco'
    );

    if (usaUsers.length > 0) {
      console.log('🇺🇸 USUARIOS DE USA ENCONTRADOS:');
      console.log('================================');
      usaUsers.forEach(user => {
        console.log(`- ${user.email} (${user.name || 'Sin nombre'})`);
      });
    } else {
      console.log('❌ No se encontraron usuarios de USA');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkCurrentUsers();
