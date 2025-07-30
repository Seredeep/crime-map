// Script para cargar barrios de Mar del Plata
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// URL del archivo GeoJSON de los barrios
const GEOJSON_URL = 'https://datos.mardelplata.gob.ar/sites/default/files/barrios.geojson';
const OUTPUT_FILE = path.join(__dirname, 'barrios.geojson');

// Función para descargar el archivo GeoJSON usando fetch
async function downloadGeoJSON() {
  console.log('Descargando archivo GeoJSON de barrios...');

  try {
    const response = await fetch(GEOJSON_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json,*/*'
      }
    });

    if (!response.ok) {
      throw new Error(`Error al descargar el archivo: ${response.status} ${response.statusText}`);
    }

    const data = await response.text();
    fs.writeFileSync(OUTPUT_FILE, data);
    console.log('Descarga completada.');
    return OUTPUT_FILE;
  } catch (error) {
    console.error('Error al descargar el archivo:', error);
    throw error;
  }
}

// Función para cargar el GeoJSON en MongoDB
async function loadGeoJSONToMongoDB(filePath) {
  console.log('Conectando a MongoDB...');

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log('Conexión a MongoDB establecida.');

    const db = client.db();
    const collection = db.collection('neighborhoods');

    // Leer el archivo GeoJSON
    console.log('Leyendo archivo GeoJSON...');
    const geoJSONData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Verificar si la colección ya tiene datos
    const count = await collection.countDocuments();
    if (count > 0) {
      console.log('La colección ya contiene datos. Eliminando datos existentes...');
      await collection.deleteMany({});
    }

    // Función para validar un anillo (ring) de un polígono
    function validateRing(ring) {
      // Debe tener al menos 4 puntos (el primero y último deben ser iguales para cerrar el polígono)
      if (ring.length < 4) return false;

      // Verificar si hay al menos 3 vértices únicos
      const uniqueVertices = new Set();
      ring.forEach(coord => {
        uniqueVertices.add(JSON.stringify(coord));
      });

      return uniqueVertices.size >= 3;
    }

    // Función para validar y corregir la geometría de un feature
    function validateAndFixGeometry(feature) {
      if (feature.geometry.type === 'MultiPolygon') {
        // Filtrar anillos inválidos en cada polígono
        feature.geometry.coordinates = feature.geometry.coordinates.map(polygon => {
          return polygon.filter(ring => validateRing(ring));
        }).filter(polygon => polygon.length > 0);

        // Si no quedan polígonos válidos, devuelve null
        if (feature.geometry.coordinates.length === 0) {
          console.log(`Advertencia: Feature con ID ${feature.properties.id || 'desconocido'} no tiene polígonos válidos y será omitido.`);
          return null;
        }
      } else if (feature.geometry.type === 'Polygon') {
        // Filtrar anillos inválidos
        feature.geometry.coordinates = feature.geometry.coordinates.filter(ring => validateRing(ring));

        // Si no quedan anillos válidos, devuelve null
        if (feature.geometry.coordinates.length === 0) {
          console.log(`Advertencia: Feature con ID ${feature.properties.id || 'desconocido'} no tiene anillos válidos y será omitido.`);
          return null;
        }
      }

      return feature;
    }

    // Convertir cada feature en un documento para MongoDB, filtrando los inválidos
    console.log('Validando y corrigiendo geometrías...');
    const documents = geoJSONData.features
      .map(feature => validateAndFixGeometry(feature))
      .filter(feature => feature !== null)
      .map(feature => {
        return {
          type: feature.type,
          geometry: feature.geometry,
          properties: {
            ...feature.properties,
            country: 'Argentina',
            city: 'Mar del Plata',
            source: 'datos.mardelplata.gob.ar'
          }
        };
      });

    console.log(`${geoJSONData.features.length - documents.length} geometrías inválidas omitidas.`);

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
    const filePath = await downloadGeoJSON();
    const insertedCount = await loadGeoJSONToMongoDB(filePath);

    console.log('Proceso completado con éxito.');
    console.log(`${insertedCount} barrios cargados en la base de datos.`);
  } catch (error) {
    console.error('Error durante la ejecución del script:', error);
    process.exit(1);
  }
}

// Ejecutar la función principal
main();
