'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

// Añadir: Interfaz para los barrios
interface Neighborhood {
  _id: string;
  name: string;
  properties: {
    soc_fomen: string;
  };
}

interface OnboardingFormData {
  name: string;
  surname: string;
  blockNumber: string;
  lotNumber: string;
  neighborhood: string;
  email: string;
}

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]); // Añadir: Estado para la lista de barrios
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>(''); // Añadir: Estado para el barrio seleccionado

  const {
    register,
    handleSubmit,
    setValue, // Añadir: setValue para el formulario
    formState: { errors },
  } = useForm<OnboardingFormData>({
    defaultValues: {
      email: session?.user?.email || '',
      neighborhood: '',
      blockNumber: '',
      lotNumber: '',
    }
  });

  // Añadir: useEffect para cargar los barrios
  useEffect(() => {
    const fetchNeighborhoods = async () => {
      try {
        const response = await fetch('/api/neighborhoods');
        if (!response.ok) {
          throw new Error('Error al cargar los barrios');
        }
        const data = await response.json();
        setNeighborhoods(data);
      } catch (err) {
        console.error('Error fetching neighborhoods:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar la lista de barrios.');
      }
    };
    fetchNeighborhoods();
  }, []);

  // Sincronizar email del usuario de la sesión con el formulario
  useEffect(() => {
    if (session?.user?.email) {
      setValue('email', session.user.email);
    }
  }, [session, setValue]);

  const onSubmit = async (data: OnboardingFormData) => {
    try {
      setIsSubmitting(true);
      setError('');

      if (!session?.user?.email) {
        throw new Error('No se encontró el email del usuario');
      }

      if (!data.neighborhood) {
        throw new Error('Por favor, selecciona un barrio.');
      }

      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          email: session.user.email
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar la información');
      }

      await update({ onboarded: true });

      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hubo un error al guardar tu información. Por favor, intenta de nuevo.');
      console.error('Error en onboarding:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Si no hay sesión, mostrar mensaje de error
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-red-500">No se encontró la sesión del usuario. Por favor, inicia sesión nuevamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">Completa tu Perfil</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-500 text-white rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Nombre
              </label>
              <input
                id="name"
                type="text"
                {...register('name', { required: 'El nombre es requerido' })}
                className="w-full px-3 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tu nombre"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="surname" className="block text-sm font-medium mb-1">
                Apellido
              </label>
              <input
                id="surname"
                type="text"
                {...register('surname', { required: 'El apellido es requerido' })}
                className="w-full px-3 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tu apellido"
              />
              {errors.surname && (
                <p className="mt-1 text-sm text-red-500">{errors.surname.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="blockNumber" className="block text-sm font-medium mb-1">
                Número de Manzana
              </label>
              <input
                id="blockNumber"
                type="text"
                {...register('blockNumber')}
                className="w-full px-3 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Número de manzana"
              />
              {errors.blockNumber && (
                <p className="mt-1 text-sm text-red-500">{errors.blockNumber.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="lotNumber" className="block text-sm font-medium mb-1">
                Número de Lote
              </label>
              <input
                id="lotNumber"
                type="text"
                {...register('lotNumber')}
                className="w-full px-3 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Número de lote"
              />
              {errors.lotNumber && (
                <p className="mt-1 text-sm text-red-500">{errors.lotNumber.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="neighborhood-select" className="block text-sm font-medium mb-1">
                Selecciona tu Barrio
              </label>
              <select
                id="neighborhood-select"
                {...register('neighborhood', { required: 'El barrio es requerido' })}
                className="w-full px-3 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Selecciona un barrio --</option>
                {neighborhoods
                  .sort((a, b) => a.properties.soc_fomen.localeCompare(b.properties.soc_fomen))
                  .map((n) => (
                    <option key={n._id} value={n.properties.soc_fomen}>
                      {n.properties.soc_fomen}
                    </option>
                  ))}
              </select>
              {errors.neighborhood && (
                <p className="mt-1 text-sm text-red-500">{errors.neighborhood.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Guardando...' : 'Completar Perfil'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
