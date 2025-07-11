'use client';

// #region External Libraries
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
// #endregion

// #region Internal Services & Types
import { reverseGeocode } from '@/lib/services/geo';
import { updateIncident } from '@/lib/services/incidents/incidentService';
import { Neighborhood } from '@/lib/services/neighborhoods';
import { Incident } from '@/lib/types/global';
// #endregion

// #region Leaflet Configuration
const fixLeafletIcons = () => {
  // Fix TypeScript error by using type assertion
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};
// #endregion

// #region Custom Marker Icons
const createMarkerIcon = (color: string, size: number = 35, iconType: string = 'default') => {
  let iconSvg = '';

  // Choose SVG based on incident type
  switch (iconType) {
    case 'robbery':
    case 'robo':
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="${size * 0.5}px" height="${size * 0.5}px"><path d="M11 8.414V18h2V8.414l4.293 4.293 1.414-1.414L12 4.586l-6.707 6.707 1.414 1.414z"/></svg>`;
      break;
    case 'assault':
    case 'asalto':
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="${size * 0.5}px" height="${size * 0.5}px"><path d="M10.5 1.875a1.125 1.125 0 0 1 2.25 0v8.219c.517.384 1.651 1.459 1.651 3.219 0 1.766-1.356 3.228-3.151 3.228-1.794 0-3.15-1.462-3.15-3.228 0-1.76 1.134-2.835 1.65-3.219V1.875Z" /><path d="M5.25 14.25a1.125 1.125 0 0 0-2.25 0v4.5a1.125 1.125 0 0 0 2.25 0v-4.5ZM21 14.25a1.125 1.125 0 0 0-2.25 0v4.5a1.125 1.125 0 0 0 2.25 0v-4.5ZM9.75 14.25a1.125 1.125 0 0 0-2.25 0v4.5a1.125 1.125 0 0 0 2.25 0v-4.5ZM16.5 14.25a1.125 1.125 0 0 0-2.25 0v4.5a1.125 1.125 0 0 0 2.25 0v-4.5Z" /></svg>`;
      break;
    case 'theft':
    case 'hurto':
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="${size * 0.5}px" height="${size * 0.5}px"><path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375Z" /><path fill-rule="evenodd" d="m3.087 9 .54 9.176A3 3 0 0 0 6.62 21h10.757a3 3 0 0 0 2.995-2.824L20.913 9H3.087Zm6.133 2.845a.75.75 0 0 1 1.06 0l1.72 1.72 1.72-1.72a.75.75 0 1 1 1.06 1.06l-1.72 1.72 1.72 1.72a.75.75 0 1 1-1.06 1.06L12 15.685l-1.72 1.72a.75.75 0 1 1-1.06-1.06l1.72-1.72-1.72-1.72a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" /></svg>`;
      break;
    case 'vandalism':
    case 'vandalismo':
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="${size * 0.5}px" height="${size * 0.5}px"><path d="M15.75 4.5a3 3 0 1 1 .825 2.066l-8.421 4.679a3.002 3.002 0 0 1-1.51 4.744l-.113.035a3 3 0 0 1-3.585-3.586l.035-.113a3.002 3.002 0 0 1 4.744-1.51l4.679-8.42A2.997 2.997 0 0 1 15.75 4.5Z" /><path d="M14.568 14.25a3 3 0 1 0 4.243 4.243 3 3 0 0 0-4.243-4.243Z" /></svg>`;
      break;
    case 'suspicious':
    case 'actividad sospechosa':
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="${size * 0.5}px" height="${size * 0.5}px"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd" /></svg>`;
      break;
    default:
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="${size * 0.5}px" height="${size * 0.5}px"><path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742Z" clip-rule="evenodd" /></svg>`;
  }

  // Create the SVG icon as a data URL
  const svgTemplate = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 10}" viewBox="0 0 ${size} ${size + 10}">
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.3" />
      </filter>
      <path d="M${size / 2},${size} L${size * 0.2},${size * 0.6} C${size * 0.1},${size * 0.4} ${size * 0.1},${size * 0.2} ${size / 2},${size * 0.1} C${size * 0.9},${size * 0.2} ${size * 0.9},${size * 0.4} ${size * 0.8},${size * 0.6} L${size / 2},${size} Z" fill="${color}" stroke="#ffffff" stroke-width="1.5" filter="url(#shadow)" />
      <circle cx="${size / 2}" cy="${size * 0.4}" r="${size * 0.25}" fill="${color}" stroke="#ffffff" stroke-width="1.5" />
      <g transform="translate(${size * 0.25}, ${size * 0.15})">
        ${iconSvg}
      </g>
    </svg>
  `;

  const svgBlob = new Blob([svgTemplate], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(svgBlob);

  return new L.Icon({
    iconUrl: url,
    iconSize: [size, size + 10],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
    className: 'custom-map-marker'
  });
};

// Marker icons by incident type
const defaultMarkerIcon = createMarkerIcon('#3B82F6', 32);
const editingMarkerIcon = createMarkerIcon('#3B82F6', 28);
const hoverMarkerIcon = createMarkerIcon('#EF4444', 28);

// Custom marker icons based on incident type
const incidentTypeIcons = {
  'robbery': createMarkerIcon('#EF4444', 24, 'robbery'), // Red for robbery
  'assault': createMarkerIcon('#F97316', 24, 'assault'), // Orange for assault
  'theft': createMarkerIcon('#FACC15', 24, 'theft'),   // Yellow for theft
  'vandalism': createMarkerIcon('#84CC16', 24, 'vandalism'), // Green for vandalism
  'suspicious': createMarkerIcon('#06B6D4', 24, 'suspicious'), // Cyan for suspicious activity
  'other': createMarkerIcon('#8B5CF6', 24, 'default'),    // Purple for other
  'default': createMarkerIcon('#6B7280', 24, 'default')    // Gray for default
};

// Get marker icon based on incident type
const getMarkerIconByType = (incident: Incident) => {
  const type = incident.type?.toLowerCase() || 'default';
  return incidentTypeIcons[type as keyof typeof incidentTypeIcons] || incidentTypeIcons.default;
};

interface MapComponentProps {
  // Single marker position [lat, lng] for form mode
  markerPosition?: [number, number];
  // Multiple markers for incidents display mode
  incidents: Incident[];
  // Callback when marker position changes (for form mode)
  onMarkerPositionChange?: (position: [number, number]) => void;
  // Callback when an incident marker is clicked
  onIncidentSelect?: (incident: Incident) => void;
  // Callback when the map center changes
  onMapCenterChange?: (position: [number, number]) => void;
  // Callback when the map zoom changes
  onZoomChange?: (zoom: number) => void;
  // Callback when the map is clicked
  onMapClick?: (coordinates: [number, number]) => void;
  // Whether the marker should be draggable (for form mode)
  draggable?: boolean;
  // Whether to allow setting marker by clicking on map (for form mode)
  setMarkerOnClick?: boolean;
  // Mode of the map: 'form' for report form or 'incidents' for viewing incidents
  mode?: 'form' | 'incidents';
  // Selected neighborhood data (GeoJSON)
  selectedNeighborhood?: Neighborhood | null;
  // Whether the map is in form mode
  isFormMode?: boolean;
  // Incident being edited
  editingIncident?: Incident | null;
  // Callback when an incident is updated
  onIncidentUpdate?: (incident: Incident) => void;
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

// Componente para hacer zoom al barrio seleccionado
function NeighborhoodFitBounds({ neighborhood }: { neighborhood: Neighborhood }) {
  const map = useMap();

  useEffect(() => {
    if (neighborhood && neighborhood.geometry && neighborhood.geometry.coordinates) {
      try {
        // Crear un objeto GeoJSON para calcular los límites
        const geoJsonLayer = L.geoJSON({
          type: 'Feature',
          properties: {},
          geometry: neighborhood.geometry
        } as GeoJSON.Feature);

        // Obtener los límites del polígono y ajustar el mapa
        const bounds = geoJsonLayer.getBounds();
        map.fitBounds(bounds, { padding: [20, 20] });
      } catch (error) {
        console.error('Error al ajustar el mapa al barrio:', error);
      }
    }
  }, [neighborhood, map]);

  return null;
}

// Add custom styles to improve Leaflet popup
const customPopupStyle = `
  .leaflet-popup-improved .leaflet-popup-content-wrapper {
    padding: 0;
    overflow: hidden;
    border-radius: 0.5rem;
  }
  .leaflet-popup-improved .leaflet-popup-content {
    margin: 0;
    width: auto !important;
  }
  .leaflet-popup-improved .leaflet-popup-close-button {
    color: #4b5563;
    font-size: 18px;
    padding: 4px 4px 0 0;
  }
  .leaflet-popup-improved .leaflet-popup-tip {
    background: white;
  }
