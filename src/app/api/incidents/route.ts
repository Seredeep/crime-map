import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

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
    const client = await clientPromise;
    const db = client.db();
    
    // Check if location filtering is requested
    const hasLocationFilter = searchParams.has('lat') && searchParams.has('lng');
    
    if (hasLocationFilter) {
      // If location filters are explicitly provided, use them
      const lat = parseFloat(searchParams.get('lat') || '0');
      const lng = parseFloat(searchParams.get('lng') || '0');
      const zoom = parseInt(searchParams.get('zoom') || '12', 10);
      
      // Calculate the bounding box based on zoom level and coordinates
      const radius = Math.max(5 / Math.pow(1.5, zoom - 10), 0.5); // in kilometers
      
      // Query incidents within the area using MongoDB's geospatial queries
      const incidents = await db.collection('incident_draft').find({
        location: {
          $geoWithin: {
            $centerSphere: [[lng, lat], radius / 6371] // radius in radians (divide by Earth's radius in km)
          }
        }
      }).toArray();
      
      return NextResponse.json(incidents);
    } else {
      // If no location filters, return all incidents
      const incidents = await db.collection('incident_draft').find({}).toArray();
      return NextResponse.json(incidents);
    }
    
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