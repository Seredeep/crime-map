// app/api/geocode/route.ts

import { NextRequest, NextResponse } from 'next/server';

// Google Geocoding API configuration
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GOOGLE_GEOCODING_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const GOOGLE_PLACES_AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const GOOGLE_PLACES_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

/**
 * Interface for Google Geocoding API result
 */
interface GoogleGeocodingResult {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    location_type: string;
    viewport: {
      northeast: {
        lat: number;
        lng: number;
      };
      southwest: {
        lat: number;
        lng: number;
      };
    };
  };
  address_components: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
  types: string[];
}

/**
 * Interface for Google Places Autocomplete API result
 */
interface GooglePlacesAutocompleteResult {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    main_text_matched_substrings: {
      offset: number;
      length: number;
    }[];
    secondary_text: string;
  };
  terms: {
    offset: number;
    value: string;
  }[];
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
 * Converts Google Geocoding results to GeoJSON format
 */
function googleToGeoJSON(data: { results: GoogleGeocodingResult[] }) {
  if (!data || !data.results || data.results.length === 0) {
    return {
      type: "FeatureCollection",
      features: []
    };
  }

  const features = data.results.map(item => {
    // Extract address components
    const getAddressComponent = (type: string, nameType: 'long_name' | 'short_name' = 'long_name') => {
      const component = item.address_components.find(comp => comp.types.includes(type));
      return component ? component[nameType] : undefined;
    };

    // Determine the layer/type based on the most specific Google place type
    let layer = 'address';
    if (item.types.includes('street_address')) {
      layer = 'address';
    } else if (item.types.includes('route')) {
      layer = 'street';
    } else if (item.types.includes('locality')) {
      layer = 'locality';
    } else if (item.types.includes('administrative_area_level_1')) {
      layer = 'region';
    } else if (item.types.includes('country')) {
      layer = 'country';
    }

    const coordinates: [number, number] = [item.geometry.location.lng, item.geometry.location.lat];
    
    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates
      },
      properties: {
        id: item.place_id,
        gid: item.place_id,
        layer: layer,
        source: "google",
        name: getAddressComponent('route') || getAddressComponent('locality') || item.formatted_address.split(',')[0],
        housenumber: getAddressComponent('street_number'),
        street: getAddressComponent('route'),
        postalcode: getAddressComponent('postal_code'),
        locality: getAddressComponent('locality') || getAddressComponent('sublocality'),
        region: getAddressComponent('administrative_area_level_1'),
        country: getAddressComponent('country'),
        confidence: 1, // Google doesn't provide confidence scores
        label: item.formatted_address
      }
    };
  });

  return {
    type: "FeatureCollection",
    features: features,
    geocoding: {
      version: "1.0",
      attribution: "Data © Google",
      query: {},
      engine: {
        name: "Google Geocoding API",
        author: "Google",
        version: "1.0"
      },
      timestamp: Date.now()
    },
    bbox: calculateBBox(features)
  };
}

/**
 * Converts Google Places Autocomplete results to GeoJSON format
 */
function googlePlacesToGeoJSON(predictions: GooglePlacesAutocompleteResult[]) {
  if (!predictions || predictions.length === 0) {
    return {
      type: "FeatureCollection",
      features: []
    };
  }

  const features = predictions.map(item => {
    // Since autocomplete doesn't provide coordinates, we'll need to fetch details
    // separately or use a placeholder until selection
    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [0, 0] // Placeholder coordinates
      },
      properties: {
        id: item.place_id,
        gid: item.place_id,
        layer: "search_result",
        source: "google",
        name: item.structured_formatting.main_text,
        confidence: 1,
        label: item.description
      }
    };
  });

  return {
    type: "FeatureCollection",
    features: features,
    geocoding: {
      version: "1.0",
      attribution: "Data © Google",
      query: {},
      engine: {
        name: "Google Places API",
        author: "Google",
        version: "1.0"
      },
      timestamp: Date.now()
    }
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
    if (lon !== 0 && lat !== 0) { // Skip placeholder coordinates
      minLon = Math.min(minLon, lon);
      minLat = Math.min(minLat, lat);
      maxLon = Math.max(maxLon, lon);
      maxLat = Math.max(maxLat, lat);
    }
  });
  
  // If all coordinates were placeholders, return a default
  if (minLon === Infinity) {
    return [0, 0, 0, 0];
  }
  
  return [minLon, minLat, maxLon, maxLat];
}

