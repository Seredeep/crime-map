import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

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
      await db.collection('incident_draft').createIndex(
        { location: '2dsphere' },
        { background: true }
      );
    }
  } catch (error) {
    console.error('Error ensuring indexes:', error);
  }
}

export async function GET(request: Request) {
  try {
    // Ensure indexes exist
    await ensureIndexes();
    
    const { searchParams } = new URL(request.url);
    
    const client = await clientPromise;
    const db = client.db();
    
    // Build MongoDB query based on filters
    let query: any = {};
    
    // Neighborhood filter
    if (searchParams.has('neighborhoodId')) {
      const neighborhoodId = searchParams.get('neighborhoodId');
      
      // Only proceed if we have a valid ID
      if (neighborhoodId) {
        try {
          // Primero intentamos convertir a número ya que properties.id es numérico
          const neighborhoodIdNum = parseInt(neighborhoodId, 10);
          
          // Find the neighborhood - could be numeric ID from properties
          const neighborhood = await db
            .collection('neighborhoods')
            .findOne({ 'properties.id': isNaN(neighborhoodIdNum) ? neighborhoodId : neighborhoodIdNum });
          
          if (neighborhood && neighborhood.geometry) {
            // Filter incidents by location within the neighborhood polygon
            query.location = {
              $geoWithin: {
                $geometry: neighborhood.geometry
              }
            };
          }
        } catch (err) {
          console.error('Error fetching neighborhood for filtering:', err);
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
      
      // Aseguramos que la fecha tenga el formato correcto (YYYY-MM-DD)
      if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        query.date = date;
      }
    }
    
    // Time range filter
    if (searchParams.has('time')) {
      const timeRange = searchParams.get('time');
      
      switch (timeRange) {
        case 'morning':
          query.time = { $gte: '06:00', $lt: '12:00' };
          break;
        case 'afternoon':
          query.time = { $gte: '12:00', $lt: '18:00' };
          break;
        case 'evening':
          query.time = { $gte: '18:00', $lt: '24:00' };
          break;
        case 'night':
          // Para el periodo "night" (00:00-06:00)
          query = {
            ...query,
            $or: [
              { time: { $gte: '00:00', $lt: '06:00' } }
            ]
          };
          break;
        default:
          // If it's not a predefined range, assume it's a specific time
          query.time = timeRange;
      }
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
    const incidents = await db.collection('incident_draft').find(query).toArray();

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
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, message: 'No autorizado. Debes iniciar sesión para reportar un incidente.' },
        { status: 401 }
      );
    }
    const formData = await request.formData();
    const client = await clientPromise;
    const db = client.db();

    // Obtener y analizar el objeto location
    let location;
    try {
      location = JSON.parse(formData.get('location') as string);
    } catch (e) {
      console.error('Error parsing location:', e);
      return NextResponse.json(
        { success: false, message: 'Invalid location format' },
        { status: 400 }
      );
    }

    // Verificar que las coordenadas sean números válidos
    if (!location || 
        !location.coordinates || 
        !Array.isArray(location.coordinates) ||
        location.coordinates.length !== 2 ||
        typeof location.coordinates[0] !== 'number' ||
        typeof location.coordinates[1] !== 'number') {
      return NextResponse.json(
        { success: false, message: 'Invalid coordinates format' },
        { status: 400 }
      );
    }

    // Get tags from form data
    const tags = formData.getAll('tags[]').map(tag => tag.toString());

    // Convert formData to a regular object
    const incidentData = {
      description: formData.get('description'),
      address: formData.get('address'),
      time: formData.get('time'),
      date: formData.get('date'),
      // Add location data
      location,
      createdAt: new Date(),
      status: 'pending',
      tags: tags.length > 0 ? tags : undefined,
      evidenceFiles: formData.getAll('evidence').map((file) => ({
        name: (file as File).name,
        type: (file as File).type,
        size: (file as File).size,
      })),
      createdBy: session.user.id,
    };

    // Insert the incident into MongoDB
    const result = await db.collection('incident_draft').insertOne(incidentData);

    // Insert a log entry
    await db.collection('logs').insertOne({
      action: 'create_incident',
      incidentId: result.insertedId,
      userId: session.user.id,
      userEmail: session.user.email,
      timestamp: new Date(),
      details: {
        description: incidentData.description,
        address: incidentData.address,
      },
    });

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