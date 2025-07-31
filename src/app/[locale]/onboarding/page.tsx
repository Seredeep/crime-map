'use client';

import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

// Interfaz actualizada para los barrios de San Francisco
interface Neighborhood {
  _id: string;
  type: string;
  geometry: {
    type: string;
    coordinates: number[][][][];
  };
  properties: {
    id?: number;
    name?: string;
    link?: string;
    city?: string;
    state?: string;
    country?: string;
    source?: string;
    // Campos de Mar del Plata (para compatibilidad)
    soc_fomen?: string;
  };
}

interface OnboardingFormData {
  name: string;
  surname: string;
  country: string;
  city: string;
  neighborhood: string;
  email: string;
}

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Componente del modal de bienvenida
function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900/95 rounded-2xl shadow-2xl border border-gray-800/50 p-8 max-w-md w-full">
        <div className="text-center">
          <div className="flex items-center justify-center">
            <Image
              src="/icons/clari.svg"
              alt="Claridad Logo"
              width={180}
              height={180}
              className="h-32 w-32 object-contain"
              priority
            />
          </div>
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">
            ¡Bienvenido a Claridad!
          </h2>
          <p className="text-gray-300 mb-6 leading-relaxed">
            Para brindarte la mejor experiencia de seguridad comunitaria, necesitamos conocer tu ubicación.
            Esta información nos permite conectar con tu comunidad local y mantenerte informado sobre incidentes
            en tu área.
          </p>
          <div className="space-y-3 text-sm text-gray-400 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-3 mt-0.5 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Tu información personal se mantiene segura y privada</span>
            </div>
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-3 mt-0.5 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Podrás recibir alertas relevantes para tu zona</span>
            </div>
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-3 mt-0.5 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Conectarás con tu comunidad local</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            Entendido, continuar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [filteredNeighborhoods, setFilteredNeighborhoods] = useState<Neighborhood[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [isLoadingNeighborhoods, setIsLoadingNeighborhoods] = useState(true);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingNeighborhoodsList, setIsLoadingNeighborhoodsList] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    defaultValues: {
      email: session?.user?.email || '',
      name: '',
      surname: '',
      country: '',
      city: '',
      neighborhood: '',
    }
  });

    // Observar cambios en país y ciudad
  const watchedCountry = watch('country');
  const watchedCity = watch('city');

  // Estados para controlar la activación de campos y sincronizar con react-hook-form
  const [isCountrySelected, setIsCountrySelected] = useState(false);
  const [isCitySelected, setIsCitySelected] = useState(false);

  // Cargar todos los barrios
  useEffect(() => {
    const fetchNeighborhoods = async () => {
      try {
        setIsLoadingNeighborhoods(true);
        const response = await fetch('/api/neighborhoods');
        if (!response.ok) {
          throw new Error('Error al cargar los barrios');
        }
        const data = await response.json();
        setNeighborhoods(data);
      } catch (err) {
        console.error('Error fetching neighborhoods:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar la lista de barrios.');
      } finally {
        setIsLoadingNeighborhoods(false);
      }
    };
    fetchNeighborhoods();
  }, []);

  // Filtrar barrios por país y ciudad
  useEffect(() => {
    if (selectedCountry && selectedCity) {
      setIsLoadingNeighborhoodsList(true);
      // Simular un pequeño delay para mostrar el spinner
      setTimeout(() => {
        const filtered = neighborhoods.filter(n =>
          n.properties.country === selectedCountry &&
          n.properties.city === selectedCity
        );
        setFilteredNeighborhoods(filtered);
        setIsLoadingNeighborhoodsList(false);
      }, 300);
    } else {
      setFilteredNeighborhoods([]);
      setIsLoadingNeighborhoodsList(false);
    }
  }, [selectedCountry, selectedCity, neighborhoods]);

  // Actualizar estados de activación inmediatamente
  useEffect(() => {
    const hasCountry = !!watchedCountry;
    setIsCountrySelected(hasCountry);

    // Si no hay país seleccionado, limpiar ciudad
    if (!hasCountry) {
      setIsCitySelected(false);
    }
  }, [watchedCountry]);

  useEffect(() => {
    const hasCity = !!watchedCity;
    setIsCitySelected(hasCity);
  }, [watchedCity]);

    // Obtener ciudades únicas para el país seleccionado
  const getCitiesForCountry = (country: string) => {
    const cities = neighborhoods
      .filter(n => n.properties.country === country)
      .map(n => n.properties.city)
      .filter((city, index, arr) => city && arr.indexOf(city) === index);

    // Si no hay ciudades para el país, agregar opciones por defecto
    if (cities.length === 0) {
      if (country === 'Argentina') {
        return ['Mar del Plata'];
      } else if (country === 'USA') {
        return ['San Francisco'];
      }
    }

    return cities.sort();
  };

  // Obtener países únicos
  const getUniqueCountries = () => {
    const countries = neighborhoods
      .map(n => n.properties.country)
      .filter((country, index, arr) => country && arr.indexOf(country) === index);

    // Si no hay países en los barrios, agregar Argentina por defecto
    if (countries.length === 0) {
      return ['Argentina'];
    }

    return countries.sort();
  };

  // Sincronizar email del usuario de la sesión con el formulario
  useEffect(() => {
    if (session?.user?.email) {
      setValue('email', session.user.email);
    }
  }, [session, setValue]);

  // Sincronizar valores iniciales cuando se cargan los datos
  useEffect(() => {
    if (neighborhoods.length > 0) {
      // Si ya hay valores en el formulario, sincronizarlos
      if (watchedCountry) {
        setIsCountrySelected(true);
      }
      if (watchedCity) {
        setIsCitySelected(true);
      }
    }
  }, [neighborhoods, watchedCountry, watchedCity]);

  const onSubmit = async (data: OnboardingFormData) => {
    try {
      setIsSubmitting(true);
      setError('');

      if (!session?.user?.email) {
        throw new Error('No se encontró el email del usuario');
      }

      if (!data.country || !data.city || !data.neighborhood) {
        throw new Error('Por favor, completa toda la información de ubicación.');
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

      // Mostrar pantalla de éxito
      setIsSuccess(true);

      // Redirigir después de 2 segundos para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        router.push('/');
      }, 2000);
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
    <>
      <WelcomeModal isOpen={showWelcomeModal} onClose={() => setShowWelcomeModal(false)} />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-md w-full relative z-10">
        <div className={`bg-gray-900/80 p-8 rounded-2xl shadow-2xl border border-gray-800/50 transition-opacity duration-300 ${isSuccess ? 'opacity-50' : 'opacity-100'}`}>
          {/* Logo y Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-2">
              <Image
                src="/icons/clari.svg"
                alt="Claridad Logo"
                width={180}
                height={180}
                className="h-28 w-28 object-contain"
                priority
              />
            </div>
            <h2 className="text-2xl font-semibold text-gray-100 mb-2">
              Completa tu Perfil
            </h2>
            <p className="text-gray-400 text-sm">
              Configura tu información personal y ubicación
            </p>
          </div>

          {/* Mensajes de estado */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 text-red-300 text-center rounded-xl animate-pulse">
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" autoComplete="on" style={{ pointerEvents: isSuccess ? 'none' : 'auto' }}>
            <div className="space-y-4">
              {/* Nombre */}
              <div className="group">
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2 group-focus-within:text-orange-400 transition-colors">
                  Nombre
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className={`h-5 w-5 transition-all duration-300 ${
                      watch('name') ? 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]' : 'text-gray-400 blur-sm group-focus-within:text-orange-400 group-focus-within:blur-none'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="name"
                    type="text"
                    autoComplete="given-name"
                    {...register('name', { required: 'El nombre es requerido' })}
                    className="appearance-none relative block w-full pl-12 pr-4 py-4 border border-gray-700 bg-gray-800/50 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-300 sm:text-sm group-hover:border-gray-600"
                    placeholder="Tu nombre"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
                )}
              </div>

              {/* Apellido */}
              <div className="group">
                <label htmlFor="surname" className="block text-sm font-medium text-gray-300 mb-2 group-focus-within:text-orange-400 transition-colors">
                  Apellido
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className={`h-5 w-5 transition-all duration-300 ${
                      watch('surname') ? 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]' : 'text-gray-400 blur-sm group-focus-within:text-orange-400 group-focus-within:blur-none'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="surname"
                    type="text"
                    autoComplete="family-name"
                    {...register('surname', { required: 'El apellido es requerido' })}
                    className="appearance-none relative block w-full pl-12 pr-4 py-4 border border-gray-700 bg-gray-800/50 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-300 sm:text-sm group-hover:border-gray-600"
                    placeholder="Tu apellido"
                  />
                </div>
                {errors.surname && (
                  <p className="mt-1 text-sm text-red-400">{errors.surname.message}</p>
                )}
              </div>



              {/* Selección de País */}
              <div className="group">
                <label htmlFor="country-select" className="block text-sm font-medium text-gray-300 mb-2 group-focus-within:text-orange-400 transition-colors">
                  País
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className={`h-5 w-5 transition-all duration-300 ${
                      watch('country') ? 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]' : 'text-gray-400 blur-sm group-focus-within:text-orange-400 group-focus-within:blur-none'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                                    <select
                    id="country-select"
                    autoComplete="country"
                    {...register('country', { required: 'El país es requerido' })}
                    className="appearance-none relative block w-full pl-12 pr-10 py-4 border border-gray-700 bg-gray-800/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-300 sm:text-sm group-hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        onChange={(e) => {
                      const countryValue = e.target.value;

                      // Actualizar react-hook-form
                      setValue('country', countryValue);
                      setValue('city', '');
                      setValue('neighborhood', '');

                      // Actualizar estados locales
                      setSelectedCountry(countryValue);
                      setIsCountrySelected(!!countryValue);

                      // Limpiar ciudad y barrio
                      setSelectedCity('');
                      setIsCitySelected(false);

                      // Mostrar spinner de carga de ciudades
                      if (countryValue) {
                        setIsLoadingCities(true);
                        setTimeout(() => {
                          setIsLoadingCities(false);
                        }, 200);
                      }
                    }}
                    disabled={isLoadingNeighborhoods}
                  >
                    <option value="">
                      {isLoadingNeighborhoods ? 'Cargando países...' : '-- Selecciona un país --'}
                    </option>
                    {!isLoadingNeighborhoods && getUniqueCountries().map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {isLoadingNeighborhoods ? (
                      <svg className="animate-spin h-5 w-5 text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                </div>
                {errors.country && (
                  <p className="mt-1 text-sm text-red-400">{errors.country.message}</p>
                )}
              </div>

              {/* Selección de Ciudad */}
              <div className={`group transition-all duration-300 ${!isCountrySelected ? 'opacity-50' : 'opacity-100'}`}>
                <label htmlFor="city-select" className="block text-sm font-medium text-gray-300 mb-2 group-focus-within:text-orange-400 transition-colors">
                  Ciudad
                  {!isCountrySelected && <span className="text-gray-500 ml-1">(Selecciona un país primero)</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className={`h-5 w-5 transition-all duration-300 ${
                      watch('city') ? 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]' : 'text-gray-400 blur-sm group-focus-within:text-orange-400 group-focus-within:blur-none'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <select
                    id="city-select"
                    autoComplete="address-level2"
                    {...register('city', { required: 'La ciudad es requerida' })}
                    className="appearance-none relative block w-full pl-12 pr-10 py-4 border border-gray-700 bg-gray-800/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-300 sm:text-sm group-hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isCountrySelected || isLoadingCities}
                    onChange={(e) => {
                      const cityValue = e.target.value;

                      // Actualizar react-hook-form
                      setValue('city', cityValue);
                      setValue('neighborhood', '');

                      // Actualizar estados locales
                      setSelectedCity(cityValue);
                      setIsCitySelected(!!cityValue);
                    }}
                  >
                    <option value="">
                      {isLoadingCities ? 'Cargando ciudades...' : '-- Selecciona una ciudad --'}
                    </option>
                    {isCountrySelected && !isLoadingCities && getCitiesForCountry(selectedCountry).map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {isLoadingCities ? (
                      <svg className="animate-spin h-5 w-5 text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                </div>
                {errors.city && (
                  <p className="mt-1 text-sm text-red-400">{errors.city.message}</p>
                )}
              </div>

              {/* Selección de Barrio */}
              <div className={`group transition-all duration-300 ${!isCitySelected ? 'opacity-50' : 'opacity-100'}`}>
                <label htmlFor="neighborhood-select" className="block text-sm font-medium text-gray-300 mb-2 group-focus-within:text-orange-400 transition-colors">
                  Barrio
                  {!isCitySelected && <span className="text-gray-500 ml-1">(Selecciona una ciudad primero)</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className={`h-5 w-5 transition-all duration-300 ${
                      watch('neighborhood') ? 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]' : 'text-gray-400 blur-sm group-focus-within:text-orange-400 group-focus-within:blur-none'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <select
                    id="neighborhood-select"
                    autoComplete="address-level3"
                    {...register('neighborhood', { required: 'El barrio es requerido' })}
                    className="appearance-none relative block w-full pl-12 pr-10 py-4 border border-gray-700 bg-gray-800/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-300 sm:text-sm group-hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isCitySelected || isLoadingNeighborhoodsList}
                  >
                    <option value="">
                      {isLoadingNeighborhoodsList ? 'Cargando barrios...' : '-- Selecciona un barrio --'}
                    </option>
                    {!isLoadingNeighborhoodsList && filteredNeighborhoods
                      .sort((a, b) => {
                        const nameA = a.properties.name || a.properties.soc_fomen || '';
                        const nameB = b.properties.name || b.properties.soc_fomen || '';
                        return nameA.localeCompare(nameB);
                      })
                      .map((n) => {
                        const neighborhoodName = n.properties.name || n.properties.soc_fomen || 'Sin nombre';
                        return (
                          <option key={n._id} value={neighborhoodName}>
                            {neighborhoodName}
                          </option>
                        );
                      })}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {isLoadingNeighborhoodsList ? (
                      <svg className="animate-spin h-5 w-5 text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                </div>
                {errors.neighborhood && (
                  <p className="mt-1 text-sm text-red-400">{errors.neighborhood.message}</p>
                )}
              </div>
            </div>

            {/* Botón de envío */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Completar Perfil</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    {/* Pantalla de éxito */}
    {isSuccess && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900/95 rounded-2xl shadow-2xl border border-gray-800/50 p-8 max-w-md w-full text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <Image
                src="/icons/clari.svg"
                alt="Claridad Logo"
                width={180}
                height={180}
                className="h-24 w-24 object-contain"
                priority
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-gray-100 mb-4">
            ¡Perfil Completado!
          </h2>

          <p className="text-gray-300 mb-6 leading-relaxed">
            Tu información ha sido guardada exitosamente. Ya puedes acceder a todas las funcionalidades de Claridad.
          </p>

          <div className="space-y-3 text-sm text-gray-400 mb-6">
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Tu perfil está configurado</span>
            </div>
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Redirigiendo a la aplicación...</span>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
