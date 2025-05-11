import { NextRequest, NextResponse } from 'next/server';

// Configuration for maps.co geocoding API
const MAPS_CO_BASE_URL = 'https://geocode.maps.co';
const API_KEY = process.env.MAPS_CO_API_KEY || '67c33f9f09640920210484hmg5fe0f3';

/**
 * Reverse geocodes coordinates to an address using maps.co
 * @route GET /api/geocode/reverse
 * @param {string} lat - Latitude
 * @param {string} lon - Longitude
 * @returns {Object} Address information for the coordinates
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    
    if (!lat || !lon) {
      return NextResponse.json(
        { error: 'Both "lat" and "lon" query parameters are required' },
        { status: 400 }
      );
    }
    
    // Construct the maps.co API URL for reverse geocoding
    const apiUrl = new URL(`${MAPS_CO_BASE_URL}/reverse`);
    apiUrl.searchParams.append('lat', lat);
    apiUrl.searchParams.append('lon', lon);
    apiUrl.searchParams.append('api_key', API_KEY);
    
    // Optional: Set format explicitly (default is JSON)
    apiUrl.searchParams.append('format', 'json');
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('Maps.co API error:', response.statusText);
      return NextResponse.json(
        { error: 'Failed to reverse geocode coordinates' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 