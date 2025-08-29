/**
 * USER INTERFACE CONFIGURATION
 * ============================
 *
 * This file centralizes all user interface related configuration,
 * including colors, styles, component configurations and system messages.
 */

import { IncidentColor } from '../services/incidents/types';

// #region Incident Color Configuration
/**
 * Color configuration for incident types
 * Includes CSS classes for borders, backgrounds, text and hover states
 * Reduced palette for a more professional and less flashy appearance
 */
export const INCIDENT_COLORS: Record<IncidentColor, {
  border: string;
  bg: string;
  text: string;
  hover: string;
  gradient: string;
}> = {
  red: {
    border: 'border-red-600',
    bg: 'bg-red-600/10',
    text: 'text-red-500',
    hover: 'hover:bg-red-600/20',
    gradient: 'from-red-600 to-red-700'
  },
  orange: {
    border: 'border-orange-600',
    bg: 'bg-orange-600/10',
    text: 'text-orange-500',
    hover: 'hover:bg-orange-600/20',
    gradient: 'from-orange-600 to-orange-700'
  },
  yellow: {
    border: 'border-amber-600',
    bg: 'bg-amber-600/10',
    text: 'text-amber-500',
    hover: 'hover:bg-amber-600/20',
    gradient: 'from-amber-600 to-amber-700'
  },
  blue: {
    border: 'border-blue-600',
    bg: 'bg-blue-600/10',
    text: 'text-blue-500',
    hover: 'hover:bg-blue-600/20',
    gradient: 'from-blue-600 to-blue-700'
  },
  purple: {
    border: 'border-purple-600',
    bg: 'bg-purple-600/10',
    text: 'text-purple-500',
    hover: 'hover:bg-purple-600/20',
    gradient: 'from-purple-600 to-purple-700'
  },
  pink: {
    border: 'border-pink-600',
    bg: 'bg-pink-600/10',
    text: 'text-pink-500',
    hover: 'hover:bg-pink-600/20',
    gradient: 'from-pink-600 to-pink-700'
  },
  gray: {
    border: 'border-gray-600',
    bg: 'bg-gray-600/10',
    text: 'text-gray-500',
    hover: 'hover:bg-gray-600/20',
    gradient: 'from-gray-600 to-gray-700'
  },
  green: {
    border: 'border-green-600',
    bg: 'bg-green-600/10',
    text: 'text-green-500',
    hover: 'hover:bg-green-600/20',
    gradient: 'from-green-600 to-green-700'
  },
  cyan: {
    border: 'border-cyan-600',
    bg: 'bg-cyan-600/10',
    text: 'text-cyan-500',
    hover: 'hover:bg-cyan-600/20',
    gradient: 'from-cyan-600 to-cyan-700'
  },
  teal: {
    border: 'border-teal-600',
    bg: 'bg-teal-600/10',
    text: 'text-teal-500',
    hover: 'hover:bg-teal-600/20',
    gradient: 'from-teal-600 to-teal-700'
  },
  indigo: {
    border: 'border-indigo-600',
    bg: 'bg-indigo-600/10',
    text: 'text-indigo-500',
    hover: 'hover:bg-indigo-600/20',
    gradient: 'from-indigo-600 to-indigo-700'
  },
  violet: {
    border: 'border-violet-600',
    bg: 'bg-violet-600/10',
    text: 'text-violet-500',
    hover: 'hover:bg-violet-600/20',
    gradient: 'from-violet-600 to-violet-700'
  },
  rose: {
    border: 'border-rose-600',
    bg: 'bg-rose-600/10',
    text: 'text-rose-500',
    hover: 'hover:bg-rose-600/20',
    gradient: 'from-rose-600 to-rose-700'
  },
  emerald: {
    border: 'border-emerald-600',
    bg: 'bg-emerald-600/10',
    text: 'text-emerald-500',
    hover: 'hover:bg-emerald-600/20',
    gradient: 'from-emerald-600 to-emerald-700'
  },
  amber: {
    border: 'border-amber-600',
    bg: 'bg-amber-600/10',
    text: 'text-amber-500',
    hover: 'hover:bg-amber-600/20',
    gradient: 'from-amber-600 to-amber-700'
  },
  lime: {
    border: 'border-lime-600',
    bg: 'bg-lime-600/10',
    text: 'text-lime-500',
    hover: 'hover:bg-lime-600/20',
    gradient: 'from-lime-600 to-lime-700'
  },
} as const;
// #endregion

