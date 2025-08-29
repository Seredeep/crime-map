'use client';

import { Neighborhood, fetchNeighborhoods } from '@/lib/services/neighborhoods';
import { IncidentFilters as FiltersType } from '@/lib/types/global';
import { AnimatePresence, motion } from 'framer-motion';
import {
    List
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import IncidentFiltersContent from './IncidentFiltersContent';

interface IncidentFiltersProps {
  filters: FiltersType;
  onFiltersChangeAction: (filters: FiltersType) => void;
  onNeighborhoodSelect?: (neighborhood: Neighborhood | null) => void;
}

// Common tags for quick filtering
const COMMON_TAGS = [
  'robo', 'hurto', 'asalto', 'vandalismo', 'drogas', 'ruido', 'violencia', 'accidente'
];

export default function IncidentFilters({ filters, onFiltersChangeAction, onNeighborhoodSelect }: IncidentFiltersProps) {
  const t = useTranslations('Filters');
  const [open, setOpen] = useState(false);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tags || []);
  const [selectedNeighborhoodMongoId, setSelectedNeighborhoodMongoId] = useState<string>('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const { data: session } = useSession();

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
  }, [t, session, filters.neighborhoodId, onNeighborhoodSelect]);

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

  // Handle click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        triggerRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  return (
    <div className="relative">
      <motion.button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center p-2 text-gray-400 hover:text-white rounded-lg transition-all duration-300"
        whileTap={{ scale: 0.95 }}
        aria-label={t('title')}
      >
        <List className="h-6 w-6" />

        <AnimatePresence>
          {activeFiltersCount > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 text-xs bg-blue-500 text-white rounded-full"
            >
              {activeFiltersCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute top-full mt-3 w-[95vw] max-w-sm rounded-2xl shadow-2xl z-[200]"
            style={{
              background: 'rgba(0, 0, 0, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: `
                0 20px 60px rgba(0, 0, 0, 0.5),
                0 8px 32px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
              `,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="p-6">
              <IncidentFiltersContent
                filters={filters}
                onFiltersChangeAction={onFiltersChangeAction}
                onNeighborhoodSelect={onNeighborhoodSelect}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
