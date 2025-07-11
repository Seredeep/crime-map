import { Incident } from "../../types/global";

export interface MapComponentProps {
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
