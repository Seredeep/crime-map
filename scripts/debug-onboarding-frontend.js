// scripts/debug-onboarding-frontend.js
require('dotenv').config({ path: '../.env.local' });

/**
 * Script para debuggear el problema del onboarding frontend
 * Verifica qué datos se están cargando desde la API
 */

async function debugOnboardingFrontend() {
  console.log('🔍 DEBUG ONBOARDING FRONTEND');
  console.log('============================\n');

  try {
    // Simular la llamada a la API que hace el frontend
    console.log('📡 Llamando a la API de neighborhoods...');
    const response = await fetch('http://localhost:3000/api/neighborhoods');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const neighborhoods = await response.json();
    console.log(`✅ API respondió con ${neighborhoods.length} neighborhoods\n`);

    // Analizar los datos como lo hace el frontend
    console.log('🔍 ANALIZANDO DATOS COMO EL FRONTEND:');
    console.log('=====================================\n');

    // Función getUniqueCountries (como en el frontend)
    const getUniqueCountries = () => {
      const countries = neighborhoods
        .map(n => n.properties.country)
        .filter((country, index, arr) => country && arr.indexOf(country) === index);

      console.log('🌍 Países encontrados en neighborhoods:');
      console.log('   - Datos crudos:', neighborhoods.map(n => n.properties.country).slice(0, 10));
      console.log('   - Países únicos:', countries);

      // Si no hay países en los barrios, agregar Argentina por defecto
      if (countries.length === 0) {
        console.log('   ⚠️  No se encontraron países, agregando Argentina por defecto');
        return ['Argentina'];
      }

      return countries.sort();
    };

    // Función getCitiesForCountry (como en el frontend)
    const getCitiesForCountry = (country) => {
      const cities = neighborhoods
        .filter(n => n.properties.country === country)
        .map(n => n.properties.city)
        .filter((city, index, arr) => city && arr.indexOf(city) === index);

      console.log(`🏙️  Ciudades para ${country}:`);
      console.log(`   - Datos crudos:`, neighborhoods.filter(n => n.properties.country === country).map(n => n.properties.city).slice(0, 5));
      console.log(`   - Ciudades únicas:`, cities);

      // Si no hay ciudades para el país, agregar opciones por defecto
      if (cities.length === 0) {
        if (country === 'Argentina') {
          console.log(`   ⚠️  No se encontraron ciudades para ${country}, agregando Mar del Plata por defecto`);
          return ['Mar del Plata'];
        } else if (country === 'USA') {
          console.log(`   ⚠️  No se encontraron ciudades para ${country}, agregando San Francisco por defecto`);
          return ['San Francisco'];
        }
      }

      return cities.sort();
    };

    // Ejecutar análisis
    const countries = getUniqueCountries();
    console.log(`\n📋 PAÍSES FINALES: ${countries.join(', ')}`);

    countries.forEach(country => {
      const cities = getCitiesForCountry(country);
      console.log(`\n📋 CIUDADES PARA ${country}: ${cities.join(', ')}`);
    });

    // Verificar estructura de datos
    console.log('\n🔍 VERIFICACIÓN DE ESTRUCTURA DE DATOS:');
    console.log('========================================');

    if (neighborhoods.length > 0) {
      const sample = neighborhoods[0];
      console.log('📄 Estructura del primer neighborhood:');
      console.log('   - Tiene properties:', !!sample.properties);
      console.log('   - Tiene country:', !!sample.properties?.country);
      console.log('   - Tiene city:', !!sample.properties?.city);
      console.log('   - Country value:', sample.properties?.country);
      console.log('   - City value:', sample.properties?.city);
    }

    // Verificar si hay neighborhoods sin country
    const withoutCountry = neighborhoods.filter(n => !n.properties?.country);
    if (withoutCountry.length > 0) {
      console.log(`\n⚠️  WARNING: ${withoutCountry.length} neighborhoods sin país definido`);
    }

    // Verificar si hay neighborhoods sin city
    const withoutCity = neighborhoods.filter(n => !n.properties?.city);
    if (withoutCity.length > 0) {
      console.log(`⚠️  WARNING: ${withoutCity.length} neighborhoods sin ciudad definida`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.message.includes('fetch')) {
      console.log('\n💡 SUGERENCIAS:');
      console.log('   - Asegúrate de que el servidor esté corriendo en localhost:3000');
      console.log('   - Verifica que la API /api/neighborhoods esté disponible');
    }
  }
}

// Ejecutar el debug
debugOnboardingFrontend().catch(console.error);
