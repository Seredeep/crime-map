#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Obtener la ruta del directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno desde la raíz del proyecto
dotenv.config({ path: join(__dirname, '..', '.env.local') });

console.log('🔍 Verificando configuración del proyecto...\n');

// Verificar variables de entorno críticas
const requiredEnvVars = {
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
  'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY': process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
};

console.log('📋 Variables de Entorno:');
let allEnvVarsOk = true;

Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (value) {
    console.log(`  ✅ ${key}: ${key.includes('KEY') ? '***' + value.slice(-4) : value}`);
  } else {
    console.log(`  ❌ ${key}: NO CONFIGURADA`);
    allEnvVarsOk = false;
  }
});

console.log('');

// Verificar configuración de Supabase
if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('🔗 Verificando conexión a Supabase...');

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Verificar buckets de storage
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.log(`  ❌ Error conectando a Supabase: ${error.message}`);
    } else {
      console.log('  ✅ Conexión a Supabase exitosa');

      const requiredBuckets = ['profile-images', 'incident-evidence', 'chat-media'];
      console.log('  📁 Verificando buckets de storage:');

      requiredBuckets.forEach(bucketName => {
        const exists = buckets?.some(bucket => bucket.name === bucketName);
        if (exists) {
          console.log(`    ✅ ${bucketName}: Existe`);
        } else {
          console.log(`    ❌ ${bucketName}: No existe`);
        }
      });
    }
  } catch (error) {
    console.log(`  ❌ Error inesperado: ${error.message}`);
  }
}

console.log('');

// Verificar configuración de Google Maps
if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
  console.log('🗺️ Verificando configuración de Google Maps...');

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Verificar formato de API key
  if (apiKey.length < 30) {
    console.log('  ⚠️  API Key parece ser muy corta');
  } else if (apiKey.length > 100) {
    console.log('  ⚠️  API Key parece ser muy larga');
  } else {
    console.log('  ✅ API Key tiene formato válido');
  }

  // Verificar que no sea la key de ejemplo
  if (apiKey.includes('tu_api_key_aqui') || apiKey.includes('example')) {
    console.log('  ❌ API Key parece ser un placeholder');
  }

  console.log('  📝 Para verificar completamente, visita:');
  console.log('    https://console.cloud.google.com/apis/credentials');

} else {
  console.log('🗺️ Google Maps no configurado');
  console.log('  📝 Para configurar Google Maps:');
  console.log('    1. Ve a https://console.cloud.google.com/');
  console.log('    2. Crea un proyecto o selecciona uno existente');
  console.log('    3. Habilita Maps JavaScript API y Places API');
  console.log('    4. Crea una API Key');
  console.log('    5. Agrega NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en .env.local');
}

console.log('');

// Resumen final
if (allEnvVarsOk) {
  console.log('🎉 ¡Configuración completa! El proyecto debería funcionar correctamente.');
} else {
  console.log('⚠️  Hay problemas en la configuración. Revisa las variables faltantes.');
}

console.log('');
console.log('📚 Documentación disponible:');
console.log('  - docs/GOOGLE-MAPS-SETUP.md');
console.log('  - docs/CHAT-MEDIA-SETUP.md');
console.log('  - docs/API-DOCS.md');

console.log('');
console.log('🚀 Para probar la funcionalidad:');
console.log('  1. Inicia el servidor: npm run dev');
console.log('  2. Ve a /test-media para probar medios');
console.log('  3. Abre el chat y prueba la ubicación');
