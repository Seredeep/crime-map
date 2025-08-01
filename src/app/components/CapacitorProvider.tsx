'use client';

import { useEffect, useState } from 'react';

interface CapacitorProviderProps {
  children: React.ReactNode;
}

export default function CapacitorProvider({ children }: CapacitorProviderProps) {
  const [isCapacitorReady, setIsCapacitorReady] = useState(false);

  useEffect(() => {
    // Solo inicializar Capacitor en el cliente
    if (typeof window !== 'undefined') {
      const initializeCapacitor = async () => {
        try {
          // Importación dinámica para evitar errores en el servidor
          const { initializeCapacitorPlugins } = await import('../../lib/capacitor-plugins');
          await initializeCapacitorPlugins();
          setIsCapacitorReady(true);
        } catch (error) {
          console.warn('Capacitor initialization failed:', error);
          // Continuar sin Capacitor
          setIsCapacitorReady(true);
        }
      };

      initializeCapacitor();
    } else {
      // En el servidor, marcar como listo sin Capacitor
      setIsCapacitorReady(true);
    }
  }, []);

  // Mostrar children inmediatamente, Capacitor se inicializará en background
  return <>{children}</>;
}