`;

export default function MapComponent({
  markerPosition,
  incidents = [],
  onMarkerPositionChange,
  onIncidentSelect,
  onMapCenterChange,
  onZoomChange,
  onMapClick,
  draggable = true,
  setMarkerOnClick = true,
  mode = 'form',
  selectedNeighborhood,
  isFormMode,
  editingIncident,
  onIncidentUpdate
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
  const [showLegend, setShowLegend] = useState<boolean>(false);

  // Keep track of the previous position to prevent unnecessary rerenders
  const prevPositionRef = useRef<[number, number] | undefined>(position);

  // Effect to handle editing incident
  useEffect(() => {
    if (editingIncident) {
      // Centrar el mapa en el incidente que se está editando
      const mapElement = document.getElementById('map');
      if (mapElement) {
        const map = (mapElement as unknown as { _leaflet_map: L.Map })._leaflet_map;
        if (map) {
          map.setView(
            [editingIncident.location.coordinates[1], editingIncident.location.coordinates[0]],
            15
          );
        }
      }
    }
  }, [editingIncident]);



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
    if (setMarkerOnClick) {
      const newPosition: [number, number] = [e.latlng.lat, e.latlng.lng];
      setPosition(newPosition);
      prevPositionRef.current = newPosition;

      if (onMarkerPositionChange) {
        onMarkerPositionChange(newPosition);
      }
    }
  }, [onMarkerPositionChange, setMarkerOnClick]);

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

  // Handle incident marker drag
  const handleIncidentMarkerDrag = useCallback(async (e: L.LeafletEvent, incident: Incident) => {
    const marker = e.target;
    const latLng = marker.getLatLng();
    const newPosition: [number, number] = [latLng.lat, latLng.lng];

    if (onIncidentUpdate) {
      try {
        // Obtener la dirección usando geocodificación inversa
        const result = await reverseGeocode(latLng.lat, latLng.lng);

        // Extraer la dirección formateada del resultado
        let formattedAddress = "";
        if (result && result.features && result.features.length > 0 && result.features[0].properties) {
          formattedAddress = result.features[0].properties.label;
        } else {
          // Si no podemos obtener una dirección, usar una por defecto
          formattedAddress = incident.address || `Mar del Plata, Argentina`;
        }

        // Actualizar el incidente
        const updatedIncident = await updateIncident(incident._id, {
          location: {
            type: "Point" as const,
            coordinates: [latLng.lng, latLng.lat] // [longitude, latitude]
          },
          address: formattedAddress
        });

        onIncidentUpdate(updatedIncident);

      } catch (error) {
        console.error('Error al actualizar la ubicación del incidente:', error);
        // En caso de error, intentar una solución alternativa
        try {
          // Si no podemos obtener una dirección, al menos actualizar las coordenadas
          const fallbackUpdate = await updateIncident(incident._id, {
            location: {
              type: "Point" as const,
              coordinates: [latLng.lng, latLng.lat] // [longitude, latitude]
            }
          });

          onIncidentUpdate(fallbackUpdate);
        } catch (secondError) {
          console.error('Error en la actualización alternativa:', secondError);

          // Como último recurso, actualizar solo el estado local
          const localUpdate: Incident = {
            ...incident,
            location: {
              type: "Point",
              coordinates: [latLng.lng, latLng.lat] // [longitude, latitude]
            }
          };

          onIncidentUpdate(localUpdate);
        }
      }
    }
  }, [onIncidentUpdate]);

  // Calculate appropriate center and zoom for incidents view
  const getMapCenterAndZoom = () => {
    if (editingIncident) {
      // Si estamos editando un incidente, centrar en él
      return {
        center: [editingIncident.location.coordinates[1], editingIncident.location.coordinates[0]] as L.LatLngExpression,
        zoom: 15
      };
    }

    if (mode === 'incidents' && incidents.length > 0) {
      // If we have incidents and are in incidents mode, center the map to show all incidents
      if (incidents.length === 1) {
        // If there's only one incident, center on it
        // Validate coordinates to avoid Invalid LatLng error
        const latitude = typeof incidents[0].location.coordinates[1] === 'number' ? incidents[0].location.coordinates[1] : defaultCenter[0];
        const longitude = typeof incidents[0].location.coordinates[0] === 'number' ? incidents[0].location.coordinates[0] : defaultCenter[1];

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
      className="w-full h-screen"
      zoomControl={false}
      attributionControl={false}
    >
      <ZoomControl position="bottomright" />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Style: <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* Map event handlers */}
      {(onMapCenterChange || onZoomChange) && (
        <MapEventHandler
          onMapCenterChange={onMapCenterChange}
          onZoomChange={onZoomChange}
        />
      )}

      {/* Click handler for form mode */}
      {mode === 'form' && setMarkerOnClick && (
        <MapClickHandler
          onMapClick={handleMapClick}
          setMarkerOnClick={true}
        />
      )}

      {/* Ajustar zoom al barrio si está seleccionado */}
      {selectedNeighborhood && (
        <NeighborhoodFitBounds neighborhood={selectedNeighborhood} />
      )}

      {/* Renderizar barrio seleccionado con GeoJSON */}
      {selectedNeighborhood && (
        <GeoJSON
          data={{
            type: 'Feature',
            properties: {},
            geometry: selectedNeighborhood.geometry
          } as GeoJSON.Feature}
          style={() => ({
            color: '#3B82F6',
            weight: 3,
            opacity: 0.8,
            fillColor: '#3B82F6',
            fillOpacity: 0.2,
            dashArray: '5, 5'
          })}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold">{selectedNeighborhood.properties?.soc_fomen || 'Barrio'}</h3>
              <p className="text-sm text-gray-600">{selectedNeighborhood.properties?.id || ''}</p>
            </div>
          </Popup>
        </GeoJSON>
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
              <strong>Ubicación seleccionada</strong><br />
              {position[0].toFixed(6)}, {position[1].toFixed(6)}
            </div>
          </Popup>
        </Marker>
      )}
      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-gray-900/90 backdrop-blur-md rounded-lg shadow-lg border border-gray-700/50 p-2 text-white">
        <div className="flex items-center">
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-800 rounded-lg transition-colors w-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-sm">{showLegend ? 'Ocultar leyenda' : 'Mostrar leyenda'}</span>
          </button>
        </div>

        {showLegend && (
          <div className="mt-2 p-2 space-y-2 border-t border-gray-700">
            <h4 className="font-medium text-sm mb-2 text-gray-200">Tipos de incidentes</h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="14px" height="14px">
                    <path d="M11 8.414V18h2V8.414l4.293 4.293 1.414-1.414L12 4.586l-6.707 6.707 1.414 1.414z" />
                  </svg>
                </div>
                <span className="text-sm text-gray-300">Robo</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="14px" height="14px">
                    <path d="M10.5 1.875a1.125 1.125 0 0 1 2.25 0v8.219c.517.384 1.651 1.459 1.651 3.219 0 1.766-1.356 3.228-3.151 3.228-1.794 0-3.15-1.462-3.15-3.228 0-1.76 1.134-2.835 1.65-3.219V1.875Z" />
                  </svg>
                </div>
                <span className="text-sm text-gray-300">Asalto</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="14px" height="14px">
                    <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375Z" />
                  </svg>
                </div>
                <span className="text-sm text-gray-300">Hurto</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="14px" height="14px">
                    <path d="M15.75 4.5a3 3 0 1 1 .825 2.066l-8.421 4.679a3.002 3.002 0 0 1-1.51 4.744l-.113.035a3 3 0 0 1-3.585-3.586l.035-.113a3.002 3.002 0 0 1 4.744-1.51l4.679-8.42A2.997 2.997 0 0 1 15.75 4.5Z" />
                  </svg>
                </div>
                <span className="text-sm text-gray-300">Vandalismo</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="14px" height="14px">
                    <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Z" clip-rule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm text-gray-300">Actividad sospechosa</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="14px" height="14px">
                    <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742Z" clip-rule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm text-gray-300">Otros</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Report button - Larger and more visible */}
      <div className="absolute bottom-6 right-6 z-[1000]">
        <button
          onClick={() => window.location.href = '/report'}
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-full w-20 h-20 flex flex-col items-center justify-center shadow-xl transition-all hover:shadow-2xl transform hover:scale-105 border-2 border-blue-400/30 animate-pulse"
          title="Reportar un incidente"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium">REPORTAR</span>
        </button>
      </div>

      {/* Incidents mode markers */}
      {mode === 'incidents' && incidents && incidents.length > 0 && incidents.map((incident) => {
        // Si estamos editando un incidente, solo mostrar ese incidente
        if (editingIncident && incident._id !== editingIncident._id) {
          return null;
        }

        const isEditing = editingIncident?._id === incident._id;
        const isHovered = hoveredIncidentId === incident._id;

        return (
          <Marker
            key={incident._id}
            position={[incident.location.coordinates[1], incident.location.coordinates[0]]}
            icon={isEditing ? editingMarkerIcon : (isHovered ? hoverMarkerIcon : getMarkerIconByType(incident))}
            eventHandlers={{
              click: () => handleIncidentMarkerClick(incident),
              mouseover: () => setHoveredIncidentId(incident._id || null),
              mouseout: () => setHoveredIncidentId(null),
              dragend: (e) => handleIncidentMarkerDrag(e, incident)
            }}
            draggable={isEditing}
          >
            <Popup className="leaflet-popup-improved">
              <div className="rounded-lg overflow-hidden shadow-lg">
                <style>{customPopupStyle}</style>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${incident.type === 'robbery' ? 'bg-red-100 text-red-800' :
                      incident.type === 'assault' ? 'bg-orange-100 text-orange-800' :
                        incident.type === 'theft' ? 'bg-yellow-100 text-yellow-800' :
                          incident.type === 'vandalism' ? 'bg-green-100 text-green-800' :
                            incident.type === 'suspicious' ? 'bg-cyan-100 text-cyan-800' :
                              'bg-purple-100 text-purple-800'}`}>
                      {incident.type || 'Sin clasificar'}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${incident.status === 'verified' ? 'bg-blue-100 text-blue-800' :
                      incident.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'}`}>
                      {incident.status === 'verified' ? 'Verificado' :
                        incident.status === 'resolved' ? 'Resuelto' : 'Pendiente'}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">{incident.description}</h3>

                  <div className="text-sm text-gray-600 mb-3">
                    <div className="flex items-center mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{incident.address}</span>
                    </div>
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{incident.date} {incident.time}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => handleIncidentMarkerClick(incident)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                    >
                      Ver detalles
                    </button>
                    {isEditing && (
                      <div className="text-xs text-blue-500">
                        {isEditing ? 'Arrastra para mover' : 'Click para editar'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
