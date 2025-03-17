'use client';

import { Incident } from './types';

export interface IncidentFilters {
  neighborhoodId?: string;
  date?: string;
  time?: string;
  status?: string;
  tags?: string[];
}

/**
 * Fetch incidents with optional filters
 */
export async function fetchIncidents(filters?: IncidentFilters): Promise<Incident[]> {
  try {
    // Build URL with query parameters based on filters
    let url = '/api/incidents';
    
    if (filters) {
      console.log('Aplicando filtros:', filters);
      const params = new URLSearchParams();
      
      if (filters.neighborhoodId) {
        params.append('neighborhoodId', filters.neighborhoodId);
      }
      
      if (filters.date) {
        params.append('date', filters.date);
      }
      
      if (filters.time) {
        params.append('time', filters.time);
      }
      
      if (filters.status) {
        params.append('status', filters.status);
      }
      
      if (filters.tags && filters.tags.length > 0) {
        filters.tags.forEach(tag => params.append('tag', tag));
      }
      
      // Add parameters to URL if there are any
      const queryString = params.toString();
      if (queryString) {
        url = `${url}?${queryString}`;
      }
    }
    
    console.log('Consultando URL:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Se encontraron ${data.length} incidentes`);
    return data as Incident[];
  } catch (error) {
    console.error('Error fetching incidents:', error);
    throw error;
  }
}

/**
 * Fetch a single incident by ID
 */
export async function fetchIncidentById(id: string): Promise<Incident | null> {
  try {
    const response = await fetch(`/api/incidents/${id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data as Incident;
  } catch (error) {
    console.error(`Error fetching incident with ID ${id}:`, error);
    return null;
  }
}