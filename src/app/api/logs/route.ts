import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import clientPromise from '@/lib/mongodb';
import { ROLES, hasRequiredRole, Role } from '@/lib/config/roles';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y rol
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      );
    }

    if (!hasRequiredRole(session.user.role as Role, [ROLES.ADMIN])) {
      return NextResponse.json(
        { success: false, message: 'No autorizado. Solo los administradores pueden ver los logs.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const user = searchParams.get('user');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const client = await clientPromise;
    const db = client.db();

    // Construir el query de MongoDB
    const query: any = {};

    if (action && action !== 'all') {
      query.action = action;
    }

    if (user) {
      query.userEmail = { $regex: user, $options: 'i' };
    }

    if (dateFrom || dateTo) {
      query.timestamp = {};
      if (dateFrom) {
        const startDate = new Date(dateFrom);
        startDate.setHours(0, 0, 0, 0);
        query.timestamp.$gte = startDate;
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.timestamp.$lte = endDate;
      }
    }

    // Obtener los logs ordenados por fecha descendente
    const logs = await db.collection('logs')
      .find(query)
      .sort({ timestamp: -1 })
      .limit(1000) // Limitar a los últimos 1000 logs por rendimiento
      .toArray();

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { success: false, message: 'Error al obtener los logs' },
      { status: 500 }
    );
  }
} 