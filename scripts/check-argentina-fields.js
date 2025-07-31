// scripts/check-argentina-fields.js
require('dotenv').config({ path: '../.env.local' });
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;

async function checkArgentinaFields() {
  const client = new MongoClient(MONGO_URI);

  try {
    console.log('🔍 VERIFICANDO CAMPOS DE BARRIOS DE ARGENTINA');
    console.log('=============================================');

    await client.connect();
    const db = client.db();

    // Obtener algunos neighborhoods de Argentina
    const argentinaNeighborhoods = await db.collection('neighborhoods').find({
      'properties.country': 'Argentina'
    }).limit(5).toArray();

    console.log(`📊 Analizando ${argentinaNeighborhoods.length} barrios de Argentina`);

    if (argentinaNeighborhoods.length === 0) {
      console.log('❌ No hay neighborhoods de Argentina en la base de datos');
      return;
    }

    // Analizar los campos disponibles
    console.log('\n📋 CAMPOS DISPONIBLES:');
    console.log('========================');

    argentinaNeighborhoods.forEach((n, index) => {
      console.log(`\n🏘️  Barrio ${index + 1}:`);
      console.log('   Properties:', JSON.stringify(n.properties, null, 2));
    });

    // Verificar qué campos tienen todos los barrios
    console.log('\n🔍 ANÁLISIS DE CAMPOS:');
    console.log('=======================');

    const allFields = new Set();
    argentinaNeighborhoods.forEach(n => {
      if (n.properties) {
        Object.keys(n.properties).forEach(key => allFields.add(key));
      }
    });

    console.log('Campos encontrados en properties:');
    Array.from(allFields).sort().forEach(field => {
      console.log(`   - ${field}`);
    });

    // Verificar si hay algún campo que contenga nombres
    console.log('\n🔍 BUSCANDO NOMBRES DE BARRIOS:');
    console.log('=================================');

    const possibleNameFields = ['name', 'nombre', 'barrio', 'neighborhood', 'descripcion', 'description', 'id', 'codigo', 'code'];

    possibleNameFields.forEach(field => {
      const hasField = argentinaNeighborhoods.some(n => n.properties?.[field]);
      if (hasField) {
        console.log(`✅ Campo "${field}" encontrado`);
        const values = argentinaNeighborhoods
          .filter(n => n.properties?.[field])
          .map(n => n.properties[field])
          .slice(0, 5); // Mostrar solo los primeros 5
        console.log(`   Valores: ${values.join(', ')}`);
      } else {
        console.log(`❌ Campo "${field}" no encontrado`);
      }
    });

    // Mostrar un ejemplo completo
    console.log('\n📋 EJEMPLO COMPLETO:');
    console.log('=====================');

    const example = argentinaNeighborhoods[0];
    console.log('Estructura completa del primer barrio:');
    console.log(JSON.stringify(example, null, 2));

    // Conclusión
    console.log('\n🎯 CONCLUSIÓN:');
    console.log('===============');

    const hasNameField = argentinaNeighborhoods.some(n => n.properties?.name);
    if (hasNameField) {
      console.log('✅ Los barrios tienen nombres en el campo "name"');
    } else {
      console.log('❌ Los barrios NO tienen nombres en el campo "name"');
      console.log('💡 Necesitamos encontrar qué campo contiene los nombres');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkArgentinaFields();
