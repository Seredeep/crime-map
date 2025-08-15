import clientPromise from '@/lib/config/db/mongodb';
import { NextRequest, NextResponse } from 'next/server';

// Datos de ejemplo para cuando no hay MongoDB
const sampleIncidents = [
  {
    _id: '1',
    description: 'Robo en vivienda en Avenida Luro 1234',
    address: 'Avenida Luro 1234, Mar del Plata, Argentina',
    time: '14:30',
    date: '2024-01-15',
    location: {
      type: "Point",
      coordinates: [-57.5426, -38.0055]
    },
    status: 'verified',
    tags: ['robo', 'vivienda'],
    type: 'robo'
  },
  {
    _id: '2',
    description: 'Asalto en la esquina de Avenida Colón y San Martín',
    address: 'Avenida Colón y San Martín, Mar del Plata, Argentina',
    time: '20:15',
    date: '2024-01-14',
    location: {
      type: "Point",
      coordinates: [-57.5526, -38.0155]
    },
    status: 'verified',
    tags: ['asalto', 'esquina'],
    type: 'asalto'
  },
  {
    _id: '3',
    description: 'Vandalismo en parque público',
    address: 'Parque San Martín, Mar del Plata, Argentina',
    time: '23:45',
    date: '2024-01-13',
    location: {
      type: "Point",
      coordinates: [-57.5326, -37.9955]
    },
    status: 'verified',
    tags: ['vandalismo', 'parque'],
    type: 'vandalismo'
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const neighborhoodId = searchParams.get('neighborhoodId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const tags = searchParams.get('tags');
    const userLat = searchParams.get('userLat');
    const userLng = searchParams.get('userLng');

    console.log('🔍 Search request received:', {
      query,
      dateFrom,
      dateTo,
      neighborhoodId,
      status,
      type,
      tags,
      userLat,
      userLng
    });

    if (!query || query.trim().length < 2) {
      console.log('❌ Query too short, returning empty results');
      return NextResponse.json({ incidents: [] });
    }

    let incidents: any[] = [];

    try {
      // Intentar conectar a MongoDB
      const client = await clientPromise;
      const db = client.db();
      const incidentsCollection = db.collection('incident_draft');

      // Verificar si hay incidentes en la base de datos
      const totalIncidents = await incidentsCollection.countDocuments();
      console.log(`📊 Total incidents in database: ${totalIncidents}`);

      if (totalIncidents > 0) {
        // Construir la consulta base
        const searchQuery: any = {
          $or: [
            // Buscar en la descripción
            { description: { $regex: query, $options: 'i' } },
            // Buscar en la dirección
            { address: { $regex: query, $options: 'i' } },
            // Buscar en el tipo de incidente
            { type: { $regex: query, $options: 'i' } },
            // Buscar en los tags
            { tags: { $regex: query, $options: 'i' } }
          ]
        };

        console.log('🔍 Search query:', JSON.stringify(searchQuery, null, 2));

        // Aplicar filtros adicionales
        if (dateFrom || dateTo) {
          searchQuery.date = {};
          if (dateFrom) searchQuery.date.$gte = new Date(dateFrom);
          if (dateTo) searchQuery.date.$lte = new Date(dateTo);
        }

        if (status) {
          searchQuery.status = status;
        }

        if (type) {
          searchQuery.type = { $regex: type, $options: 'i' };
        }

        if (tags) {
          const tagArray = tags.split(',').map(tag => tag.trim());
          searchQuery.tags = { $in: tagArray };
        }

        // Filtro por barrio si se proporciona
        if (neighborhoodId) {
          try {
            const neighborhoodsCollection = db.collection('neighborhoods');
            const neighborhood = await neighborhoodsCollection.findOne({
              'properties.id': parseInt(neighborhoodId, 10)
            });

            if (neighborhood && neighborhood.geometry) {
              searchQuery.location = {
                $geoWithin: {
                  $geometry: neighborhood.geometry
                }
              };
            }
          } catch (error) {
            console.error('Error applying neighborhood filter:', error);
          }
        }

        console.log('🔍 Final search query:', JSON.stringify(searchQuery, null, 2));

        // Búsqueda por proximidad si se proporcionan coordenadas del usuario
        const sortOptions: any = { date: -1 }; // Ordenar por fecha más reciente por defecto

        if (userLat && userLng) {
          try {
            const userLatNum = parseFloat(userLat);
            const userLngNum = parseFloat(userLng);

            if (!isNaN(userLatNum) && !isNaN(userLngNum)) {
              console.log('📍 Using proximity search with user coordinates:', userLatNum, userLngNum);

              // Agregar búsqueda por proximidad usando $geoNear
              const geoNearStage = {
                $geoNear: {
                  near: {
                    type: "Point",
                    coordinates: [userLngNum, userLatNum]
                  },
                  distanceField: "distance",
                  spherical: true,
                  maxDistance: 10000, // 10km máximo
                  query: searchQuery
                }
              };

              // Usar agregación para ordenar por proximidad
              const pipeline = [
                geoNearStage,
                { $limit: 10 }
              ];

              console.log('🔍 Using aggregation pipeline for proximity search');
              incidents = await incidentsCollection.aggregate(pipeline).toArray();
              console.log(`✅ Found ${incidents.length} incidents with proximity search`);
            }
          } catch (error) {
            console.error('Error applying proximity search:', error);
          }
        }

        // Si no hay resultados de proximidad, usar búsqueda normal
        if (incidents.length === 0) {
          console.log('🔍 Using regular search without proximity');
          incidents = await incidentsCollection
            .find(searchQuery)
            .limit(10)
            .sort(sortOptions)
            .toArray();

          console.log(`✅ Found ${incidents.length} incidents with regular search`);
        }
      } else {
        console.log('⚠️ No incidents in database, using sample data');
        incidents = sampleIncidents.filter(incident =>
          incident.description.toLowerCase().includes(query.toLowerCase()) ||
          incident.address.toLowerCase().includes(query.toLowerCase()) ||
          incident.type.toLowerCase().includes(query.toLowerCase()) ||
          incident.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );
      }
    } catch (error) {
      console.log('⚠️ MongoDB connection failed, using sample data:', error instanceof Error ? error.message : String(error));
      incidents = sampleIncidents.filter(incident =>
        incident.description.toLowerCase().includes(query.toLowerCase()) ||
        incident.address.toLowerCase().includes(query.toLowerCase()) ||
        incident.type.toLowerCase().includes(query.toLowerCase()) ||
        incident.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
    }

    // Formatear los resultados para el MapSearchBar
    const formattedResults = incidents.map(incident => ({
      id: incident._id.toString(),
      type: 'incident' as const,
      title: incident.type || incident.description?.substring(0, 50) || 'Incidente',
      subtitle: incident.description || incident.address || 'Sin descripción',
      coordinates: incident.location?.coordinates || undefined,
      incident: incident
    }));

    console.log('📤 Returning formatted results:', formattedResults.length);

    return NextResponse.json({ incidents: formattedResults });
  } catch (error) {
    console.error('❌ Error searching incidents:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
