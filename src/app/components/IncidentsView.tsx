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
      
      setIncidents(data);
      
      // Select the first incident by default if available
      if (data.length > 0) {
        setSelectedIncident(data[0]);
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