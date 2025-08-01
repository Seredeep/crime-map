// app/api/geocode/route.ts

import { NextRequest, NextResponse } from 'next/server';

// Mar del Plata coordinates for location biasing
const MAR_DEL_PLATA_LOCATION = {
  lat: -38.0055,
  lng: -57.5426
};

// Street type patterns for normalization
const STREET_TYPE_PATTERNS = {
  'avenida': ['av ', 'ave ', 'avda ', 'avenida ', 'avenue '],
  'calle': ['calle ', 'c/ ', 'c. '],
  'diagonal': ['diag ', 'diagonal ', 'diagonale '],
  'ruta': ['ruta ', 'rt ', 'route '],
  'pasaje': ['pje ', 'pasaje ', 'passage '],
  'boulevard': ['bv ', 'blvd ', 'boulevard '],
  'plaza': ['pl ', 'plaza '],
  'costanera': ['costanera '],
  'camino': ['camino '],
  'corredor': ['corredor '],
  'circunvalacion': ['circunvalación ', 'circunvalacion ']
};

// Common intersection keywords and patterns
const INTERSECTION_KEYWORDS = [
  'y', '&', 'con', 'esquina', 'esq', 'entre', 'interseccion', 'intersección',
  'cruz', 'cruce', 'x', 'vs'
];

/**
 * Normalizes street names by adding common prefixes and handling local patterns
 */
function normalizeStreetName(streetName: string): string {
  if (!streetName) return streetName;

  const normalized = streetName.toLowerCase().trim();

  // If it already has a street type prefix, return as is
  for (const patterns of Object.values(STREET_TYPE_PATTERNS)) {
    if (patterns.some(pattern => normalized.startsWith(pattern))) {
      return streetName;
    }
  }

  // Common abbreviations and full names mapping
  const nameMapping: { [key: string]: string } = {
    'jb justo': 'juan b justo',
    'juan b justo': 'avenida juan b. justo',
    'juan domingo peron': 'avenida juan domingo perón',
    'peron': 'avenida juan domingo perón',
    'colon': 'avenida colón',
    'mitre': 'avenida mitre',
    'luro': 'avenida luro',
    'constitucion': 'avenida constitución',
    'independencia': 'avenida independencia',
    'libertad': 'avenida libertad',
    'tetamanti': 'avenida tetamanti',
    'martinez de hoz': 'avenida martínez de hoz',
    'felix u camet': 'avenida félix u. camet',
    'camet': 'avenida félix u. camet',
    '11 de septiembre': 'avenida 11 de septiembre',
    'edison': 'avenida edison',
    'arturo alfonsin': 'avenida arturo alfonsín',
    'alfonsin': 'avenida arturo alfonsín'
  };

  // Check if the normalized name matches any mapping
  for (const [key, value] of Object.entries(nameMapping)) {
    if (normalized === key || normalized === key.replace(/\./g, '')) {
      return value;
    }
  }

  // If no specific mapping, try to add common prefixes for Mar del Plata streets
  if (!normalized.includes('avenida') && !normalized.includes('calle') && !normalized.includes('diagonal')) {
    // Major streets are usually avenidas
    const majorStreets = [
      'colon', 'mitre', 'luro', 'constitucion', 'independencia', 'libertad',
      'juan b justo', 'peron', 'tetamanti', 'martinez de hoz', 'edison',
      'camet', '11 de septiembre', 'alfonsin'
    ];

    if (majorStreets.some(major => normalized.includes(major.replace(/\./g, '')))) {
      return `avenida ${streetName}`;
    } else {
      return `calle ${streetName}`;
    }
  }

  return streetName;
}

/**
 * Detects if a query is searching for an intersection and formats it appropriately
 */
