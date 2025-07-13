'use client';

import { useEffect } from 'react';
import { initializeCapacitorPlugins } from '../../lib/capacitor-plugins';

interface CapacitorProviderProps {
  children: React.ReactNode;
}

export default function CapacitorProvider({ children }: CapacitorProviderProps) {
  useEffect(() => {
    // Inicializar plugins de Capacitor cuando el componente se monta
    initializeCapacitorPlugins();
  }, []);

  return <>{children}</>;
}
