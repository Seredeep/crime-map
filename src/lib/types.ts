/**
 * Represents an incident reported in the system
 */
export interface Incident {
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