/**
 * UTILIDADES PARA INCIDENTES
 * ==========================
 *
 * Este archivo contiene todas las funciones utilitarias para trabajar
 * con tipos de incidentes, incluyendo filtros, búsquedas, generación
 * de clases CSS y validaciones.
 */

import { INCIDENT_COLORS } from '../../config/ui';
import { CURRENT_REGION, INCIDENT_FILTER_CONFIG, INCIDENT_SEARCH_CONFIG } from './config';
import { IncidentCategory, IncidentColor, IncidentType, Region, REGION_INCIDENT_TYPES } from './types';

// #region Funciones de Obtención de Tipos
/**
 * Obtiene los tipos de incidentes para una región específica
 */
export function getIncidentTypesForRegion(region: Region = 'general'): IncidentType[] {
  return REGION_INCIDENT_TYPES[region] || REGION_INCIDENT_TYPES.general;
}

/**
 * Obtiene un tipo de incidente específico por su ID
 */
export function getIncidentTypeById(id: string, region: Region = 'general'): IncidentType | undefined {
  const types = getIncidentTypesForRegion(region);
  return types.find(type => type.id === id);
}

/**
 * Obtiene los tipos de incidentes filtrados por categoría
 */
export function getIncidentTypesByCategory(
  category: IncidentCategory,
  region: Region = 'general'
): IncidentType[] {
  const types = getIncidentTypesForRegion(region);
  return types.filter(type => type.category === category);
}

/**
 * Obtiene los tipos de incidentes urgentes
 */
export function getUrgentIncidentTypes(region: Region = 'general'): IncidentType[] {
  const types = getIncidentTypesForRegion(region);
  return types.filter(type => type.urgent);
}

/**
 * Obtiene los tipos de incidentes ordenados por prioridad (mayor a menor)
 */
export function getIncidentTypesByPriority(region: Region = 'general'): IncidentType[] {
  const types = getIncidentTypesForRegion(region);
  return [...types].sort((a, b) => b.priority - a.priority);
}

/**
 * Obtiene los tipos de incidentes activos en el sistema actual
 */
export function getActiveIncidentTypes(): IncidentType[] {
  return getIncidentTypesForRegion(CURRENT_REGION);
}

/**
 * Obtiene un tipo de incidente activo por su ID
 */
export function getActiveIncidentTypeById(id: string): IncidentType | undefined {
  return getIncidentTypeById(id, CURRENT_REGION);
}
// #endregion

// #region Funciones de Estilos y CSS
/**
 * Obtiene las clases CSS para un color específico
 */
export function getIncidentColorClasses(color: IncidentColor) {
  return INCIDENT_COLORS[color];
}

/**
 * Genera la cadena de clases CSS para un tipo de incidente
 */
export function getIncidentTypeClasses(type: IncidentType, isSelected: boolean): string {
  const colorClasses = getIncidentColorClasses(type.color);

  if (isSelected) {
    return `${colorClasses.border} ${colorClasses.bg} ${colorClasses.text} shadow-lg scale-105`;
  }

  return `border-${type.color}-500/40 text-${type.color}-400/80 bg-gray-800/30 hover:bg-gray-800/50`;
}

/**
 * Genera clases CSS combinadas para múltiples colores
 */
export function getCombinedColorClasses(colors: IncidentColor[]) {
  return colors.reduce((acc, color) => {
    const classes = getIncidentColorClasses(color);
    return {
      ...acc,
      [color]: `${classes.border} ${classes.bg} ${classes.text}`
    };
  }, {} as Record<IncidentColor, string>);
}
// #endregion

// #region Funciones de Filtrado y Búsqueda
/**
 * Interfaz para filtros de tipos de incidentes
 */
export interface IncidentTypeFilters {
  category?: IncidentCategory;
  urgent?: boolean;
  priority?: number;
  color?: IncidentColor;
  search?: string;
}

/**
 * Filtra tipos de incidentes por múltiples criterios
 */
