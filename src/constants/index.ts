// #region Application Constants
export const APP_CONFIG = {
  name: 'Crime Map',
  description: 'Mapa de Incidentes de Seguridad Urbana',
  version: '1.0.0',
  author: 'Crime Map Team',
  defaultLocation: {
    lat: -38.0055,
    lng: -57.5426,
    city: 'Mar del Plata, Argentina'
  }
} as const;
// #endregion

// #region User Roles
export const USER_ROLES = {
  USER: 'user',
  EDITOR: 'editor',
  ADMIN: 'admin'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
// #endregion

// #region Incident Types & Severity
export const INCIDENT_TYPES = {
  ROBBERY: 'robo',
  THEFT: 'hurto',
  ASSAULT: 'agresion',
  VANDALISM: 'vandalismo',
  DRUG_ACTIVITY: 'drogas',
  SUSPICIOUS_ACTIVITY: 'sospechoso',
  VIOLENCE: 'violencia',
  OTHER: 'otro'
} as const;

export const INCIDENT_SEVERITY = {
  LOW: 'baja',
  MEDIUM: 'media',
  HIGH: 'alta',
  CRITICAL: 'critica'
} as const;

export const INCIDENT_STATUS = {
  PENDING: 'pendiente',
  VERIFIED: 'verificado',
  REJECTED: 'rechazado',
  INVESTIGATING: 'investigando'
} as const;
// #endregion

// #region Common Tags
export const COMMON_TAGS = [
  'noche', 'dia', 'fin_de_semana', 'feriado',
  'zona_comercial', 'zona_residencial', 'transporte_publico',
  'multitud', 'solitario', 'testigos', 'camara_seguridad',
  'policia_presente', 'iluminacion_deficiente', 'lugar_transitado'
] as const;
// #endregion

// #region UI Colors & Styles
export const COLORS = {
  incident: {
    [INCIDENT_TYPES.ROBBERY]: '#dc2626',      // red-600
    [INCIDENT_TYPES.THEFT]: '#ea580c',        // orange-600
    [INCIDENT_TYPES.ASSAULT]: '#b91c1c',      // red-700
    [INCIDENT_TYPES.VANDALISM]: '#7c3aed',    // violet-600
    [INCIDENT_TYPES.DRUG_ACTIVITY]: '#059669', // emerald-600
    [INCIDENT_TYPES.SUSPICIOUS_ACTIVITY]: '#0891b2', // cyan-600
    [INCIDENT_TYPES.VIOLENCE]: '#be123c',     // rose-700
    [INCIDENT_TYPES.OTHER]: '#6b7280'         // gray-500
  },
  severity: {
    [INCIDENT_SEVERITY.LOW]: '#22c55e',       // green-500
    [INCIDENT_SEVERITY.MEDIUM]: '#f59e0b',    // amber-500
    [INCIDENT_SEVERITY.HIGH]: '#ef4444',      // red-500
    [INCIDENT_SEVERITY.CRITICAL]: '#991b1b'   // red-800
  },
  status: {
    [INCIDENT_STATUS.PENDING]: '#6b7280',     // gray-500
    [INCIDENT_STATUS.VERIFIED]: '#22c55e',    // green-500
    [INCIDENT_STATUS.REJECTED]: '#ef4444',    // red-500
    [INCIDENT_STATUS.INVESTIGATING]: '#3b82f6' // blue-500
  }
} as const;
// #endregion

// #region API Endpoints
export const API_ENDPOINTS = {
  incidents: '/api/incidents',
  neighborhoods: '/api/neighborhoods',
  geocode: '/api/geocode',
  reverseGeocode: '/api/geocode/reverse',
  auth: '/api/auth',
  admin: {
    users: '/api/admin/users',
    userRole: '/api/admin/users/role',
    userStatus: '/api/admin/users/status'
  }
} as const;
// #endregion

// #region Map Configuration
export const MAP_CONFIG = {
  defaultZoom: 13,
  minZoom: 10,
  maxZoom: 18,
  tileLayer: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors'
  },
  markerClusterOptions: {
    chunkedLoading: true,
    maxClusterRadius: 50
  }
} as const;
// #endregion

// #region File Upload
export const UPLOAD_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxFiles: 3,
  bucketName: 'incident-evidence'
} as const;
// #endregion

// #region Time & Date
export const TIME_RANGES = {
  LAST_24H: '24h',
  LAST_WEEK: '7d',
  LAST_MONTH: '30d',
  LAST_3_MONTHS: '90d',
  LAST_YEAR: '365d',
  ALL_TIME: 'all'
} as const;

export const DATE_FORMATS = {
  display: 'dd/MM/yyyy HH:mm',
  api: 'yyyy-MM-dd',
  full: 'dd/MM/yyyy HH:mm:ss'
} as const;
// #endregion
