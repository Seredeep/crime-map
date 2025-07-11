'use client';

import { GeocodingResult } from '@/lib/services/geo';
import React, { useCallback, useEffect, useState } from 'react';
import { FiSearch } from 'react-icons/fi';

interface GeocodeSearchProps {
  onLocationSelect?: (result: GeocodingResult) => void;
  placeholder?: string;
  className?: string;
  selectedAddress?: string;
  selectedCoordinates?: [number, number] | null;
}

export default function GeocodeSearch({
  onLocationSelect,
  placeholder = 'Buscar dirección o lugar...',
  className = '',
  selectedAddress,
  selectedCoordinates,
}: GeocodeSearchProps) {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Cache for place details to avoid repeated API calls
  const [placeDetailsCache, setPlaceDetailsCache] = useState<Map<string, GeocodingResult>>(new Map());

  // Use useEffect to mark component as mounted on the client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Generate session token for Google Places API cost optimization
  const generateSessionToken = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const [sessionToken, setSessionToken] = useState(() => generateSessionToken());

  // Manual search function - only called when button is clicked
  const handleSearch = useCallback(async () => {
    if (!query.trim() || query.trim().length < 2) {
      setError('Ingresa al menos 2 caracteres para buscar');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}&sessiontoken=${sessionToken}`);

      if (!response.ok) {
        throw new Error('Failed to fetch geocoding results');
      }

      const data = await response.json();
      setResults(data.features || []);
      setShowResults(true);
    } catch (err) {
      setError('Error buscando ubicación. Intenta nuevamente.');
      console.error('Geocoding error:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, sessionToken]);

  const handleSelectResult = async (result: GeocodingResult) => {
    // If the result doesn't have coordinates, fetch the full details
    if (result.geometry.coordinates[0] === 0 && result.geometry.coordinates[1] === 0) {
      try {
        setIsLoading(true);

        // Check cache first
        const cachedResult = placeDetailsCache.get(result.properties.id);
        if (cachedResult) {
          result = cachedResult;
        } else {
          // Fetch details with session token
          const response = await fetch('/api/geocode', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              placeId: result.properties.id,
              sessiontoken: sessionToken
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to fetch place details');
          }

          const data = await response.json();
          if (data.features && data.features.length > 0) {
            result = data.features[0];

            // Cache the result
            setPlaceDetailsCache(prev => {
              const newCache = new Map(prev);
              newCache.set(result.properties.id, result);
              return newCache;
            });
          }
        }
      } catch (err) {
        console.error('Error fetching place details:', err);
        setError('Error obteniendo detalles de ubicación. Intenta nuevamente.');
      } finally {
        setIsLoading(false);
      }
    }

    if (onLocationSelect) {
      onLocationSelect(result);
    }

    // Clear results after selection and generate new session token for next session
    setResults([]);
    setQuery('');
    setShowResults(false);
    setSessionToken(generateSessionToken());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    // Clear previous results when typing
    if (showResults) {
      setShowResults(false);
      setResults([]);
    }
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // If not mounted yet, render a placeholder
  if (!isMounted) {
    return (
      <div className={`geocode-search ${className || ''}`}>
        <div className="flex">
          <div className="flex-grow px-4 py-3 bg-gray-700 border border-gray-600 rounded-l-xl opacity-50">
            {placeholder}
          </div>
          <div className="px-4 py-3 bg-blue-500 text-white rounded-r-xl opacity-50">
            <FiSearch className="w-5 h-5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`geocode-search ${className || ''}`}>
      <div className="flex">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-grow px-4 py-3 bg-gray-700 border border-gray-600 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 transition-all"
        />
        <button
          type="button"
          onClick={handleSearch}
          className="px-4 py-3 bg-blue-500 text-white rounded-r-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || !query.trim()}
        >
          {isLoading ? (
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <FiSearch className="w-5 h-5" />
          )}
        </button>
      </div>

      {error && (
        <div className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {showResults && results.length > 0 && (
        <div className="mt-2 bg-gray-800 border border-gray-600 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {results.map((result) => (
            <div
              key={result.properties.gid}
              className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-600 last:border-b-0 text-white transition-all"
              onClick={() => handleSelectResult(result)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">
                    {result.properties.main_text || result.properties.name}
                  </p>
                  <p className="text-sm text-gray-300 truncate">
                    {result.properties.secondary_text || result.properties.locality || result.properties.label}
                  </p>
                  {result.properties.housenumber && (
                    <p className="text-xs text-blue-300 mt-1">
                      📍 Número {result.properties.housenumber}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Display selected address */}
      {selectedAddress && (
        <div className="mt-3 p-4 bg-green-500/20 border border-green-400/30 rounded-xl text-white">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2 flex-1">
              <p className="font-medium text-sm mb-1 text-green-100">📍 Ubicación seleccionada:</p>
              <p className="text-sm text-green-50 break-words">{selectedAddress}</p>
              {selectedCoordinates && (
                <p className="mt-1 text-xs text-green-200">
                  GPS: {selectedCoordinates[0].toFixed(6)}, {selectedCoordinates[1].toFixed(6)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
