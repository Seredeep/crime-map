'use client';

import { GeocodingResult } from '@/lib/services/geo';
import { useTranslations } from 'next-intl';
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
  placeholder,
  className = '',
  selectedAddress,
  selectedCoordinates,
}: GeocodeSearchProps) {
  const t = useTranslations('Forms');
  const finalPlaceholder = placeholder || t('searchPlaceholder');
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
      setError(t('minTwoCharacters'));
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
  }, [query, sessionToken, t]);

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
    const newValue = e.target.value;
    setQuery(newValue);

    // Si había una dirección seleccionada y el usuario está editando, limpiar la selección
    if (selectedAddress && newValue !== selectedAddress) {
      // Notificar al padre que se limpió la selección
      if (onLocationSelect) {
        onLocationSelect({
          geometry: { coordinates: [0, 0] },
          properties: { label: '' }
        } as GeocodingResult);
      }
    }

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
        <div className="flex rounded-xl overflow-hidden border border-gray-600/50 bg-gray-800/50">
          <div className="flex-grow px-4 py-3 bg-gray-800 opacity-50 text-gray-400">
            {placeholder}
          </div>
          <div className="px-4 py-3 bg-purple-500 text-white opacity-50">
            <FiSearch className="w-5 h-5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`geocode-search relative ${className || ''}`}>
      <div className="flex rounded-xl overflow-hidden border border-gray-600/50 bg-gray-800/50 shadow-lg">
        <input
          type="text"
          value={selectedAddress || query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={finalPlaceholder}
          className="flex-grow px-4 py-3 bg-gray-800 border-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400 transition-all"
        />
        <button
          type="button"
          onClick={handleSearch}
          className="px-5 py-3 bg-purple-500 text-white hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
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
        <div className="mt-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600/50 rounded-xl shadow-xl max-h-60 overflow-y-auto z-[9999]">
          {results.map((result) => (
            <div
              key={result.properties.gid}
              className="p-3 hover:bg-gray-700/50 cursor-pointer border-b border-gray-600/50 last:border-b-0 text-white transition-all"
              onClick={() => handleSelectResult(result)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <p className="text-xs text-purple-300 mt-1">
                      📍 {t('number')} {result.properties.housenumber}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}


    </div>
  );
}
