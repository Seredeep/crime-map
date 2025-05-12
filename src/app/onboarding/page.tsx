'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

interface OnboardingFormData {
  name: string;
  surname: string;
  blockNumber: string;
  lotNumber: string;
}

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingFormData>();

  const onSubmit = async (data: OnboardingFormData) => {
    try {
      setIsSubmitting(true);
      setError('');

      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al guardar la información');
      }

      // Actualizar la sesión para reflejar que el usuario ha completado el onboarding
      await update();
      
      // Cerrar sesión y redirigir al usuario a la página principal
      await signOut({ redirect: false });
      router.push('/');
    } catch (err) {
      setError('Hubo un error al guardar tu información. Por favor, intenta de nuevo.');
      console.error('Error en onboarding:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                {...register('blockNumber', { required: 'El número de manzana es requerido' })}
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
                {...register('lotNumber', { required: 'El número de lote es requerido' })}
                className="w-full px-3 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Número de lote"
              />
              {errors.lotNumber && (
                <p className="mt-1 text-sm text-red-500">{errors.lotNumber.message}</p>
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