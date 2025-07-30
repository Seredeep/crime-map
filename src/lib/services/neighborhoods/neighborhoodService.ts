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
    const neighborhoods = await fetchNeighborhoods();
    return neighborhoods.filter(n => n.properties.city === city);
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
