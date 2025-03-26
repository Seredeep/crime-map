import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to ensure indexes exist
async function ensureIndexes() {
  try {
    const client = await clientPromise;
    const db = client.db();

    // Check if the geospatial index already exists
    const indexes = await db.collection("incident_draft").indexes();
    const hasGeoIndex = indexes.some(
      (index) => index.key && index.key.location === "2dsphere"
    );

    // Create the index if it doesn't exist
    if (!hasGeoIndex) {
      console.log("Creating geospatial index on incident_draft collection");
      await db
        .collection("incident_draft")
        .createIndex({ location: "2dsphere" }, { background: true });
    }
  } catch (error) {
    console.error("Error ensuring indexes:", error);
    // Don't throw, just log the error
  }
}

export async function GET(request: Request) {
  try {
    // Ensure indexes exist
    await ensureIndexes();

    const { searchParams } = new URL(request.url);
    const client = await clientPromise;
    const db = client.db();

    // Check if location filtering is requested
    const hasLocationFilter =
      searchParams.has("lat") && searchParams.has("lng");

    if (hasLocationFilter) {
      // If location filters are explicitly provided, use them
      const lat = parseFloat(searchParams.get("lat") || "0");
      const lng = parseFloat(searchParams.get("lng") || "0");
      const zoom = parseInt(searchParams.get("zoom") || "12", 10);

      // Calculate the bounding box based on zoom level and coordinates
      const radius = Math.max(5 / Math.pow(1.5, zoom - 10), 0.5); // in kilometers

      // Query incidents within the area using MongoDB's geospatial queries
      const incidents = await db
        .collection("incident_draft")
        .find({
          location: {
            $geoWithin: {
              $centerSphere: [[lng, lat], radius / 6371], // radius in radians (divide by Earth's radius in km)
            },
          },
        })
        .toArray();

      return NextResponse.json(incidents);
    } else {
      // If no location filters, return all incidents
      const incidents = await db
        .collection("incident_draft")
        .find({})
        .toArray();
      return NextResponse.json(incidents);
    }
  } catch (error) {
    console.error("Error fetching incidents:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch incidents" },
      { status: 500 }
    );
  }
}

// Interface for the response structure of the GET method
interface EvidenceFile {
  name: string;
  type: string;
  size: number;
  url: string | null;
}

// Interface for incident data
interface IncidentData {
  description: string;
  address: string;
  time: string;
  date: string;
  location: {
    type: string;
    coordinates: number[];
  };
  createdAt: Date;
  status: string;
  evidenceFiles: EvidenceFile[];
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const client = await clientPromise;
    const db = client.db();

    const latitude = parseFloat(formData.get("latitude")?.toString() || "0");
    const longitude = parseFloat(formData.get("longitude")?.toString() || "0");

    // Create evidence in database
    const evidenceData: IncidentData = {
      description: formData.get("description")?.toString() || "",
      address: formData.get("address")?.toString() || "",
      time: formData.get("time")?.toString() || "",
      date: formData.get("date")?.toString() || "",
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      createdAt: new Date(),
      status: "draft",
      evidenceFiles: [],
    };

    const result = await db
      .collection("incident_draft")
      .insertOne(evidenceData);
    const incidentId = result.insertedId.toString();

    // Upload files to SUPABASE storage
    const evidenceFiles = formData.getAll("evidence");
    console.log(`Número de archivos encontrados: ${evidenceFiles.length}`);

    for (const file of evidenceFiles) {
      if (!(file instanceof File)) {
        console.error("No es un archivo válido:", file);
        continue;
      }

      const fileName = `${incidentId}/${file.name}`;
      console.log(`Procesando archivo: ${fileName}`);

      try {
        const fileBuffer = await file.arrayBuffer();
        console.log(
          `Archivo convertido a ArrayBuffer, tamaño: ${fileBuffer.byteLength}`
        );

        const { data, error } = await supabase.storage
          .from("evidence")
          .upload(fileName, fileBuffer, {
            contentType: file.type,
            cacheControl: "3600",
            upsert: true,
          });

        if (error) {
          console.error("Error uploading file:", error.message);
          continue;
        }

        console.log("Archivo subido exitosamente:", data);

        // Publico url of the file
        const { data: signedUrlData } = await supabase.storage
          .from("evidence")
          .createSignedUrl(fileName, 31536000); // Token válido por 1 año

        // Note: The file itself will not be deleted or inaccessible after one year.
        // Only the signed URL will expire after one year. You can generate a new signed URL if needed.

          if (signedUrlData) {
            const fileData: EvidenceFile = {
          name: file.name,
          type: file.type,
          size: file.size,
          url: signedUrlData.signedUrl || null, 
        };

        evidenceData.evidenceFiles.push(fileData);
        console.log("Archivo añadido a evidenceFiles:", fileData);
      } else {
        console.error("Error creating signed URL:", signedUrlData);
      }
      } catch (error) {
        console.error("Error processing file:", error);
      }
    }

    // Update incident with the file URLs
    if (evidenceData.evidenceFiles.length > 0) {
      console.log("Actualizando documento con evidenceFiles");
      const finalEvidenceData = {
        ...evidenceData,
        evidenceFiles: evidenceData.evidenceFiles,
      };

      await db.collection("incident_draft").insertOne(finalEvidenceData);
    }

    return NextResponse.json({
      success: true,
      message: "Incident draft created successfully",
      id: incidentId,
    });
  } catch (error) {
    console.error("Error saving incident:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save incident" },
      { status: 500 }
    );
  }
}
