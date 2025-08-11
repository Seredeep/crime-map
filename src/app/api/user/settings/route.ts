import clientPromise from '@/lib/config/db/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }

  try {
    const body = await req.json();

    const updateFields: Record<string, boolean> = {};
    if (body.notificationsEnabled !== undefined) {
      if (typeof body.notificationsEnabled !== 'boolean') {
        return NextResponse.json({ message: 'Datos de configuración inválidos' }, { status: 400 });
      }
      updateFields.notificationsEnabled = body.notificationsEnabled;
    }
    if (body.privacyPublic !== undefined) {
      if (typeof body.privacyPublic !== 'boolean') {
        return NextResponse.json({ message: 'Datos de configuración inválidos' }, { status: 400 });
      }
      updateFields.privacyPublic = body.privacyPublic;
    }
    if (body.autoLocationEnabled !== undefined) {
      if (typeof body.autoLocationEnabled !== 'boolean') {
        return NextResponse.json({ message: 'Datos de configuración inválidos' }, { status: 400 });
      }
      updateFields.autoLocationEnabled = body.autoLocationEnabled;
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ message: 'Sin cambios' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Configuración actualizada con éxito' }, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar la configuración del usuario:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor al actualizar la configuración' },
      { status: 500 }
    );
  }
}
