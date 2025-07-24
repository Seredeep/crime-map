'use client';

import { AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import { useAppLoading } from '../../lib/hooks/useAppLoading';
import LoadingScreen from './LoadingScreen';

interface AppWrapperProps {
  children: ReactNode;
  navbar?: ReactNode;
  globalComponents: ReactNode;
}

export default function AppWrapper({ children, navbar, globalComponents }: AppWrapperProps) {
  const { isLoading, progress, message } = useAppLoading();

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && (
          <LoadingScreen
            key="loading"
            isLoading={isLoading}
            progress={progress}
            message={message}
          />
        )}
      </AnimatePresence>

      {/* Contenido principal - solo se muestra cuando no está cargando */}
      <div className={`${isLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-300`}>
        {navbar && navbar}
        {children}
        {globalComponents}
      </div>
    </>
  );
}
