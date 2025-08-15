import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import clientPromise from '@/lib/config/db/mongodb';
import { ROLES, Role, hasRequiredRole } from '@/lib/config/roles';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

// TODO: Re-enable Supabase when properly configured
// const EVIDENCE_BUCKET = 'incident-evidence';

interface MongoQuery {
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
  [key: string]: any;
}

// Helper function to ensure indexes exist
async function ensureIndexes(collection: any) {
  try {
    const hasGeoIndex = await collection.indexExists('location_2dsphere');

    if (!hasGeoIndex) {
      await collection.createIndex({ location: '2dsphere' }, { background: true });
    }
  } catch (error) {
    console.error('Error ensuring indexes:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const incidentsCollection = db.collection('incident_draft');
    await ensureIndexes(incidentsCollection);

    const { searchParams } = new URL(request.url);

    const city = searchParams.get('city');
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

    // Add city filter if provided
    if (city) {
      // Buscar por ciudad en el campo neighborhood o address
      query.$or = [
        { neighborhood: { $regex: city, $options: 'i' } },
        { address: { $regex: city, $options: 'i' } }
      ];
    }

    // Add neighborhood filter if provided
    if (neighborhoodId) {
      try {
        // Buscar el barrio por _id (MongoDB ObjectId) o properties.id
        const neighborhood = await db.collection('neighborhoods').findOne({
          $or: [
            { 'properties.id': neighborhoodId },
            { 'properties.id': parseInt(neighborhoodId, 10) }
          ]
        });

        if (neighborhood && neighborhood.geometry) {
          query.location = {
            $geoWithin: {
              $geometry: neighborhood.geometry
            }
          };
        }
      } catch (error) {
        console.error('Error filtering by neighborhood:', error);
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
    const incidents = await incidentsCollection.find(query).toArray();

    return NextResponse.json(incidents);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // TODO: Re-enable Supabase when properly configured
    // Check if Supabase is correctly initialized
    // if (!supabase || !supabase.storage) {
    //   console.error('Supabase client not properly initialized');
    //   return NextResponse.json(
    //     { success: false, message: 'Storage service unavailable' },
    //     { status: 500 }
    //   );
    // }

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
    const incidentsCollection = db.collection('incident_draft');
    await ensureIndexes(incidentsCollection);

    // Parse location
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

    // Validate coordinates
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

    // TODO: Re-enable Supabase when properly configured
    // Handle file uploads to Supabase
    // const evidenceFiles = formData.getAll('evidence') as File[];
    // const uploadedEvidences = [];

    // // Upload each file to Supabase
    // for (const file of evidenceFiles) {
    //   try {
    //     // Create a unique file name with timestamp and random string
    //     const fileExt = file.name.split('.').pop();
    //     const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

    //     // Store files in a user-specific folder for better organization
    //     const filePath = `${session.user.id}/${fileName}`;

    //     // Convert the file to array buffer for upload
    //     const arrayBuffer = await file.arrayBuffer();
    //     const buffer = new Uint8Array(arrayBuffer);

    //     // Upload to the dedicated bucket
    //     const { data, error } = await supabase
    //       .storage
    //       .from(EVIDENCE_BUCKET)
    //       .upload(filePath, buffer, {
    //         contentType: file.type,
    //         upsert: false
    //       });

    //     if (error) {
    //       console.error('Error uploading file to Supabase:', error);
    //       continue; // Skip this file but continue with the others
    //     }

    //     // Get public URL using the correct bucket
    //     const { data: urlData } = supabase
    //       .storage
    //       .from(EVIDENCE_BUCKET)
    //       .getPublicUrl(filePath);

    //     // Store file metadata with the public URL
    //     uploadedEvidences.push({
    //       name: file.name,
    //       type: file.type,
    //       size: file.size,
    //       path: filePath,
    //       url: urlData.publicUrl
    //     });
    //   } catch (error) {
    //     console.error(`Error processing file ${file.name}:`, error);
    //   }
    // }

    // Create incident data object
    const incidentData = {
      description: formData.get('description'),
      address: formData.get('address'),
      time: formData.get('time'),
      date: formData.get('date'),
      location,
      createdAt: new Date(),
      status: 'pending',
      tags: tags.length > 0 ? tags : undefined,
      // TODO: Re-enable Supabase when properly configured
      // Store both file metadata and direct URLs
      // evidenceFiles: uploadedEvidences,
      // evidenceUrls: uploadedEvidences.map(file => file.url), // For backward compatibility
      createdBy: session.user.id,
    };

    // Insert the incident into MongoDB
    const result = await incidentsCollection.insertOne(incidentData);

    // Log the action
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

export async function PATCH(request: Request) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, message: 'No autorizado. Debes iniciar sesión para actualizar un incidente.' },
        { status: 401 }
      );
    }

    if (!hasRequiredRole(session.user.role as Role, [ROLES.EDITOR, ROLES.ADMIN])) {
      return NextResponse.json(
        { success: false, message: 'No autorizado. Debes estar autenticado como editor para actualizar un incidente.' },
        { status: 401 }
      );
    }

    const contentType = request.headers.get('content-type') || '';

    let incidentId: string | undefined;
    let updates: Record<string, unknown> | undefined;

    if (contentType.includes('application/json')) {
      // JSON payload: { incidentId, ...updates }
      const body = await request.json().catch(() => null);
      if (body && typeof body === 'object') {
        const { incidentId: id, ...rest } = body as Record<string, unknown>;
        incidentId = typeof id === 'string' ? id : undefined;
        updates = rest;
      }
    } else {
      // Form payload: incidentId + updates (as JSON string) or individual fields
      const formData = await request.formData();
      const id = formData.get('incidentId');
      incidentId = typeof id === 'string' ? id : undefined;

      const updatesRaw = formData.get('updates');
      if (typeof updatesRaw === 'string' && updatesRaw.trim()) {
        try {
          updates = JSON.parse(updatesRaw);
        } catch {
          return NextResponse.json(
            { success: false, message: 'Formato de actualizaciones inválido' },
            { status: 400 }
          );
        }
      } else {
        // Fallback: build updates from all form fields except incidentId
        updates = {};
        for (const [key, value] of formData.entries()) {
          if (key === 'incidentId') continue;
          (updates as Record<string, unknown>)[key] = value as unknown as string;
        }
      }
    }

    if (!incidentId || !updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: 'ID de incidente y actualizaciones son requeridos' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection('incident_draft').updateOne(
      { _id: new ObjectId(incidentId) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: 'Incidente no encontrado' }, { status: 404 });
    }

    const updatedIncident = await db.collection('incident_draft').findOne({ _id: new ObjectId(incidentId) });

    return NextResponse.json({ success: true, incident: updatedIncident });
  } catch (error) {
    console.error('Error updating incident:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role as Role;
    if (!session?.user?.id || !hasRequiredRole(userRole, [ROLES.ADMIN])) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Incident ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('incident_draft');

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Incident not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Incident deleted successfully' });
  } catch (error) {
    console.error('Error deleting incident:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
