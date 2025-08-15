'use client';

// #region External Libraries
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
// #endregion

// #region Internal Services & Types
import { reverseGeocode } from '@/lib/services/geo';
import { updateIncident } from '@/lib/services/incidents/incidentService';
import { Neighborhood } from '@/lib/services/neighborhoods';
import { Incident } from '@/lib/types/global';
import { useSession } from 'next-auth/react';
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

// #region User Location Helper
const getUserLocationCoordinates = (user: any): [number, number] => {
  console.log('🔍 getUserLocationCoordinates - User data:', user);

  if (!user) {
    console.log('⚠️ No user data, defaulting to San Francisco');
    return [37.7749, -122.4194];
  }

  // Mapeo de ciudades específicas a sus coordenadas
  const cityCoordinates: { [key: string]: [number, number] } = {
    'Mar del Plata': [-38.0055, -57.5426],
    'San Francisco': [37.7749, -122.4194],
    // Puedes agregar más ciudades aquí según sea necesario
  };

  console.log('🏙️ User city:', user.city);
  console.log('🗺️ Available cities:', Object.keys(cityCoordinates));

  // Si el usuario tiene una ciudad específica, usar esas coordenadas
  if (user.city && cityCoordinates[user.city]) {
    console.log('✅ Using coordinates for city:', user.city, cityCoordinates[user.city]);
    return cityCoordinates[user.city];
  }

  console.log('⚠️ City not found or no city data, defaulting to San Francisco');
  // Fallback: usar San Francisco por defecto
  return [37.7749, -122.4194];
};
// #endregion

