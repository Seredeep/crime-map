'use client';

import { PhotoIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useRef, useState } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
  threshold?: number;
  rootMargin?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder,
  onLoad,
  onError,
  threshold = 0.1,
  rootMargin = '50px'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer para detectar cuando la imagen entra en vista
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [threshold, rootMargin]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const LoadingPlaceholder = () => (
    <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}>
      <div className="flex flex-col items-center space-y-2 text-gray-400">
        <PhotoIcon className="h-8 w-8 animate-pulse" />
        <span className="text-xs">Cargando...</span>
      </div>
    </div>
  );

  const ErrorPlaceholder = () => (
    <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}>
      <div className="flex flex-col items-center space-y-2 text-gray-400">
        <PhotoIcon className="h-8 w-8" />
        <span className="text-xs">Error al cargar</span>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {!isInView && (
        <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}>
          <div className="flex flex-col items-center space-y-2 text-gray-400">
            <PhotoIcon className="h-8 w-8" />
            <span className="text-xs">Imagen</span>
          </div>
        </div>
      )}

      {isInView && !hasError && (
        <>
          {!isLoaded && <LoadingPlaceholder />}
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            className={`transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            } ${className}`}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
            style={{
              position: isLoaded ? 'static' : 'absolute',
              top: isLoaded ? 'auto' : 0,
              left: isLoaded ? 'auto' : 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </>
      )}

      {hasError && <ErrorPlaceholder />}
    </div>
  );
};

export default LazyImage;
