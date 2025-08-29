'use client'

import { GET_REGION_INCIDENT_TYPES, Region } from '@/lib/services/incidents'
import { fetchIncidents } from '@/lib/services/incidents/incidentService'
import { getIncidentColorConfig } from '@/lib/services/incidents/types'
import {
  Neighborhood,
  fetchNeighborhoods,
} from '@/lib/services/neighborhoods/neighborhoodService'
import { Incident } from '@/lib/types/global'
import { formatDate, formatTime, timeAgo } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FiAlertTriangle,
  FiCalendar,
  FiCheckCircle,
  FiCheckSquare,
  FiClock,
  FiFilter,
  FiMapPin,
  FiSearch,
  FiTag,
  FiUser,
  FiX,
} from 'react-icons/fi'

interface IncidentQueueProps {
  onIncidentSelect?: (incident: Incident) => void
}

interface Filters {
  city: string
  neighborhoodId: string
  dateFrom: string
  dateTo: string
  tags: string[]
}

export default function IncidentQueue({
  onIncidentSelect,
}: IncidentQueueProps) {
  const { data: session } = useSession()
  const t = useTranslations('Incidents')
  const tCommon = useTranslations('Common')
  const tIncidentTypes = useTranslations('incidentTypes')
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  )
  const [reason, setReason] = useState('')
  const [showReasonModal, setShowReasonModal] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<
    'pending' | 'verified' | 'resolved' | null
  >(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showActiveFilters, setShowActiveFilters] = useState(false)

  // Filtros activos (los que se aplican realmente)
  const [activeFilters, setActiveFilters] = useState<Filters>({
    city: '',
    neighborhoodId: '',
    dateFrom: '',
    dateTo: '',
    tags: [],
  })

  // Filtros temporales (los que se están editando)
  const [tempFilters, setTempFilters] = useState<Filters>({
    city: '',
    neighborhoodId: '',
    dateFrom: '',
    dateTo: '',
    tags: [],
  })

  // Estados para manejo de filtros anidados
  const [cities, setCities] = useState<string[]>([])
  const [filteredNeighborhoods, setFilteredNeighborhoods] = useState<
    Neighborhood[]
  >([])

  const filterButtonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Helper function to get user region from session
  const getUserRegion = (): Region => {
    const country = session?.user?.country
    if (country === 'Argentina') return 'argentina'
    if (country === 'Mexico') return 'mexico'
    if (country === 'Colombia') return 'colombia'
    if (country === 'Chile') return 'chile'
    return 'general'
  }

  const userRegion = getUserRegion()
  const incidentTypes = GET_REGION_INCIDENT_TYPES(tIncidentTypes, userRegion)

  // Cerrar popover al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target as Node)
      ) {
        setShowFilters(false)
        // Al cerrar sin aplicar, revertir a los filtros activos
        setTempFilters(activeFilters)
      }
    }

    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFilters, activeFilters])

  // Cargar barrios y extraer ciudades únicas
  useEffect(() => {
    const loadNeighborhoods = async () => {
      try {
        const data = await fetchNeighborhoods()

        // Extraer ciudades únicas y ordenarlas
        const uniqueCities = [
          ...new Set(
            data.map(
              (n) => n.properties.city || n.properties.state || 'Sin ciudad'
            )
          ),
        ]
          .filter((city) => city && city !== 'Sin ciudad')
          .sort()

        setCities(uniqueCities)
        setNeighborhoods(data)
      } catch (err) {
        console.error('Error loading neighborhoods:', err)
      }
    }
    loadNeighborhoods()
  }, [])

  // Filtrar barrios cuando cambia la ciudad
  useEffect(() => {
    if (tempFilters.city) {
      const filtered = neighborhoods.filter(
        (n) => (n.properties.city || n.properties.state) === tempFilters.city
      )

      // Ordenar barrios alfabéticamente
      const sorted = filtered.sort((a, b) => {
        const nameA = (
          a.properties.soc_fomen ||
          a.properties.name ||
          ''
        ).toLowerCase()
        const nameB = (
          b.properties.soc_fomen ||
          b.properties.name ||
          ''
        ).toLowerCase()
        return nameA.localeCompare(nameB, 'es')
      })

      setFilteredNeighborhoods(sorted)

      // Si el barrio seleccionado no pertenece a la nueva ciudad, limpiarlo
      if (tempFilters.neighborhoodId) {
        const neighborhoodExists = sorted.some(
          (n) => n._id === tempFilters.neighborhoodId
        )
        if (!neighborhoodExists) {
          setTempFilters((prev) => ({ ...prev, neighborhoodId: '' }))
        }
      }
    } else {
      setFilteredNeighborhoods([])
      setTempFilters((prev) => ({ ...prev, neighborhoodId: '' }))
    }
  }, [tempFilters.city, tempFilters.neighborhoodId, neighborhoods])

  // Cargar incidentes con filtros activos
  const loadIncidents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const apiFilters: any = {}

      if (activeFilters.city) {
        apiFilters.city = activeFilters.city
      }

      if (activeFilters.neighborhoodId) {
        apiFilters.neighborhoodId = activeFilters.neighborhoodId
      }

      if (activeFilters.dateFrom || activeFilters.dateTo) {
        if (activeFilters.dateFrom) apiFilters.dateFrom = activeFilters.dateFrom
        if (activeFilters.dateTo) apiFilters.dateTo = activeFilters.dateTo
      }

      if (activeFilters.tags.length > 0) {
        apiFilters.tags = activeFilters.tags
      }

      const data = await fetchIncidents(apiFilters)
      setIncidents(data)
    } catch (err) {
      console.error('Error loading incidents:', err)
      setError('No se pudieron cargar los incidentes')
    } finally {
      setLoading(false)
    }
  }, [activeFilters])

  useEffect(() => {
    loadIncidents()
  }, [loadIncidents])

  const handleStatusChange = async (
    incidentId: string,
    newStatus: 'pending' | 'verified' | 'resolved'
  ) => {
    const incident = incidents.find((i) => i._id === incidentId)
    if (!incident) return

    setSelectedIncident(incident)
    setPendingStatus(newStatus)
    setShowReasonModal(true)
  }

  const confirmStatusChange = async () => {
    if (!selectedIncident || !pendingStatus) return

    try {
      const response = await fetch('/api/incidents', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          incidentId: selectedIncident._id,
          status: pendingStatus,
          reason: reason.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(
          data.message || data.error || 'Failed to update incident status'
        )
      }

      // Update the local state
      setIncidents(
        incidents.map((incident) =>
          incident._id === selectedIncident._id
            ? { ...incident, status: pendingStatus }
            : incident
        )
      )

      // Reset state
      setSelectedIncident(null)
      setPendingStatus(null)
      setReason('')
      setShowReasonModal(false)
    } catch (err) {
      console.error('Error updating incident status:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo actualizar el estado del incidente'
      )
    }
  }

  const updateTempFilter = (key: keyof Filters, value: any) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    setActiveFilters(tempFilters)
    setShowFilters(false)
  }

  const clearFilters = () => {
    const clearedFilters = {
      city: '',
      neighborhoodId: '',
      dateFrom: '',
      dateTo: '',
      tags: [],
    }
    setTempFilters(clearedFilters)
    setActiveFilters(clearedFilters)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (activeFilters.city) count++
    if (activeFilters.neighborhoodId) count++
    if (activeFilters.dateFrom || activeFilters.dateTo) count++
    if (activeFilters.tags.length > 0) count++
    return count
  }

  const hasPendingChanges = () => {
    return (
      activeFilters.city !== tempFilters.city ||
      activeFilters.neighborhoodId !== tempFilters.neighborhoodId ||
      activeFilters.dateFrom !== tempFilters.dateFrom ||
      activeFilters.dateTo !== tempFilters.dateTo ||
      JSON.stringify(activeFilters.tags) !== JSON.stringify(tempFilters.tags)
    )
  }

  const getNeighborhoodName = (neighborhoodId: string) => {
    const neighborhood = neighborhoods.find((n) => n._id === neighborhoodId)
    return neighborhood
      ? neighborhood.properties.soc_fomen || neighborhood.properties.name
      : 'Unknown'
  }

  // Sincronizar filtros temporales con activos al abrir
  const openFilters = () => {
    setTempFilters(activeFilters)
    setShowFilters(true)
  }

  // Lista plana de todos los tipos de incidente basada en la región del usuario
  const allIncidentTypes = incidentTypes.map((type) => type.id)

  // Función para obtener el color del estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'from-yellow-500 to-orange-500'
      case 'verified':
        return 'from-blue-500 to-cyan-500'
      case 'resolved':
        return 'from-green-500 to-emerald-500'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  // Función para obtener el icono del estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FiClock className="w-4 h-4" />
      case 'verified':
        return <FiCheckCircle className="w-4 h-4" />
      case 'resolved':
        return <FiCheckSquare className="w-4 h-4" />
      default:
        return <FiAlertTriangle className="w-4 h-4" />
    }
  }

  if (loading && incidents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 space-y-3">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <div
            className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-400 rounded-full animate-spin"
            style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
          ></div>
        </div>
        <div className="text-center">
          <p className="text-gray-300 font-medium text-sm">
            Cargando incidentes...
          </p>
          <p className="text-gray-500 text-xs">
            Preparando la cola de verificación
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gradient-to-r from-red-900/30 to-red-800/30 backdrop-blur-sm p-6 rounded-2xl border border-red-500/30 shadow-xl">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
            <FiAlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h4 className="text-red-200 font-semibold">
              Error al cargar incidentes
            </h4>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header compacto */}
      <div className="bg-gradient-to-r from-gray-800/40 via-gray-700/40 to-gray-800/40 backdrop-blur-sm rounded-xl p-4 border border-gray-600/30 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
              <FiCheckCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {t('pendingIncidents')}
              </h3>
              <div className="flex items-center space-x-3 text-xs">
                <span className="text-gray-300">
                  Total:{' '}
                  <span className="text-blue-400 font-semibold">
                    {incidents.length}
                  </span>
                </span>
                {getActiveFiltersCount() > 0 && (
                  <button
                    onClick={() => setShowActiveFilters(!showActiveFilters)}
                    className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs font-medium border border-blue-400/30 hover:bg-blue-500/30 hover:border-blue-400/50 transition-colors cursor-pointer"
                  >
                    {getActiveFiltersCount()} filtros
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Botón de filtros compacto */}
          <div className="relative">
            <button
              ref={filterButtonRef}
              onClick={openFilters}
              className="group relative flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-700/80 to-gray-600/80 hover:from-gray-600/80 hover:to-gray-500/80 text-gray-200 rounded-lg transition-all duration-200 border border-gray-600/30 hover:border-gray-500/50 shadow-md hover:shadow-lg hover:scale-105 transform"
            >
              <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center transition-transform group-hover:rotate-12">
                <FiFilter className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="font-medium text-sm">{t('filters')}</span>
              {hasPendingChanges() && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse shadow-lg"></span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Popover de filtros mejorado */}
      {showFilters && (
        <>
          {/* Overlay de fondo con blur */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-40"
            onClick={() => setShowFilters(false)}
          />

          <div
            ref={popoverRef}
            className="fixed inset-4 h-[60vh] lg:absolute lg:right-0 lg:top-full lg:mt-3 lg:w-[700px] lg:inset-auto bg-gray-900/95 backdrop-blur-xl rounded-3xl border-2 border-gray-600/50 shadow-2xl z-50 overflow-hidden"
          >
            {/* Header del popover sobrio */}
            <div className="bg-gray-800/95 backdrop-blur-sm p-3 border-b border-gray-600/30 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 bg-gray-700 rounded-lg flex items-center justify-center border border-gray-600/40">
                    <FiFilter className="w-4 h-4 text-gray-300" />
                  </div>
                  <div>
                    <h5 className="text-white font-semibold text-base">
                      {t('searchFilters')}
                    </h5>
                    <p className="text-gray-400 text-xs">
                      {t('refineResults')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={clearFilters}
                    className="text-xs text-gray-400 hover:text-gray-200 transition-colors px-2 py-1 rounded-md hover:bg-gray-700/50 font-medium border border-gray-600/40 hover:border-gray-500/50"
                  >
                    {t('clear')}
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-gray-400 hover:text-gray-200 transition-colors p-1 rounded-md hover:bg-gray-700/50"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Contenido del popover compacto sin scroll */}
            <div className="p-3 bg-gray-900/95">
              <div className="space-y-3">
                {/* Filtros de Ciudad y Barrio en línea */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Filtro de Ciudad */}
                  <div className="space-y-1">
                    <label className="flex text-xs font-medium text-gray-300 items-center">
                      <div className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-2"></div>
                      {t('cityState')}
                    </label>
                    <div className="relative">
                      <select
                        value={tempFilters.city}
                        onChange={(e) =>
                          updateTempFilter('city', e.target.value)
                        }
                        className="w-full bg-gray-800/80 text-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-500/50 focus:border-gray-500/50 border border-gray-600/40 transition-colors appearance-none font-medium text-xs hover:border-gray-500/50"
                      >
                        <option value="">{t('allCities')}</option>
                        {cities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <div className="w-1.5 h-1.5 border border-gray-400 border-t-transparent border-l-transparent transform rotate-45"></div>
                      </div>
                    </div>
                  </div>

                  {/* Filtro de Barrio */}
                  <div className="space-y-1">
                    <label className="flex text-xs font-medium text-gray-300 items-center">
                      <div className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-2"></div>
                      {t('neighborhoodCity')}
                      {tempFilters.city && (
                        <span className="ml-auto text-xs text-gray-400 bg-gray-600/30 px-1.5 py-0.5 rounded-full font-medium border border-gray-500/30">
                          {filteredNeighborhoods.length}
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <select
                        value={tempFilters.neighborhoodId}
                        onChange={(e) =>
                          updateTempFilter('neighborhoodId', e.target.value)
                        }
                        disabled={!tempFilters.city}
                        className={`w-full rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-500/50 focus:border-gray-500/50 border transition-colors appearance-none font-medium text-xs ${
                          tempFilters.city
                            ? 'bg-gray-800/80 text-gray-200 border-gray-600/40 hover:border-gray-500/50'
                            : 'bg-gray-800/40 text-gray-500 border-gray-600/20 cursor-not-allowed'
                        }`}
                      >
                        <option value="">
                          {tempFilters.city
                            ? t('selectNeighborhood')
                            : t('selectCityFirst')}
                        </option>
                        {filteredNeighborhoods.map((neighborhood) => (
                          <option
                            key={neighborhood._id}
                            value={neighborhood._id}
                          >
                            {neighborhood.properties.soc_fomen ||
                              neighborhood.properties.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <div
                          className={`w-1.5 h-1.5 border transform rotate-45 ${
                            tempFilters.city
                              ? 'border-gray-400 border-t-transparent border-l-transparent'
                              : 'border-gray-500 border-t-transparent border-l-transparent'
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {!tempFilters.city && (
                  <p className="text-xs text-gray-500 flex items-center">
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-2"></span>
                    {t('selectCityForNeighborhoods')}
                  </p>
                )}

                {/* Filtros de Fecha sobrios */}
                <div className="space-y-1">
                  <label className="flex text-xs font-medium text-gray-300 items-center">
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-2"></div>
                    {t('dateRange')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
                        {t('from')}
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={tempFilters.dateFrom}
                          onChange={(e) =>
                            updateTempFilter('dateFrom', e.target.value)
                          }
                          className="w-full bg-gray-800/80 text-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-500/50 focus:border-gray-500/50 border border-gray-600/40 transition-colors font-medium text-xs hover:border-gray-500/50"
                          placeholder="mm/dd/yyyy"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <FiCalendar className="w-3 h-3 text-gray-400" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
                        {t('to')}
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={tempFilters.dateTo}
                          onChange={(e) =>
                            updateTempFilter('dateTo', e.target.value)
                          }
                          className="w-full bg-gray-800/80 text-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-500/50 focus:border-gray-500/50 border border-gray-600/40 transition-colors font-medium text-xs hover:border-gray-500/50"
                          placeholder="mm/dd/yyyy"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <FiCalendar className="w-3 h-3 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filtros de Tags sobrios */}
                <div className="space-y-2">
                  <label className="flex text-xs font-medium text-gray-300 items-center">
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-2"></div>
                    {t('incidentTypes')}
                    {tempFilters.tags.length > 0 && (
                      <span className="ml-auto text-xs text-gray-400 bg-gray-600/30 px-1.5 py-0.5 rounded-full font-medium border border-gray-500/30">
                        {tempFilters.tags.length}
                      </span>
                    )}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {allIncidentTypes.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          const newTags = tempFilters.tags.includes(tag)
                            ? tempFilters.tags.filter((t) => t !== tag)
                            : [...tempFilters.tags, tag]
                          updateTempFilter('tags', newTags)
                        }}
                        className={`px-2 py-1.5 text-xs rounded-md transition-colors font-medium text-center border transform hover:scale-105 ${
                          tempFilters.tags.includes(tag)
                            ? 'bg-gray-600 text-white border-gray-500 scale-105'
                            : 'bg-gray-800/80 text-gray-300 border-gray-600/40 hover:bg-gray-700/80 hover:text-white hover:border-gray-500/50'
                        }`}
                      >
                        {incidentTypes.find((type) => type.id === tag)?.label ||
                          tag.charAt(0).toUpperCase() + tag.slice(1)}
                      </button>
                    ))}
                  </div>
                  {tempFilters.tags.length === 0 && (
                    <p className="text-xs text-gray-500 flex items-center">
                      <span className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-2"></span>
                      {t('selectIncidentTypes')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer del popover sobrio */}
            <div className="p-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-400 font-medium">
                    {getActiveFiltersCount()} {t('activeFilters')}
                  </span>
                  {hasPendingChanges() && (
                    <span className="text-xs text-gray-300 bg-gray-600/30 px-2 py-1 rounded-full font-medium border border-gray-500/30">
                      {t('pendingChanges')}
                    </span>
                  )}
                </div>
                <button
                  onClick={applyFilters}
                  disabled={!hasPendingChanges()}
                  className={`px-8 py-3 rounded-xl transition-all duration-200 font-bold text-sm transform ${
                    hasPendingChanges()
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25 hover:scale-105'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {t('applyFilters')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Lista de incidentes compacta */}
      <div className="space-y-3">
        {incidents
          .sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime())
          .map((incident, index) => (
          <div
            key={incident._id}
            className="group bg-gradient-to-r from-gray-800/50 via-gray-700/50 to-gray-800/50 backdrop-blur-sm rounded-xl p-4 hover:from-gray-700/60 hover:via-gray-600/60 hover:to-gray-700/60 transition-all duration-200 cursor-pointer border border-gray-700/30 hover:border-gray-600/50 shadow-md hover:shadow-lg hover:scale-[1.01] transform"
            onClick={() => onIncidentSelect?.(incident)}
            style={{ animationDelay: `${index * 30}ms` }}
          >
            {/* Header del incidente compacto y centralizado */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 max-w-[70%]">
                <h3 className="text-base font-bold text-gray-100 mb-3 line-clamp-2 group-hover:text-white transition-colors leading-relaxed">
                  {incident.description}
                </h3>

                {/* Información de ubicación y fecha en columna */}
                <div className="space-y-2">
                  {/* Información de ubicación compacta */}
                  <div className="flex items-center text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                    <FiMapPin className="w-3 h-3 text-blue-400 mr-2 flex-shrink-0" />
                    <span className="font-medium truncate">
                      {incident.address?.replace(/^\d+;\d+,\s*/, '') ||
                        incident.address}
                    </span>
                    {incident.neighborhood && (
                      <span className="ml-2 text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded-full text-xs flex-shrink-0">
                        {incident.neighborhood}
                      </span>
                    )}
                  </div>

                  {/* Información de fecha y hora compacta */}
                  <div className="flex items-center text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                    <FiCalendar className="w-3 h-3 text-purple-400 mr-2 flex-shrink-0" />
                    <span className="font-medium">
                      {formatDate(incident.date)}
                    </span>
                    {incident.time && (
                      <>
                        <span className="mx-2 text-gray-500">•</span>
                        <span className="font-medium">
                          {formatTime(incident.time)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Selector de estado con colores específicos */}
              <div className="ml-4">
                <select
                  value={incident.status || 'pending'}
                  onChange={(e) =>
                    handleStatusChange(
                      incident._id,
                      e.target.value as 'pending' | 'verified' | 'resolved'
                    )
                  }
                  onClick={(e) => e.stopPropagation()}
                  className={`rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 border transition-all duration-200 font-medium cursor-pointer ${
                    incident.status === 'pending'
                      ? 'bg-amber-600/20 text-amber-300 border-amber-500/40 hover:bg-amber-600/30'
                      : incident.status === 'verified'
                      ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 hover:bg-blue-600/30'
                      : 'bg-green-600/20 text-green-300 border-green-500/40 hover:bg-green-600/30'
                  }`}
                >
                  <option
                    value="pending"
                    className="bg-gray-800 text-amber-300 font-medium"
                  >
                    {t('pending')}
                  </option>
                  <option
                    value="verified"
                    className="bg-gray-800 text-blue-300 font-medium"
                  >
                    {t('verified')}
                  </option>
                  <option
                    value="resolved"
                    className="bg-gray-800 text-green-300 font-medium"
                  >
                    {t('resolved')}
                  </option>
                </select>
              </div>
            </div>

            {/* Tags del incidente con colores específicos */}
            {incident.tags && incident.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <FiTag className="w-3 h-3 text-gray-400" />
                {incident.tags.map((tag) => {
                  const incidentType = incidentTypes.find(
                    (type) => type.id === tag
                  )
                  if (!incidentType) return null

                  // Get color configuration for this incident type
                  const colorConfig = getIncidentColorConfig(incidentType)

                  return (
                    <span
                      key={tag}
                      className={`bg-gradient-to-r ${colorConfig.gradient} text-white px-2 py-1 rounded-full text-xs font-semibold border-2 ${colorConfig.border} shadow-lg backdrop-blur-sm`}
                    >
                      {incidentType.label}
                    </span>
                  )
                })}
              </div>
            )}

            {/* Imágenes de evidencia */}
            {incident.evidenceUrls && incident.evidenceUrls.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm text-gray-400 font-medium">
                    {t('evidence')}:
                  </span>
                  <span className="text-xs text-gray-500">
                    ({incident.evidenceUrls.length}{' '}
                    {incident.evidenceUrls.length === 1
                      ? t('image')
                      : t('images')}
                    )
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {incident.evidenceUrls?.slice(0, 3).map((url, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={url}
                        alt={`${t('evidence')} ${index + 1}`}
                        width={64}
                        height={64}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-600/40 hover:border-gray-500/60 transition-all duration-200 cursor-pointer hover:scale-105"
                        onClick={() => window.open(url, '_blank')}
                      />
                      {index === 2 &&
                        incident.evidenceUrls &&
                        incident.evidenceUrls.length > 3 && (
                          <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              +{incident.evidenceUrls.length - 3}
                            </span>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Información adicional compacta y organizada */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-700/30 group-hover:border-gray-600/50 transition-colors">
              <div className="flex items-center space-x-4 text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                <div className="flex items-center space-x-1">
                  <FiUser className="w-3 h-3" />
                  <span>
                    {t('reported')} {timeAgo(incident.createdAt)}
                  </span>
                </div>
                {incident.evidenceUrls && incident.evidenceUrls.length > 0 && (
                  <div className="flex items-center space-x-1 text-blue-400">
                    <span className="text-sm">📷</span>
                    <span className="font-medium">
                      {incident.evidenceUrls.length} {t('evidence')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Estado vacío compacto */}
        {incidents.length === 0 && (
          <div className="text-center py-8 bg-gradient-to-r from-gray-800/30 to-gray-700/30 rounded-xl border border-gray-600/30">
            <div className="w-12 h-12 bg-gray-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiSearch className="w-6 h-6 text-gray-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-300 mb-1">
              No se encontraron incidentes
            </h3>
            <p className="text-gray-500 text-xs">
              Ajusta los filtros para ver más resultados
            </p>
          </div>
        )}
      </div>

      {/* Popover de filtros activos */}
      {showActiveFilters && getActiveFiltersCount() > 0 && (
        <div className="fixed inset-4 lg:absolute lg:right-0 lg:top-full lg:mt-3 lg:w-80 lg:inset-auto bg-gray-900/95 backdrop-blur-xl rounded-xl border border-gray-600/50 shadow-2xl z-50 overflow-hidden">
          {/* Header del popover */}
          <div className="bg-gray-800/95 p-3 border-b border-gray-600/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                  <FiFilter className="w-3 h-3 text-blue-400" />
                </div>
                <div>
                  <h5 className="text-white font-semibold text-sm">
                    Filtros Activos
                  </h5>
                  <p className="text-gray-400 text-xs">
                    Filtros aplicados actualmente
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowActiveFilters(false)}
                className="text-gray-400 hover:text-gray-200 transition-colors p-1 rounded-md hover:bg-gray-700/50"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Contenido del popover */}
          <div className="p-4 bg-gray-900/95">
            <div className="space-y-3">
              {activeFilters.city && (
                <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-blue-300 text-sm font-medium">
                      Ciudad: {activeFilters.city}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setActiveFilters((prev) => ({ ...prev, city: '' }))
                      setTempFilters((prev) => ({ ...prev, city: '' }))
                    }}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              )}

              {activeFilters.neighborhoodId && (
                <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-300 text-sm font-medium">
                      Barrio:{' '}
                      {getNeighborhoodName(activeFilters.neighborhoodId)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setActiveFilters((prev) => ({
                        ...prev,
                        neighborhoodId: '',
                      }))
                      setTempFilters((prev) => ({
                        ...prev,
                        neighborhoodId: '',
                      }))
                    }}
                    className="text-green-400 hover:text-green-300 transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              )}

              {(activeFilters.dateFrom || activeFilters.dateTo) && (
                <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-purple-300 text-sm font-medium">
                      Fecha:{' '}
                      {activeFilters.dateFrom && activeFilters.dateTo
                        ? `${activeFilters.dateFrom} - ${activeFilters.dateTo}`
                        : activeFilters.dateFrom || activeFilters.dateTo}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setActiveFilters((prev) => ({
                        ...prev,
                        dateFrom: '',
                        dateTo: '',
                      }))
                      setTempFilters((prev) => ({
                        ...prev,
                        dateFrom: '',
                        dateTo: '',
                      }))
                    }}
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              )}

              {activeFilters.tags.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    <span className="text-orange-300 text-sm font-medium">
                      Tipos: {activeFilters.tags.length} seleccionados
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setActiveFilters((prev) => ({ ...prev, tags: [] }))
                      setTempFilters((prev) => ({ ...prev, tags: [] }))
                    }}
                    className="text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer del popover */}
          <div className="bg-gray-800/95 p-3 border-t border-gray-600/30">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400 font-medium">
                {getActiveFiltersCount()} filtros activos
              </span>
              <button
                onClick={() => {
                  clearFilters()
                  setShowActiveFilters(false)
                }}
                className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded-md hover:bg-red-500/10 font-medium"
              >
                Limpiar todos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de razón mejorado */}
      {showReasonModal && selectedIncident && pendingStatus && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-8 max-w-md w-full border border-gray-600/40 shadow-2xl">
            <div className="text-center mb-6">
              <div
                className={`w-16 h-16 bg-gradient-to-r ${getStatusColor(
                  pendingStatus
                )} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}
              >
                {getStatusIcon(pendingStatus)}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Cambiar estado a{' '}
                {pendingStatus === 'verified'
                  ? 'Verificado'
                  : pendingStatus === 'resolved'
                  ? 'Resuelto'
                  : 'Pendiente'}
              </h3>
              <p className="text-gray-300 text-sm">
                {selectedIncident.description}
              </p>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                Razón del cambio (opcional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explica por qué cambias el estado..."
                className="w-full bg-gray-700/50 text-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 border-2 border-gray-600/40 transition-all duration-200 resize-none"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={() => {
                  setShowReasonModal(false)
                  setSelectedIncident(null)
                  setPendingStatus(null)
                  setReason('')
                }}
                className="px-6 py-3 text-gray-400 hover:text-gray-200 transition-all duration-200 font-medium hover:bg-gray-700/50 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={confirmStatusChange}
                className={`px-6 py-3 bg-gradient-to-r ${getStatusColor(
                  pendingStatus
                )} text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold transform`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
