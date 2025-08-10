'use client';

/**
 * Interface for GeoJSON Feature representing a neighborhood
 */
export interface Neighborhood {
  _id: string;
  type: string;
  geometry: {
    type: string;
    coordinates: number[][][][]; // MultiPolygon coordinates
  };
  properties: {
    id?: number;
    name?: string;
    link?: string;
    city?: string;
    state?: string;
    country?: string;
    source?: string;
    // Campos de Mar del Plata (comentados para San Francisco)
    cartodb_id?: number;
    gid?: number;
    soc_fomen?: string; // Neighborhood name
    mapkey?: string;
    hectares?: number;
    colorb?: string;
  };
}

/**
 * Fetches all neighborhoods from the API
 */
export async function fetchNeighborhoods(): Promise<Neighborhood[]> {
  try {
    const response = await fetch('/api/neighborhoods');

    if (!response.ok) {
      throw new Error(`Error fetching neighborhoods: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in fetchNeighborhoods:', error);
    throw error;
  }
}

/**
 * Fetch neighborhoods by city
 */
export async function fetchNeighborhoodsByCity(city: string): Promise<Neighborhood[]> {
  try {
    const response = await fetch(`/api/neighborhoods?city=${encodeURIComponent(city)}`);
    if (!response.ok) {
      throw new Error(`Error fetching neighborhoods by city: ${response.status} ${response.statusText}`);
    }
    const neighborhoods: Neighborhood[] = await response.json();
    return neighborhoods;
  } catch (error) {
    console.error(`Error fetching neighborhoods for city ${city}:`, error);
    throw error;
  }
}

/**
 * Fetch San Francisco neighborhoods
 */
export async function fetchSanFranciscoNeighborhoods(): Promise<Neighborhood[]> {
  return fetchNeighborhoodsByCity('San Francisco');
}

/**
 * Fetch a single neighborhood by ID
 */
export async function fetchNeighborhoodById(id: string): Promise<Neighborhood | null> {
  try {
    const neighborhoods = await fetchNeighborhoods();
    return neighborhoods.find(n => n._id === id) || null;
  } catch (error) {
    console.error(`Error fetching neighborhood with ID ${id}:`, error);
    return null;
  }
}

/**
 * Search neighborhoods by name
 */
export async function searchNeighborhoodsByName(searchTerm: string): Promise<Neighborhood[]> {
  try {
    const neighborhoods = await fetchNeighborhoods();
    const term = searchTerm.toLowerCase();
    return neighborhoods.filter(n =>
      n.properties.name?.toLowerCase().includes(term) ||
      n.properties.soc_fomen?.toLowerCase().includes(term)
    );
  } catch (error) {
    console.error(`Error searching neighborhoods with term ${searchTerm}:`, error);
    throw error;
  }
}

/**
 * Calcula el centro de un barrio basado en su geometría
 */
export function getNeighborhoodCenter(neighborhood: Neighborhood): [number, number] | null {
  if (!neighborhood.geometry || !neighborhood.geometry.coordinates) {
    return null;
  }

  try {
    // Para MultiPolygon, tomamos el primer polígono
    const firstPolygon = neighborhood.geometry.coordinates[0];
    if (!firstPolygon || firstPolygon.length === 0) {
      return null;
    }

    // Calculamos el centro del polígono
    let sumLng = 0;
    let sumLat = 0;
    let pointCount = 0;

    // Iteramos sobre todos los puntos del polígono
    for (const ring of firstPolygon) {
      for (const point of ring) {
        if (point.length >= 2) {
          sumLng += point[0];
          sumLat += point[1];
          pointCount++;
        }
      }
    }

    if (pointCount === 0) {
      return null;
    }

    return [sumLng / pointCount, sumLat / pointCount];
  } catch (error) {
    console.error('Error calculating neighborhood center:', error);
    return null;
  }
}

/**
 * Obtiene las coordenadas del barrio del usuario
 */
export async function getUserNeighborhoodCoordinates(userNeighborhoodName: string): Promise<[number, number] | null> {
  try {
    const response = await fetch('/api/neighborhoods');
    if (!response.ok) {
      throw new Error('Failed to fetch neighborhoods');
    }

    const data = await response.json();
    const neighborhoods = data.neighborhoods || [];

    // Buscar el barrio por nombre
    const neighborhood = neighborhoods.find((n: Neighborhood) =>
      n.properties?.soc_fomen === userNeighborhoodName ||
      n.properties?.name === userNeighborhoodName
    );

    if (!neighborhood) {
      console.warn(`Neighborhood not found: ${userNeighborhoodName}`);
      return null;
    }

    return getNeighborhoodCenter(neighborhood);
  } catch (error) {
    console.error('Error getting user neighborhood coordinates:', error);
    return null;
  }
}
