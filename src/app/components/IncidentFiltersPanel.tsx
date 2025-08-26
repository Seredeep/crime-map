'use client'

// #region Imports
import { GET_REGION_INCIDENT_TYPES, Region } from '@/lib/services/incidents'
import { Neighborhood, fetchNeighborhoods } from '@/lib/services/neighborhoods/neighborhoodService'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FiCalendar, FiFilter, FiX } from 'react-icons/fi'
// #endregion

// #region Types
export interface BaseFiltersValue {
  city?: string
  neighborhoodId?: string
  dateFrom?: string
  dateTo?: string
  tags?: string[]
}

interface IncidentFiltersPanelProps<T extends BaseFiltersValue = BaseFiltersValue> {
  open: boolean
  value: T
  onApply: (next: T) => void
  onOpenChange: (open: boolean) => void
  onClear?: () => void
  onNeighborhoodSelect?: (neighborhood: Neighborhood | null) => void
  // Define qué secciones mostrar
  sections?: {
    city?: boolean
    neighborhood?: boolean
    dates?: boolean
    tags?: boolean
  }
  // Cómo mapear neighborhoodId al aplicar
  mapNeighborhoodId?: 'mongo' | 'propertiesId'
}
// #endregion

// #region Component
export default function IncidentFiltersPanel<T extends BaseFiltersValue = BaseFiltersValue>({
  open,
  value,
  onApply,
  onOpenChange,
  onClear,
  onNeighborhoodSelect,
  sections = { city: true, neighborhood: true, dates: true, tags: true },
  mapNeighborhoodId = 'mongo',
}: IncidentFiltersPanelProps<T>) {
  const t = useTranslations('Incidents')
  const { data: session } = useSession()

  // Region + incident types for tag labels
  const userRegion: Region = useMemo(() => {
    const country = (session?.user as any)?.country
    if (country === 'Argentina') return 'argentina'
    if (country === 'Mexico') return 'mexico'
    if (country === 'Colombia') return 'colombia'
    if (country === 'Chile') return 'chile'
    return 'general'
  }, [session])
  const incidentTypes = GET_REGION_INCIDENT_TYPES(useTranslations('incidentTypes'), userRegion)
  const allIncidentTypeIds = useMemo(() => incidentTypes.map((t) => t.id), [incidentTypes])

  // Local temp state (delayed apply)
  const [temp, setTemp] = useState<BaseFiltersValue>({
    city: value.city || '',
    neighborhoodId: value.neighborhoodId || '',
    dateFrom: value.dateFrom || '',
    dateTo: value.dateTo || '',
    tags: value.tags || [],
  })

  // Neighborhoods and cities
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [filteredNeighborhoods, setFilteredNeighborhoods] = useState<Neighborhood[]>([])

  // Refs for outside click
  const popoverRef = useRef<HTMLDivElement>(null)

  // Sync open -> temp with current value
  useEffect(() => {
    if (open) {
      setTemp({
        city: value.city || '',
        // If value.neighborhoodId could be properties.id, try to preselect matching mongo _id
        neighborhoodId: preselectNeighborhoodMongoId(value.neighborhoodId, neighborhoods) || '',
        dateFrom: value.dateFrom || '',
        dateTo: value.dateTo || '',
        tags: value.tags || [],
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Load neighborhoods and compute cities
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchNeighborhoods()
        setNeighborhoods(data)
        const uniqueCities = [
          ...new Set(
            data.map((n) => n.properties.city || n.properties.state || 'Sin ciudad')
          ),
        ]
          .filter((c) => c && c !== 'Sin ciudad')
          .sort()
        setCities(uniqueCities)
        // When opening with a properties.id value, ensure we map to mongo _id on first load
        if (open && value.neighborhoodId) {
          const mongoId = preselectNeighborhoodMongoId(value.neighborhoodId, data)
          if (mongoId) setTemp((prev) => ({ ...prev, neighborhoodId: mongoId }))
        }
      } catch (e) {
        // silent fail
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filter neighborhoods when city changes
  useEffect(() => {
    if (temp.city) {
      const filtered = neighborhoods.filter(
        (n) => (n.properties.city || n.properties.state) === temp.city
      )
      const sorted = filtered.sort((a, b) => {
        const aName = (a.properties.soc_fomen || a.properties.name || '').toLowerCase()
        const bName = (b.properties.soc_fomen || b.properties.name || '').toLowerCase()
        return aName.localeCompare(bName, 'es')
      })
      setFilteredNeighborhoods(sorted)
      // Clean invalid selection when city changes
      if (temp.neighborhoodId && !sorted.some((n) => n._id === temp.neighborhoodId)) {
        setTemp((p) => ({ ...p, neighborhoodId: '' }))
      }
    } else {
      setFilteredNeighborhoods([])
      if (temp.neighborhoodId) setTemp((p) => ({ ...p, neighborhoodId: '' }))
    }
  }, [temp.city, temp.neighborhoodId, neighborhoods])

  // Outside click to close and revert
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!open) return
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onOpenChange(false)
        // revert temp to current value next time we open
      }
    }
    if (open) document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open, onOpenChange])

  // Helpers
  const hasPendingChanges = useMemo(() => {
    return (
      (value.city || '') !== (temp.city || '') ||
      // compare by mapped outward id
      (normalizeNeighborhoodOut(value.neighborhoodId, mapNeighborhoodId, neighborhoods) || '') !==
        (normalizeNeighborhoodOut(temp.neighborhoodId, mapNeighborhoodId, neighborhoods) || '') ||
      (value.dateFrom || '') !== (temp.dateFrom || '') ||
      (value.dateTo || '') !== (temp.dateTo || '') ||
      JSON.stringify(value.tags || []) !== JSON.stringify(temp.tags || [])
    )
  }, [value, temp, neighborhoods, mapNeighborhoodId])

  const getActiveFiltersCount = () => {
    let count = 0
    if (value.city) count++
    if (value.neighborhoodId) count++
    if (value.dateFrom || value.dateTo) count++
    if (value.tags && value.tags.length > 0) count++
    return count
  }

  const apply = () => {
    // Map neighborhood id as requested
    const mappedNeighborhoodId = normalizeNeighborhoodOut(
      temp.neighborhoodId,
      mapNeighborhoodId,
      neighborhoods
    )
    const next = {
      ...value,
      city: temp.city || undefined,
      neighborhoodId: mappedNeighborhoodId || undefined,
      dateFrom: temp.dateFrom || undefined,
      dateTo: temp.dateTo || undefined,
      tags: temp.tags && temp.tags.length > 0 ? temp.tags : undefined,
    }
    onApply(next as T)
    // notify external selection for map highlight
    if (onNeighborhoodSelect) {
      const selected = neighborhoods.find((n) =>
        matchNeighborhoodId(n, mappedNeighborhoodId)
      )
      onNeighborhoodSelect(selected || null)
    }
    onOpenChange(false)
  }

  const clear = () => {
    setTemp({ city: '', neighborhoodId: '', dateFrom: '', dateTo: '', tags: [] })
    onClear?.()
  }

  // #region Render
  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-40" onClick={() => onOpenChange(false)} />

      <div
        ref={popoverRef}
        className="fixed inset-4 h-[60vh] lg:absolute lg:right-4 lg:top-20 lg:w-[700px] lg:inset-auto bg-gray-900/95 backdrop-blur-xl rounded-3xl border-2 border-gray-600/50 shadow-2xl z-50 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gray-800/95 backdrop-blur-sm p-3 border-b border-gray-600/30 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-7 h-7 bg-gray-700 rounded-lg flex items-center justify-center border border-gray-600/40">
                <FiFilter className="w-4 h-4 text-gray-300" />
              </div>
              <div>
                <h5 className="text-white font-semibold text-base">{t('searchFilters')}</h5>
                <p className="text-gray-400 text-xs">{t('refineResults')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={clear}
                className="text-xs text-gray-400 hover:text-gray-200 transition-colors px-2 py-1 rounded-md hover:bg-gray-700/50 font-medium border border-gray-600/40 hover:border-gray-500/50"
              >
                {t('clear')}
              </button>
              <button
                onClick={() => onOpenChange(false)}
                className="text-gray-400 hover:text-gray-200 transition-colors p-1 rounded-md hover:bg-gray-700/50"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 bg-gray-900/95">
          <div className="space-y-3">
            {/* City + Neighborhood */}
            {(sections.city || sections.neighborhood) && (
              <div className="grid grid-cols-2 gap-2">
                {sections.city && (
                  <div className="space-y-1">
                    <label className="flex text-xs font-medium text-gray-300 items-center">
                      <div className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-2"></div>
                      {t('cityState')}
                    </label>
                    <div className="relative">
                      <select
                        value={temp.city || ''}
                        onChange={(e) => setTemp((p) => ({ ...p, city: e.target.value }))}
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
                )}

                {sections.neighborhood && (
                  <div className="space-y-1">
                    <label className="flex text-xs font-medium text-gray-300 items-center">
                      <div className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-2"></div>
                      {t('neighborhoodCity')}
                      {temp.city && (
                        <span className="ml-auto text-xs text-gray-400 bg-gray-600/30 px-1.5 py-0.5 rounded-full font-medium border border-gray-500/30">
                          {filteredNeighborhoods.length}
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <select
                        value={temp.neighborhoodId || ''}
                        onChange={(e) => setTemp((p) => ({ ...p, neighborhoodId: e.target.value }))}
                        disabled={!temp.city}
                        className={`w-full rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-500/50 focus:border-gray-500/50 border transition-colors appearance-none font-medium text-xs ${
                          temp.city
                            ? 'bg-gray-800/80 text-gray-200 border-gray-600/40 hover:border-gray-500/50'
                            : 'bg-gray-800/40 text-gray-500 border-gray-600/20 cursor-not-allowed'
                        }`}
                      >
                        <option value="">
                          {temp.city ? t('selectNeighborhood') : t('selectCityFirst')}
                        </option>
                        {filteredNeighborhoods.map((n) => (
                          <option key={n._id} value={n._id}>
                            {n.properties.soc_fomen || n.properties.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <div
                          className={`w-1.5 h-1.5 border transform rotate-45 ${
                            temp.city
                              ? 'border-gray-400 border-t-transparent border-l-transparent'
                              : 'border-gray-500 border-t-transparent border-l-transparent'
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!temp.city && (sections.city || sections.neighborhood) && (
              <p className="text-xs text-gray-500 flex items-center">
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-2"></span>
                {t('selectCityForNeighborhoods')}
              </p>
            )}

            {/* Dates */}
            {sections.dates && (
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
                        value={temp.dateFrom || ''}
                        onChange={(e) => setTemp((p) => ({ ...p, dateFrom: e.target.value }))}
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
                        value={temp.dateTo || ''}
                        onChange={(e) => setTemp((p) => ({ ...p, dateTo: e.target.value }))}
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
            )}

            {/* Tags */}
            {sections.tags && (
              <div className="space-y-2">
                <label className="flex text-xs font-medium text-gray-300 items-center">
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-2"></div>
                  {t('incidentTypes')}
                  {temp.tags && temp.tags.length > 0 && (
                    <span className="ml-auto text-xs text-gray-400 bg-gray-600/30 px-1.5 py-0.5 rounded-full font-medium border border-gray-500/30">
                      {temp.tags.length}
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {allIncidentTypeIds.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        const nextTags = new Set(temp.tags || [])
                        if (nextTags.has(tag)) nextTags.delete(tag)
                        else nextTags.add(tag)
                        setTemp((p) => ({ ...p, tags: Array.from(nextTags) }))
                      }}
                      className={`px-2 py-1.5 text-xs rounded-md transition-colors font-medium text-center border transform hover:scale-105 ${
                        temp.tags?.includes(tag)
                          ? 'bg-gray-600 text-white border-gray-500 scale-105'
                          : 'bg-gray-800/80 text-gray-300 border-gray-600/40 hover:bg-gray-700/80 hover:text-white hover:border-gray-500/50'
                      }`}
                    >
                      {incidentTypes.find((i) => i.id === tag)?.label ||
                        tag.charAt(0).toUpperCase() + tag.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-400 font-medium">
                {getActiveFiltersCount()} {t('activeFilters')}
              </span>
              {hasPendingChanges && (
                <span className="text-xs text-gray-300 bg-gray-600/30 px-2 py-1 rounded-full font-medium border border-gray-500/30">
                  {t('pendingChanges')}
                </span>
              )}
            </div>
            <button
              onClick={apply}
              disabled={!hasPendingChanges}
              className={`px-8 py-3 rounded-xl transition-all duration-200 font-bold text-sm transform ${
                hasPendingChanges
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
  )
  // #endregion
}

// #region Helpers
function preselectNeighborhoodMongoId(
  incomingNeighborhoodId: string | undefined,
  list: Neighborhood[]
): string | undefined {
  if (!incomingNeighborhoodId) return undefined
  // If already looks like a mongo id present in list, keep it
  const exists = list.some((n) => n._id === incomingNeighborhoodId)
  if (exists) return incomingNeighborhoodId
  // Otherwise try to map properties.id -> mongo _id
  const match = list.find(
    (n) => n.properties.id?.toString() === incomingNeighborhoodId
  )
  return match?._id
}

function normalizeNeighborhoodOut(
  internalMongoId: string | undefined,
  mode: 'mongo' | 'propertiesId',
  list: Neighborhood[]
): string | undefined {
  if (!internalMongoId) return undefined
  if (mode === 'mongo') return internalMongoId
  const match = list.find((n) => n._id === internalMongoId)
  return match?.properties.id?.toString()
}

function matchNeighborhoodId(n: Neighborhood, outwardId?: string) {
  if (!outwardId) return false
  return (
    n._id === outwardId || n.properties.id?.toString() === outwardId
  )
}
// #endregion
