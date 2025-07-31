'use client';

import { PhotoIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import React, { useState } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  onLoad,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const t = useTranslations('States');

  const handleLoad = (result: any) => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  const LoadingPlaceholder = () => (
    <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 w-full h-full`}>
      <div className="flex flex-col items-center space-y-2 text-gray-400">
        <PhotoIcon className="h-8 w-8 animate-pulse" />
        <span className="text-xs">{t('loading')}</span>
      </div>
    </div>
  );

  const ErrorPlaceholder = () => (
    <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 w-full h-full`}>
      <div className="flex flex-col items-center space-y-2 text-gray-400">
        <PhotoIcon className="h-8 w-8" />
        <span className="text-xs">{t('errorLoading')}</span>
      </div>
    </div>
  );

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && <LoadingPlaceholder />}
      {hasError && <ErrorPlaceholder />}
      <Image
        src={src}
        alt={alt}
        layout="fill"
        objectFit="cover"
        className={`transition-opacity duration-300 ${!isLoading && !hasError ? 'opacity-100' : 'opacity-0'}`}
        onLoadingComplete={handleLoad}
        onError={handleError}
      />
    </div>
  );
};

export default LazyImage;
