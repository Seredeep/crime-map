/**
 * CONFIGURACIÓN DE VALIDACIÓN
 * ===========================
 *
 * Este archivo centraliza todas las reglas de validación, límites
 * y configuraciones relacionadas con la validación de formularios
 * y datos del sistema.
 */

// #region Límites de Formularios
/**
 * Límites y validaciones para formularios
 */
export const FORM_LIMITS = {
  /** Longitud mínima para descripción de incidente */
  MIN_DESCRIPTION_LENGTH: 10,
  /** Longitud máxima para descripción de incidente */
  MAX_DESCRIPTION_LENGTH: 500,
  /** Número máximo de archivos de evidencia */
  MAX_EVIDENCE_FILES: 5,
  /** Tamaño máximo de archivo en MB */
  MAX_FILE_SIZE_MB: 10,
  /** Tipos de archivo permitidos */
  ALLOWED_FILE_TYPES: ['image/*', 'video/*'] as const
} as const;
// #endregion

// #region Tags Comunes (Legacy - para compatibilidad)
/**
 * @deprecated Usar ACTIVE_INCIDENT_TYPES de services/incidents en su lugar
 * Tags relevantes para tipos de incidentes
 */
export const COMMON_TAGS = [
  'robo', 'asalto', 'vandalismo', 'disturbio',
  'amenaza', 'sospechoso', 'violencia', 'otro'
] as const;
// #endregion

// #region Reglas de Validación
/**
 * Reglas de validación para diferentes campos
 */
export const VALIDATION_RULES = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Email inválido'
  },
  password: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número'
  },
  location: {
    latRange: [-90, 90],
    lngRange: [-180, 180],
    message: 'Coordenadas inválidas'
  },
  time: {
    pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    message: 'Formato de hora inválido (HH:mm)'
  },
  date: {
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    message: 'Formato de fecha inválido (YYYY-MM-DD)'
  }
} as const;
// #endregion
