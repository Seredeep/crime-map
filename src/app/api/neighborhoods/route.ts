import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Get all neighborhoods
    const neighborhoods = await db.collection('neighborhoods').find({}).toArray();
    
    return NextResponse.json(neighborhoods);
  } catch (error) {
    console.error('Error fetching neighborhoods:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch neighborhoods' },
      { status: 500 }
    );
  }
} 