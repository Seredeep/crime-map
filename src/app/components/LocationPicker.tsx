'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FiArrowLeft, FiMapPin, FiNavigation } from 'react-icons/fi';
import styles from './LocationPicker.module.css';

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address?: string }) => void;
  onClose: () => void;
}

interface LocationPickerState {
  selectedLocation: { lat: number; lng: number } | null;
  searchQuery: string;
  searchResults: Array<{ lat: number; lng: number; description: string }>;
  isSearching: boolean;
  mapLoaded: boolean;
  mapError: string | null;
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
    isSearching: false,
    mapLoaded: false,
    mapError: null
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

          if (mapInstanceRef.current && state.mapLoaded) {
            try {
              mapInstanceRef.current.setCenter(userLoc);
              mapInstanceRef.current.setZoom(15);
            } catch (error) {
              console.warn('Error setting map center:', error);
            }
          }
        },
        (error) => {
          console.log('Error obteniendo ubicación:', error);
        }
      );
    }
  }, [state.mapLoaded]);

  // Inicializar Google Maps de forma segura
  const initMap = useCallback(() => {
    try {
      if (!mapRef.current || !window.google || !window.google.maps) {
        console.warn('Google Maps no está disponible');
        setState(prev => ({ ...prev, mapError: 'Google Maps no está disponible' }));
        return;
      }

      const map = new window.google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom: 13,
        gestureHandling: 'cooperative',
        scrollwheel: false,
        disableDoubleClickZoom: true,
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_TOP
        },
        draggable: true,
        maxZoom: 18,
        minZoom: 10,
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
        try {
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
        } catch (error) {
          console.warn('Error creating user location marker:', error);
        }
      }

      // Agregar listener para clics en el mapa
      map.addListener('click', (e: any) => {
        try {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();

          setState(prev => ({
            ...prev,
            selectedLocation: { lat, lng }
          }));

          // Actualizar marcador seleccionado
          if (markerRef.current) {
            markerRef.current.setMap(null);
          }

          markerRef.current = new window.google.maps.Marker({
            position: { lat, lng },
            map: map,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#EF4444',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3
            },
            title: 'Ubicación seleccionada'
          });
        } catch (error) {
          console.error('Error handling map click:', error);
        }
      });

      // Inicializar SearchBox de forma segura
      try {
        const input = document.getElementById('search-input') as HTMLInputElement;
        if (input && window.google.maps.places) {
          searchBoxRef.current = new window.google.maps.places.SearchBox(input);

          searchBoxRef.current.addListener('places_changed', () => {
            try {
              const places = searchBoxRef.current.getPlaces();
              if (places && places.length > 0) {
                const place = places[0];
                if (place.geometry && place.geometry.location) {
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
                }
              }
            } catch (error) {
              console.error('Error handling places changed:', error);
            }
          });
        }
      } catch (error) {
        console.warn('Error initializing SearchBox:', error);
      }

      setState(prev => ({ ...prev, mapLoaded: true, mapError: null }));
      console.log('Google Maps inicializado correctamente');

    } catch (error) {
      console.error('Error inicializando Google Maps:', error);
      setState(prev => ({
        ...prev,
        mapError: 'Error al cargar el mapa. Intenta recargar la página.'
      }));
    }
  }, [mapCenter, userLocation]);

  // Cargar Google Maps API de forma segura
  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        if (!window.google || !window.google.maps) {
          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

          if (!apiKey) {
            setState(prev => ({
              ...prev,
              mapError: 'API key de Google Maps no configurada'
            }));
            return;
          }

          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
          script.async = true;
          script.defer = true;

          // Función global para callback
          window.initMap = () => {
            setTimeout(() => {
              try {
                initMap();
              } catch (error) {
                console.error('Error en callback de Google Maps:', error);
                setState(prev => ({
                  ...prev,
                  mapError: 'Error al cargar Google Maps'
                }));
              }
            }, 100);
          };

          script.onerror = () => {
            setState(prev => ({
              ...prev,
              mapError: 'Error al cargar Google Maps'
            }));
          };

          document.head.appendChild(script);

          return () => {
            try {
              document.head.removeChild(script);
              if ('initMap' in window) {
                delete (window as any).initMap;
              }
            } catch (error) {
              console.warn('Error cleaning up Google Maps script:', error);
            }
          };
        } else {
          // Google Maps ya está cargado
          setTimeout(() => {
            try {
              initMap();
            } catch (error) {
              console.error('Error inicializando mapa existente:', error);
            }
          }, 100);
        }
      } catch (error) {
        console.error('Error cargando Google Maps:', error);
        setState(prev => ({
          ...prev,
          mapError: 'Error inesperado al cargar el mapa'
        }));
      }
    };

    loadGoogleMaps();
  }, [initMap]);

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  const handleSearchChange = (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  };

  const handleMapContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleMapContainerTouch = (e: React.TouchEvent) => {
    e.stopPropagation();
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
    if (userLocation && mapInstanceRef.current && state.mapLoaded) {
      try {
        setMapCenter(userLocation);
        mapInstanceRef.current.setCenter(userLocation);
        mapInstanceRef.current.setZoom(15);

        setState(prev => ({ ...prev, selectedLocation: userLocation }));

        if (markerRef.current) {
          markerRef.current.setPosition(userLocation);
          markerRef.current.setVisible(true);
        }
      } catch (error) {
        console.error('Error going to user location:', error);
      }
    }
  };

  // Componente de fallback si hay error
  if (state.mapError) {
    return (
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className={`fixed inset-0 bg-gray-900 z-[500] flex flex-col ${styles.modalContainer}`}
      >
        <div className="bg-gray-900/95 backdrop-blur-md border-b border-gray-800/50 px-4 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-white">Seleccionar Ubicación</h2>
          <div className="w-10"></div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <FiMapPin className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Error al cargar el mapa</h3>
            <p className="text-gray-400 mb-4">{state.mapError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Recargar página
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

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
      className={`fixed inset-0 bg-gray-900 z-[500] flex flex-col ${styles.modalContainer}`}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
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
        <div className="w-10"></div>
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
            className={`w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 pr-12 ${styles.searchInput}`}
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
      <div
        className={`flex-1 relative ${styles.mapWrapper}`}
        onClick={handleMapContainerClick}
        onTouchStart={handleMapContainerTouch}
        onTouchMove={handleMapContainerTouch}
        onTouchEnd={handleMapContainerTouch}
      >
        {!state.mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-400">Cargando mapa...</p>
            </div>
          </div>
        )}

        <div
          ref={mapRef}
          className={`w-full h-full ${styles.mapContainer}`}
          style={{ height: '100%' }}
        />
      </div>

      {/* Footer con botones */}
      <div className="bg-gray-800/50 p-4 border-t border-gray-700/50">
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors ${styles.actionButton}`}
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            disabled={!state.selectedLocation}
            className={`flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors ${styles.actionButton}`}
          >
            {state.selectedLocation ? 'Confirmar Ubicación' : 'Selecciona una ubicación'}
          </button>
        </div>

        {/* Información de ubicación seleccionada */}
        {state.selectedLocation && (
          <div className={`mt-3 p-3 bg-blue-600/20 border border-blue-500/40 rounded-lg ${styles.locationIndicator}`}>
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
