'use client';

import { Incident } from './types';

/**
 * Fetches incidents from the API without location filtering
 */
export async function fetchIncidents(): Promise<Incident[]> {
  try {
    const url = '/api/incidents';
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error fetching incidents: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in fetchIncidents:', error);
    throw error;
  }
}

/**
 * Fetches a single incident by ID
 */
export async function fetchIncidentById(id: string): Promise<Incident | null> {
  try {
    const response = await fetch(`/api/incidents/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch incident');
    }
    
    return response.json();
  } catch (error) {
    console.error(`Error fetching incident with ID ${id}:`, error);
    return null;
  }
}