import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Helper function to ensure indexes exist
async function ensureIndexes() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Check if the geospatial index already exists
    const indexes = await db.collection('incident_draft').indexes();
    const hasGeoIndex = indexes.some(index => 
      index.key && index.key.location === '2dsphere'
    );
    
    // Create the index if it doesn't exist
    if (!hasGeoIndex) {
      console.log('Creating geospatial index on incident_draft collection');
      await db.collection('incident_draft').createIndex(
        { location: '2dsphere' },
        { background: true }
      );
    }
  } catch (error) {
    console.error('Error ensuring indexes:', error);
    // Don't throw, just log the error
  }
}

export async function GET(request: Request) {
  try {
    // Ensure indexes exist
    await ensureIndexes();
    
    const { searchParams } = new URL(request.url);
    console.log('Parámetros de búsqueda recibidos:', Object.fromEntries(searchParams.entries()));
    
    const client = await clientPromise;
    const db = client.db();
    
    // Build MongoDB query based on filters
    let query: any = {};
    
    // Neighborhood filter
    if (searchParams.has('neighborhoodId')) {
      const neighborhoodId = searchParams.get('neighborhoodId');
      console.log('Filtrando por barrio ID:', neighborhoodId);
      
      // Only proceed if we have a valid ID
      if (neighborhoodId) {
        try {
          // Primero intentamos convertir a número ya que properties.id es numérico
          const neighborhoodIdNum = parseInt(neighborhoodId, 10);
          console.log('ID como número:', neighborhoodIdNum, 'Es NaN:', isNaN(neighborhoodIdNum));
          
          // Find the neighborhood - could be numeric ID from properties
          const neighborhood = await db
            .collection('neighborhoods')
            .findOne({ 'properties.id': isNaN(neighborhoodIdNum) ? neighborhoodId : neighborhoodIdNum });
          
          if (neighborhood && neighborhood.geometry) {
            console.log('Barrio encontrado:', neighborhood._id, 'Nombre:', neighborhood.properties?.soc_fomen);
            // Filter incidents by location within the neighborhood polygon
            query.location = {
              $geoWithin: {
                $geometry: neighborhood.geometry
              }
            };
          } else {
            console.log(`No neighborhood found with ID: ${neighborhoodId}`);
          }
        } catch (err) {
          console.error('Error fetching neighborhood for filtering:', err);
          // If there's an error, we'll just proceed without the neighborhood filter
        }
      }
    }
    // Location filter (original feature)
    else if (searchParams.has('lat') && searchParams.has('lng')) {
      const lat = parseFloat(searchParams.get('lat') || '0');
      const lng = parseFloat(searchParams.get('lng') || '0');
      const zoom = parseInt(searchParams.get('zoom') || '12', 10);
      
      // Calculate the bounding box based on zoom level and coordinates
      const radius = Math.max(5 / Math.pow(1.5, zoom - 10), 0.5); // in kilometers
      
      // Add geospatial query
      query.location = {
        $geoWithin: {
          $centerSphere: [[lng, lat], radius / 6371] // radius in radians (divide by Earth's radius in km)
        }
      };
    }
    
    // Date filter
    if (searchParams.has('date')) {
      const date = searchParams.get('date');
      console.log('Filtrando por fecha:', date);
      
      // Aseguramos que la fecha tenga el formato correcto (YYYY-MM-DD)
      // y lo comparamos como string exacto (ya que así se guarda en la BD)
      if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        query.date = date;
        console.log('Filtro de fecha aplicado:', query.date);
        
        // Información adicional para depuración
        db.collection('incident_draft').find({ date }).toArray().then(results => {
          console.log(`Incidentes encontrados con fecha ${date}: ${results.length}`);
          if (results.length > 0) {
            console.log('Ejemplo de incidente con esta fecha:', {
              _id: results[0]._id,
              date: results[0].date,
              dateType: typeof results[0].date
            });
          }
        }).catch(err => {
          console.error('Error al buscar incidentes por fecha:', err);
        });
      } else {
        console.log('Formato de fecha inválido:', date);
      }
    }
    
    // Time range filter
    if (searchParams.has('time')) {
      const timeRange = searchParams.get('time');
      console.log('Filtrando por horario:', timeRange);
      
      switch (timeRange) {
        case 'morning':
          query.time = { $gte: '06:00', $lt: '12:00' };
          break;
        case 'afternoon':
          query.time = { $gte: '12:00', $lt: '18:00' };
          break;
        case 'evening':
          query.time = { $gte: '18:00', $lt: '24:00' };  // Cambiado a 24:00 para claridad
          break;
        case 'night':
          // Para el periodo "night" (00:00-06:00), necesitamos usar $or directamente dentro de la consulta
          // porque cruza la medianoche
          query = {
            ...query,
            $or: [
              { time: { $gte: '00:00', $lt: '06:00' } }
            ]
          };
          console.log('Filtro de noche aplicado:', JSON.stringify(query));
          break;
        default:
          // If it's not a predefined range, assume it's a specific time
          query.time = timeRange;
      }
    }
    
    // Status filter
    if (searchParams.has('status')) {
      query.status = searchParams.get('status');
    }
    
    // Tag filter
    if (searchParams.has('tag')) {
      const tags = searchParams.getAll('tag');
      
      if (tags.length === 1) {
        query.tags = tags[0];
      } else if (tags.length > 1) {
        query.tags = { $in: tags };
      }
    }
    
    // Execute the query
    console.log('Consulta MongoDB final:', JSON.stringify(query));
    const incidents = await db.collection('incident_draft').find(query).toArray();
    console.log(`Se encontraron ${incidents.length} incidentes`);
    
    // Logging para debug: muestra el formato de las fechas
    if (incidents.length > 0) {
      console.log('Ejemplo de incidente:', {
        _id: incidents[0]._id,
        date: incidents[0].date,
        time: incidents[0].time,
        dateType: typeof incidents[0].date,
        timeType: typeof incidents[0].time
      });
    }

    return NextResponse.json(incidents);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch incidents' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const client = await clientPromise;
    const db = client.db();

    // Parse latitude and longitude
    const latitude = parseFloat(formData.get('latitude') as string || '0');
    const longitude = parseFloat(formData.get('longitude') as string || '0');

    // Convert formData to a regular object
    const incidentData = {
      description: formData.get('description'),
      address: formData.get('address'),
      time: formData.get('time'),
      date: formData.get('date'),
      // Add location data
      location: {
        type: 'Point',
        coordinates: [longitude, latitude] // GeoJSON format: [longitude, latitude]
      },
      latitude, // Store as separate fields for easier access
      longitude,
      createdAt: new Date(),
      status: 'draft',
      // Handle file paths or URLs later when implementing file storage
      evidenceFiles: formData.getAll('evidence').map((file) => ({
        name: (file as File).name,
        type: (file as File).type,
        size: (file as File).size,
      })),
    };

    // Insert the incident into MongoDB
    const result = await db.collection('incident_draft').insertOne(incidentData);

    return NextResponse.json({ 
      success: true, 
      message: 'Incident draft created successfully',
      id: result.insertedId.toString()
    });

  } catch (error) {
    console.error('Error saving incident:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save incident' },
      { status: 500 }
    );
  }
} 