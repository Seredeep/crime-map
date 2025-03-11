'use client';

import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useCallback, useRef } from 'react';
import L from 'leaflet';
import { Incident } from '@/lib/types';

// Fix for default marker icons in Leaflet with Next.js
const fixLeafletIcons = () => {
  // delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

// Create custom marker icons
const createMarkerIcon = (color: string, size: number = 25) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
};

// Regular marker icons
const defaultMarkerIcon = createMarkerIcon('#3B82F6', 25); // Blue
const incidentMarkerIcon = createMarkerIcon('#EF4444', 15); // Red, smaller for incidents

// Hover marker icon
const hoverMarkerIcon = createMarkerIcon('#EF4444', 20); // Red, slightly larger for hover effect

interface MapComponentProps {
  // Single marker position [lat, lng] for form mode
  markerPosition?: [number, number];
  // Multiple markers for incidents display mode
  incidents?: Incident[];
  // Callback when marker position changes (for form mode)
  onMarkerPositionChange?: (position: [number, number]) => void;
  // Callback when an incident marker is clicked
  onIncidentSelect?: (incident: Incident) => void;
  // Callback when the map center changes
  onMapCenterChange?: (position: [number, number]) => void;
  // Callback when the map zoom changes
  onZoomChange?: (zoom: number) => void;
  // Whether the marker should be draggable (for form mode)
  draggable?: boolean;
  // Whether to allow setting marker by clicking on map (for form mode)
  setMarkerOnClick?: boolean;
  // Mode of the map: 'form' for report form or 'incidents' for viewing incidents
  mode?: 'form' | 'incidents';
}

// This component handles map click events
function MapClickHandler({ 
  onMapClick, 
  setMarkerOnClick 
}: { 
  onMapClick: (e: L.LeafletMouseEvent) => void;
  setMarkerOnClick?: boolean;
}) {
  useMapEvents({
    click: (e) => {
      if (setMarkerOnClick) {
        onMapClick(e);
      }
    },
  });
  
  return null;
}

// This component tracks map movement and zoom
function MapEventHandler({
  onMapCenterChange,
  onZoomChange
}: {
  onMapCenterChange?: (position: [number, number]) => void;
  onZoomChange?: (zoom: number) => void;
}) {
  const map = useMap();
  
  useEffect(() => {
    if (!onMapCenterChange && !onZoomChange) return;
    
    const handleMoveEnd = () => {
      if (onMapCenterChange) {
        const center = map.getCenter();
        onMapCenterChange([center.lat, center.lng]);
      }
    };
    
    const handleZoomEnd = () => {
      if (onZoomChange) {
        onZoomChange(map.getZoom());
      }
    };
    
    map.on('moveend', handleMoveEnd);
    map.on('zoomend', handleZoomEnd);
    
    return () => {
      map.off('moveend', handleMoveEnd);
      map.off('zoomend', handleZoomEnd);
    };
  }, [map, onMapCenterChange, onZoomChange]);
  
  return null;
}

