/**
 * CONFIGURACIÓN DE INCIDENTES
 * ===========================
 *
 * Este archivo centraliza la configuración específica del sistema
 * de incidentes, incluyendo la región actual y configuraciones
 * relacionadas con el manejo de incidentes.
 */

import { Region } from './types';

// #region Configuración Regional
/**
 * Región actual del sistema
 * Cambiar esta constante para adaptar los tipos de incidentes a la región específica
 */
export const CURRENT_REGION: Region = 'argentina';
// #endregion

// #region Configuración de Etiquetas Legacy
/**
 * Tags comunes de incidentes (compatibilidad con versiones anteriores)
 * @deprecated Usar getActiveIncidentTypes() en su lugar
 */
export const LEGACY_COMMON_TAGS = [
  'amenaza',
  'asalto',
  'disturbio',
  'hurto',
  'otro',
  'robo',
  'sospechoso',
  'vandalismo',
  'violencia'
];
// #endregion

// #region Configuración de Filtros
/**
 * Configuración para filtros de incidentes
 */
export const INCIDENT_FILTER_CONFIG = {
  /** Máximo número de tags que se pueden seleccionar a la vez */
  MAX_SELECTED_TAGS: 5,
  /** Categorías que se consideran urgentes por defecto */
  URGENT_CATEGORIES: ['violence', 'emergency'],
  /** Prioridades que se consideran críticas */
  CRITICAL_PRIORITIES: [4, 5],
  /** Tiempo en horas para considerar un incidente como "reciente" */
  RECENT_HOURS_THRESHOLD: 24
} as const;
// #endregion

// #region Configuración de Búsqueda
/**
 * Configuración para búsqueda de incidentes
 */
export const INCIDENT_SEARCH_CONFIG = {
  /** Número mínimo de caracteres para activar búsqueda */
  MIN_SEARCH_LENGTH: 3,
  /** Número máximo de resultados por búsqueda */
  MAX_SEARCH_RESULTS: 50,
  /** Campos que se incluyen en la búsqueda de texto */
  SEARCHABLE_FIELDS: ['label', 'description', 'id'] as const,
  /** Peso de relevancia por campo */
  FIELD_WEIGHTS: {
    label: 3,
    description: 2,
    id: 1
  }
} as const;
// #endregion
