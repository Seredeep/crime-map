import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    // Verificar sesión y rol de administrador
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Acceso denegado' },
        { status: 403 }
      );
    }
    
    // Obtener datos de la solicitud
    const { userId, enabled } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'ID de usuario requerido' },
        { status: 400 }
      );
    }
    
    // Conectar a la base de datos
    const client = await clientPromise;
    const db = client.db();
    
    // Actualizar estado del usuario
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { enabled: enabled } }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Usuario ${enabled ? 'habilitado' : 'deshabilitado'} correctamente` 
    });
  } catch (error) {
    console.error('Error al actualizar estado del usuario:', error);
    return NextResponse.json(
      { success: false, message: 'Error al actualizar estado del usuario' },
      { status: 500 }
    );
  }
} 