export default function MapComponent({
  markerPosition,
  incidents = [],
  onMarkerPositionChange,
  onIncidentSelect,
  onMapCenterChange,
  onZoomChange,
  draggable = true,
  setMarkerOnClick = true,
  mode = 'form',
}: MapComponentProps) {
  useEffect(() => {
    fixLeafletIcons();
  }, []);

  // Mar del Plata coordinates as default center
  const defaultCenter: L.LatLngExpression = [-38.0729, -57.5725];
  
  // Using state for marker position to allow updates
  const [position, setPosition] = useState<[number, number] | undefined>(markerPosition);
  
  // State to track which incident marker is being hovered over
  const [hoveredIncidentId, setHoveredIncidentId] = useState<string | null>(null);
  
  // Keep track of the previous position to prevent unnecessary rerenders
  const prevPositionRef = useRef<[number, number] | undefined>(position);
  
  // Update internal state when prop changes
  useEffect(() => {
    if (markerPosition && 
        (!prevPositionRef.current || 
         prevPositionRef.current[0] !== markerPosition[0] || 
         prevPositionRef.current[1] !== markerPosition[1])) {
      setPosition(markerPosition);
      prevPositionRef.current = markerPosition;
    }
  }, [markerPosition]);

  // Handle map click (for form mode)
  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    const newPosition: [number, number] = [e.latlng.lat, e.latlng.lng];
    setPosition(newPosition);
    prevPositionRef.current = newPosition;
    
    if (onMarkerPositionChange) {
      onMarkerPositionChange(newPosition);
    }
  }, [onMarkerPositionChange]);
  
  // Handle marker drag (for form mode)
  const handleMarkerDrag = useCallback((e: L.LeafletEvent) => {
    const marker = e.target;
    const latLng = marker.getLatLng();
    const newPosition: [number, number] = [latLng.lat, latLng.lng];
    
    // Update internal state
    setPosition(newPosition);
    prevPositionRef.current = newPosition;
    
    if (onMarkerPositionChange) {
      onMarkerPositionChange(newPosition);
    }
  }, [onMarkerPositionChange]);

  // Handle incident marker click
  const handleIncidentMarkerClick = useCallback((incident: Incident) => {
    if (onIncidentSelect) {
      onIncidentSelect(incident);
    }
  }, [onIncidentSelect]);

  // Calculate appropriate center and zoom for incidents view
  const getMapCenterAndZoom = () => {
    if (mode === 'incidents' && incidents.length > 0) {
      // If we have incidents and are in incidents mode, center the map to show all incidents
      if (incidents.length === 1) {
        // If there's only one incident, center on it
        // Validate coordinates to avoid Invalid LatLng error
        const latitude = typeof incidents[0].latitude === 'number' ? incidents[0].latitude : defaultCenter[0];
        const longitude = typeof incidents[0].longitude === 'number' ? incidents[0].longitude : defaultCenter[1];
        
        return {
          center: [latitude, longitude] as L.LatLngExpression,
          zoom: 15
        };
      } else {
        // For multiple incidents, we'll just use the default center and zoom
        // In a real app, you might want to compute bounds to fit all markers
        return {
          center: defaultCenter,
          zoom: 13
        };
      }
    }
    
    // For form mode or if no incidents, center on the marker or default
    return {
      center: position || defaultCenter,
      zoom: 13
    };
  };

  const { center, zoom } = getMapCenterAndZoom();

  return (
    <MapContainer 
      center={center}
      zoom={zoom} 
      scrollWheelZoom={true}
      dragging={true}
      className="w-full h-[300px] md:h-[400px] lg:h-[600px]"
      zoomControl={false}
      attributionControl={false}
    >
      <ZoomControl position="bottomright" />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Map event handlers */}
      {(onMapCenterChange || onZoomChange) && (
        <MapEventHandler 
          onMapCenterChange={onMapCenterChange}
          onZoomChange={onZoomChange}
        />
      )}
      
      {mode === 'form' && (
        <MapClickHandler onMapClick={handleMapClick} setMarkerOnClick={setMarkerOnClick} />
      )}
      
      {/* Form mode marker */}
      {mode === 'form' && position && (
        <Marker 
          position={position}
          draggable={draggable}
          icon={defaultMarkerIcon}
          eventHandlers={{
            dragend: handleMarkerDrag,
          }}
        >
          <Popup className="text-black">
            <div className="text-sm">
              <strong>Selected Location</strong><br />
              {position[0].toFixed(6)}, {position[1].toFixed(6)}
            </div>
          </Popup>
        </Marker>
      )}
      
      {/* Incidents mode markers */}
      {mode === 'incidents' && incidents && incidents.length > 0 && incidents.map((incident) => (
        <Marker 
          key={incident._id || `${incident.latitude}-${incident.longitude}-${incident.date}-${incident.time}`}
          position={[incident.latitude, incident.longitude]}
          icon={hoveredIncidentId === incident._id ? hoverMarkerIcon : incidentMarkerIcon}
          eventHandlers={{
            click: () => handleIncidentMarkerClick(incident),
            mouseover: () => setHoveredIncidentId(incident._id || null),
            mouseout: () => setHoveredIncidentId(null),
          }}
        >
          <Popup className="text-black">
            <div className="text-sm">
              <strong>{incident.description.substring(0, 30)}...</strong><br />
              {incident.date} at {incident.time}
            </div>
          </Popup>
        </Marker>
      ))}
      
      <div className="absolute bottom-0 right-0 z-[1000] bg-black bg-opacity-50 text-xs text-white p-1">
        © <a href="https://www.openstreetmap.org/copyright" className="text-blue-300">OpenStreetMap</a> contributors
      </div>
    </MapContainer>
  );
} 