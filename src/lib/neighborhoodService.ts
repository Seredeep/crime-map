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
    cartodb_id: number;
    gid: number;
    id: number;
    soc_fomen: string; // Neighborhood name
    mapkey: string;
    hectares: number;
    colorb: string;
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