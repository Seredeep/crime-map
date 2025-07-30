const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// URL de la API de datos abiertos de San Francisco
const SF_NEIGHBORHOODS_URL = 'https://data.sfgov.org/resource/gfpk-269f.json';
const OUTPUT_FILE = path.join(__dirname, 'sf-neighborhoods.geojson');

// Función para descargar los barrios de San Francisco
async function downloadSFNeighborhoods() {
  console.log('Descargando barrios de San Francisco...');

  try {
    const response = await fetch(SF_NEIGHBORHOODS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json,*/*'
      }
    });

    if (!response.ok) {
      throw new Error(`Error al descargar los datos: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Descargados ${data.length} barrios de San Francisco.`);
    return data;
  } catch (error) {
    console.error('Error al descargar los datos:', error);
    throw error;
  }
}

// Función para convertir los datos de SF a formato GeoJSON
function convertToGeoJSON(sfData) {
  const features = sfData.map((neighborhood, index) => {
    return {
      type: 'Feature',
      geometry: neighborhood.the_geom,
      properties: {
        id: index + 1,
        name: neighborhood.name,
        link: neighborhood.link || '',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        source: 'SF Open Data'
      }
    };
  });

  return {
    type: 'FeatureCollection',
    features: features
  };
}

// Función para cargar el GeoJSON en MongoDB
async function loadGeoJSONToMongoDB(geoJSONData) {
  console.log('Conectando a MongoDB...');

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log('Conexión a MongoDB establecida.');

    const db = client.db();
    const collection = db.collection('neighborhoods');

    // Verificar si la colección ya tiene datos de San Francisco
    const existingSFCount = await collection.countDocuments({ 'properties.city': 'San Francisco' });
    if (existingSFCount > 0) {
      console.log('La colección ya contiene datos de San Francisco. Eliminando datos existentes...');
      await collection.deleteMany({ 'properties.city': 'San Francisco' });
    }

    // Convertir cada feature en un documento para MongoDB
    const documents = geoJSONData.features.map(feature => {
      return {
        type: feature.type,
        geometry: feature.geometry,
        properties: feature.properties
      };
    });

    // Crear índice geoespacial si no existe
    try {
      await collection.createIndex({ 'geometry': '2dsphere' });
    } catch (error) {
      console.log('Índice geoespacial ya existe o error al crearlo:', error.message);
    }

    // Insertar los documentos
    console.log(`Insertando ${documents.length} barrios de San Francisco en MongoDB...`);
    const result = await collection.insertMany(documents);

    console.log(`${result.insertedCount} barrios de San Francisco insertados correctamente.`);

    return result.insertedCount;
  } finally {
    await client.close();
    console.log('Conexión a MongoDB cerrada.');
  }
}

// Función principal que ejecuta todo el proceso
async function main() {
  try {
    const sfData = await downloadSFNeighborhoods();
    const geoJSONData = convertToGeoJSON(sfData);

    // Guardar el GeoJSON localmente para referencia
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(geoJSONData, null, 2));
    console.log(`GeoJSON guardado en: ${OUTPUT_FILE}`);

    const insertedCount = await loadGeoJSONToMongoDB(geoJSONData);

    console.log('Proceso completado con éxito.');
    console.log(`${insertedCount} barrios de San Francisco cargados en la base de datos.`);
  } catch (error) {
    console.error('Error durante la ejecución del script:', error);
    process.exit(1);
  }
}

// Ejecutar la función principal
main();
