import * as fs from "fs";
import { MongoClient } from "mongodb";

// #region Configuration
const MONGODB_URI = process.env.MONGODB_URI || "";
const DATABASE_NAME = process.env.DATABASE_NAME || "demo";
const COLLECTION_NAME = process.env.COLLECTION_NAME || "incident_draft";

const GOOGLE_GEOCODING_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";
const GOOGLE_GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json";
// #endregion

const BARRIO = "Bosque Peralta Ramos, Mar del Plata, Argentina";

// Tipado de incidente
interface Incident {
  description: string;
  location_text: string;
  date: string;
  time: string | null;
  incident_type: string;
}

// Función para geocodificar usando Google Maps API
async function geocodeLocation(locationText: string): Promise<{ coordinates: [number, number], formattedAddress: string } | null> {
  // Primero intentar con la dirección específica
  let fullAddress = `${locationText}, ${BARRIO}`;
  let url = `${GOOGLE_GEOCODING_URL}?address=${encodeURIComponent(fullAddress)}&key=${GOOGLE_GEOCODING_API_KEY}`;

  try {
    console.log(`🔍 Intentando geocodificar: ${fullAddress}`);
    let response = await fetch(url);
    let data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      const formattedAddress = data.results[0].formatted_address;

      // Verificar si es una ubicación genérica del barrio
      const isGenericLocation = formattedAddress.includes("Reserva Forestal Bosque Peralta Ramos");
      const hasLocationTypeApproximate = data.results[0].geometry.location_type === "APPROXIMATE";

      if (isGenericLocation || hasLocationTypeApproximate) {
        console.log(`⚠️ Resultado demasiado genérico para: ${locationText}`);

        // Intentar con calles principales en Mar del Plata
        fullAddress = `${locationText}, Mar del Plata, Argentina`;
        url = `${GOOGLE_GEOCODING_URL}?address=${encodeURIComponent(fullAddress)}&key=${GOOGLE_GEOCODING_API_KEY}`;

        console.log(`🔍 Intentando geocodificar con ciudad más amplia: ${fullAddress}`);
        response = await fetch(url);
        data = await response.json();

        if (data.status === "OK" && data.results.length > 0) {
          const location = data.results[0].geometry.location;
          const formattedAddress = data.results[0].formatted_address;

          // Verificar si esta vez el resultado es más específico
          if (data.results[0].geometry.location_type !== "APPROXIMATE") {
            console.log(`✅ Geocodificación mejorada exitosa: ${formattedAddress}`);
            return {
              coordinates: [location.lng, location.lat],
              formattedAddress
            };
          }
        }

        // Si aún no tenemos un buen resultado, intentar con la dirección simplificada
        console.log(`⚠️ Intentando con dirección simplificada: ${locationText}`);
        url = `${GOOGLE_GEOCODING_URL}?address=${encodeURIComponent(locationText)}&components=country:ar&key=${GOOGLE_GEOCODING_API_KEY}`;

        response = await fetch(url);
        data = await response.json();

        if (data.status === "OK" && data.results.length > 0) {
          const location = data.results[0].geometry.location;
          const formattedAddress = data.results[0].formatted_address;
          console.log(`✅ Geocodificación con dirección simplificada exitosa: ${formattedAddress}`);
          return {
            coordinates: [location.lng, location.lat],
            formattedAddress
          };
        }

        // Si todos los intentos fallan, generar una ubicación aleatoria cerca del barrio
        // para evitar agrupar todos los incidentes en el mismo punto
        console.log(`⚠️ Generando ubicación aproximada para: ${locationText}`);

        // Coordenadas base para Bosque Peralta Ramos
        const baseLat = -38.069919;
        const baseLng = -57.559690;

        // Generar un offset aleatorio (+-0.005 grados, aproximadamente +-500 metros)
        const latOffset = (Math.random() - 0.5) * 0.01;
        const lngOffset = (Math.random() - 0.5) * 0.01;

        return {
          coordinates: [baseLng + lngOffset, baseLat + latOffset],
          formattedAddress: `${locationText} (ubicación aproximada)`
        };
      }

      console.log(`✅ Geocodificación exitosa: ${formattedAddress}`);
      return {
        coordinates: [location.lng, location.lat],
        formattedAddress
      };
    } else {
      console.error(`⛔ Google Maps no encontró resultados para: ${fullAddress}. Status: ${data.status}`);
      console.error(`Error details:`, data.error_message || 'No error message provided');

      // Generar ubicación alternativa
      console.log(`⚠️ Generando ubicación aproximada para: ${locationText}`);

      // Coordenadas base para Bosque Peralta Ramos
      const baseLat = -38.069919;
      const baseLng = -57.559690;

      // Generar un offset aleatorio (+-0.005 grados, aproximadamente +-500 metros)
      const latOffset = (Math.random() - 0.5) * 0.01;
      const lngOffset = (Math.random() - 0.5) * 0.01;

      return {
        coordinates: [baseLng + lngOffset, baseLat + latOffset],
        formattedAddress: `${locationText} (ubicación aproximada)`
      };
    }
  } catch (error) {
    console.error(`⛔ Error geocoding '${fullAddress}':`, error);

    // Generar ubicación aleatoria como último recurso
    const baseLat = -38.069919;
    const baseLng = -57.559690;
    const latOffset = (Math.random() - 0.5) * 0.01;
    const lngOffset = (Math.random() - 0.5) * 0.01;

    return {
      coordinates: [baseLng + lngOffset, baseLat + latOffset],
      formattedAddress: `${locationText} (ubicación aproximada por error)`
    };
  }
}

