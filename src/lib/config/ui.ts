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
 */
export const INCIDENT_COLORS: Record<IncidentColor, {
  border: string;
  bg: string;
  text: string;
  hover: string;
}> = {
  red: {
    border: 'border-red-500',
    bg: 'bg-red-500/15',
    text: 'text-red-400',
    hover: 'hover:bg-red-500/25'
  },
  orange: {
    border: 'border-orange-500',
    bg: 'bg-orange-500/15',
    text: 'text-orange-400',
    hover: 'hover:bg-orange-500/25'
  },
  yellow: {
    border: 'border-yellow-500',
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-400',
    hover: 'hover:bg-yellow-500/25'
  },
  blue: {
    border: 'border-blue-500',
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    hover: 'hover:bg-blue-500/25'
  },
  purple: {
    border: 'border-purple-500',
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    hover: 'hover:bg-purple-500/25'
  },
  pink: {
    border: 'border-pink-500',
    bg: 'bg-pink-500/15',
    text: 'text-pink-400',
    hover: 'hover:bg-pink-500/25'
  },
  gray: {
    border: 'border-gray-500',
    bg: 'bg-gray-500/15',
    text: 'text-gray-400',
    hover: 'hover:bg-gray-500/25'
  },
  green: {
    border: 'border-green-500',
    bg: 'bg-green-500/15',
    text: 'text-green-400',
    hover: 'hover:bg-green-500/25'
  },
  cyan: {
    border: 'border-cyan-500',
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-400',
    hover: 'hover:bg-cyan-500/25'
  },
  teal: {
    border: 'border-teal-500',
    bg: 'bg-teal-500/15',
    text: 'text-teal-400',
    hover: 'hover:bg-teal-500/25'
  },
  indigo: {
    border: 'border-indigo-500',
    bg: 'bg-indigo-500/15',
    text: 'text-indigo-400',
    hover: 'hover:bg-indigo-500/25'
  },
  violet: {
    border: 'border-violet-500',
    bg: 'bg-violet-500/15',
    text: 'text-violet-400',
    hover: 'hover:bg-violet-500/25'
  },
  rose: {
    border: 'border-rose-500',
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    hover: 'hover:bg-rose-500/25'
  },
  emerald: {
    border: 'border-emerald-500',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    hover: 'hover:bg-emerald-500/25'
  },
  amber: {
    border: 'border-amber-500',
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    hover: 'hover:bg-amber-500/25'
  },
  lime: {
    border: 'border-lime-500',
    bg: 'bg-lime-500/15',
    text: 'text-lime-400',
    hover: 'hover:bg-lime-500/25'
  }
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
export const getUIMessages = (t: (key: string) => string) => ({
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
 * @deprecated Usar getUIMessages() en su lugar
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
