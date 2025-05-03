import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { evidenceUrls } = data;

    if (!evidenceUrls || !Array.isArray(evidenceUrls)) {
      return NextResponse.json(
        { success: false, message: 'URLs de evidencia inválidas' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Actualizar el incidente con las URLs de evidencia
    const result = await db.collection('incident_draft').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { evidenceUrls } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Incidente no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'URLs de evidencia actualizadas correctamente'
    });

  } catch (error) {
    console.error('Error updating incident evidence URLs:', error);
    return NextResponse.json(
      { success: false, message: 'Error al actualizar las URLs de evidencia' },
      { status: 500 }
    );
  }
} 