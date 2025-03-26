'use client';
import { useState, useEffect } from 'react';
import Map from './Map';
import IncidentDetails from './IncidentDetails';
import { Incident } from '@/lib/types';
import { fetchIncidents } from '@/lib/incidentService';

export default function IncidentsView() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
 
  // Load incidents without location filtering
  const loadIncidents = async () => {
    setIsLoading(true);
    try {
      const data = await fetchIncidents();
      
      // Transform the data to match the expected format with latitude and longitude
      const transformedIncidents = data.map(incident => {
        // Check if we have valid location data
        if (incident.location && 
            incident.location.coordinates && 
            incident.location.coordinates.length === 2) {
          // MongoDB stores coordinates as [longitude, latitude]
          // We need to extract and swap them for our Map component
          return {
            ...incident,
            // Add latitude and longitude properties
            longitude: incident.location.coordinates[0],
            latitude: incident.location.coordinates[1]
          };
        } else {
          // For incidents without proper location data, set default coordinates
          // to prevent errors (ideally, filter these out)
          console.warn(`Incident ${incident._id} has invalid location data`);
          return {
            ...incident,
            longitude: -57.5725, // default longitude (Mar del Plata)
            latitude: -38.0729  // default latitude (Mar del Plata)
          };
        }
      });
     
      setIncidents(transformedIncidents);
     
      // Select the first incident by default if available
      if (transformedIncidents.length > 0) {
        setSelectedIncident(transformedIncidents[0]);
      } else {
        setSelectedIncident(null);
      }
    } catch (err) {
      console.error('Failed to load incidents:', err);
      setError('Failed to load incidents. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load incidents on initial component mount
  useEffect(() => {
    loadIncidents();
  }, []);

  // Handle when an incident marker is clicked on the map
  const handleIncidentSelect = (incident: Incident) => {
    setSelectedIncident(incident);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="ml-3 text-white">Loading incidents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-800 text-white rounded-md">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
        {/* Map - left on desktop, top on mobile */}
        <div className="md:w-1/2 w-full">
          <Map
            incidents={incidents}
            onIncidentSelect={handleIncidentSelect}
            mode="incidents"
          />
        </div>
       
        {/* Incident details - right on desktop, bottom on mobile */}
        <div className="md:w-1/2 w-full bg-gray-800 p-6 rounded-lg shadow-lg">
          <IncidentDetails incident={selectedIncident} />
        </div>
      </div>
    </div>
  );
}