// #region Carousel Configuration
/**
 * Animation configuration for the incident carousel
 */
export const CAROUSEL_CONFIG = {
  /** Auto-scroll speed (units per frame) */
  SCROLL_SPEED: 0.3,
  /** Update interval in milliseconds */
  SCROLL_INTERVAL: 60,
  /** Transition duration in seconds */
  TRANSITION_DURATION: 0.6,
  /** Number of carousel copies */
  CAROUSEL_COPIES: 3,
  /** Spacing between elements */
  ELEMENT_SPACING: 12
} as const;
// #endregion

// #region Grid Configuration
/**
 * Configuration for the incident grid view
 */
export const GRID_CONFIG = {
  /** Number of columns in grid view */
  COLUMNS: 2,
  /** Spacing between elements */
  GAP: 4,
  /** Button height in grid view */
  BUTTON_HEIGHT: 20,
  /** Button height in carousel */
  CAROUSEL_BUTTON_HEIGHT: 16,
  /** Button width in carousel */
  CAROUSEL_BUTTON_WIDTH: 20
} as const;
// #endregion

// #region Time Configuration
/**
 * Time and date related configurations
 */
export const TIME_CONFIG = {
  /** Wait time before redirect after successful submission (ms) */
  REDIRECT_DELAY: 2000,
  /** Carousel pause duration when selecting element (ms) */
  CAROUSEL_PAUSE_DURATION: 1000,
  /** Default date format */
  DATE_FORMAT: 'yyyy-MM-dd',
  /** Default time format */
  TIME_FORMAT: 'HH:mm'
} as const;
// #endregion

// #region System Messages
/**
 * Función para obtener mensajes del sistema traducidos
 * @param t - Función de traducción de next-intl
 * @returns Objeto con mensajes traducidos
 */
export const UI_MESSAGES = (t: (key: string) => string) => ({
  ERRORS: {
    DESCRIPTION_REQUIRED: t('errors.descriptionRequired'),
    LOCATION_REQUIRED: t('errors.locationRequired'),
    TAGS_REQUIRED: t('errors.tagsRequired'),
    SUBMIT_ERROR: t('errors.submitError'),
    NETWORK_ERROR: t('errors.networkError')
  },
  SUCCESS: {
    INCIDENT_REPORTED: t('success.incidentReported'),
    FORM_SUBMITTED: t('success.formSubmitted')
  },
  INFO: {
    LOADING: t('info.loading'),
    SUBMITTING: t('info.submitting'),
    PROCESSING: t('info.processing')
  }
});

/**
 * @deprecated Usar UI_MESSAGES() en su lugar
 * Mensajes hardcodeados (mantenidos para compatibilidad)
 */
export const MESSAGES = {
  ERRORS: {
    DESCRIPTION_REQUIRED: 'Description is required',
    LOCATION_REQUIRED: 'Please select a valid location',
    TAGS_REQUIRED: 'Select at least one incident type',
    SUBMIT_ERROR: 'Error reporting the incident',
    NETWORK_ERROR: 'Connection error. Please try again.'
  },
  SUCCESS: {
    INCIDENT_REPORTED: 'Incident reported successfully',
    FORM_SUBMITTED: 'Form submitted correctly'
  },
  INFO: {
    LOADING: 'Loading...',
    SUBMITTING: 'Submitting...',
    PROCESSING: 'Processing...'
  }
} as const;
// #endregion
