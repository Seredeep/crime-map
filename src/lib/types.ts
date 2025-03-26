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
  latitude: number;
  longitude: number;
  createdAt: string;
  status?: 'pending' | 'verified' | 'resolved';
} 