import { getUserNeighborhoodCoordinates } from '@/lib/services/neighborhoods/neighborhoodService';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';

export function useUserLocation() {
  const { data: session } = useSession();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener las coordenadas del barrio del usuario
  const fetchUserLocation = useCallback(async () => {
    if (!session?.user?.neighborhood) {
      setUserLocation(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const coords = await getUserNeighborhoodCoordinates(session.user.neighborhood);
      setUserLocation(coords);

      if (!coords) {
        setError(`No se pudo obtener la ubicación del barrio: ${session.user.neighborhood}`);
      }
    } catch (err) {
      console.error('Error getting user neighborhood coordinates:', err);
      setError('Error al obtener la ubicación del barrio');
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.neighborhood]);

  // Cargar ubicación cuando cambie el barrio del usuario
  useEffect(() => {
    fetchUserLocation();
  }, [fetchUserLocation]);

  // Función para refrescar la ubicación manualmente
  const refreshLocation = useCallback(() => {
    fetchUserLocation();
  }, [fetchUserLocation]);

  return {
    userLocation,
    isLoading,
    error,
    refreshLocation,
    neighborhood: session?.user?.neighborhood
  };
}
