/**
 * CONFIGURACIÓN DE INTERFAZ DE USUARIO
 * ====================================
 *
 * Este archivo centraliza toda la configuración relacionada con la interfaz
 * de usuario, incluyendo colores, estilos, configuraciones de componentes
 * y mensajes del sistema.
 */

import { IncidentColor } from '../services/incidents/types';

// #region Configuración de Colores para Incidentes
/**
 * Configuración de colores para tipos de incidentes
 * Incluye clases CSS para bordes, fondos, texto y hover
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

// #region Configuración de Carrusel
/**
 * Configuración de animaciones para el carrusel de incidentes
 */
export const CAROUSEL_CONFIG = {
  /** Velocidad de scroll automático (unidades por frame) */
  SCROLL_SPEED: 0.3,
  /** Intervalo de actualización en milisegundos */
  SCROLL_INTERVAL: 60,
  /** Duración de transición en segundos */
  TRANSITION_DURATION: 0.6,
  /** Número de copias del carrusel */
  CAROUSEL_COPIES: 3,
  /** Espaciado entre elementos */
  ELEMENT_SPACING: 12
} as const;
// #endregion

// #region Configuración de Grid
/**
 * Configuración de la vista grid de incidentes
 */
export const GRID_CONFIG = {
  /** Número de columnas en la vista grid */
  COLUMNS: 2,
  /** Espaciado entre elementos */
  GAP: 4,
  /** Altura de los botones en la vista grid */
  BUTTON_HEIGHT: 20,
  /** Altura de los botones en el carrusel */
  CAROUSEL_BUTTON_HEIGHT: 16,
  /** Ancho de los botones en el carrusel */
  CAROUSEL_BUTTON_WIDTH: 20
} as const;
// #endregion

// #region Configuración de Tiempo
/**
 * Configuraciones relacionadas con tiempo y fechas
 */
export const TIME_CONFIG = {
  /** Tiempo de espera antes de redirigir después de envío exitoso (ms) */
  REDIRECT_DELAY: 2000,
  /** Tiempo de pausa del carrusel al seleccionar elemento (ms) */
  CAROUSEL_PAUSE_DURATION: 1000,
  /** Formato de fecha por defecto */
  DATE_FORMAT: 'yyyy-MM-dd',
  /** Formato de hora por defecto */
  TIME_FORMAT: 'HH:mm'
} as const;
// #endregion

// #region Mensajes del Sistema
/**
 * Mensajes de error y éxito del sistema
 */
export const MESSAGES = {
  ERRORS: {
    DESCRIPTION_REQUIRED: 'La descripción es obligatoria',
    LOCATION_REQUIRED: 'Por favor selecciona una ubicación válida',
    TAGS_REQUIRED: 'Selecciona al menos un tipo de incidente',
    SUBMIT_ERROR: 'Error al reportar el incidente',
    NETWORK_ERROR: 'Error de conexión. Por favor intenta nuevamente.'
  },
  SUCCESS: {
    INCIDENT_REPORTED: 'Incidente reportado exitosamente',
    FORM_SUBMITTED: 'Formulario enviado correctamente'
  },
  INFO: {
    LOADING: 'Cargando...',
    SUBMITTING: 'Enviando...',
    PROCESSING: 'Procesando...'
  }
} as const;
// #endregion
