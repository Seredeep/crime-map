import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { Incident } from '@/lib/types';
import { Filter } from 'mongodb';

interface MongoQuery extends Filter<Incident> {
  location?: {
    $geoWithin?: {
      $geometry: {
        type: string;
        coordinates: number[][][];
      };
    };
    $near?: {
      $geometry: {
        type: string;
        coordinates: [number, number];
      };
      $maxDistance: number;
    };
  };
  date?: {
    $gte?: string;
    $lte?: string;
  };
  time?: {
    $gte?: string;
    $lte?: string;
  };
  status?: 'pending' | 'verified' | 'resolved';
  tags?: {
    $in: string[];
  };
}

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

export async function GET(request: NextRequest) {
  try {
    // Ensure indexes exist
    await ensureIndexes();
    
    const { searchParams } = new URL(request.url);
    
    const client = await clientPromise;
    const db = client.db();
    
    const neighborhoodId = searchParams.get('neighborhoodId');
    const date = searchParams.get('date');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const time = searchParams.get('time');
    const timeFrom = searchParams.get('timeFrom');
    const timeTo = searchParams.get('timeTo');
    const status = searchParams.get('status') as 'pending' | 'verified' | 'resolved' | null;
    const tags = searchParams.getAll('tag');
    const location = searchParams.get('location');
    
    // Build MongoDB query based on filters
    const query: MongoQuery = {};
    
    // Add neighborhood filter if provided
    if (neighborhoodId) {
      const neighborhoodIdNum = parseInt(neighborhoodId, 10);
      const neighborhood = await db.collection('neighborhoods').findOne({ 'properties.id': isNaN(neighborhoodIdNum) ? neighborhoodId : neighborhoodIdNum });
      if (neighborhood) {
        query.location = {
          $geoWithin: {
            $geometry: neighborhood.geometry
          }
        };
      }
    }
    
    // Add date filters
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay.toISOString(), $lte: endOfDay.toISOString() };
    } else {
      const dateQuery: MongoQuery['date'] = {};
      if (dateFrom) {
        const startDate = new Date(dateFrom);
        startDate.setHours(0, 0, 0, 0);
        dateQuery.$gte = startDate.toISOString();
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        dateQuery.$lte = endDate.toISOString();
      }
      if (Object.keys(dateQuery).length > 0) {
        query.date = dateQuery;
      }
    }
    
    // Add time filters
    if (time) {
      const [hours, minutes] = time.split(':').map(Number);
      const timeInMinutes = hours * 60 + minutes;
      query.time = { $gte: timeInMinutes.toString(), $lte: timeInMinutes.toString() };
    } else {
      const timeQuery: MongoQuery['time'] = {};
      if (timeFrom) {
        const [hours, minutes] = timeFrom.split(':').map(Number);
        timeQuery.$gte = (hours * 60 + minutes).toString();
      }
      if (timeTo) {
        const [hours, minutes] = timeTo.split(':').map(Number);
        timeQuery.$lte = (hours * 60 + minutes).toString();
      }
      if (Object.keys(timeQuery).length > 0) {
        query.time = timeQuery;
      }
    }
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    
    // Add tags filter if provided
    if (tags.length > 0) {
      query.tags = { $in: tags };
    }
    
    // Add location filter if provided
    if (location) {
      try {
        const locationObj = JSON.parse(location);
        if (locationObj.type === 'Point' && Array.isArray(locationObj.coordinates)) {
          query.location = {
            $near: {
              $geometry: locationObj,
              $maxDistance: 1000 // 1km radius
            }
          };
        }
      } catch (error) {
        console.error('Error parsing location:', error);
      }
    }
    
    // Execute the query
    const incidents = await db.collection<Incident>('incident_draft').find(query).toArray();

    return NextResponse.json(incidents);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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