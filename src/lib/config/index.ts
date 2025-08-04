/**
 * CONFIGURACIÓN DEL SISTEMA
 * =========================
 *
 * Punto de entrada principal para toda la configuración del sistema.
 * Exporta todas las constantes, configuraciones y reglas de validación
 * de forma organizada y centralizada.
 */

// #region Application Configuration Exports
export {
    API_ENDPOINTS, APP_CONFIG, DATE_FORMATS, INCIDENT_SEVERITY, INCIDENT_STATUS, MAP_CONFIG, TIME_RANGES, UPLOAD_CONFIG, USER_ROLES
} from './app';
export type { UserRole } from './app';
// #endregion

// #region UI Configuration Exports
export {
    CAROUSEL_CONFIG,
    GRID_CONFIG, INCIDENT_COLORS, MESSAGES, TIME_CONFIG, UI_MESSAGES
} from './ui';
// #endregion

// #region Validation Configuration Exports
export {
    COMMON_TAGS, FORM_LIMITS, VALIDATION_RULES
} from './validation';
// #endregion

// #region Exportaciones de Roles (para compatibilidad)
export { getDefaultRole, hasPermission, hasRequiredRole, REQUIRED_ROLES, ROLE_PERMISSIONS, ROLES } from './roles';
export type { Role } from './roles';
// #endregion
