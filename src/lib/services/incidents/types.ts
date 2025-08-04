/**
 * SPECIFIC INCIDENT TYPES
 * =======================
 *
 * This file contains all specific type definitions
 * for the incident system, including regional configurations
 * and incident type definitions.
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


// #region Incident Type Definition
/**
 * Complete definition of an incident type
 */
export interface IncidentType {
  /** Unique identifier for the incident type */
  id: string;
  /** Human-readable name of the incident type */
  label: string;
  /** React icon component */
  icon: React.ComponentType<any>;
  /** Theme color for UI */
  color: IncidentColor;
  /** Detailed description of the type (optional) */
  description?: string;
  /** Priority level (1=low, 5=critical) */
  priority: 1 | 2 | 3 | 4 | 5;
  /** Whether it requires immediate intervention */
  urgent: boolean;
  /** General category of the incident */
  category: IncidentCategory;
}

// #region Base Types for Incidents
/**
 * Available colors for incident types
 */
export type IncidentColor =
  | 'red' | 'orange' | 'yellow' | 'blue'
  | 'purple' | 'pink' | 'gray' | 'green'
  | 'cyan' | 'teal' | 'indigo' | 'violet'
  | 'rose' | 'emerald' | 'amber' | 'lime';

/**
 * General incident categories
 */
export type IncidentCategory =
  | 'violence' | 'theft' | 'property' | 'suspicious'
  | 'traffic' | 'disturbance' | 'emergency' | 'other';

/**
 * Possible incident states
 */
export type IncidentStatus = 'pending' | 'verified' | 'resolved';

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

// #region Base Incident Types
/**
 * Base incident types - common to all regions
 */
export const BASE_INCIDENT_TYPES: IncidentType[] = [
  {
    id: 'amenaza',
    label: 'Threat',
    icon: FiAlertTriangle,
    color: 'yellow',
    description: 'Verbal or written intimidation or threat',
    priority: 3,
    urgent: false,
    category: 'violence'
  },
  {
    id: 'asalto',
    label: 'Assault',
    icon: FiShield,
    color: 'red',
    description: 'Physical attack or direct threat to people',
    priority: 5,
    urgent: true,
    category: 'violence'
  },
  {
    id: 'disturbio',
    label: 'Disturbance',
    icon: FiVolumeX,
    color: 'amber',
    description: 'Public order disruption or disturbing noises',
    priority: 2,
    urgent: false,
    category: 'disturbance'
  },
  {
    id: 'hurto',
    label: 'Theft',
    icon: MdOutlineDirectionsRun,
    color: 'orange',
    description: 'Theft of goods without violence',
    priority: 3,
    urgent: false,
    category: 'theft'
  },
  {
    id: 'otro',
    label: 'Other',
    icon: FiHelpCircle,
    color: 'gray',
    description: 'Other types of uncategorized incidents',
    priority: 1,
    urgent: false,
    category: 'other'
  },
  {
    id: 'robo',
    label: 'Robbery',
    icon: FiLock,
    color: 'rose',
    description: 'Theft of goods with violence or intimidation',
    priority: 4,
    urgent: true,
    category: 'theft'
  },
  {
    id: 'sospechoso',
    label: 'Suspicious Activity',
    icon: FiEye,
    color: 'pink',
    description: 'Behavior or situation that raises suspicion',
    priority: 2,
    urgent: false,
    category: 'suspicious'
  },
  {
    id: 'vandalismo',
    label: 'Vandalism',
    icon: FiTool,
    color: 'violet',
    description: 'Intentional damage to public or private property',
    priority: 2,
    urgent: false,
    category: 'property'
  },
  {
    id: 'violencia',
    label: 'Violence',
    icon: FiZap,
    color: 'indigo',
    description: 'Violent acts or physical aggressions',
    priority: 5,
    urgent: true,
    category: 'violence'
  }
];
// #endregion

// #region Regional Incident Types
/**
 * Argentina-specific incident types
 */
export const ARGENTINA_INCIDENT_TYPES: IncidentType[] = [
  ...BASE_INCIDENT_TYPES,
  {
    id: 'motochorro',
    label: 'Motochorro',
    icon: MdOutlineDirectionsBike,
    color: 'emerald',
    description: 'Robbery carried out from motorcycle',
    priority: 5,
    urgent: true,
    category: 'theft'
  }
];

/**
 * Mexico-specific incident types
 */
export const MEXICO_INCIDENT_TYPES: IncidentType[] = [
  ...BASE_INCIDENT_TYPES,
  {
    id: 'secuestro_express',
    label: 'Express Kidnapping',
    icon: BiSolidCar,
    color: 'indigo',
    description: 'Short-duration kidnapping for extortion',
    priority: 5,
    urgent: true,
    category: 'violence'
  },
  {
    id: 'extorsion',
    label: 'Extortion',
    icon: FiPhone,
    color: 'teal',
    description: 'Threats to obtain money or benefits',
    priority: 4,
    urgent: true,
    category: 'violence'
  }
];

