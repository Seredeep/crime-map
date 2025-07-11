/**
 * TIPOS ESPECÍFICOS DE INCIDENTES
 * ===============================
 *
 * Este archivo contiene todas las definiciones de tipos específicos
 * para el sistema de incidentes, incluyendo configuraciones regionales
 * y definiciones de tipos de incidentes.
 */

import {
    FiAlertTriangle,
    FiEye,
    FiHelpCircle,
    FiLock,
    FiPhone,
    FiShield,
    FiTarget,
    FiTool,
    FiVolumeX,
    FiZap
} from 'react-icons/fi';

import { BiSolidCar } from 'react-icons/bi';
import { GiRevolver } from 'react-icons/gi';
import {
    MdOutlineDirectionsBike,
    MdOutlineDirectionsRun,
    MdOutlinePersonSearch
} from 'react-icons/md';

import { IncidentCategory, IncidentColor, Region } from '@/lib/types/global';

// #region Definición de Tipo de Incidente
/**
 * Definición completa de un tipo de incidente
 */
export interface IncidentType {
  /** Identificador único del tipo de incidente */
  id: string;
  /** Nombre legible del tipo de incidente */
  label: string;
  /** Componente de icono de React */
  icon: React.ComponentType<any>;
  /** Color temático para UI */
  color: IncidentColor;
  /** Descripción detallada del tipo (opcional) */
  description?: string;
  /** Nivel de prioridad (1=baja, 5=crítica) */
  priority: 1 | 2 | 3 | 4 | 5;
  /** Si requiere intervención inmediata */
  urgent: boolean;
  /** Categoría general del incidente */
  category: IncidentCategory;
}

interface EvidenceFile {
  name: string;
  type: string;
  size: number;
  path: string;
  url?: string;
}

export interface IncidentFilters {
  neighborhoodId?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  time?: string;
  timeFrom?: string;
  timeTo?: string;
  status?: string;
  tags?: string[];
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
}

// #endregion

// #region Tipos de Incidentes Base
/**
 * Tipos de incidentes base - comunes a todas las regiones
 */
export const BASE_INCIDENT_TYPES: IncidentType[] = [
  {
    id: 'amenaza',
    label: 'Amenaza',
    icon: FiAlertTriangle,
    color: 'pink',
    description: 'Intimidación o amenaza verbal o escrita',
    priority: 3,
    urgent: false,
    category: 'violence'
  },
  {
    id: 'asalto',
    label: 'Asalto',
    icon: FiShield,
    color: 'orange',
    description: 'Ataque físico o amenaza directa a personas',
    priority: 5,
    urgent: true,
    category: 'violence'
  },
  {
    id: 'disturbio',
    label: 'Disturbio',
    icon: FiVolumeX,
    color: 'yellow',
    description: 'Alteración del orden público o ruidos molestos',
    priority: 2,
    urgent: false,
    category: 'disturbance'
  },
  {
    id: 'hurto',
    label: 'Hurto',
    icon: MdOutlineDirectionsRun,
    color: 'orange',
    description: 'Sustracción de bienes sin violencia',
    priority: 3,
    urgent: false,
    category: 'theft'
  },
  {
    id: 'otro',
    label: 'Otro',
    icon: FiHelpCircle,
    color: 'gray',
    description: 'Otros tipos de incidentes no categorizados',
    priority: 1,
    urgent: false,
    category: 'other'
  },
  {
    id: 'robo',
    label: 'Robo',
    icon: FiLock,
    color: 'red',
    description: 'Sustracción de bienes con violencia o intimidación',
    priority: 4,
    urgent: true,
    category: 'theft'
  },
  {
    id: 'sospechoso',
    label: 'Actividad Sospechosa',
    icon: FiEye,
    color: 'blue',
    description: 'Comportamiento o situación que genera sospecha',
    priority: 2,
    urgent: false,
    category: 'suspicious'
  },
  {
    id: 'vandalismo',
    label: 'Vandalismo',
    icon: FiTool,
    color: 'purple',
    description: 'Daños intencionales a propiedad pública o privada',
    priority: 2,
    urgent: false,
    category: 'property'
  },
  {
    id: 'violencia',
    label: 'Violencia',
    icon: FiZap,
    color: 'red',
    description: 'Actos violentos o agresiones físicas',
    priority: 5,
    urgent: true,
    category: 'violence'
  }
];
// #endregion

// #region Tipos de Incidentes Regionales
/**
 * Tipos de incidentes específicos para Argentina
 */
export const ARGENTINA_INCIDENT_TYPES: IncidentType[] = [
  ...BASE_INCIDENT_TYPES,
  {
    id: 'motochorro',
    label: 'Motochorro',
    icon: MdOutlineDirectionsBike,
    color: 'red',
    description: 'Robo realizado desde motocicleta',
    priority: 5,
    urgent: true,
    category: 'theft'
  }
];

/**
 * Tipos de incidentes específicos para México
 */
export const MEXICO_INCIDENT_TYPES: IncidentType[] = [
  ...BASE_INCIDENT_TYPES,
  {
    id: 'secuestro_express',
    label: 'Secuestro Express',
    icon: BiSolidCar,
    color: 'red',
    description: 'Secuestro de corta duración para extorsión',
    priority: 5,
    urgent: true,
    category: 'violence'
  },
  {
    id: 'extorsion',
    label: 'Extorsión',
    icon: FiPhone,
    color: 'orange',
    description: 'Amenazas para obtener dinero o beneficios',
    priority: 4,
    urgent: true,
    category: 'violence'
  }
];

/**
 * Tipos de incidentes específicos para Colombia
 */
export const COLOMBIA_INCIDENT_TYPES: IncidentType[] = [
  ...BASE_INCIDENT_TYPES,
  {
    id: 'atraco',
    label: 'Atraco',
    icon: GiRevolver,
    color: 'red',
    description: 'Robo a mano armada',
    priority: 5,
    urgent: true,
    category: 'theft'
  },
  {
    id: 'cosquilleo',
    label: 'Cosquilleo',
    icon: MdOutlinePersonSearch,
    color: 'orange',
    description: 'Hurto mediante distracción o engaño',
    priority: 3,
    urgent: false,
    category: 'theft'
  }
];

/**
 * Tipos de incidentes específicos para Chile
 */
export const CHILE_INCIDENT_TYPES: IncidentType[] = [
  ...BASE_INCIDENT_TYPES,
  {
    id: 'lanza',
    label: 'Lanza',
    icon: FiTarget,
    color: 'orange',
    description: 'Hurto especializado y sigiloso',
    priority: 3,
    urgent: false,
    category: 'theft'
  },
  {
    id: 'portonazo',
    label: 'Portonazo',
    icon: FiLock,
    color: 'red',
    description: 'Robo al ingresar a domicilio',
    priority: 4,
    urgent: true,
    category: 'theft'
  }
];
// #endregion

// #region Mapa de Regiones
/**
 * Mapa de regiones a sus tipos de incidentes correspondientes
 */
export const REGION_INCIDENT_TYPES: Record<Region, IncidentType[]> = {
  argentina: ARGENTINA_INCIDENT_TYPES,
  mexico: MEXICO_INCIDENT_TYPES,
  colombia: COLOMBIA_INCIDENT_TYPES,
  chile: CHILE_INCIDENT_TYPES,
  general: BASE_INCIDENT_TYPES
};
// #endregion
