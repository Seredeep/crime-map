/**
 * SERVICIO DE INCIDENTES
 * ======================
 *
 * Punto de entrada principal para el servicio de incidentes.
 * Exporta todas las funciones, tipos y constantes relacionadas
 * con el manejo de incidentes de forma organizada.
 */

// #region Exportaciones de Tipos
export {
    ARGENTINA_INCIDENT_TYPES, BASE_INCIDENT_TYPES, CHILE_INCIDENT_TYPES, COLOMBIA_INCIDENT_TYPES, MEXICO_INCIDENT_TYPES, REGION_INCIDENT_TYPES
} from './types';
export type { IncidentType } from './types';
export type { IncidentTypeFilters } from './utils';
// #endregion

// #region Exportaciones de Configuración
export {
    CURRENT_REGION, INCIDENT_FILTER_CONFIG,
    INCIDENT_SEARCH_CONFIG, LEGACY_COMMON_TAGS
} from './config';
// #endregion

// #region Exportaciones de Utilidades
export {

    // Constantes de conveniencia
    ACTIVE_INCIDENT_TYPES, areValidIncidentTypeIds,
    // Funciones de filtrado y búsqueda
    filterIncidentTypes, getActiveIncidentTypeById, getActiveIncidentTypes, getCombinedColorClasses,
    // Funciones de estilos
    getIncidentColorClasses, getIncidentTypeById, getIncidentTypeClasses, getIncidentTypesByCategory, getIncidentTypesByPriority,
    // Funciones de obtención
    getIncidentTypesForRegion,
    // Funciones de estadísticas
    getIncidentTypesStats, getInvalidIncidentTypeIds, getUrgentIncidentTypes,
    // Funciones de agrupamiento
    groupIncidentTypesByCategory,
    groupIncidentTypesByColor,
    groupIncidentTypesByPriority, isValidActiveIncidentTypeId,
    // Funciones de validación
    isValidIncidentTypeId, searchIncidentTypes
} from './utils';
// #endregion

// #region Exportación por Defecto
export { default } from './utils';
// #endregion