/**
 * Colombia-specific incident types
 */
export const COLOMBIA_INCIDENT_TYPES: IncidentType[] = [
  ...BASE_INCIDENT_TYPES,
  {
    id: 'atraco',
    label: 'Armed Robbery',
    icon: GiRevolver,
    color: 'pink',
    description: 'Armed robbery',
    priority: 5,
    urgent: true,
    category: 'theft'
  },
  {
    id: 'cosquilleo',
    label: 'Pickpocketing',
    icon: MdOutlinePersonSearch,
    color: 'lime',
    description: 'Theft through distraction or deception',
    priority: 3,
    urgent: false,
    category: 'theft'
  }
];

/**
 * Chile-specific incident types
 */
export const CHILE_INCIDENT_TYPES: IncidentType[] = [
  ...BASE_INCIDENT_TYPES,
  {
    id: 'lanza',
    label: 'Lanza',
    icon: FiTarget,
    color: 'yellow',
    description: 'Specialized and stealthy theft',
    priority: 3,
    urgent: false,
    category: 'theft'
  },
  {
    id: 'portonazo',
    label: 'Home Invasion Robbery',
    icon: FiLock,
    color: 'purple',
    description: 'Robbery when entering home',
    priority: 4,
    urgent: true,
    category: 'theft'
  }
];
// #endregion

// #region Función para Tipos de Incidentes por Región
/**
 * Función para obtener tipos de incidentes específicos de cada región
 * @param t - Función de traducción de next-intl
 * @param region - Región para obtener los tipos específicos
 * @returns Array de tipos de incidentes con etiquetas traducidas para la región
 */
export const GET_REGION_INCIDENT_TYPES = (
  t: (key: string) => string,
  region: Region = 'general'
): IncidentType[] => {
  const baseTypes = BASE_INCIDENT_TYPES.map(type => ({
    ...type,
    label: t(`${type.id}.label`),
    description: t(`${type.id}.description`)
  }));

  // Agregar tipos específicos de la región
  const regionSpecificTypes = getRegionSpecificTypes(t, region);

  return [...baseTypes, ...regionSpecificTypes];
};

/**
 * Obtiene los tipos específicos de una región con traducciones
 */
const getRegionSpecificTypes = (
  t: (key: string) => string,
  region: Region
): IncidentType[] => {
  switch (region) {
    case 'argentina':
      return [
        {
          id: 'motochorro',
          label: t('motochorro.label'),
          icon: MdOutlineDirectionsBike,
          color: 'emerald',
          description: t('motochorro.description'),
          priority: 5,
          urgent: true,
          category: 'theft'
        }
      ];
    case 'mexico':
      return [
        {
          id: 'secuestro_express',
          label: t('secuestro_express.label'),
          icon: BiSolidCar,
          color: 'indigo',
          description: t('secuestro_express.description'),
          priority: 5,
          urgent: true,
          category: 'violence'
        },
        {
          id: 'extorsion',
          label: t('extorsion.label'),
          icon: FiPhone,
          color: 'teal',
          description: t('extorsion.description'),
          priority: 4,
          urgent: true,
          category: 'violence'
        }
      ];
    case 'colombia':
      return [
        {
          id: 'atraco',
          label: t('atraco.label'),
          icon: GiRevolver,
          color: 'pink',
          description: t('atraco.description'),
          priority: 5,
          urgent: true,
          category: 'theft'
        },
        {
          id: 'cosquilleo',
          label: t('cosquilleo.label'),
          icon: MdOutlinePersonSearch,
          color: 'lime',
          description: t('cosquilleo.description'),
          priority: 3,
          urgent: false,
          category: 'theft'
        }
      ];
    case 'chile':
      return [
        {
          id: 'lanza',
          label: t('lanza.label'),
          icon: FiTarget,
          color: 'yellow',
          description: t('lanza.description'),
          priority: 3,
          urgent: false,
          category: 'theft'
        },
        {
          id: 'portonazo',
          label: t('portonazo.label'),
          icon: FiLock,
          color: 'purple',
          description: t('portonazo.description'),
          priority: 4,
          urgent: true,
          category: 'theft'
        }
      ];
    default:
      return [];
  }
};
// #endregion


/**
 * Available regions for configuration
 */
export type Region = 'argentina' | 'mexico' | 'colombia' | 'chile' | 'general';


// #region Region Map
/**
 * Map of regions to their corresponding incident types
 */
export const REGION_INCIDENT_TYPES: Record<Region, IncidentType[]> = {
  argentina: ARGENTINA_INCIDENT_TYPES,
  mexico: MEXICO_INCIDENT_TYPES,
  colombia: COLOMBIA_INCIDENT_TYPES,
  chile: CHILE_INCIDENT_TYPES,
  general: BASE_INCIDENT_TYPES
};
// #endregion