// Función para determinar tags
function determineTags(incidentType: string, description: string): string[] {
  const tags: string[] = [];
  const lowerType = incidentType.toLowerCase();
  const lowerDesc = description.toLowerCase();

  if (lowerType.includes("robo") || lowerType.includes("robar")) tags.push("robo");
  if (lowerType.includes("asalto") || lowerType.includes("arma") || lowerType.includes("violencia")) tags.push("asalto");
  if (lowerType.includes("vandalismo") || lowerDesc.includes("romper")) tags.push("vandalismo");
  if (lowerType.includes("disturbio")) tags.push("disturbio");
  if (lowerDesc.includes("amenaza")) tags.push("amenaza");
  if (lowerDesc.includes("sospechoso") || lowerDesc.includes("merodear")) tags.push("sospechoso");
  if (lowerDesc.includes("violencia") || lowerDesc.includes("violento")) tags.push("violencia");

  return tags.length > 0 ? Array.from(new Set(tags)) : ["robo"];
}

// Main
async function main() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables.");
  }
  const client = new (MongoClient as any)(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const rawData = fs.readFileSync("scripts/input_gpt4o.json", "utf-8");
    const incidents: Incident[] = JSON.parse(rawData);

    let success = 0;
    let errors = 0;
    let approximate = 0;

    for (const incident of incidents) {
      const geocodeResult = await geocodeLocation(incident.location_text);
      // Ahora no debería ser null, pero verificamos por si acaso
      if (!geocodeResult) {
        console.error(`⛔ No se pudo geocodificar: ${incident.location_text}`);
        errors++;
        continue;
      }

      const { coordinates, formattedAddress } = geocodeResult;
      const [lon, lat] = coordinates;

      // Comprobar si es una ubicación aproximada
      const isApproximate = formattedAddress.includes("ubicación aproximada");
      if (isApproximate) {
        approximate++;
      }

      const doc = {
        description: incident.description,
        address: formattedAddress,
        original_location: incident.location_text,
        time: incident.time ?? "",
        date: incident.date,
        location: {
          type: "Point",
          coordinates: [lon, lat],
        },
        createdAt: new Date(),
        status: "pending",
        tags: determineTags(incident.incident_type, incident.description),
        evidenceFiles: [],
        createdBy: "admin",
      };

      try {
        await collection.insertOne(doc);
        if (isApproximate) {
          console.log(`⚠️ Insertado con ubicación aproximada: ${incident.location_text} -> ${formattedAddress}`);
        } else {
          console.log(`✅ Insertado: ${incident.location_text} -> ${formattedAddress}`);
        }
        success++;
      } catch (error) {
        console.error(`⛔ Error insertando en DB:`, error);
        errors++;
      }
    }

    console.log(`\n✅ ${success} documentos insertados correctamente.`);
    console.log(`⚠️ ${approximate} con ubicaciones aproximadas.`);
    console.log(`⛔ ${errors} errores.`);
  } finally {
    await client.close();
  }
}

main().catch(console.error);
