const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Ruta al archivo JSON de etiquetas de crímenes
const TAGS_FILE = path.join(__dirname, 'crime-tags.json');

// Función para cargar el JSON en MongoDB
async function loadCrimeTagsToMongoDB(filePath) {
  console.log('Conectando a MongoDB...');
  
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Conexión a MongoDB establecida.');
    
    const db = client.db();
    const collection = db.collection('crime_tags');
    
    // Verificar si el archivo existe
    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo ${filePath} no existe.`);
    }
    
    // Leer el archivo JSON
    console.log('Leyendo archivo JSON de etiquetas de crímenes...');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    if (!fileContent || fileContent.trim() === '') {
      throw new Error('El archivo JSON está vacío');
    }
    
    // Parsear el JSON
    const tagsData = JSON.parse(fileContent);
    
    // Verificar si la colección ya tiene datos
    const count = await collection.countDocuments();
    if (count > 0) {
      console.log('La colección ya contiene datos. Eliminando datos existentes...');
      await collection.deleteMany({});
    }
    
    // Insertar el documento directamente
    console.log('Insertando datos de etiquetas de crímenes en MongoDB...');
    const result = await collection.insertOne(tagsData);
    
    console.log(`Datos de etiquetas de crímenes insertados correctamente con ID: ${result.insertedId}`);
    
    return result;
  } finally {
    await client.close();
    console.log('Conexión a MongoDB cerrada.');
  }
}

// Función principal
async function main() {
  try {
    console.log(`Usando archivo JSON de etiquetas: ${TAGS_FILE}`);
    const result = await loadCrimeTagsToMongoDB(TAGS_FILE);
    
    console.log('Proceso completado con éxito.');
  } catch (error) {
    console.error('Error durante la ejecución del script:', error);
    process.exit(1);
  }
}

// Ejecutar la función principal
main(); 