'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FiArrowLeft, FiNavigation } from 'react-icons/fi';

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address?: string }) => void;
  onClose: () => void;
}

interface LocationPickerState {
  selectedLocation: { lat: number; lng: number } | null;
  searchQuery: string;
  searchResults: Array<{ lat: number; lng: number; description: string }>;
  isSearching: boolean;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

const LocationPicker = ({ onLocationSelect, onClose }: LocationPickerProps) => {
  const t = useTranslations('Chat');
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const searchBoxRef = useRef<any>(null);

  const [state, setState] = useState<LocationPickerState>({
    selectedLocation: null,
    searchQuery: '',
    searchResults: [],
    isSearching: false
  });

  const [mapCenter, setMapCenter] = useState({ lat: -38.0055, lng: -57.5426 }); // Mar del Plata por defecto
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Obtener ubicación del usuario
  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userLoc = { lat: latitude, lng: longitude };
          setUserLocation(userLoc);
          setMapCenter(userLoc);

          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter(userLoc);
            mapInstanceRef.current.setZoom(15);
          }
        },
        (error) => {
          console.log('Error obteniendo ubicación:', error);
        }
      );
    }
  }, []);

  // Inicializar Google Maps
  const initMap = useCallback(() => {
    if (!mapRef.current || !window.google) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: mapCenter,
      zoom: 13,
      styles: [
        {
          featureType: 'all',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#ffffff' }]
        },
        {
          featureType: 'all',
          elementType: 'labels.text.stroke',
          stylers: [{ color: '#000000' }, { lightness: 13 }]
        },
        {
          featureType: 'administrative',
          elementType: 'geometry.fill',
          stylers: [{ color: '#000000' }]
        },
        {
          featureType: 'administrative',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#144b53' }, { lightness: 14 }]
        },
        {
          featureType: 'landscape',
          elementType: 'all',
          stylers: [{ color: '#08304b' }]
        },
        {
          featureType: 'poi',
          elementType: 'geometry',
          stylers: [{ color: '#0c4152' }, { lightness: 5 }]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry.fill',
          stylers: [{ color: '#000000' }]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#0b434f' }, { lightness: 25 }]
        },
        {
          featureType: 'road.arterial',
          elementType: 'geometry.fill',
          stylers: [{ color: '#000000' }]
        },
        {
          featureType: 'road.arterial',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#0b3d51' }, { lightness: 16 }]
        },
        {
          featureType: 'road.local',
          elementType: 'geometry',
          stylers: [{ color: '#000000' }]
        },
        {
          featureType: 'transit',
          elementType: 'all',
          stylers: [{ color: '#146474' }]
        },
        {
          featureType: 'water',
          elementType: 'all',
          stylers: [{ color: '#021019' }]
        }
      ]
    });

    mapInstanceRef.current = map;

    // Agregar marcador de ubicación del usuario
    if (userLocation) {
      new window.google.maps.Marker({
        position: userLocation,
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#10B981',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        },
        title: 'Tu ubicación'
      });
    }

    // Agregar marcador para ubicación seleccionada
    markerRef.current = new window.google.maps.Marker({
      position: mapCenter,
      map: map,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#3B82F6',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3
      },
      title: 'Ubicación seleccionada',
      visible: false
    });

    // Evento de clic en el mapa
    map.addListener('click', (event: any) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      setState(prev => ({ ...prev, selectedLocation: { lat, lng } }));

      if (markerRef.current) {
        markerRef.current.setPosition(event.latLng);
        markerRef.current.setVisible(true);
      }

      // Obtener dirección usando Geocoding
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: event.latLng }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          setState(prev => ({
            ...prev,
            searchQuery: results[0].formatted_address
          }));
        }
      });
    });

    // Inicializar SearchBox
    const input = document.getElementById('search-input') as HTMLInputElement;
    if (input) {
      searchBoxRef.current = new window.google.maps.places.SearchBox(input);

      searchBoxRef.current.addListener('places_changed', () => {
        const places = searchBoxRef.current.getPlaces();

        if (places.length === 0) return;

        const place = places[0];
        if (!place.geometry || !place.geometry.location) return;

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        setState(prev => ({
          ...prev,
          selectedLocation: { lat, lng },
          searchQuery: place.formatted_address || ''
        }));

        setMapCenter({ lat, lng });

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter({ lat, lng });
          mapInstanceRef.current.setZoom(16);
        }

        if (markerRef.current) {
          markerRef.current.setPosition({ lat, lng });
          markerRef.current.setVisible(true);
        }
      });
    }
  }, [mapCenter, userLocation]);

  // Cargar Google Maps API
  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;

      window.initMap = initMap;

      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
        delete window.initMap;
      };
    } else {
      initMap();
    }
  }, [initMap]);

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  const handleSearchChange = (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  };

  const handleConfirm = () => {
    if (state.selectedLocation) {
      onLocationSelect({
        lat: state.selectedLocation.lat,
        lng: state.selectedLocation.lng,
        address: state.searchQuery || undefined
      });
    }
  };

  const handleGoToUserLocation = () => {
    if (userLocation && mapInstanceRef.current) {
      setMapCenter(userLocation);
      mapInstanceRef.current.setCenter(userLocation);
      mapInstanceRef.current.setZoom(15);

      setState(prev => ({ ...prev, selectedLocation: userLocation }));

      if (markerRef.current) {
        markerRef.current.setPosition(userLocation);
        markerRef.current.setVisible(true);
      }
    }
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{
        type: 'spring',
        damping: 25,
        stiffness: 200,
        duration: 0.5
      }}
      className="fixed inset-0 bg-gray-900 z-[500] flex flex-col"
    >
      {/* Header */}
      <div className="bg-gray-900/95 backdrop-blur-md border-b border-gray-800/50 px-4 py-4 flex items-center justify-between">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-white">Seleccionar Ubicación</h2>
        <div className="w-10">{/* Spacer */}</div>
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-gray-800/50 p-4 border-b border-gray-700/50">
        <div className="relative">
          <input
            id="search-input"
            type="text"
            value={state.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar dirección o lugar..."
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 pr-12"
          />

          <button
            onClick={handleGoToUserLocation}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-white transition-colors"
            title="Ir a mi ubicación"
          >
            <FiNavigation className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          Escribe una dirección o haz clic en el mapa para seleccionar una ubicación
        </p>
      </div>

      {/* Mapa */}
      <div className="flex-1 relative">
        <div
          ref={mapRef}
          className="w-full h-full"
          style={{ height: '100%' }}
        />
      </div>

      {/* Footer con botones */}
      <div className="bg-gray-800/50 p-4 border-t border-gray-700/50">
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            disabled={!state.selectedLocation}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {state.selectedLocation ? 'Confirmar Ubicación' : 'Selecciona una ubicación'}
          </button>
        </div>

        {/* Información de ubicación seleccionada */}
        {state.selectedLocation && (
          <div className="mt-3 p-3 bg-blue-600/20 border border-blue-500/40 rounded-lg">
            <div className="text-blue-300 text-sm font-medium">Ubicación seleccionada:</div>
            <div className="text-blue-200 text-xs">
              Lat: {state.selectedLocation.lat.toFixed(6)}, Lng: {state.selectedLocation.lng.toFixed(6)}
            </div>
            {state.searchQuery && (
              <div className="text-blue-200 text-xs mt-1">
                Dirección: {state.searchQuery}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LocationPicker;
