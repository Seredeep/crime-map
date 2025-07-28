import clientPromise from '@/lib/config/db/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ incidents: [] });
    }

    const client = await clientPromise;
    const db = client.db();
    const incidentsCollection = db.collection('incident_draft');

    // Buscar incidentes que coincidan con el texto de búsqueda
    const searchQuery = {
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

    const incidents = await incidentsCollection
      .find(searchQuery)
      .limit(10) // Limitar a 10 resultados
      .sort({ date: -1 }) // Ordenar por fecha más reciente
      .toArray();

    // Formatear los resultados para el MapSearchBar
    const formattedResults = incidents.map(incident => ({
      id: incident._id.toString(),
      type: 'incident' as const,
      title: incident.type || 'Incidente',
      subtitle: incident.description || incident.address || 'Sin descripción',
      coordinates: incident.location?.coordinates || undefined,
      incident: incident // Incluir el incidente completo para uso posterior
    }));

    return NextResponse.json({ incidents: formattedResults });
  } catch (error) {
    console.error('Error searching incidents:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
