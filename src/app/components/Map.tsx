'use client';

import { reverseGeocode } from '@/lib/services/geo';
import { updateIncident } from '@/lib/services/incidents/incidentService';
import { Neighborhood } from '@/lib/services/neighborhoods';
import { Incident } from '@/lib/types/global';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { useState } from 'react';

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
  selectedNeighborhood?: Neighborhood | null;
  onMapClick?: (coordinates: [number, number]) => void;
  onIncidentUpdate?: (incident: Incident) => void;
}

// Importar el componente del mapa dinámicamente para evitar problemas con SSR
const MapComponentWithNoSSR = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] md:h-[400px] lg:h-[600px] bg-gray-800/50 rounded-lg flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ),
});

export default function Map({
  markerPosition,
  incidents = [],
  onMarkerPositionChange,
  onIncidentSelect,
  onMapCenterChange,
  onZoomChange,
  draggable = true,
  setMarkerOnClick = true,
  mode = 'form',
  selectedNeighborhood,
  onMapClick,
  onIncidentUpdate
}: MapProps) {
  const { data: session } = useSession();
  const isEditor = session?.user?.role === 'editor' || session?.user?.role === 'admin';
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);

  // Keep track of the last geocoded position to prevent redundant calls
  const [lastGeocodedPosition, setLastGeocodedPosition] = useState<[number, number] | null>(null);

  // Handle marker position change
  const handleMarkerChange = async (position: [number, number]) => {
    // Update last geocoded position
    setLastGeocodedPosition(position);

    // Si estamos editando un incidente, actualizar su ubicación
    if (editingIncident) {
      try {
        // Primero obtenemos la dirección actualizada
        const result = await reverseGeocode(position[0], position[1]);
        const newAddress = result?.features[0]?.properties?.label;

        const updatedIncident = await updateIncident(editingIncident._id, {
          location: {
            type: 'Point',
            coordinates: [position[0], position[1]] // [longitude, latitude]
          },
          address: newAddress || editingIncident.address // Si no se puede obtener la dirección, mantener la anterior
        });

        // Actualizar el incidente en el estado local
        if (onIncidentUpdate) {
          onIncidentUpdate(updatedIncident);
        }
        setEditingIncident(updatedIncident);
      } catch (error) {
        console.error('Error updating incident location:', error);
      }
      return;
    }

    // Only geocode if the position has changed
    if (!lastGeocodedPosition ||
        lastGeocodedPosition[0] !== position[0] ||
        lastGeocodedPosition[1] !== position[1]) {
      try {
        const result = await reverseGeocode(position[0], position[1]);
        if (result && onMarkerPositionChange) {
          onMarkerPositionChange(position, result.features[0].properties.label);
        } else if (onMarkerPositionChange) {
          onMarkerPositionChange(position);
        }
      } catch (error) {
        console.error('Error geocoding position:', error);
        if (onMarkerPositionChange) {
          onMarkerPositionChange(position);
        }
      }
    }
  };

  // Handle map click
  const handleMapClick = (coordinates: [number, number]) => {
    if (onMapClick) {
      onMapClick(coordinates);
    }
  };

  // Handle incident selection
  const handleIncidentSelect = (incident: Incident) => {
    if (isEditor && editingIncident?._id === incident._id) {
      // Si ya estamos editando este incidente, desactivar la edición
      setEditingIncident(null);
    } else if (isEditor) {
      // Si es un nuevo incidente, activar la edición
      setEditingIncident(incident);
    }

    if (onIncidentSelect) {
      onIncidentSelect(incident);
    }
  };

  // Handle incident update
  const handleIncidentUpdate = (updatedIncident: Incident) => {
    if (onIncidentUpdate) {
      onIncidentUpdate(updatedIncident);
    }
  };

  return (
    <div className="overflow-hidden shadow-lg">
      <MapComponentWithNoSSR
        markerPosition={markerPosition && Array.isArray(markerPosition) &&
          typeof markerPosition[0] === 'number' &&
          typeof markerPosition[1] === 'number' ?
          markerPosition : undefined}
        incidents={incidents.filter(incident =>
          incident.location &&
          incident.location.coordinates &&
          Array.isArray(incident.location.coordinates) &&
          typeof incident.location.coordinates[0] === 'number' &&
          typeof incident.location.coordinates[1] === 'number'
        )}
        onMarkerPositionChange={handleMarkerChange}
        onIncidentSelect={handleIncidentSelect}
        onMapCenterChange={onMapCenterChange}
        onZoomChange={onZoomChange}
        draggable={draggable}
        setMarkerOnClick={setMarkerOnClick}
        mode={mode}
        selectedNeighborhood={selectedNeighborhood}
        onMapClick={handleMapClick}
        editingIncident={editingIncident}
        onIncidentUpdate={handleIncidentUpdate}
      />
    </div>
  );
}
