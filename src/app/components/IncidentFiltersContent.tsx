'use client';

import { Neighborhood, fetchNeighborhoods } from '@/lib/services/neighborhoods';
import { IncidentFilters as FiltersType } from '@/lib/types/global';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  CheckCircle,
  Clock,
  Clock3,
  MapPin,
  Tags,
  Trash2,
  X
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

interface IncidentFiltersContentProps {
  filters: FiltersType;
  onFiltersChangeAction: (filters: FiltersType) => void;
  onNeighborhoodSelect?: (neighborhood: Neighborhood | null) => void;
  onClose?: () => void;
}

// Common tags for quick filtering
const COMMON_TAGS = [
  'robbery', 'theft', 'assault', 'vandalism', 'drugs', 'noise', 'violence', 'accident'
];

export default function IncidentFiltersContent({
  filters,
  onFiltersChangeAction,
  onNeighborhoodSelect,
  onClose
}: IncidentFiltersContentProps) {
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tags || []);
  const [selectedNeighborhoodMongoId, setSelectedNeighborhoodMongoId] = useState<string>('');

  const { data: session } = useSession();
  const t = useTranslations('Filters');

  // Check if user is editor or admin
  const isEditorOrAdmin = useMemo(() => {
    if (!session?.user) return false;
    const userRole = (session.user as any).role;
    return userRole === 'editor' || userRole === 'admin';
  }, [session]);

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.neighborhoodId) count++;
    if (filters.status) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.timeFrom || filters.timeTo) count++;
    if (filters.time) count++;
    if (filters.tags && filters.tags.length > 0) count++;
    return count;
  }, [filters]);

  // Load neighborhoods filtered by user's city on component mount
  useEffect(() => {
    async function loadNeighborhoods() {
      setLoading(true);
      try {
        let data: Neighborhood[] = [];
        const userCity = (session?.user as any)?.city as string | undefined;
        if (userCity) {
          const { fetchNeighborhoodsByCity } = await import('@/lib/services/neighborhoods');
          data = await fetchNeighborhoodsByCity(userCity);
        } else {
          data = await fetchNeighborhoods();
        }

        // Sort neighborhoods alphabetically by display name with fallback for different datasets
        const sortedNeighborhoods = [...data].sort((a, b) => {
          const displayA = (a.properties.soc_fomen || a.properties.name || '').toLowerCase();
          const displayB = (b.properties.soc_fomen || b.properties.name || '').toLowerCase();
          return displayA.localeCompare(displayB, 'es');
        });

        setNeighborhoods(sortedNeighborhoods);

        // If filters.neighborhoodId is present (numeric/string), map it to the matching Mongo _id
        if (filters.neighborhoodId) {
          const match = sortedNeighborhoods.find(n => n.properties.id?.toString() === filters.neighborhoodId);
          if (match) {
            setSelectedNeighborhoodMongoId(match._id);
            // Emit selected neighborhood on mount to draw area if filter already set
            requestAnimationFrame(() => onNeighborhoodSelect?.(match));
          }
        } else {
          setSelectedNeighborhoodMongoId('');
          requestAnimationFrame(() => onNeighborhoodSelect?.(null));
        }
      } catch (err) {
        console.error('Error loading neighborhoods:', err);
        setError(t('errorLoadingNeighborhoods'));
      } finally {
        setLoading(false);
      }
    }

    loadNeighborhoods();
  }, [t, session]);

  // Handle neighborhood selection change - memoized
  const handleNeighborhoodChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value; // Using Mongo _id as value
    setSelectedNeighborhoodMongoId(selectedId);

    // Find the full neighborhood object by _id
    const selectedNeighborhood = neighborhoods.find(n => n._id === selectedId) || null;

    // Update filters with properties.id (numeric) when available to keep backend search compatible
    const neighborhoodFilterId = selectedNeighborhood?.properties.id?.toString();

    onFiltersChangeAction({
      ...filters,
      neighborhoodId: neighborhoodFilterId || undefined
    });

    // Emit selected neighborhood for map highlight
    if (onNeighborhoodSelect) {
      onNeighborhoodSelect(selectedNeighborhood);
    }
  }, [filters, neighborhoods, onFiltersChangeAction, onNeighborhoodSelect]);

  // Handle date range changes - memoized
  const handleDateFromChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChangeAction({
      ...filters,
      dateFrom: e.target.value || undefined,
      date: undefined // Clear single date if using range
    });
  }, [filters, onFiltersChangeAction]);

  const handleDateToChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChangeAction({
      ...filters,
      dateTo: e.target.value || undefined,
      date: undefined // Clear single date if using range
    });
  }, [filters, onFiltersChangeAction]);

  // Handle time range changes - memoized
  const handleTimeFromChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChangeAction({
      ...filters,
      timeFrom: e.target.value || undefined
    });
  }, [filters, onFiltersChangeAction]);

  const handleTimeToChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChangeAction({
      ...filters,
      timeTo: e.target.value || undefined
    });
  }, [filters, onFiltersChangeAction]);

  // Handle time period change - memoized
  const handleTimePeriodChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChangeAction({
      ...filters,
      time: e.target.value || undefined
    });
  }, [filters, onFiltersChangeAction]);

  // Handle status change - memoized
  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChangeAction({
      ...filters,
      status: e.target.value as 'pending' | 'verified' | 'resolved' | undefined
    });
  }, [filters, onFiltersChangeAction]);

  // Handle tag toggle - memoized
  const handleTagToggle = useCallback((tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];

    setSelectedTags(newTags);
    onFiltersChangeAction({
      ...filters,
      tags: newTags.length > 0 ? newTags : undefined
    });
  }, [selectedTags, filters, onFiltersChangeAction]);

  // Clear all filters - memoized
  const handleClearFilters = useCallback(() => {
    setSelectedTags([]);
    const today = new Date();
    const defaultDate = new Date('2013-01-01');

    onFiltersChangeAction({
      dateFrom: defaultDate.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0],
      neighborhoodId: undefined,
      status: 'verified' // Siempre volver a 'verified' al limpiar filtros
    });

    // Limpiar también el barrio seleccionado
    if (onNeighborhoodSelect) {
      onNeighborhoodSelect(null);
    }
  }, [onFiltersChangeAction, onNeighborhoodSelect]);

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Header con estilo Claridad */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
            <Tags className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white font-manrope">{t('title')}</h3>
        </div>
        {onClose && (
          <motion.button
            onClick={onClose}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all duration-200 backdrop-blur-sm border border-white/20"
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Botón limpiar filtros */}
      <AnimatePresence>
        {activeFiltersCount > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={handleClearFilters}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm rounded-xl transition-all duration-300 mb-6 font-medium"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF'
            }}
            whileHover={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transform: 'translateY(-1px)'
            }}
            whileTap={{ scale: 0.98 }}
          >
            <Trash2 className="h-4 w-4" />
            {t('clearFilters')}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Filtros con estilo Claridad */}
      <div className="space-y-4">
        {/* Neighborhood Filter */}
        <motion.div
          className="p-4 rounded-xl transition-all duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
          whileHover={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            transform: 'translateY(-1px)'
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-white text-sm">{t('neighborhood')}</span>
          </div>
          <select
            className="w-full bg-transparent border-none outline-none text-white text-sm appearance-none cursor-pointer"
            value={selectedNeighborhoodMongoId}
            onChange={handleNeighborhoodChange}
            disabled={loading}
            style={{ color: '#FFFFFF' }}
          >
            <option value="" style={{ background: '#1F2937', color: '#FFFFFF' }}>{t('allNeighborhoods')}</option>
            {error ? (
              <option disabled style={{ background: '#1F2937', color: '#FFFFFF' }}>{t('errorLoadingNeighborhoods')}</option>
            ) : loading ? (
              <option disabled style={{ background: '#1F2937', color: '#FFFFFF' }}>{t('loadingNeighborhoods')}</option>
            ) : (
              neighborhoods.map((neighborhood) => (
                <option
                  key={neighborhood._id}
                  value={neighborhood._id}
                  style={{ background: '#1F2937', color: '#FFFFFF' }}
                >
                  {neighborhood.properties.soc_fomen || neighborhood.properties.name}
                </option>
              ))
            )}
          </select>
        </motion.div>

        {/* Status Filter - solo visible para editores y administradores */}
        {isEditorOrAdmin && (
          <motion.div
            className="p-4 rounded-xl transition-all duration-300"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
            whileHover={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              transform: 'translateY(-1px)'
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-white text-sm">{t('status')}</span>
            </div>
            <select
              className="w-full bg-transparent border-none outline-none text-white text-sm appearance-none cursor-pointer"
              value={filters.status || ''}
              onChange={handleStatusChange}
              style={{ color: '#FFFFFF' }}
            >
              <option value="" style={{ background: '#1F2937', color: '#FFFFFF' }}>{t('allStatuses')}</option>
              <option value="pending" style={{ background: '#1F2937', color: '#FFFFFF' }}>{t('pending')}</option>
              <option value="verified" style={{ background: '#1F2937', color: '#FFFFFF' }}>{t('verified')}</option>
              <option value="resolved" style={{ background: '#1F2937', color: '#FFFFFF' }}>{t('resolved')}</option>
            </select>
          </motion.div>
        )}

        {/* Date Range Filter */}
        <motion.div
          className="p-4 rounded-xl transition-all duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
          whileHover={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            transform: 'translateY(-1px)'
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-white text-sm">{t('dates')}</span>
          </div>
          <div className="flex gap-2 text-xs">
            <input
              type="date"
              className="flex-1 bg-transparent border-none outline-none cursor-pointer text-white"
              value={filters.dateFrom || ''}
              onChange={handleDateFromChange}
              style={{ color: '#FFFFFF' }}
            />
            <span className="text-white/60">-</span>
            <input
              type="date"
              className="flex-1 bg-transparent border-none outline-none cursor-pointer text-white"
              value={filters.dateTo || ''}
              onChange={handleDateToChange}
              style={{ color: '#FFFFFF' }}
            />
          </div>
        </motion.div>

        {/* Time Range Filter */}
        <motion.div
          className="p-4 rounded-xl transition-all duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
          whileHover={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            transform: 'translateY(-1px)'
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-white text-sm">{t('hours')}</span>
          </div>
          <div className="flex gap-2 text-xs">
            <input
              type="time"
              className="flex-1 bg-transparent border-none outline-none cursor-pointer text-white"
              value={filters.timeFrom || ''}
              onChange={handleTimeFromChange}
              style={{ color: '#FFFFFF' }}
            />
            <span className="text-white/60">-</span>
            <input
              type="time"
              className="flex-1 bg-transparent border-none outline-none cursor-pointer text-white"
              value={filters.timeTo || ''}
              onChange={handleTimeToChange}
              style={{ color: '#FFFFFF' }}
            />
          </div>
        </motion.div>

        {/* Time Period Filter */}
        <motion.div
          className="p-4 rounded-xl transition-all duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
          whileHover={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            transform: 'translateY(-1px)'
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Clock3 className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-white text-sm">{t('period')}</span>
          </div>
          <select
            className="w-full bg-transparent border-none outline-none text-white text-sm appearance-none cursor-pointer"
            value={filters.time || ''}
            onChange={handleTimePeriodChange}
            style={{ color: '#FFFFFF' }}
          >
            <option value="" style={{ background: '#1F2937', color: '#FFFFFF' }}>{t('anyTime')}</option>
            <option value="morning" style={{ background: '#1F2937', color: '#FFFFFF' }}>{t('morning')}</option>
            <option value="afternoon" style={{ background: '#1F2937', color: '#FFFFFF' }}>{t('afternoon')}</option>
            <option value="evening" style={{ background: '#1F2937', color: '#FFFFFF' }}>{t('evening')}</option>
            <option value="night" style={{ background: '#1F2937', color: '#FFFFFF' }}>{t('night')}</option>
          </select>
        </motion.div>

        {/* Tags Section */}
        <motion.div
          className="p-4 rounded-xl transition-all duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
          whileHover={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            transform: 'translateY(-1px)'
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/10 rounded-lg">
              <Tags className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-white text-sm">{t('tags')}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {COMMON_TAGS.map((tag, index) => (
              <motion.button
                key={tag}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleTagToggle(tag)}
                className={`px-3 py-2 text-xs rounded-lg transition-all duration-300 font-medium ${
                  selectedTags.includes(tag)
                    ? 'text-white shadow-lg'
                    : 'text-white/70 hover:text-white'
                }`}
                style={{
                  background: selectedTags.includes(tag)
                    ? 'rgba(255, 255, 255, 0.2)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: selectedTags.includes(tag)
                    ? '1px solid rgba(255, 255, 255, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.1)'
                }}
                whileHover={!selectedTags.includes(tag) ? {
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transform: 'translateY(-1px)'
                } : {}}
                whileTap={{ scale: 0.95 }}
              >
                {t(`commonTags.${tag}`)}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
