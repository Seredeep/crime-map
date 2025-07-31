// scripts/setup-multi-country.js
require('dotenv').config({ path: '../.env.local' });
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGODB_URI;

// Configuraciones por país
const COUNTRY_CONFIGS = {
  'Argentina': {
    name: 'Crime Map Argentina',
    description: 'Mapa de Incidentes de Seguridad Urbana - Argentina',
    defaultLocation: {
      lat: -38.0055,
      lng: -57.5426,
      city: 'Mar del Plata, Argentina'
    },
    timezone: 'America/Argentina/Buenos_Aires',
    currency: 'ARS',
    language: 'es'
  },
  'USA': {
    name: 'Crime Map USA',
    description: 'Urban Security Incident Map - USA',
    defaultLocation: {
      lat: 37.7749,
      lng: -122.4194,
      city: 'San Francisco, USA'
    },
    timezone: 'America/Los_Angeles',
    currency: 'USD',
    language: 'en'
  }
};

async function setupMultiCountry() {
  const client = new MongoClient(MONGO_URI);

  try {
    console.log('🌍 CONFIGURANDO APLICACIÓN MULTI-PAÍS');
    console.log('=====================================');

    await client.connect();
    const db = client.db();

    // 1. Verificar usuarios por país
    console.log('\n1️⃣ VERIFICANDO USUARIOS POR PAÍS:');
    console.log('===================================');

    const allUsers = await db.collection('users').find({}).toArray();

    const usersByCountry = {};
    allUsers.forEach(user => {
      const country = user.country || 'No especificado';
      if (!usersByCountry[country]) {
        usersByCountry[country] = [];
      }
      usersByCountry[country].push(user);
    });

    Object.entries(usersByCountry).forEach(([country, users]) => {
      console.log(`${country}: ${users.length} usuarios`);
    });

    // 2. Crear configuración dinámica
    console.log('\n2️⃣ CREANDO CONFIGURACIÓN DINÁMICA:');
    console.log('====================================');

    const dynamicConfig = {
      supportedCountries: Object.keys(COUNTRY_CONFIGS),
      defaultCountry: 'USA', // Cambiar según necesidad
      countries: COUNTRY_CONFIGS,
      features: {
        multiLanguage: true,
        multiCurrency: true,
        multiTimezone: true,
        locationBased: true
      }
    };

    // Guardar configuración en MongoDB
    await db.collection('app_config').updateOne(
      { _id: 'multi_country_config' },
      { $set: dynamicConfig },
      { upsert: true }
    );

    console.log('✅ Configuración guardada en MongoDB');

    // 3. Actualizar configuración de la aplicación
    console.log('\n3️⃣ ACTUALIZANDO CONFIGURACIÓN DE LA APLICACIÓN:');
    console.log('================================================');

    const appConfigPath = path.join(__dirname, '../src/lib/config/app.ts');

    if (fs.existsSync(appConfigPath)) {
      const currentConfig = fs.readFileSync(appConfigPath, 'utf8');

      // Crear nueva configuración multi-país
      const newConfig = `/**
 * CONFIGURACIÓN GENERAL DE LA APLICACIÓN
 * ======================================
 *
 * Este archivo centraliza toda la configuración general de la aplicación,
 * incluyendo información básica, endpoints de API, configuración de mapas
 * y otras constantes globales.
 */

// #region Información de la Aplicación
export const APP_CONFIG = {
  name: 'Crime Map',
  description: 'Mapa de Incidentes de Seguridad Urbana',
  version: '1.0.0',
  author: 'Crime Map Team',
  multiCountry: true,
  defaultCountry: 'USA',
  supportedCountries: ['USA', 'Argentina'],
  defaultLocation: {
    lat: 37.7749,
    lng: -122.4194,
    city: 'San Francisco, USA'
  }
} as const;
// #endregion

// #region Configuración por País
export const COUNTRY_CONFIGS = {
  'Argentina': {
    name: 'Crime Map Argentina',
    description: 'Mapa de Incidentes de Seguridad Urbana - Argentina',
    defaultLocation: {
      lat: -38.0055,
      lng: -57.5426,
      city: 'Mar del Plata, Argentina'
    },
    timezone: 'America/Argentina/Buenos_Aires',
    currency: 'ARS',
    language: 'es',
    mapCenter: {
      lat: -38.0055,
      lng: -57.5426
    },
    mapZoom: 13
  },
  'USA': {
    name: 'Crime Map USA',
    description: 'Urban Security Incident Map - USA',
    defaultLocation: {
      lat: 37.7749,
      lng: -122.4194,
      city: 'San Francisco, USA'
    },
    timezone: 'America/Los_Angeles',
    currency: 'USD',
    language: 'en',
    mapCenter: {
      lat: 37.7749,
      lng: -122.4194
    },
    mapZoom: 13
  }
} as const;

export type CountryCode = keyof typeof COUNTRY_CONFIGS;
// #endregion

// #region Roles de Usuario
export const USER_ROLES = {
  USER: 'user',
  EDITOR: 'editor',
  ADMIN: 'admin'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
// #endregion

// #region Endpoints de API
export const API_ENDPOINTS = {
  incidents: '/api/incidents',
  neighborhoods: '/api/neighborhoods',
  geocode: '/api/geocode',
  reverseGeocode: '/api/geocode/reverse',
  auth: '/api/auth',
  admin: {
    users: '/api/admin/users',
    userRole: '/api/admin/users/role',
    userStatus: '/api/admin/users/status'
  }
} as const;
// #endregion

// #region Configuración de Mapas
export const MAP_CONFIG = {
  defaultZoom: 13,
  minZoom: 10,
  maxZoom: 18,
  tileLayer: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors'
  },
  markerClusterOptions: {
    chunkedLoading: true,
    maxClusterRadius: 50
  }
} as const;
// #endregion

// #region Configuración de Subida de Archivos
export const UPLOAD_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxFiles: 3,
  bucketName: 'incident-evidence'
} as const;
// #endregion

// #region Rangos de Tiempo
export const TIME_RANGES = {
  LAST_24H: '24h',
  LAST_WEEK: '7d',
  LAST_MONTH: '30d',
  LAST_3_MONTHS: '90d',
  LAST_YEAR: '365d',
  ALL_TIME: 'all'
} as const;

export const DATE_FORMATS = {
  display: 'dd/MM/yyyy HH:mm',
  api: 'yyyy-MM-dd',
  full: 'dd/MM/yyyy HH:mm:ss'
} as const;
// #endregion

// #region Estados de Incidentes (Legacy - para compatibilidad)
export const INCIDENT_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  RESOLVED: 'resolved'
} as const;

export const INCIDENT_SEVERITY = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
  URGENT: 5
} as const;
// #endregion

// #region Utilidades para Multi-País
export function getCountryConfig(country: CountryCode) {
  return COUNTRY_CONFIGS[country] || COUNTRY_CONFIGS['USA'];
}

export function getUserCountry(user: any): CountryCode {
  if (user?.country && COUNTRY_CONFIGS[user.country as CountryCode]) {
    return user.country as CountryCode;
  }
  return 'USA';
}

export function getDefaultLocation(country: CountryCode) {
  return getCountryConfig(country).defaultLocation;
}
// #endregion
`;

      fs.writeFileSync(appConfigPath, newConfig);
      console.log('✅ Configuración de aplicación actualizada');
    } else {
      console.log('⚠️  No se encontró el archivo de configuración de la aplicación');
    }

    // 4. Crear usuarios de prueba para ambos países
    console.log('\n4️⃣ CREANDO USUARIOS DE PRUEBA:');
    console.log('===============================');

    const testUsers = [
      {
        email: 'test.usa@example.com',
        name: 'Test User USA',
        password: 'password123',
        country: 'USA',
        city: 'San Francisco',
        role: 'user',
        enabled: true,
        onboarded: false
      },
      {
        email: 'test.argentina@example.com',
        name: 'Test User Argentina',
        password: 'password123',
        country: 'Argentina',
        city: 'Mar del Plata',
        role: 'user',
        enabled: true,
        onboarded: false
      }
    ];

    for (const testUser of testUsers) {
      const existingUser = await db.collection('users').findOne({ email: testUser.email });

      if (!existingUser) {
        // Hash de la contraseña
        const crypto = require('crypto');
        const { promisify } = require('util');
        const pbkdf2 = promisify(crypto.pbkdf2);

        const salt = crypto.randomBytes(16).toString('hex');
        const iterations = 310000;
        const keylen = 32;
        const digest = 'sha256';
        const derivedKey = await pbkdf2(testUser.password, salt, iterations, keylen, digest);
        const hashedPassword = [
          'pbkdf2',
          iterations,
          salt,
          derivedKey.toString('hex'),
          digest
        ].join('$');

        const userToInsert = {
          ...testUser,
          password: hashedPassword,
          createdAt: new Date(),
          notificationsEnabled: true,
          privacyPublic: false,
          autoLocationEnabled: true
        };

        await db.collection('users').insertOne(userToInsert);
        console.log(`✅ Usuario de prueba creado: ${testUser.email} (${testUser.country})`);
      } else {
        console.log(`ℹ️  Usuario de prueba ya existe: ${testUser.email}`);
      }
    }

    // 5. Resumen final
    console.log('\n📈 RESUMEN DE CONFIGURACIÓN:');
    console.log('=============================');
    console.log('✅ Configuración multi-país habilitada');
    console.log('✅ Países soportados: USA, Argentina');
    console.log('✅ Configuración guardada en MongoDB');
    console.log('✅ Archivo de configuración actualizado');
    console.log('✅ Usuarios de prueba creados');

    const finalUserCount = await db.collection('users').countDocuments();
    console.log(`📊 Total de usuarios: ${finalUserCount}`);

    console.log('\n🔑 CREDENCIALES DE PRUEBA:');
    console.log('==========================');
    console.log('🇺🇸 USA: test.usa@example.com / password123');
    console.log('🇦🇷 Argentina: test.argentina@example.com / password123');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

// Función para verificar la configuración
async function checkMultiCountrySetup() {
  const client = new MongoClient(MONGO_URI);

  try {
    console.log('🔍 VERIFICANDO CONFIGURACIÓN MULTI-PAÍS');
    console.log('=======================================');

    await client.connect();
    const db = client.db();

    // Verificar configuración en MongoDB
    const config = await db.collection('app_config').findOne({ _id: 'multi_country_config' });

    if (config) {
      console.log('✅ Configuración multi-país encontrada en MongoDB');
      console.log(`📋 Países soportados: ${config.supportedCountries.join(', ')}`);
    } else {
      console.log('❌ No se encontró configuración multi-país');
    }

    // Verificar usuarios por país
    const users = await db.collection('users').find({}).toArray();
    const usersByCountry = {};

    users.forEach(user => {
      const country = user.country || 'No especificado';
      if (!usersByCountry[country]) {
        usersByCountry[country] = [];
      }
      usersByCountry[country].push(user);
    });

    console.log('\n📊 USUARIOS POR PAÍS:');
    console.log('=======================');
    Object.entries(usersByCountry).forEach(([country, userList]) => {
      console.log(`${country}: ${userList.length} usuarios`);
    });

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
  console.log('  node setup-multi-country.js --setup              // Configurar multi-país');
  console.log('  node setup-multi-country.js --check              // Verificar configuración');
  process.exit(1);
}

if (command === '--setup') {
  setupMultiCountry();
} else if (command === '--check') {
  checkMultiCountrySetup();
} else {
  console.error('Comando no reconocido. Usa --setup o --check');
  process.exit(1);
}
