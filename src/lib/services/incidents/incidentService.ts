'use client';

import { Incident } from '../../types/global';
import { IncidentFilters } from './types';

export interface StatisticsResults {
  day?: {
    dates: string[];
    counts: number[];
    rollingAverage: number[];
  };
  week?: {
    weeks: string[];
    counts: number[];
    rollingAverage: number[];
  };
  month?: {
    months: string[];
    counts: number[];
  };
  weekdayDistribution?: {
    weekdays: string[];
    counts: number[];
  };
  hourDistribution?: {
    hours: number[];
    counts: number[];
  };
  tag?: {
    tags: string[];
    counts: number[];
  };
  heatMapDensity?: {
    density: number;
    totalIncidents: number;
    area: number;
  };
  rate?: {
    totalIncidents: number;
  };
}

/**
 * Fetch incidents with optional filters
 */
export async function fetchIncidents(filters?: IncidentFilters): Promise<Incident[]> {
  try {
    let url = '/api/incidents';

    if (filters) {
      const params = new URLSearchParams();

      if (filters.city) {
        params.append('city', filters.city);
      }

      if (filters.neighborhoodId) {
        params.append('neighborhoodId', filters.neighborhoodId);
      }

      if (filters.dateFrom) {
        params.append('dateFrom', filters.dateFrom);
      }

      if (filters.dateTo) {
        params.append('dateTo', filters.dateTo);
      }

      if (filters.date) {
        params.append('date', filters.date);
      }

      if (filters.timeFrom) {
        params.append('timeFrom', filters.timeFrom);
      }

      if (filters.timeTo) {
        params.append('timeTo', filters.timeTo);
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

      if (filters.location) {
        params.append('location', JSON.stringify(filters.location));
      }

      const queryString = params.toString();
      if (queryString) {
        url = `${url}?${queryString}`;
      }
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data as Incident[];
  } catch (error) {
    console.error('Error fetching incidents:', error);
    throw error;
  }
}

/**
 * Fetch statistics with optional filters
 */
export async function fetchStatistics(filters?: IncidentFilters): Promise<StatisticsResults> {
  try {
    let url = '/api/incidents/statistics';
    const params = new URLSearchParams();

    // Required parameters
    if (!filters?.dateFrom || !filters?.dateTo) {
      // Default to last 30 days if no dates provided
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      params.append('dateFrom', thirtyDaysAgo.toISOString().split('T')[0]);
      params.append('dateTo', today.toISOString().split('T')[0]);
    } else {
      params.append('dateFrom', filters.dateFrom);
      params.append('dateTo', filters.dateTo);
    }

    // Optional parameters
    if (filters?.neighborhoodId) {
      params.append('neighborhoodId', filters.neighborhoodId);
    }
    if (filters?.timeFrom) {
      params.append('timeFrom', filters.timeFrom);
    }
    if (filters?.timeTo) {
      params.append('timeTo', filters.timeTo);
    }
    if (filters?.tags && filters.tags.length > 0) {
      params.append('tag', filters.tags[0]); // For now, we only support one tag
    }

    // Required stats parameter
    const stats = [
      'day',
      'week',
      'month',
      'weekday-distribution',
      'hour-distribution',
      'tag'
    ];

    // Only include heat-map-density if we have a neighborhoodId
    if (filters?.neighborhoodId) {
      stats.push('heat-map-density');
    }

    stats.push('rate');
    params.append('stats', stats.join(','));

    url = `${url}?${params.toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching statistics:', error);
    throw error;
  }
}

/**
 * Fetch a single incident by ID with evidence files
 */
export async function fetchIncidentById(id: string): Promise<Incident | null> {
  try {
    const response = await fetch(`/api/incidents/${id}`);
    if (!response.ok) {
      console.error(`Error fetching incident by ID ${id}: Status ${response.status}`);
      return null;
    }

    const incident = await response.json();

    // No need to process URLs as they should now be provided directly from the API
    return incident;
  } catch (error) {
    console.error(`Error fetching incident by ID ${id}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Update an incident
 */
export async function updateIncident(incidentId: string, updates: Partial<Incident>): Promise<Incident> {
  try {
    const response = await fetch('/api/incidents', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        incidentId,
        ...updates,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al actualizar el incidente');
    }

    const data = await response.json();
    if (!data.success || !data.incident) {
      throw new Error('Error al actualizar el incidente: respuesta inválida del servidor');
    }

    return data.incident as Incident;
  } catch (error) {
    console.error('Error updating incident:', error);
    throw error;
  }
}
