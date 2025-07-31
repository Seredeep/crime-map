// scripts/test-neighborhoods-api.js
require('dotenv').config({ path: '../.env.local' });

async function testNeighborhoodsAPI() {
  try {
    console.log('🔍 PROBANDO ENDPOINT DE NEIGHBORHOODS');
    console.log('=====================================');

    // Probar el endpoint local
    const response = await fetch('http://localhost:3000/api/neighborhoods');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log(`📊 Total de neighborhoods recibidos: ${data.length}`);

    // Agrupar por país
    const countries = {};
    data.forEach(n => {
      const country = n.properties?.country || 'No especificado';
      if (!countries[country]) {
        countries[country] = [];
      }
      countries[country].push(n);
    });

    console.log('\n📊 NEIGHBORHOODS POR PAÍS:');
    console.log('============================');
    Object.entries(countries).forEach(([country, neighborhoods]) => {
      console.log(`${country}: ${neighborhoods.length} neighborhoods`);

      // Agrupar por ciudad
      const cities = {};
      neighborhoods.forEach(n => {
        const city = n.properties?.city || 'No especificado';
        if (!cities[city]) {
          cities[city] = [];
        }
        cities[city].push(n);
      });

      Object.entries(cities).forEach(([city, cityNeighborhoods]) => {
        console.log(`  📍 ${city}: ${cityNeighborhoods.length} neighborhoods`);
      });
    });

    // Verificar específicamente Argentina y USA
    const argentinaCount = data.filter(n => n.properties?.country === 'Argentina').length;
    const usaCount = data.filter(n => n.properties?.country === 'USA').length;

    console.log('\n✅ VERIFICACIÓN ESPECÍFICA:');
    console.log('===========================');
    console.log(`🇦🇷 Argentina: ${argentinaCount} neighborhoods`);
    console.log(`🇺🇸 USA: ${usaCount} neighborhoods`);

    if (argentinaCount > 0 && usaCount > 0) {
      console.log('\n🎉 ¡El endpoint está devolviendo datos de ambos países!');
    } else {
      console.log('\n⚠️  Problema detectado:');
      if (argentinaCount === 0) {
        console.log('❌ No hay datos de Argentina en el endpoint');
      }
      if (usaCount === 0) {
        console.log('❌ No hay datos de USA en el endpoint');
      }
    }

    // Mostrar algunos ejemplos
    console.log('\n📋 EJEMPLOS DE DATOS:');
    console.log('======================');
    const argentinaExample = data.find(n => n.properties?.country === 'Argentina');
    const usaExample = data.find(n => n.properties?.country === 'USA');

    if (argentinaExample) {
      console.log('🇦🇷 Ejemplo Argentina:', {
        name: argentinaExample.properties?.name,
        city: argentinaExample.properties?.city,
        country: argentinaExample.properties?.country
      });
    }

    if (usaExample) {
      console.log('🇺🇸 Ejemplo USA:', {
        name: usaExample.properties?.name,
        city: usaExample.properties?.city,
        country: usaExample.properties?.country
      });
    }

  } catch (error) {
    console.error('❌ Error probando el endpoint:', error.message);
    console.log('\n💡 Asegúrate de que el servidor esté corriendo en http://localhost:3000');
  }
}

testNeighborhoodsAPI();
