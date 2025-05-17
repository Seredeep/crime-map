/**
 * Represents an incident reported in the system
 */
export interface Incident {
  [x: string]: any;
  _id: string;
  description: string;
  address: string;
  time: string;
  date: string;
  evidenceUrls?: string[];
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  createdAt: string;
  status?: 'pending' | 'verified' | 'resolved';
  tags?: string[];
}

export interface IncidentFilters {
  neighborhoodId?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  time?: string;
  timeFrom?: string;
  timeTo?: string;
  status?: 'pending' | 'verified' | 'resolved';
  tags?: string[];
}

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
} 