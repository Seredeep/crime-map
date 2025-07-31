// scripts/debug-onboarding-frontend.js
require('dotenv').config({ path: '../.env.local' });

// Simular la función getUniqueCountries del frontend
function getUniqueCountries(neighborhoods) {
  const countries = neighborhoods
    .map(n => n.properties?.country)
    .filter((country, index, arr) => country && arr.indexOf(country) === index);

  // Si no hay países en los barrios, agregar Argentina por defecto
  if (countries.length === 0) {
    return ['Argentina'];
  }

  return countries.sort();
}

// Simular la función getCitiesForCountry del frontend
function getCitiesForCountry(neighborhoods, country) {
  const cities = neighborhoods
    .filter(n => n.properties?.country === country)
    .map(n => n.properties?.city)
    .filter((city, index, arr) => city && arr.indexOf(city) === index);

  // Si no hay ciudades para el país, agregar opciones por defecto
  if (cities.length === 0) {
    if (country === 'Argentina') {
      return ['Mar del Plata'];
    } else if (country === 'USA') {
      return ['San Francisco'];
    }
  }

  return cities.sort();
}

async function debugOnboardingFrontend() {
  try {
    console.log('🔍 DEBUGGEANDO FRONTEND DEL ONBOARDING');
    console.log('=======================================');

    // Obtener datos del endpoint
    const response = await fetch('http://localhost:3000/api/neighborhoods');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const neighborhoods = await response.json();

    console.log(`📊 Total de neighborhoods recibidos: ${neighborhoods.length}`);

    // Simular lo que hace el frontend
    console.log('\n🔧 SIMULANDO FUNCIÓN getUniqueCountries():');
    console.log('===========================================');

    const countries = getUniqueCountries(neighborhoods);
    console.log('Países encontrados:', countries);

    // Verificar cada país
    countries.forEach(country => {
      console.log(`\n🌍 País: ${country}`);
      const cities = getCitiesForCountry(neighborhoods, country);
      console.log(`  Ciudades: ${cities.join(', ')}`);

      // Contar neighborhoods por país
      const countryNeighborhoods = neighborhoods.filter(n => n.properties?.country === country);
      console.log(`  Total neighborhoods: ${countryNeighborhoods.length}`);
    });

    // Verificar específicamente Argentina y USA
    console.log('\n✅ VERIFICACIÓN ESPECÍFICA:');
    console.log('===========================');

    const argentinaNeighborhoods = neighborhoods.filter(n => n.properties?.country === 'Argentina');
    const usaNeighborhoods = neighborhoods.filter(n => n.properties?.country === 'USA');

    console.log(`🇦🇷 Argentina: ${argentinaNeighborhoods.length} neighborhoods`);
    if (argentinaNeighborhoods.length > 0) {
      const argentinaCities = getCitiesForCountry(neighborhoods, 'Argentina');
      console.log(`  Ciudades: ${argentinaCities.join(', ')}`);
    }

    console.log(`🇺🇸 USA: ${usaNeighborhoods.length} neighborhoods`);
    if (usaNeighborhoods.length > 0) {
      const usaCities = getCitiesForCountry(neighborhoods, 'USA');
      console.log(`  Ciudades: ${usaCities.join(', ')}`);
    }

    // Verificar si hay problemas con los datos
    console.log('\n🔍 ANÁLISIS DE DATOS:');
    console.log('=====================');

    // Verificar si hay neighborhoods sin country
    const noCountry = neighborhoods.filter(n => !n.properties?.country);
    console.log(`Neighborhoods sin país: ${noCountry.length}`);

    // Verificar si hay neighborhoods con country vacío
    const emptyCountry = neighborhoods.filter(n => n.properties?.country === '');
    console.log(`Neighborhoods con país vacío: ${emptyCountry.length}`);

    // Verificar si hay neighborhoods con country null
    const nullCountry = neighborhoods.filter(n => n.properties?.country === null);
    console.log(`Neighborhoods con país null: ${nullCountry.length}`);

    // Mostrar algunos ejemplos de neighborhoods sin país
    if (noCountry.length > 0) {
      console.log('\n⚠️  Ejemplos de neighborhoods sin país:');
      noCountry.slice(0, 3).forEach((n, i) => {
        console.log(`  ${i + 1}. ID: ${n._id}, Name: ${n.properties?.name}, City: ${n.properties?.city}`);
      });
    }

    // Verificar la estructura de los datos
    console.log('\n📋 ESTRUCTURA DE DATOS:');
    console.log('========================');

    const sampleArgentina = argentinaNeighborhoods[0];
    const sampleUSA = usaNeighborhoods[0];

    if (sampleArgentina) {
      console.log('🇦🇷 Ejemplo Argentina:');
      console.log('  properties:', JSON.stringify(sampleArgentina.properties, null, 2));
    }

    if (sampleUSA) {
      console.log('🇺🇸 Ejemplo USA:');
      console.log('  properties:', JSON.stringify(sampleUSA.properties, null, 2));
    }

    // Conclusión
    console.log('\n🎯 CONCLUSIÓN:');
    console.log('===============');

    if (countries.includes('Argentina') && countries.includes('USA')) {
      console.log('✅ El frontend debería mostrar Argentina y USA correctamente');
      console.log('💡 Si no aparece en el navegador, puede ser un problema de:');
      console.log('   - Caché del navegador (Ctrl+F5 para refrescar)');
      console.log('   - Servidor de desarrollo no corriendo');
      console.log('   - Error en el componente React');
    } else {
      console.log('❌ Hay un problema con los datos o la función getUniqueCountries');
    }

  } catch (error) {
    console.error('❌ Error debuggeando el frontend:', error.message);
    console.log('\n💡 Asegúrate de que el servidor esté corriendo en http://localhost:3000');
  }
}

debugOnboardingFrontend();
