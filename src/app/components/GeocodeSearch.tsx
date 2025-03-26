'use client';

import React, { useState, useEffect } from 'react';
import { geocodeAddress, GeocodingResult } from '@/lib/geocoding';

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
  // Add a mounted state to prevent hydration mismatch
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Use useEffect to mark component as mounted on the client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
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
  };

  const handleSelectResult = (result: GeocodingResult) => {
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
    // Hide results when input changes
    if (showResults) setShowResults(false);
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
          className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
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
          className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {showResults && results.length > 0 && (
        <ul className="mt-2 border border-gray-200 rounded-md shadow-sm max-h-60 overflow-y-auto bg-white">
          {results.map((result) => (
            <li
              key={result.properties.gid}
              className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0 text-black"
              onClick={() => handleSelectResult(result)}
            >
              <p className="font-medium text-black">{result.properties.name}</p>
              <p className="text-sm text-gray-600">{result.properties.label}</p>
            </li>
          ))}
        </ul>
      )}

      {/* Display selected address from either search or map interaction */}
      {selectedAddress && (
        <div className="mt-3 p-3 bg-gray-700 border border-gray-600 rounded-md text-white">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2 flex-1">
              <p className="font-medium text-sm mb-1">Selected location:</p>
              <p className="text-sm text-gray-300 break-words">{selectedAddress}</p>
              {selectedCoordinates && (
                <p className="mt-1 text-xs text-gray-400">
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