function detectAndFormatIntersection(query: string): { isIntersection: boolean; formattedQuery: string; streets?: string[] } {
  const normalizedQuery = query.toLowerCase().trim();

  // Check for intersection keywords
  const hasIntersectionKeyword = INTERSECTION_KEYWORDS.some(keyword =>
    normalizedQuery.includes(` ${keyword} `) ||
    normalizedQuery.includes(`${keyword} `) ||
    normalizedQuery.includes(` ${keyword}`)
  );

  if (!hasIntersectionKeyword) {
    return { isIntersection: false, formattedQuery: query };
  }

  // Find the keyword that was used
  let usedKeyword = '';
  let splitPattern = '';

  for (const keyword of INTERSECTION_KEYWORDS) {
    const patterns = [
      ` ${keyword} `,
      `${keyword} `,
      ` ${keyword}`
    ];

    for (const pattern of patterns) {
      if (normalizedQuery.includes(pattern)) {
        usedKeyword = keyword;
        splitPattern = pattern;
        break;
      }
    }
    if (usedKeyword) break;
  }

  if (!usedKeyword) {
    return { isIntersection: false, formattedQuery: query };
  }

  // Split the query by the keyword
  const parts = normalizedQuery.split(splitPattern);
  if (parts.length !== 2) {
    return { isIntersection: false, formattedQuery: query };
  }

  const street1 = parts[0].trim();
  const street2 = parts[1].trim();

  if (!street1 || !street2) {
    return { isIntersection: false, formattedQuery: query };
  }

  // Normalize both street names
  const normalizedStreet1 = normalizeStreetName(street1);
  const normalizedStreet2 = normalizeStreetName(street2);

  // Format the intersection query
  const formattedQuery = `${normalizedStreet1} y ${normalizedStreet2}, Mar del Plata, Argentina`;

  return {
    isIntersection: true,
    formattedQuery,
    streets: [normalizedStreet1, normalizedStreet2]
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
 * Route handler for geocoding
 * @route GET /api/geocode
 * @param {string} q - The address or location query
 * @param {string} lat - User latitude for proximity search
 * @param {string} lng - User longitude for proximity search
 * @returns {Object} Geocoding results with coordinates
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const lat = searchParams.get('lat'); // Coordenadas del usuario
    const lng = searchParams.get('lng'); // Coordenadas del usuario

    console.log('🌍 Geocoding request received:', { query, lat, lng });

    if (!query) {
      console.log('❌ No query provided');
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    // Detectar si this is an intersection search and format accordingly
    const intersectionResult = detectAndFormatIntersection(query);
    let searchQuery = intersectionResult.formattedQuery;

    console.log(`Original query: "${query}"`);
    if (intersectionResult.isIntersection) {
      console.log(`Detected intersection: "${searchQuery}"`);
      console.log(`Streets: ${intersectionResult.streets?.join(' y ')}`);
    } else {
      // For non-intersection queries, try to normalize the street name
      const normalizedQuery = normalizeStreetName(query);
      searchQuery = `${normalizedQuery}, Mar del Plata, Argentina`;
      console.log(`Normalized query: "${searchQuery}"`);
    }

    // Determinar el centro de búsqueda basado en las coordenadas del usuario o Mar del Plata por defecto
    let searchCenter = MAR_DEL_PLATA_LOCATION;
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      if (!isNaN(userLat) && !isNaN(userLng)) {
        searchCenter = { lat: userLat, lng: userLng };
        console.log(`Using user location for search bias: ${userLat}, ${userLng}`);
      }
    }

    // Usar OpenStreetMap Nominatim como fuente principal
    console.log(`Nominatim request for query: "${searchQuery}"`);

    try {
      const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
      nominatimUrl.searchParams.append('q', searchQuery);
      nominatimUrl.searchParams.append('format', 'json');
      nominatimUrl.searchParams.append('limit', '10');
      nominatimUrl.searchParams.append('addressdetails', '1');
      nominatimUrl.searchParams.append('countrycodes', 'ar');

      console.log('🌍 Fetching from Nominatim:', nominatimUrl.toString());

      const nominatimResponse = await fetch(nominatimUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CrimeMapApp/1.0'
        }
      });

      if (nominatimResponse.ok) {
        const nominatimData = await nominatimResponse.json();
        console.log(`Nominatim found ${nominatimData.length} results`);

        if (nominatimData.length > 0) {
          // Filter results to only include Mar del Plata area
          const marDelPlataResults = nominatimData.filter((item: any) => {
            const displayName = item.display_name.toLowerCase();
            const address = item.address || {};

            // Check if it's in Mar del Plata or nearby areas
            return displayName.includes('mar del plata') ||
                   displayName.includes('general pueyrredón') ||
                   address.city?.toLowerCase().includes('mar del plata') ||
                   address.town?.toLowerCase().includes('mar del plata') ||
                   address.municipality?.toLowerCase().includes('mar del plata') ||
                   address.state?.toLowerCase().includes('buenos aires');
          });

          console.log(`Filtered to ${marDelPlataResults.length} Mar del Plata results`);

          // Convert Nominatim results to our GeoJSON format
          const features = marDelPlataResults.map((item: any) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [parseFloat(item.lon), parseFloat(item.lat)]
            },
            properties: {
              id: item.place_id.toString(),
              gid: item.place_id.toString(),
              layer: 'address',
              source: 'nominatim',
              name: item.name || item.display_name.split(',')[0],
              housenumber: item.address?.house_number,
              street: item.address?.road,
              postalcode: item.address?.postcode,
              locality: item.address?.city || item.address?.town || item.address?.village,
              region: item.address?.state,
              country: item.address?.country,
              confidence: 0.8,
              label: item.display_name,
              // Additional properties for better UX
              main_text: item.name || item.display_name.split(',')[0],
              secondary_text: item.display_name.split(',').slice(1).join(',').trim()
            }
          }));

          const response = {
            type: "FeatureCollection",
            features: features,
            geocoding: {
              version: "1.0",
              attribution: "Data © OpenStreetMap contributors",
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

          console.log(`✅ Returning ${features.length} geocoding results`);
          return NextResponse.json(response);
        } else {
          // If no Mar del Plata results, try a broader search in Argentina
          console.log('No Mar del Plata results, trying broader Argentina search...');
          const broaderUrl = new URL('https://nominatim.openstreetmap.org/search');
          broaderUrl.searchParams.append('q', `${query}, Argentina`);
          broaderUrl.searchParams.append('format', 'json');
          broaderUrl.searchParams.append('limit', '5');
          broaderUrl.searchParams.append('addressdetails', '1');
          broaderUrl.searchParams.append('countrycodes', 'ar');

          const broaderResponse = await fetch(broaderUrl.toString(), {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'CrimeMapApp/1.0'
            }
          });

          if (broaderResponse.ok) {
            const broaderData = await broaderResponse.json();
            if (broaderData.length > 0) {
              const broaderFeatures = broaderData.map((item: any) => ({
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [parseFloat(item.lon), parseFloat(item.lat)]
                },
                properties: {
                  id: item.place_id.toString(),
                  gid: item.place_id.toString(),
                  layer: 'address',
                  source: 'nominatim',
                  name: item.name || item.display_name.split(',')[0],
                  housenumber: item.address?.house_number,
                  street: item.address?.road,
                  postalcode: item.address?.postcode,
                  locality: item.address?.city || item.address?.town || item.address?.village,
                  region: item.address?.state,
                  country: item.address?.country,
                  confidence: 0.6,
                  label: item.display_name,
                  // Additional properties for better UX
                  main_text: item.name || item.display_name.split(',')[0],
                  secondary_text: item.display_name.split(',').slice(1).join(',').trim()
                }
              }));

              const broaderResponse = {
                type: "FeatureCollection",
                features: broaderFeatures,
                geocoding: {
                  version: "1.0",
                  attribution: "Data © OpenStreetMap contributors",
                  query: {},
                  engine: {
                    name: "Nominatim",
                    author: "OpenStreetMap",
                    version: "1.0"
                  },
                  timestamp: Date.now()
                },
                bbox: calculateBBox(broaderFeatures)
              };

              console.log(`✅ Returning ${broaderFeatures.length} broader geocoding results`);
              return NextResponse.json(broaderResponse);
            }
          }
        }
      } else {
        console.error('❌ Nominatim response not ok:', nominatimResponse.status, nominatimResponse.statusText);
      }
    } catch (nominatimError) {
      console.error('❌ Nominatim error:', nominatimError);
    }

    // Si no hay resultados, devolver un array vacío
    console.log('No results found, returning empty response');
    return NextResponse.json({
      type: "FeatureCollection",
      features: [],
      geocoding: {
        version: "1.0",
        attribution: "Data © OpenStreetMap contributors",
        query: {},
        engine: {
          name: "Nominatim",
          author: "OpenStreetMap",
          version: "1.0"
        },
        timestamp: Date.now()
      }
    });

  } catch (error) {
    console.error('❌ Geocoding error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Route handler for place details
 * @route POST /api/geocode
 * @param {string} lat - Latitude
 * @param {string} lon - Longitude
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lon } = body;

    if (lat === undefined || lon === undefined) {
      return NextResponse.json(
        { error: 'Coordinates (lat, lon) are required' },
        { status: 400 }
      );
    }

    // Reverse geocoding using Nominatim
    const reverseUrl = new URL('https://nominatim.openstreetmap.org/reverse');
    reverseUrl.searchParams.append('lat', lat.toString());
    reverseUrl.searchParams.append('lon', lon.toString());
    reverseUrl.searchParams.append('format', 'json');
    reverseUrl.searchParams.append('addressdetails', '1');

    console.log(`Reverse geocoding request for coordinates: ${lat}, ${lon}`);

    const reverseResponse = await fetch(reverseUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CrimeMapApp/1.0'
      }
    });

    if (!reverseResponse.ok) {
      console.error('Nominatim reverse geocoding error:', reverseResponse.statusText);
      return NextResponse.json(
        { error: 'Failed to reverse geocode coordinates' },
        { status: reverseResponse.status }
      );
    }

    const reverseData = await reverseResponse.json();
    console.log('Reverse geocoding successful');

    // Convert Nominatim response to our GeoJSON format
    const feature = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [parseFloat(reverseData.lon), parseFloat(reverseData.lat)]
      },
      properties: {
        id: reverseData.place_id.toString(),
        gid: reverseData.place_id.toString(),
        layer: 'address',
        source: 'nominatim',
        name: reverseData.name || reverseData.display_name.split(',')[0],
        housenumber: reverseData.address?.house_number,
        street: reverseData.address?.road,
        postalcode: reverseData.address?.postcode,
        locality: reverseData.address?.city || reverseData.address?.town || reverseData.address?.village,
        region: reverseData.address?.state,
        country: reverseData.address?.country,
        confidence: 0.9,
        label: reverseData.display_name
      }
    };

    const response = {
      type: "FeatureCollection",
      features: [feature],
      geocoding: {
        version: "1.0",
        attribution: "Data © OpenStreetMap contributors",
        query: {},
        engine: {
          name: "Nominatim",
          author: "OpenStreetMap",
          version: "1.0"
        },
        timestamp: Date.now()
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