// #region Custom Marker Icons
const createMarkerIcon = (color: string, size: number = 35, iconType: string = 'default') => {
  // Create a canvas element for better rendering
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    // Fallback to default Leaflet icon if canvas is not available
    return L.Icon.Default.prototype;
  }

  // Set canvas size with higher resolution for better quality
  const scale = 2;
  canvas.width = size * scale;
  canvas.height = (size + 15) * scale;

  // Scale context for high DPI
  ctx.scale(scale, scale);

  // Clear canvas
  ctx.clearRect(0, 0, size, size + 15);

  // Draw marker shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(size/2 + 2, size + 13, size/2.5, size/6, 0, 0, 2 * Math.PI);
  ctx.fill();

  // Draw main marker body (teardrop shape)
  ctx.fillStyle = color;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(2, size / 16);

  ctx.beginPath();
  ctx.moveTo(size/2, size + 10);
  ctx.quadraticCurveTo(size * 0.15, size * 0.7, size/2, size * 0.15);
  ctx.quadraticCurveTo(size * 0.85, size * 0.7, size/2, size + 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Draw inner circle
  ctx.fillStyle = color;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1, size / 20);

  ctx.beginPath();
  ctx.arc(size/2, size * 0.45, size * 0.3, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  // Draw icon based on type (only for larger sizes)
  if (size >= 20) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1, size / 20);

    const iconCenterX = size/2;
    const iconCenterY = size * 0.45;
    const iconSize = size * 0.2;

    switch (iconType) {
      case 'robbery':
      case 'robo':
        // Dollar sign
        ctx.font = `bold ${iconSize * 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', iconCenterX, iconCenterY);
        break;
      case 'assault':
      case 'asalto':
        // Shield shape
        ctx.beginPath();
        ctx.moveTo(iconCenterX, iconCenterY - iconSize);
        ctx.lineTo(iconCenterX - iconSize, iconCenterY - iconSize * 0.5);
        ctx.lineTo(iconCenterX - iconSize, iconCenterY + iconSize * 0.5);
        ctx.lineTo(iconCenterX, iconCenterY + iconSize);
        ctx.lineTo(iconCenterX + iconSize, iconCenterY + iconSize * 0.5);
        ctx.lineTo(iconCenterX + iconSize, iconCenterY - iconSize * 0.5);
        ctx.closePath();
        ctx.stroke();
        break;
      case 'theft':
      case 'hurto':
        // Hand shape
        ctx.beginPath();
        ctx.arc(iconCenterX, iconCenterY, iconSize, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(iconCenterX, iconCenterY, iconSize * 0.6, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      case 'vandalism':
      case 'vandalismo':
        // Hammer shape
        ctx.beginPath();
        ctx.moveTo(iconCenterX - iconSize, iconCenterY - iconSize);
        ctx.lineTo(iconCenterX + iconSize, iconCenterY + iconSize);
        ctx.moveTo(iconCenterX - iconSize, iconCenterY + iconSize);
        ctx.lineTo(iconCenterX + iconSize, iconCenterY - iconSize);
        ctx.stroke();
        break;
      case 'suspicious':
      case 'actividad sospechosa':
        // Eye shape
        ctx.beginPath();
        ctx.arc(iconCenterX, iconCenterY, iconSize, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(iconCenterX, iconCenterY, iconSize * 0.4, 0, 2 * Math.PI);
        ctx.fill();
        break;
      case 'violence':
      case 'violencia':
        // Fist shape
        ctx.beginPath();
        ctx.arc(iconCenterX, iconCenterY, iconSize, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(iconCenterX, iconCenterY, iconSize * 0.7, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      case 'drugs':
      case 'drogas':
        // Pill shape
        ctx.beginPath();
        ctx.ellipse(iconCenterX - iconSize * 0.3, iconCenterY, iconSize * 0.4, iconSize * 0.6, 0, 0, 2 * Math.PI);
        ctx.ellipse(iconCenterX + iconSize * 0.3, iconCenterY, iconSize * 0.4, iconSize * 0.6, 0, 0, 2 * Math.PI);
        ctx.fill();
        break;
      case 'noise':
      case 'ruido':
        // Sound waves
        ctx.beginPath();
        ctx.arc(iconCenterX, iconCenterY, iconSize, 0, Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(iconCenterX, iconCenterY, iconSize * 0.7, 0, Math.PI);
        ctx.stroke();
        break;
      case 'accident':
      case 'accidente':
        // Car shape
        ctx.beginPath();
        ctx.rect(iconCenterX - iconSize, iconCenterY - iconSize * 0.3, iconSize * 2, iconSize * 0.6);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(iconCenterX - iconSize * 0.5, iconCenterY + iconSize * 0.3, iconSize * 0.3, 0, 2 * Math.PI);
        ctx.arc(iconCenterX + iconSize * 0.5, iconCenterY + iconSize * 0.3, iconSize * 0.3, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      default:
        // Exclamation mark
        ctx.font = `bold ${iconSize * 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', iconCenterX, iconCenterY);
        break;
    }
  }

  // Convert canvas to data URL
  const dataURL = canvas.toDataURL();

  return new L.Icon({
    iconUrl: dataURL,
    iconSize: [size, size + 15],
    iconAnchor: [size / 2, size + 15],
    popupAnchor: [0, -(size + 15)],
    className: 'custom-map-marker'
  });
};

// Marker icons base
const defaultMarkerIcon = createMarkerIcon('#3B82F6', 32);
const editingMarkerIcon = createMarkerIcon('#3B82F6', 28);
const hoverMarkerIcon = createMarkerIcon('#EF4444', 28);

// Tags → colors map (hex) normalized for both Spanish and English tags
const TAG_HEX_COLOR: Record<string, string> = {
  robbery: '#EF4444',
  robo: '#EF4444',
  assault: '#F97316',
  asalto: '#F97316',
  theft: '#F59E0B',
  hurto: '#F59E0B',
  vandalism: '#22C55E',
  vandalismo: '#22C55E',
  suspicious: '#06B6D4',
  'actividad sospechosa': '#06B6D4',
  violence: '#6366F1',
  violencia: '#6366F1',
  drugs: '#8B5CF6',
  drogas: '#8B5CF6',
  noise: '#F59E0B',
  ruido: '#F59E0B',
  accident: '#F43F5E',
  accidente: '#F43F5E',
  other: '#8B5CF6',
  otro: '#8B5CF6',
  default: '#6B7280'
};

