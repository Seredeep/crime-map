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
  status?: "pending" | "verified" | "resolved";
  location?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude] in GeoJSON format
  };
  latitude: number;
  longitude: number;
  createdAt: string;
  // Support both formats
  evidenceFiles?: Array<{
    name: string;
    type: string;
    url: string;
    size: number;
  }>;
}
