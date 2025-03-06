import { NextResponse } from 'next/server';
import { createGeoSpatialIndex } from '@/lib/createGeoIndex';

export async function GET() {
  try {
    const result = await createGeoSpatialIndex();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Database indexes created successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to create indexes',
        error: result.error ? (result.error as Error).message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error setting up database:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to set up database indexes',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 