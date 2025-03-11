'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { reverseGeocode } from '@/lib/geocoding';
import { Incident } from '@/lib/types';

interface MapProps {
  markerPosition?: [number, number];
  incidents?: Incident[];
  onMarkerPositionChange?: (position: [number, number], address?: string) => void;
  onIncidentSelect?: (incident: Incident) => void;
  onMapCenterChange?: (position: [number, number]) => void;
  onZoomChange?: (zoom: number) => void;
  draggable?: boolean;
  setMarkerOnClick?: boolean;
  mode?: 'form' | 'incidents';
}

// Dynamically import the Map components with ssr disabled
const MapComponentWithNoSSR = dynamic(
  () => import('./MapComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[300px] md:h-[400px] lg:h-[600px] bg-gray-700 rounded-lg shadow-lg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-3 text-white font-medium">Loading map...</p>
        </div>
      </div>
    )
  }
);

export default function Map({
  markerPosition,
  incidents = [],
  onMarkerPositionChange,
  onIncidentSelect,
  onMapCenterChange,
  onZoomChange,
  draggable = true,
  setMarkerOnClick = true,
  mode = 'form'
}: MapProps) {
  // Keep track of the last geocoded position to prevent redundant calls
  const [lastGeocodedPosition, setLastGeocodedPosition] = useState<[number, number] | null>(null);
  // Debounced marker position for geocoding
  const [debouncedPosition, setDebouncedPosition] = useState<[number, number] | null>(null);
  // Flag to track if geocoding is in progress
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Handle marker position changes
  const handleMarkerChange = async (position: [number, number]) => {
    // First, immediately call the callback with just the position
    if (onMarkerPositionChange) {
      onMarkerPositionChange(position);
    }
    
    // Only set up for debounced reverse geocoding in form mode
    if (mode === 'form') {
      setDebouncedPosition(position);
    }
  };

  // Effect for debounced reverse geocoding
  useEffect(() => {
    if (!debouncedPosition || isGeocoding || mode !== 'form') return;

    // Skip if this position was recently geocoded
    if (lastGeocodedPosition && 
        debouncedPosition[0] === lastGeocodedPosition[0] && 
        debouncedPosition[1] === lastGeocodedPosition[1]) {
      return;
    }

    // Set up a timer to execute after a delay
    const timer = setTimeout(async () => {
      if (!debouncedPosition) return;
      
      setIsGeocoding(true);
      try {
        const result = await reverseGeocode(debouncedPosition[0], debouncedPosition[1]);
        
        if (result.features && result.features.length > 0) {
          const address = result.features[0].properties.label;
          
          // Call the callback with both position and address
          if (onMarkerPositionChange) {
            onMarkerPositionChange(debouncedPosition, address);
          }
        }
        
        // Record this position as geocoded
        setLastGeocodedPosition(debouncedPosition);
      } catch (error) {
        console.error('Error during reverse geocoding:', error);
      } finally {
        setIsGeocoding(false);
      }
    }, 500); // 500ms debounce delay
    
    // Clean up the timer
    return () => clearTimeout(timer);
  }, [debouncedPosition, onMarkerPositionChange, lastGeocodedPosition, isGeocoding, mode]);

  return (
    <div className="rounded-lg overflow-hidden shadow-lg">
      <MapComponentWithNoSSR 
        markerPosition={markerPosition && Array.isArray(markerPosition) && 
          typeof markerPosition[0] === 'number' && 
          typeof markerPosition[1] === 'number' ? 
          markerPosition : undefined}
        incidents={incidents.filter(incident => 
          typeof incident.latitude === 'number' && 
          typeof incident.longitude === 'number'
        )}
        onMarkerPositionChange={handleMarkerChange}
        onIncidentSelect={onIncidentSelect}
        onMapCenterChange={onMapCenterChange}
        onZoomChange={onZoomChange}
        draggable={draggable}
        setMarkerOnClick={setMarkerOnClick}
        mode={mode}
      />
    </div>
  );
} 