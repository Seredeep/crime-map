import { NextRequest, NextResponse } from 'next/server';

// Configuration for OpenStreetMap Nominatim (free, no API key required)
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// Backup: maps.co geocoding API
const MAPS_CO_BASE_URL = 'https://geocode.maps.co';
const API_KEY = process.env.MAPS_CO_API_KEY || '67c33f9f09640920210484hmg5fe0f3';

/**
 * Formats address components into a readable address string
 */
function formatAddress(data: any, isNominatim: boolean = false): string {
  if (data.display_name) {
    // Para Nominatim, usar display_name directamente ya que es muy detallado
    return data.display_name;
  }

  const components = [];

  if (isNominatim && data.address) {
    // Formateo específico para respuestas de Nominatim
    const addr = data.address;

    // Número de casa y calle
    if (addr.house_number && addr.road) {
      components.push(`${addr.road} ${addr.house_number}`);
    } else if (addr.road) {
      components.push(addr.road);
    }

    // Barrio o área
    if (addr.neighbourhood || addr.suburb || addr.quarter || addr.city_district) {
      components.push(addr.neighbourhood || addr.suburb || addr.quarter || addr.city_district);
    }

    // Ciudad
    if (addr.city || addr.town || addr.village || addr.municipality) {
      components.push(addr.city || addr.town || addr.village || addr.municipality);
    }

    // Estado/Provincia
    if (addr.state || addr.province) {
      components.push(addr.state || addr.province);
    }

    // País
    if (addr.country) {
      components.push(addr.country);
    }
  } else {
    // Formateo para maps.co y otros servicios
    // Número de casa y calle
    if (data.house_number && data.road) {
      components.push(`${data.road} ${data.house_number}`);
    } else if (data.road) {
      components.push(data.road);
    }

    // Barrio o área
    if (data.neighbourhood || data.suburb || data.quarter) {
      components.push(data.neighbourhood || data.suburb || data.quarter);
    }

    // Ciudad
    if (data.city || data.town || data.village) {
      components.push(data.city || data.town || data.village);
    }

    // Estado/Provincia
    if (data.state) {
      components.push(data.state);
    }

    // País
    if (data.country) {
      components.push(data.country);
    }
  }

  return components.length > 0 ? components.join(', ') : 'Dirección no disponible';
}

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
        {
          error: 'Both "lat" and "lon" query parameters are required',
          success: false
        },
        { status: 400 }
      );
    }

    // Validar que las coordenadas sean números válidos
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        {
          error: 'Invalid coordinates provided',
          success: false
        },
        { status: 400 }
      );
    }

    // Validar rangos de coordenadas
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        {
          error: 'Coordinates out of valid range',
          success: false
        },
        { status: 400 }
      );
    }

        // Try OpenStreetMap Nominatim first (free, no API key required)
    let response;
    let usingNominatim = true;

    try {
      const nominatimUrl = new URL(`${NOMINATIM_BASE_URL}/reverse`);
      nominatimUrl.searchParams.append('lat', lat);
      nominatimUrl.searchParams.append('lon', lon);
      nominatimUrl.searchParams.append('format', 'json');
      nominatimUrl.searchParams.append('addressdetails', '1');
      nominatimUrl.searchParams.append('zoom', '18'); // Maximum detail level

      response = await fetch(nominatimUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CrimeMapApp/1.0 (contact@crimemap.com)' // Required by Nominatim
        },
        signal: AbortSignal.timeout(8000)
      });
    } catch (nominatimError) {
      console.log('Nominatim failed, trying maps.co backup...');
      usingNominatim = false;

      // Fallback to maps.co
      const apiUrl = new URL(`${MAPS_CO_BASE_URL}/reverse`);
      apiUrl.searchParams.append('lat', lat);
      apiUrl.searchParams.append('lon', lon);
      apiUrl.searchParams.append('api_key', API_KEY);
      apiUrl.searchParams.append('format', 'json');

      response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CrimeMapApp/1.0'
        },
        signal: AbortSignal.timeout(10000)
      });
    }

    if (!response.ok) {
      console.error('Maps.co API error:', response.statusText);

      // Proporcionar coordenadas como fallback
      return NextResponse.json({
        success: true,
        display_name: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        formatted_address: `Coordenadas: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        coordinates: { lat: latitude, lon: longitude },
        fallback: true
      });
    }

    const data = await response.json();

    // Si no se encontró dirección, usar coordenadas
    if (!data || data.error) {
      return NextResponse.json({
        success: true,
        display_name: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        formatted_address: `Coordenadas: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        coordinates: { lat: latitude, lon: longitude },
        fallback: true
      });
    }

        // Formatear la dirección
    const formattedAddress = formatAddress(data, usingNominatim);

    return NextResponse.json({
      ...data,
      success: true,
      formatted_address: formattedAddress,
      coordinates: { lat: latitude, lon: longitude },
      service_used: usingNominatim ? 'nominatim' : 'maps.co'
    });

  } catch (error) {
    console.error('Reverse geocoding error:', error);

    // En caso de error, intentar devolver las coordenadas al menos
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (lat && lon) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);

      if (!isNaN(latitude) && !isNaN(longitude)) {
        return NextResponse.json({
          success: true,
          display_name: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          formatted_address: `Coordenadas: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          coordinates: { lat: latitude, lon: longitude },
          fallback: true,
          error: 'Geocoding service unavailable'
        });
      }
    }

    return NextResponse.json(
      {
        error: 'Internal server error during geocoding',
        success: false
      },
      { status: 500 }
    );
  }
}
