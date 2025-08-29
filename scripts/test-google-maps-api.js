#!/usr/bin/env node

import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Obtener la ruta del directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno desde la raíz del proyecto
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
  console.log('❌ API Key de Google Maps no encontrada');
  process.exit(1);
}

console.log('🔍 Probando API Key de Google Maps...\n');

// Probar la API de Geocoding (más simple para verificar)
const testGeocoding = async () => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=Mar%20del%20Plata&key=${API_KEY}`
    );

    const data = await response.json();

    if (data.status === 'OK') {
      console.log('✅ API Key válida - Geocoding API funciona');
      console.log(`📍 Dirección encontrada: ${data.results[0].formatted_address}`);
    } else if (data.status === 'REQUEST_DENIED') {
      console.log('❌ API Key rechazada');
      console.log('📝 Posibles causas:');
      console.log('   - API no habilitada en Google Cloud Console');
      console.log('   - API Key con restricciones muy estrictas');
      console.log('   - Facturación no habilitada');
      console.log('\n🔗 Verifica en: https://console.cloud.google.com/apis/credentials');
    } else if (data.status === 'OVER_QUERY_LIMIT') {
      console.log('⚠️  Límite de consultas excedido');
      console.log('📝 La API funciona pero has excedido la cuota gratuita');
    } else {
      console.log(`❌ Error: ${data.status}`);
      console.log(`📝 Mensaje: ${data.error_message || 'Sin mensaje de error'}`);
    }
  } catch (error) {
    console.log('❌ Error de red:', error.message);
  }
};

// Probar la API de Places
const testPlaces = async () => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=Mar%20del%20Plata&inputtype=textquery&key=${API_KEY}`
    );

    const data = await response.json();

    if (data.status === 'OK') {
      console.log('✅ API Key válida - Places API funciona');
    } else if (data.status === 'REQUEST_DENIED') {
      console.log('❌ Places API no habilitada');
      console.log('📝 Habilita Places API en Google Cloud Console');
    } else {
      console.log(`⚠️  Places API: ${data.status}`);
    }
  } catch (error) {
    console.log('❌ Error probando Places API:', error.message);
  }
};

// Ejecutar pruebas
(async () => {
  await testGeocoding();
  console.log('');
  await testPlaces();

  console.log('\n📚 Para habilitar las APIs necesarias:');
  console.log('1. Ve a https://console.cloud.google.com/');
  console.log('2. Selecciona tu proyecto');
  console.log('3. Ve a "APIs & Services" > "Library"');
  console.log('4. Busca y habilita:');
  console.log('   - Maps JavaScript API');
  console.log('   - Places API');
  console.log('   - Geocoding API');
})();


