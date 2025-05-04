import { MongoClient } from "mongodb";
import * as fs from "fs";
import { DB_CONFIG, EXTERNAL_SERVICES } from "../src/config/constants";

// Tipado de incidente
interface Incident {
  description: string;
  location_text: string;
  date: string;
  time: string | null;
  incident_type: string;
}

// Función para determinar tags
function determineTags(incidentType: string, description: string): string[] {
  const tags: string[] = [];
  const lowerType = incidentType.toLowerCase();
  const lowerDesc = description.toLowerCase();

  // Usar las etiquetas comunes definidas en la configuración
  const commonTags = ["robo", "hurto", "asalto", "violencia", "vandalismo", "drogas", "disturbios", "sospechoso"];
  commonTags.forEach((tag: string) => {
    if (lowerType.includes(tag) || lowerDesc.includes(tag)) {
      tags.push(tag);
    }
  });

  return tags.length > 0 ? tags : ["otros"];
}

// Función para geocodificar una dirección
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const url = `${EXTERNAL_SERVICES.GOOGLE_MAPS.GEOCODING_URL}?address=${encodeURIComponent(address)}&key=${EXTERNAL_SERVICES.GOOGLE_MAPS.GEOCODING_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === "OK" && data.results[0]) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng
      };
    }
    return null;
  } catch (error) {
    console.error("Error en geocodificación:", error);
    return null;
  }
}

// Main
async function main() {
  if (!DB_CONFIG.MONGODB_URI) {
    console.error("Error: MONGODB_URI no está definida en las variables de entorno");
    process.exit(1);
  }

  if (!EXTERNAL_SERVICES.GOOGLE_MAPS.GEOCODING_API_KEY) {
    console.error("Error: GOOGLE_GEOCODING_API_KEY no está definida en las variables de entorno");
    process.exit(1);
  }

  const client = new MongoClient(DB_CONFIG.MONGODB_URI);
  
  try {
    await client.connect();
    console.log("Conectado a MongoDB");
    
    const db = client.db(DB_CONFIG.DATABASE_NAME);
    const collection = db.collection(DB_CONFIG.COLLECTIONS.INCIDENTS);
    
    const rawData = fs.readFileSync("scripts/input_gpt4o.json", "utf-8");
    const incidents: Incident[] = JSON.parse(rawData);
    
    console.log(`Procesando ${incidents.length} incidentes...`);
    
    for (const incident of incidents) {
      const location = await geocodeAddress(incident.location_text);
      
      if (location) {
        const tags = determineTags(incident.incident_type, incident.description);
        
        await collection.insertOne({
          description: incident.description,
          address: incident.location_text,
          time: incident.time,
          date: incident.date,
          location: {
            type: "Point",
            coordinates: [location.lng, location.lat]
          },
          createdAt: new Date(),
          status: "pending",
          tags
        });
        
        console.log(`Incidente procesado: ${incident.description}`);
      } else {
        console.error(`No se pudo geocodificar: ${incident.location_text}`);
      }
    }
    
    console.log("Proceso completado");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

main();
