import { NextRequest, NextResponse } from 'next/server';

// Configuration for Nominatim geocoding API
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
// We should set a unique user agent as per Nominatim usage policy
const USER_AGENT = 'CrimeMapApp/1.0';

/**
 * Interface for Nominatim search result
 */
interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  importance: number;
  name?: string;
  address?: {
    house_number?: string;
    road?: string;
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    [key: string]: string | undefined;
  };
}

/**
 * Interface for GeoJSON feature
 */
interface GeoJSONFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  properties: {
    id: string;
    gid: string;
    layer: string;
    source: string;
    name: string;
    housenumber?: string;
    street?: string;
    postalcode?: string;
    locality?: string;
    region?: string;
    country?: string;
    confidence: number;
    label: string;
  };
}

/**
 * Fetch with custom options for better error handling
 */
async function fetchWithFallback(url: URL, options: RequestInit = {}) {
  try {
    // First try with the regular fetch
    const response = await fetch(url.toString(), options);
    return response;
  } catch (error) {
    console.error('Initial fetch failed:', error);
    
    // If using Node.js environment, we can try to force IPv4
    if (typeof process !== 'undefined') {
      try {
        // Convert URL object to string for the retry
        const urlString = url.toString();
        
        // Add a timestamp to avoid caching issues
        const urlWithParam = urlString + (urlString.includes('?') ? '&' : '?') + 
          '_nocache=' + Date.now();
        
        console.log('Retrying with modified URL:', urlWithParam);
        
        // Retry the fetch
        const retryResponse = await fetch(urlWithParam, {
          ...options,
          // Setting this header can help some CDNs prefer IPv4
          headers: {
            ...(options.headers || {}),
            'Accept': 'application/json',
            'Connection': 'keep-alive'
          }
        });
        
        return retryResponse;
      } catch (retryError) {
        console.error('Retry fetch also failed:', retryError);
        throw retryError;
      }
    } else {
      throw error;
    }
  }
}

/**
 * Converts Nominatim results to GeoJSON format for compatibility
 * with our existing frontend code
 */
function nominatimToGeoJSON(data: NominatimResult[]) {
  // If no results, return empty GeoJSON structure
  if (!data || data.length === 0) {
    return {
      type: "FeatureCollection",
      features: []
    };
  }

  const features = data.map(item => {
    // Explicitly cast coordinates to the required tuple type
    const coordinates: [number, number] = [parseFloat(item.lon), parseFloat(item.lat)];
    
    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates
      },
      properties: {
        id: item.place_id.toString(),
        gid: item.place_id.toString(),
        layer: item.type,
        source: "nominatim",
        name: item.name || item.display_name.split(',')[0],
        housenumber: item.address?.house_number,
        street: item.address?.road,
        postalcode: item.address?.postcode,
        locality: item.address?.city || item.address?.town || item.address?.village,
        region: item.address?.state,
        country: item.address?.country,
        confidence: 1, // Nominatim doesn't provide confidence scores
        label: item.display_name
      }
    };
  });

  return {
    type: "FeatureCollection",
    features: features,
    geocoding: {
      version: "1.0",
      attribution: "Data © OpenStreetMap contributors, ODbL 1.0.",
      query: {},
      engine: {
        name: "Nominatim",
        author: "OpenStreetMap",
        version: "1.0"
      },
      timestamp: Date.now()
    },
    bbox: calculateBBox(features)
  };
}

/**
 * Calculate bounding box from features
 */
function calculateBBox(features: GeoJSONFeature[]) {
  if (features.length === 0) return [0, 0, 0, 0];
  
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  
  features.forEach(feature => {
    const [lon, lat] = feature.geometry.coordinates;
    minLon = Math.min(minLon, lon);
    minLat = Math.min(minLat, lat);
    maxLon = Math.max(maxLon, lon);
    maxLat = Math.max(maxLat, lat);
  });
  
  return [minLon, minLat, maxLon, maxLat];
}

/**
 * Geocodes an address using Nominatim
 * @route GET /api/geocode
 * @param {string} q - The address or location query
 * @returns {Object} Geocoding results with coordinates
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }
    
    // Construct the Nominatim API URL for forward geocoding
    const apiUrl = new URL(`${NOMINATIM_BASE_URL}/search`);
    apiUrl.searchParams.append('q', query);
    apiUrl.searchParams.append('format', 'json');
    apiUrl.searchParams.append('addressdetails', '1');
    apiUrl.searchParams.append('limit', '10');
    
    console.log(`Geocoding request for query: "${query}"`);
    
    const response = await fetchWithFallback(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': USER_AGENT
      },
    });
    
    if (!response.ok) {
      console.error('Nominatim API error:', response.statusText);
      return NextResponse.json(
        { error: 'Failed to geocode address' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Geocoding successful, found ${data.length || 0} results: ${JSON.stringify(data)}`);
    
    // Convert Nominatim response format to our GeoJSON structure
    const geoJsonResponse = nominatimToGeoJSON(data);
    
    return NextResponse.json(geoJsonResponse);
    
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Reverse geocodes coordinates to an address using Nominatim
 * @route POST /api/geocode
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Object} Address information for the coordinates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lon } = body;
    
    if (!lat || !lon) {
      return NextResponse.json(
        { error: 'Both "lat" and "lon" are required in the request body' },
        { status: 400 }
      );
    }
    
    // Construct the Nominatim API URL for reverse geocoding
    const apiUrl = new URL(`${NOMINATIM_BASE_URL}/reverse`);
    apiUrl.searchParams.append('lat', lat.toString());
    apiUrl.searchParams.append('lon', lon.toString());
    apiUrl.searchParams.append('format', 'json');
    apiUrl.searchParams.append('addressdetails', '1');
    
    console.log(`Reverse geocoding request for coordinates: ${lat}, ${lon}`);
    
    const response = await fetchWithFallback(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': USER_AGENT
      },
    });
    
    if (!response.ok) {
      console.error('Nominatim API error:', response.statusText);
      return NextResponse.json(
        { error: 'Failed to reverse geocode coordinates' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('Reverse geocoding successful');
    
    // For reverse geocoding, we need to convert the single result to our GeoJSON format
    const geoJsonResponse = nominatimToGeoJSON([data]);
    
    return NextResponse.json(geoJsonResponse);
    
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 