export function filterIncidentTypes(
  types: IncidentType[],
  filters: IncidentTypeFilters
): IncidentType[] {
  return types.filter(type => {
    // Filtro por categoría
    if (filters.category && type.category !== filters.category) {
      return false;
    }

    // Filtro por urgencia
    if (filters.urgent !== undefined && type.urgent !== filters.urgent) {
      return false;
    }

    // Filtro por prioridad
    if (filters.priority && type.priority !== filters.priority) {
      return false;
    }

    // Filtro por color
    if (filters.color && type.color !== filters.color) {
      return false;
    }

    // Filtro por búsqueda de texto
    if (filters.search && filters.search.length >= INCIDENT_SEARCH_CONFIG.MIN_SEARCH_LENGTH) {
      const searchLower = filters.search.toLowerCase();
      const matchesLabel = type.label.toLowerCase().includes(searchLower);
      const matchesDescription = type.description?.toLowerCase().includes(searchLower);
      const matchesId = type.id.toLowerCase().includes(searchLower);

      if (!matchesLabel && !matchesDescription && !matchesId) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Busca tipos de incidentes por texto con scoring de relevancia
 */
export function searchIncidentTypes(
  types: IncidentType[],
  searchText: string
): IncidentType[] {
  if (searchText.length < INCIDENT_SEARCH_CONFIG.MIN_SEARCH_LENGTH) {
    return types;
  }

  const searchLower = searchText.toLowerCase();
  const results = types
    .map(type => {
      let score = 0;

      // Calcular score basado en coincidencias y pesos
      if (type.label.toLowerCase().includes(searchLower)) {
        score += INCIDENT_SEARCH_CONFIG.FIELD_WEIGHTS.label;
      }
      if (type.description?.toLowerCase().includes(searchLower)) {
        score += INCIDENT_SEARCH_CONFIG.FIELD_WEIGHTS.description;
      }
      if (type.id.toLowerCase().includes(searchLower)) {
        score += INCIDENT_SEARCH_CONFIG.FIELD_WEIGHTS.id;
      }

      return { type, score };
    })
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, INCIDENT_SEARCH_CONFIG.MAX_SEARCH_RESULTS)
    .map(result => result.type);

  return results;
}
// #endregion

// #region Funciones de Validación
/**
 * Valida si un ID de tipo de incidente existe
 */
export function isValidIncidentTypeId(id: string, region: Region = 'general'): boolean {
  return getIncidentTypeById(id, region) !== undefined;
}

/**
 * Valida si un array de IDs de tipos de incidentes son válidos
 */
export function areValidIncidentTypeIds(ids: string[], region: Region = 'general'): boolean {
  return ids.every(id => isValidIncidentTypeId(id, region));
}

/**
 * Obtiene IDs de tipos de incidentes inválidos
 */
export function getInvalidIncidentTypeIds(ids: string[], region: Region = 'general'): string[] {
  return ids.filter(id => !isValidIncidentTypeId(id, region));
}

/**
 * Valida si un ID de tipo de incidente es válido en la configuración actual
 */
export function isValidActiveIncidentTypeId(id: string): boolean {
  return isValidIncidentTypeId(id, CURRENT_REGION);
}
// #endregion

// #region Funciones de Estadísticas
/**
 * Obtiene estadísticas de tipos de incidentes
 */
export function getIncidentTypesStats(types: IncidentType[]) {
  const stats = {
    total: types.length,
    urgent: types.filter(t => t.urgent).length,
    byCategory: {} as Record<IncidentCategory, number>,
    byColor: {} as Record<IncidentColor, number>,
    byPriority: {} as Record<number, number>,
    averagePriority: 0,
    criticalCount: 0
  };

  // Estadísticas por categoría, color y prioridad
  types.forEach(type => {
    stats.byCategory[type.category] = (stats.byCategory[type.category] || 0) + 1;
    stats.byColor[type.color] = (stats.byColor[type.color] || 0) + 1;
    stats.byPriority[type.priority] = (stats.byPriority[type.priority] || 0) + 1;

    if (INCIDENT_FILTER_CONFIG.CRITICAL_PRIORITIES.includes(type.priority as 4 | 5)) {
      stats.criticalCount++;
    }
  });

  // Prioridad promedio
  stats.averagePriority = types.reduce((sum, type) => sum + type.priority, 0) / types.length;

  return stats;
}
// #endregion

// #region Funciones de Agrupamiento
/**
 * Agrupa tipos de incidentes por categoría
 */
export function groupIncidentTypesByCategory(types: IncidentType[]): Record<IncidentCategory, IncidentType[]> {
  return types.reduce((acc, type) => {
    if (!acc[type.category]) {
      acc[type.category] = [];
    }
    acc[type.category].push(type);
    return acc;
  }, {} as Record<IncidentCategory, IncidentType[]>);
}

/**
 * Agrupa tipos de incidentes por color
 */
export function groupIncidentTypesByColor(types: IncidentType[]): Record<IncidentColor, IncidentType[]> {
  return types.reduce((acc, type) => {
    if (!acc[type.color]) {
      acc[type.color] = [];
    }
    acc[type.color].push(type);
    return acc;
  }, {} as Record<IncidentColor, IncidentType[]>);
}

/**
 * Agrupa tipos de incidentes por prioridad
 */
export function groupIncidentTypesByPriority(types: IncidentType[]): Record<number, IncidentType[]> {
  return types.reduce((acc, type) => {
    if (!acc[type.priority]) {
      acc[type.priority] = [];
    }
    acc[type.priority].push(type);
    return acc;
  }, {} as Record<number, IncidentType[]>);
}
// #endregion

// #region Exportaciones de Conveniencia
/**
 * Tipos de incidentes activos en el sistema actual
 */
export const ACTIVE_INCIDENT_TYPES = getActiveIncidentTypes();

/**
 * Exportación por defecto para compatibilidad
 */
export default ACTIVE_INCIDENT_TYPES;
// #endregion
