/**
 * Geocoding utilities for interacting with the Google Geocoding API
 */

/**
 * Type definition for a geocoding result
 */
export interface GeocodingResult {
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
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
    // Additional properties for Google Places structured formatting
    main_text?: string;
    secondary_text?: string;
    structured_formatting?: {
      main_text: string;
      main_text_matched_substrings: {
        offset: number;
        length: number;
      }[];
      secondary_text: string;
    };
  };
}

/**
 * Type definition for geocoding response
 */
export interface GeocodingResponse {
  geocoding: {
    version: string;
    attribution: string;
    query: Record<string, string | number | boolean>;
    engine: {
      name: string;
      author: string;
      version: string;
    };
    timestamp: number;
  };
  type: string;
  features: GeocodingResult[];
  bbox: [number, number, number, number];
}

/**
 * Geocodes an address string to coordinates
 * @param query The address or location to geocode
 * @returns A Promise containing geocoding results
 */
export async function geocodeAddress(query: string): Promise<GeocodingResponse> {
  const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Geocoding failed: ${errorData.error || response.statusText}`);
  }

  return response.json();
}

/**
 * Reverse geocodes coordinates to an address
 * @param lat Latitude
 * @param lon Longitude
 * @returns A Promise containing address information
 */
export async function reverseGeocode(lat: number, lon: number): Promise<GeocodingResponse> {
  const response = await fetch('/api/geocode', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ lat, lon }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Reverse geocoding failed: ${errorData.error || response.statusText}`);
  }

  return response.json();
}

/**
 * Extracts a formatted address from a geocoding result
 * @param result A geocoding result
 * @returns A formatted address string
 */
export function formatAddress(result: GeocodingResult): string {
  if (result.properties.label) {
    return result.properties.label;
  }

  const parts = [];

  if (result.properties.housenumber) {
    parts.push(result.properties.housenumber);
  }

  if (result.properties.street) {
    parts.push(result.properties.street);
  }

  if (result.properties.locality) {
    parts.push(result.properties.locality);
  }

  if (result.properties.region) {
    parts.push(result.properties.region);
  }

  if (result.properties.country) {
    parts.push(result.properties.country);
  }

  return parts.join(', ');
}
