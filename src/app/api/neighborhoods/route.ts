import clientPromise from '@/lib/config/db/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');

    const client = await clientPromise;
    const db = client.db();

    let query = {};

    // Si se especifica una ciudad, filtrar por ella
    if (city) {
      query = { 'properties.city': city };
    }

    // Get neighborhoods based on query
    const neighborhoods = await db.collection('neighborhoods').find(query).toArray();

    return NextResponse.json(neighborhoods);
  } catch (error) {
    console.error('Error fetching neighborhoods:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch neighborhoods' },
      { status: 500 }
    );
  }
}
