import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import clientPromise from '@/lib/mongodb';

export async function GET() {
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
    
    // Conectar a la base de datos
    const client = await clientPromise;
    const db = client.db();
    
    // Obtener usuarios, excluyendo la contraseña
    const users = await db.collection('users')
      .find({})
      .project({ password: 0 })
      .sort({ createdAt: -1 })
      .toArray();
    
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json(
      { success: false, message: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
} 