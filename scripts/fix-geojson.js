const fs = require('fs');
const path = require('path');

// Ruta al archivo GeoJSON
const INPUT_FILE = path.join(__dirname, 'barrios.geojson');
const OUTPUT_FILE = path.join(__dirname, 'barrios-fixed.geojson');

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
  if (!feature.geometry) {
    console.log(`Advertencia: Feature sin geometría: ${JSON.stringify(feature.properties)}`);
    return null;
  }

  if (feature.geometry.type === 'MultiPolygon') {
    // Filtrar anillos inválidos en cada polígono
    const originalPolygonCount = feature.geometry.coordinates.length;
    
    feature.geometry.coordinates = feature.geometry.coordinates.map(polygon => {
      const originalRingCount = polygon.length;
      const validRings = polygon.filter(ring => validateRing(ring));
      
      if (originalRingCount > validRings.length) {
        console.log(`Corregido: Feature ID ${feature.properties.id || 'desconocido'} - ${originalRingCount - validRings.length} anillos inválidos eliminados`);
      }
      
      return validRings;
    }).filter(polygon => polygon.length > 0);
    
    if (originalPolygonCount > feature.geometry.coordinates.length) {
      console.log(`Corregido: Feature ID ${feature.properties.id || 'desconocido'} - ${originalPolygonCount - feature.geometry.coordinates.length} polígonos inválidos eliminados`);
    }
    
    // Si no quedan polígonos válidos, devuelve null
    if (feature.geometry.coordinates.length === 0) {
      console.log(`Advertencia: Feature con ID ${feature.properties.id || 'desconocido'} no tiene polígonos válidos y será omitido.`);
      return null;
    }
  } else if (feature.geometry.type === 'Polygon') {
    // Filtrar anillos inválidos
    const originalRingCount = feature.geometry.coordinates.length;
    feature.geometry.coordinates = feature.geometry.coordinates.filter(ring => validateRing(ring));
    
    if (originalRingCount > feature.geometry.coordinates.length) {
      console.log(`Corregido: Feature ID ${feature.properties.id || 'desconocido'} - ${originalRingCount - feature.geometry.coordinates.length} anillos inválidos eliminados`);
    }
    
    // Si no quedan anillos válidos, devuelve null
    if (feature.geometry.coordinates.length === 0) {
      console.log(`Advertencia: Feature con ID ${feature.properties.id || 'desconocido'} no tiene anillos válidos y será omitido.`);
      return null;
    }
  }
  
  return feature;
}

// Función principal
function fixGeoJSON() {
  try {
    console.log('Leyendo archivo GeoJSON...');
    const geoJSONData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
    
    console.log('Validando y corrigiendo geometrías...');
    const originalFeatureCount = geoJSONData.features.length;
    
    // Validar y corregir cada feature
    geoJSONData.features = geoJSONData.features
      .map(feature => validateAndFixGeometry(feature))
      .filter(feature => feature !== null);
    
    const removedFeatureCount = originalFeatureCount - geoJSONData.features.length;
    console.log(`${removedFeatureCount} features inválidos omitidos.`);
    console.log(`${geoJSONData.features.length} features válidos restantes.`);
    
    // Guardar el archivo corregido
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(geoJSONData, null, 2));
    console.log(`Archivo GeoJSON corregido guardado como: ${OUTPUT_FILE}`);
    
    return {
      originalCount: originalFeatureCount,
      validCount: geoJSONData.features.length,
      removedCount: removedFeatureCount
    };
  } catch (error) {
    console.error('Error al procesar el archivo GeoJSON:', error);
    throw error;
  }
}

// Ejecutar la función principal
if (require.main === module) {
  try {
    const result = fixGeoJSON();
    console.log('Proceso completado con éxito.');
    console.log(`Resumen: ${result.originalCount} features originales, ${result.validCount} features válidos, ${result.removedCount} features eliminados.`);
  } catch (error) {
    console.error('Error durante la ejecución del script:', error);
    process.exit(1);
  }
}

module.exports = { fixGeoJSON }; 