/**
 * Geocodes an address using Google Geocoding API
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
    
    if (!GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { error: 'Google Maps API key is not configured' },
        { status: 500 }
      );
    }

    // First, try to get autocomplete suggestions
    const autocompleteUrl = new URL(GOOGLE_PLACES_AUTOCOMPLETE_URL);
    autocompleteUrl.searchParams.append('input', query);
    autocompleteUrl.searchParams.append('key', GOOGLE_MAPS_API_KEY);
    autocompleteUrl.searchParams.append('components', 'locality:Mar del Plata|country:AR');
    
    console.log(`Google Places Autocomplete request for query: "${query}"`);
    
    const autocompleteResponse = await fetch(autocompleteUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!autocompleteResponse.ok) {
      console.error('Google Places API error:', autocompleteResponse.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch autocomplete suggestions' },
        { status: autocompleteResponse.status }
      );
    }
    
    const autocompleteData = await autocompleteResponse.json();
    
    // If we have autocomplete results, return those
    if (autocompleteData.predictions && autocompleteData.predictions.length > 0) {
      const geoJsonResponse = googlePlacesToGeoJSON(autocompleteData.predictions);
      return NextResponse.json(geoJsonResponse);
    }
    
    // If no autocomplete results, fall back to geocoding
    const geocodeUrl = new URL(GOOGLE_GEOCODING_URL);
    geocodeUrl.searchParams.append('address', query);
    geocodeUrl.searchParams.append('key', GOOGLE_MAPS_API_KEY);
    geocodeUrl.searchParams.append('components', 'locality:Mar del Plata|country:AR');
    
    console.log(`Google Geocoding request for query: "${query}"`);
    
    const geocodeResponse = await fetch(geocodeUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!geocodeResponse.ok) {
      console.error('Google Geocoding API error:', geocodeResponse.statusText);
      return NextResponse.json(
        { error: 'Failed to geocode address' },
        { status: geocodeResponse.status }
      );
    }
    
    const geocodeData = await geocodeResponse.json();
    console.log(`Geocoding successful, found ${geocodeData.results?.length || 0} results`);
    
    // Convert Google response format to our GeoJSON structure
    const geoJsonResponse = googleToGeoJSON(geocodeData);
    
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
 * Route handler for place details
 * @route GET /api/geocode/details
 * @param {string} placeId - The place ID to get details for
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lon, placeId } = body;
    
    if (!GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { error: 'Google Maps API key is not configured' },
        { status: 500 }
      );
    }

    // If we have a placeId, get the details
    if (placeId) {
      const detailsUrl = new URL(GOOGLE_PLACES_DETAILS_URL);
      detailsUrl.searchParams.append('place_id', placeId);
      detailsUrl.searchParams.append('fields', 'geometry,formatted_address,name,address_component');
      detailsUrl.searchParams.append('key', GOOGLE_MAPS_API_KEY);
      
      console.log(`Google Places Details request for place ID: "${placeId}"`);
      
      const detailsResponse = await fetch(detailsUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!detailsResponse.ok) {
        console.error('Google Places API error:', detailsResponse.statusText);
        return NextResponse.json(
          { error: 'Failed to fetch place details' },
          { status: detailsResponse.status }
        );
      }
      
      const detailsData = await detailsResponse.json();
      
      if (detailsData.result) {
        // Convert place details to GeoJSON format
        const result = {
          results: [
            {
              place_id: placeId,
              formatted_address: detailsData.result.formatted_address,
              geometry: detailsData.result.geometry,
              address_components: detailsData.result.address_components,
              types: detailsData.result.types || ['place']
            }
          ]
        };
        
        const geoJsonResponse = googleToGeoJSON(result);
        return NextResponse.json(geoJsonResponse);
      }
    }
    
    // If we have coordinates, do reverse geocoding
    if (lat !== undefined && lon !== undefined) {
      const reverseUrl = new URL(GOOGLE_GEOCODING_URL);
      reverseUrl.searchParams.append('latlng', `${lat},${lon}`);
      reverseUrl.searchParams.append('key', GOOGLE_MAPS_API_KEY);
      
      console.log(`Reverse geocoding request for coordinates: ${lat}, ${lon}`);
      
      const reverseResponse = await fetch(reverseUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!reverseResponse.ok) {
        console.error('Google Geocoding API error:', reverseResponse.statusText);
        return NextResponse.json(
          { error: 'Failed to reverse geocode coordinates' },
          { status: reverseResponse.status }
        );
      }
      
      const reverseData = await reverseResponse.json();
      console.log('Reverse geocoding successful');
      
      // Convert Google response format to our GeoJSON structure
      const geoJsonResponse = googleToGeoJSON(reverseData);
      
      return NextResponse.json(geoJsonResponse);
    }
    
    return NextResponse.json(
      { error: 'Either place_id or coordinates (lat, lon) are required' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}