// Get primary tag id for an incident
const getPrimaryTagId = (incident: Incident): string => {
  const tag = (incident.tags && incident.tags.length > 0 ? incident.tags[0] : incident.type) || 'default';
  return String(tag).toLowerCase();
};

// Build a marker icon using the primary tag color
const getMarkerIconByType = (incident: Incident, size: number = 24) => {
  const tagId = getPrimaryTagId(incident);
  const color = TAG_HEX_COLOR[tagId] || TAG_HEX_COLOR.default;
  // Use same iconType to render inner glyph according to tagId when possible
  const iconType =
    tagId.includes('robo') || tagId === 'robbery' ? 'robo' :
    tagId.includes('asalto') || tagId === 'assault' ? 'asalto' :
    tagId.includes('hurto') || tagId === 'theft' ? 'hurto' :
    tagId.includes('vandal') ? 'vandalismo' :
    tagId.includes('sospech') || tagId === 'suspicious' || tagId.includes('actividad') ? 'actividad sospechosa' :
    tagId.includes('violenc') || tagId === 'violence' ? 'violencia' :
    'default';
  return createMarkerIcon(color, size, iconType);
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

// Component to handle automatic map centering when marker position changes
function MapCenterUpdater({
  markerPosition,
  mode
}: {
  markerPosition?: [number, number];
  mode?: string;
}) {
  const map = useMap();

  useEffect(() => {
    if (mode === 'form' && markerPosition) {
      // Fly to the new position with zoom
      map.setView(markerPosition, 16, {
        animate: true,
        duration: 1
      });
    }
  }, [map, markerPosition, mode]);

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
  /* Fancy in animation with gentle overshoot and blur fade */
  @keyframes popupIn {
    0%   { opacity: 0; transform: translateY(10px) scale(0.92); filter: blur(6px); }
    60%  { opacity: 1; transform: translateY(0)    scale(1.03); filter: blur(0); }
    100% { opacity: 1; transform: translateY(0)    scale(1);    filter: blur(0); }
  }
  @keyframes tipIn {
    0%   { opacity: 0; transform: translateY(6px) scaleY(0.8); }
    100% { opacity: 1; transform: translateY(0)   scaleY(1); }
  }
  .leaflet-popup-improved .leaflet-popup-content-wrapper {
    padding: 0;
    overflow: hidden;
    border-radius: 0.75rem;
    background: rgba(0, 0, 0, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow:
      0 20px 60px rgba(0, 0, 0, 0.5),
      0 8px 32px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transform-origin: bottom center;
    will-change: transform, opacity;
    animation: popupIn 260ms cubic-bezier(0.2, 0.9, 0.22, 1) both;
    backface-visibility: hidden;
    transform-style: preserve-3d;
  }
  .leaflet-popup-improved .leaflet-popup-content {
    margin: 0;
    width: auto !important;
    color: white;
  }
  .leaflet-popup-improved .leaflet-popup-close-button {
    color: #9ca3af;
    font-size: 18px;
    padding: 8px 8px 0 0;
    background: transparent;
    border: none;
    font-weight: bold;
  }
  .leaflet-popup-improved .leaflet-popup-close-button:hover {
    color: #d1d5db;
  }
  .leaflet-popup-improved .leaflet-popup-tip {
    background: rgba(0, 0, 0, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    animation: tipIn 260ms ease-out both;
  }
  .leaflet-popup-improved .leaflet-popup-tip-container {
    margin-top: -1px;
  }
  /* Reduce motion accessibility */
  @media (prefers-reduced-motion: reduce) {
    .leaflet-popup-improved .leaflet-popup-content-wrapper,
    .leaflet-popup-improved .leaflet-popup-tip {
      animation: none !important;
    }
  }

  /* Estilos específicos para móvil */
  @media (max-width: 768px) {
    .leaflet-popup-improved .leaflet-popup-content-wrapper {
      min-width: 280px;
      max-width: 320px;
    }
  }

  /* Accessibility improvements */
  .leaflet-popup-improved .leaflet-popup-close-button:focus {
    outline: 2px solid #3B82F6;
    outline-offset: 2px;
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .leaflet-popup-improved .leaflet-popup-content-wrapper {
      border: 2px solid #ffffff;
      background: #000000;
    }
    .leaflet-popup-improved .leaflet-popup-tip {
      border: 2px solid #ffffff;
      background: #000000;
    }
  }

  /* Screen reader only content */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Focus indicators for keyboard navigation */
  button:focus,
  [tabindex]:focus {
    outline: 2px solid #3B82F6;
    outline-offset: 2px;
  }

  /* Skip link for accessibility */
  .skip-link {
    position: absolute;
    top: -40px;
    left: 6px;
    background: #000000;
    color: white;
    padding: 8px;
    text-decoration: none;
    z-index: 10000;
  }

  .skip-link:focus {
    top: 6px;
  }
`;

// Función para detectar si estamos en móvil
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768;
};

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
  const { data: session } = useSession();

  useEffect(() => {
    fixLeafletIcons();
  }, []);

  console.log('🔍 MapComponent - Session data:', session);
  console.log('👤 Session user:', session?.user);

  // Get user location coordinates based on their city
  const userCoordinates = getUserLocationCoordinates(session?.user);
  const defaultCenter: L.LatLngExpression = userCoordinates;

  // Using state for marker position to allow updates
  const [position, setPosition] = useState<[number, number] | undefined>(markerPosition);

  // State to track which incident marker is being hovered over
  const [hoveredIncidentId, setHoveredIncidentId] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState<boolean>(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState<boolean>(false);

  // Translations
  const tMap = useTranslations('Map');
  const tFilters = useTranslations('Filters');
  const tIncidentList = useTranslations('IncidentList');
  const tIncidentTypes = useTranslations('incidentTypes');

  // Helpers to localize tag labels
  const mapEnglishToSpanishKey = (id: string): string => {
    const lower = id.toLowerCase();
    const mapping: Record<string, string> = {
      robbery: 'robo',
      assault: 'asalto',
      theft: 'hurto',
      vandalism: 'vandalismo',
      suspicious: 'sospechoso',
      violence: 'violencia',
      drugs: 'drogas',
      noise: 'ruido',
      accident: 'accidente',
    };
    return mapping[lower] || lower;
  };

  const getLocalizedTagLabel = (tagId: string): string => {
    const key = mapEnglishToSpanishKey(tagId);
    try {
      const label = tIncidentTypes(`${key}.label` as any);
      if (label) return label;
    } catch {}
    try {
      const raw = (tFilters as any)(`commonTags.${key}`);
      if (raw) return raw.charAt(0).toUpperCase() + raw.slice(1);
    } catch {}
    return key.charAt(0).toUpperCase() + key.slice(1);
  };

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
    // On mobile, keep default behavior (only popup) when clicking the marker itself
    if (isMobile()) return;
    onIncidentSelect?.(incident);
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
    <div
      role="application"
      aria-label="Mapa interactivo de incidentes"
      className="w-full h-screen"
    >
      {/* Main map content */}
      <div id="map-content" tabIndex={-1}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        dragging={true}
        className="w-full h-screen"
        zoomControl={false}
        attributionControl={false}
        keyboard={true}
        keyboardPanDelta={50}
      >
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

      {/* Automatic map centering for form mode */}
      <MapCenterUpdater
        markerPosition={position}
        mode={mode}
      />

      {/* Click handler for form mode */}
      {mode === 'form' && setMarkerOnClick && (
        <MapClickHandler
          onMapClick={handleMapClick}
          setMarkerOnClick={true}
        />
      )}

      {/* Ajustar zoom al barrio si está seleccionado */}
      {selectedNeighborhood && (
        <NeighborhoodFitBounds key={`bounds-${selectedNeighborhood._id}`} neighborhood={selectedNeighborhood} />
      )}

      {/* Renderizar barrio seleccionado con GeoJSON */}
      {selectedNeighborhood && (
        <GeoJSON
          key={`geojson-${selectedNeighborhood._id}`}
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
              <h3 className="font-semibold">{selectedNeighborhood.properties?.soc_fomen || selectedNeighborhood.properties?.name || 'Barrio'}</h3>
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
          aria-label="Marcador de ubicación seleccionada"
        >
          <Popup className="text-black">
            <div className="text-sm" role="dialog" aria-label="Información de ubicación">
              <strong>Ubicación seleccionada</strong><br />
              <span aria-label={`Latitud: ${position[0].toFixed(6)}, Longitud: ${position[1].toFixed(6)}`}>
                {position[0].toFixed(6)}, {position[1].toFixed(6)}
              </span>
            </div>
          </Popup>
        </Marker>
      )}
      {/* Map Legend */}
      <div
        className="absolute bottom-4 left-4 z-[1000] bg-gray-900/90 backdrop-blur-md rounded-lg shadow-lg border border-gray-700/50 p-2 text-white"
        role="region"
        aria-label="Leyenda del mapa"
      >
        <div className="flex items-center">
          <button
            onClick={() => setShowLegend(!showLegend)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowLegend(!showLegend);
              }
            }}
            className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-800 rounded-lg transition-colors w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            aria-expanded={showLegend}
            aria-controls="map-legend-content"
            aria-label={showLegend ? 'Ocultar leyenda del mapa' : 'Mostrar leyenda del mapa'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-sm">{showLegend ? 'Ocultar leyenda' : 'Mostrar leyenda'}</span>
          </button>
        </div>

        {showLegend && (
          <div
            id="map-legend-content"
            className="mt-2 p-2 space-y-2 border-t border-gray-700"
            role="group"
            aria-labelledby="legend-title"
          >
            <h4 id="legend-title" className="font-medium text-sm mb-2 text-gray-200">Tipos de incidentes</h4>
            <div className="grid grid-cols-1 gap-3" role="list">
              <div className="flex items-center space-x-3" role="listitem">
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="14px" height="14px">
                    <path d="M11 8.414V18h2V8.414l4.293 4.293 1.414-1.414L12 4.586l-6.707 6.707 1.414 1.414z" />
                  </svg>
                </div>
                <span className="text-sm text-gray-300">Robo</span>
              </div>
              <div className="flex items-center space-x-3" role="listitem">
                <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="14px" height="14px">
                    <path d="M10.5 1.875a1.125 1.125 0 0 1 2.25 0v8.219c.517.384 1.651 1.459 1.651 3.219 0 1.766-1.356 3.228-3.151 3.228-1.794 0-3.15-1.462-3.15-3.228 0-1.76 1.134-2.835 1.65-3.219V1.875Z" />
                  </svg>
                </div>
                <span className="text-sm text-gray-300">Asalto</span>
              </div>
              <div className="flex items-center space-x-3" role="listitem">
                <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="14px" height="14px">
                    <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375Z" />
                  </svg>
                </div>
                <span className="text-sm text-gray-300">Hurto</span>
              </div>
              <div className="flex items-center space-x-3" role="listitem">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="14px" height="14px">
                    <path d="M15.75 4.5a3 3 0 1 1 .825 2.066l-8.421 4.679a3.002 3.002 0 0 1-1.51 4.744l-.113.035a3 3 0 0 1-3.585-3.586l.035-.113a3.002 3.002 0 0 1 4.744-1.51l4.679-8.42A2.997 2.997 0 0 1 15.75 4.5Z" />
                  </svg>
                </div>
                <span className="text-sm text-gray-300">Vandalismo</span>
              </div>
              <div className="flex items-center space-x-3" role="listitem">
                <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="14px" height="14px">
                    <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Z" clip-rule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm text-gray-300">Actividad sospechosa</span>
              </div>
              <div className="flex items-center space-x-3" role="listitem">
                <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center" aria-hidden="true">
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
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              window.location.href = '/report';
            }
          }}
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-full w-20 h-20 flex flex-col items-center justify-center shadow-xl transition-all hover:shadow-2xl transform hover:scale-105 border-2 border-blue-400/30 animate-pulse focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-transparent"
          title={tMap('reportIncident')}
          aria-label={tMap('reportIncident')}
          role="button"
          tabIndex={0}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium">{tMap('report')}</span>
        </button>
      </div>

      {/* Screen Reader Announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="map-announcements"
      >
        {mode === 'form' && position && (
          <span>
            Ubicación seleccionada en el mapa: Latitud {position[0].toFixed(6)}, Longitud {position[1].toFixed(6)}
          </span>
        )}
        {mode === 'incidents' && incidents.length > 0 && (
          <span>
            Mostrando {incidents.length} incidente{incidents.length !== 1 ? 's' : ''} en el mapa
          </span>
        )}
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
            icon={getMarkerIconByType(incident, (isEditing || isHovered) ? 28 : 24)}
            eventHandlers={{
              click: () => handleIncidentMarkerClick(incident),
              mouseover: () => setHoveredIncidentId(incident._id || null),
              mouseout: () => setHoveredIncidentId(null),
              dragend: (e) => handleIncidentMarkerDrag(e, incident)
            }}
            draggable={isEditing}
            aria-label={`Incidente de ${incident.type || 'tipo desconocido'} en ${incident.address}`}
          >
            <Popup className="leaflet-popup-improved">
              <div className="rounded-lg overflow-hidden">
                <style>{customPopupStyle}</style>
                <div className="p-3">
                  {/* Evidence image preview if available */}
                  {incident.evidenceUrls && incident.evidenceUrls.length > 0 && (
                    <div className="mb-2 overflow-hidden rounded-md border border-gray-700/40 relative">
                      <div className="w-full h-28 bg-gray-800/50 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={incident.evidenceUrls[0]}
                        alt=""
                        className="w-full h-28 object-cover absolute inset-0 opacity-0 transition-opacity duration-300"
                        loading="lazy"
                        onLoad={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.classList.remove('opacity-0');
                          target.classList.add('opacity-100');
                          // Ocultar el spinner
                          const spinner = target.parentElement?.querySelector('.animate-spin');
                          if (spinner) {
                            spinner.classList.add('hidden');
                          }
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.classList.add('hidden');
                          // Mostrar mensaje de error
                          const container = target.parentElement;
                          if (container) {
                            container.innerHTML = `
                              <div class="w-full h-28 bg-gray-800/50 flex items-center justify-center text-gray-400 text-sm">
                                <svg class="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Error al cargar imagen
                              </div>
                            `;
                          }
                        }}
                      />
                    </div>
                  )}
                  {/* Header con badges: estado a la izquierda, tipo a la derecha */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full font-semibold border ${
                      incident.status === 'verified' ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' :
                      incident.status === 'resolved' ? 'bg-green-500/20 text-green-300 border-green-400/30' :
                      'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
                    }`}>
                      {incident.status === 'verified'
                        ? tIncidentList('verified')
                        : incident.status === 'resolved'
                        ? tFilters('resolved')
                        : tFilters('pending')}
                    </span>
                    {(() => {
                      const tagId = getPrimaryTagId(incident);
                      const color = TAG_HEX_COLOR[tagId] || TAG_HEX_COLOR.default;
                      const style = {
                        backgroundColor: `${color}33`,
                        color,
                        borderColor: `${color}55`
                      } as React.CSSProperties;
                      const label = getLocalizedTagLabel(tagId);
                      return (
                        <span
                          className="px-2 py-1 text-xs rounded-full font-medium border"
                          style={style}
                        >
                          {label}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Descripción */}
                  <h3 className="font-semibold text-white text-sm mb-2 line-clamp-2 leading-tight">
                    {incident.description}
                  </h3>

                  {/* Información de ubicación y fecha */}
                  <div className="text-xs text-gray-300 space-y-1 mb-3">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{incident.address}</span>
                    </div>
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{incident.date} {incident.time}</span>
                    </div>
                  </div>

                  {/* Footer con acciones */}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-700/30">
                    <button
                      onClick={(e) => { e.stopPropagation(); onIncidentSelect?.(incident); }}
                      className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors flex items-center"
                      aria-label="Ver detalles del incidente"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {tIncidentList('tapToViewOnMap')}
                    </button>
                    {isEditing && (
                      <div className="text-xs text-blue-400 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                        Arrastra para mover
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
      </div>
    </div>
  );
}
