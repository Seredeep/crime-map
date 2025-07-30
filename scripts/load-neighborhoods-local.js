// COMENTADO: Script para cargar barrios de Mar del Plata desde archivo local
// Este script está comentado para la rama de San Francisco
/*
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Nombre del archivo GeoJSON local (debe estar en la carpeta scripts)
const LOCAL_GEOJSON_FILE = path.join(__dirname, 'barrios.geojson');
*/

// Función para cargar el GeoJSON en MongoDB
async function loadGeoJSONToMongoDB(filePath) {
  console.log('Conectando a MongoDB...');

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log('Conexión a MongoDB establecida.');

    const db = client.db();
    const collection = db.collection('neighborhoods');

    // Verificar si el archivo existe
    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo ${filePath} no existe. Por favor, descarga el archivo GeoJSON de barrios y colócalo en la carpeta scripts con el nombre 'barrios.geojson'`);
    }

    // Leer el archivo GeoJSON
    console.log('Leyendo archivo GeoJSON...');
    const geoJSONData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Verificar si la colección ya tiene datos
    const count = await collection.countDocuments();
    if (count > 0) {
      console.log('La colección ya contiene datos. Eliminando datos existentes...');
      await collection.deleteMany({});
    }

    // Convertir cada feature en un documento para MongoDB
    const documents = geoJSONData.features.map(feature => {
      return {
        type: feature.type,
        geometry: feature.geometry,
        properties: feature.properties
      };
    });

    // Crear índice geoespacial
    await collection.createIndex({ 'geometry': '2dsphere' });

    // Insertar los documentos
    console.log(`Insertando ${documents.length} barrios en MongoDB...`);
    const result = await collection.insertMany(documents);

    console.log(`${result.insertedCount} barrios insertados correctamente.`);

    return result.insertedCount;
  } finally {
    await client.close();
    console.log('Conexión a MongoDB cerrada.');
  }
}

// Función principal que ejecuta todo el proceso
async function main() {
  try {
    const insertedCount = await loadGeoJSONToMongoDB(LOCAL_GEOJSON_FILE);

    console.log('Proceso completado con éxito.');
    console.log(`${insertedCount} barrios cargados en la base de datos.`);
  } catch (error) {
    console.error('Error durante la ejecución del script:', error);
    process.exit(1);
  }
}

// Ejecutar la función principal
// main(); // COMENTADO para la rama de San Francisco
