'use client';

import { GeocodingResult, geocodeAddress } from '@/lib/geocoding';
import React, { useCallback, useEffect, useState } from 'react';

interface GeocodeSearchProps {
  onLocationSelect?: (result: GeocodingResult) => void;
  placeholder?: string;
  className?: string;
  selectedAddress?: string;
  selectedCoordinates?: [number, number] | null;
}

export default function GeocodeSearch({
  onLocationSelect,
  placeholder = 'Search for an address or place...',
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

  // Use useEffect to mark component as mounted on the client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Add debounce to reduce API calls
  const handleSearch = useCallback(async () => {
    if (!query.trim() || query.trim().length < 3) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await geocodeAddress(query);
      setResults(response.features || []);
      setShowResults(true);
    } catch (err) {
      setError('Error searching for location. Please try again.');
      console.error('Geocoding error:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  // Then in your useEffect
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query.trim().length >= 3) {
        handleSearch();
      } else if (query.trim().length === 0) {
        setResults([]);
        setShowResults(false);
      }
    }, 1500);

    return () => clearTimeout(debounceTimer);
  }, [query, handleSearch]);

  const handleSelectResult = async (result: GeocodingResult) => {
    // If the result doesn't have coordinates (which can happen with Places API),
    // we need to get the full details first
    if (result.geometry.coordinates[0] === 0 && result.geometry.coordinates[1] === 0) {
      try {
        setIsLoading(true);
        // Fetch details for the selected place
        const response = await fetch('/api/geocode', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ placeId: result.properties.id }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch place details');
        }

        const data = await response.json();
        if (data.features && data.features.length > 0) {
          result = data.features[0];
        }
      } catch (err) {
        console.error('Error fetching place details:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (onLocationSelect) {
      onLocationSelect(result);
    }

    // Clear results after selection
    setResults([]);
    setQuery('');
    setShowResults(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  // If not mounted yet, render a placeholder with same dimensions to avoid layout shift
  if (!isMounted) {
    return (
      <div className={`geocode-search ${className || ''}`}>
        <div className="flex">
          <div className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md text-black opacity-0">
            {placeholder}
          </div>
          <div className="px-4 py-2 bg-blue-500 text-white rounded-r-md opacity-0">
            Search
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
          placeholder={placeholder}
          className="flex-grow px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 text-white placeholder-white/50 transition-all"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        <button
          type="button"
          onClick={() => handleSearch()}
          className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-r-xl hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? '🔍' : '🔍'}
        </button>
      </div>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {showResults && results.length > 0 && (
        <ul className="mt-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
          {results.map((result) => (
            <li
              key={result.properties.gid}
              className="p-3 hover:bg-white/20 cursor-pointer border-b border-white/10 last:border-b-0 text-white transition-all"
              onClick={() => handleSelectResult(result)}
            >
              <p className="font-medium text-white">{result.properties.name}</p>
              <p className="text-sm text-white/70">{result.properties.label}</p>
            </li>
          ))}
        </ul>
      )}

      {/* Display selected address from either search or map interaction */}
      {selectedAddress && (
        <div className="mt-3 p-4 backdrop-blur-sm bg-green-500/20 border border-green-400/30 rounded-xl text-white">
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
