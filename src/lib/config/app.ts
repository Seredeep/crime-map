/**
 * CONFIGURACIÓN GENERAL DE LA APLICACIÓN
 * ======================================
 *
 * Este archivo centraliza toda la configuración general de la aplicación,
 * incluyendo información básica, endpoints de API, configuración de mapas
 * y otras constantes globales.
 */

// #region Información de la Aplicación
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

// #region Roles de Usuario
export const USER_ROLES = {
  USER: 'user',
  EDITOR: 'editor',
  ADMIN: 'admin'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
// #endregion

// #region Endpoints de API
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

// #region Configuración de Mapas
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

// #region Configuración de Subida de Archivos
export const UPLOAD_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxFiles: 3,
  bucketName: 'incident-evidence'
} as const;
// #endregion

// #region Rangos de Tiempo
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

// #region Estados de Incidentes (Legacy - para compatibilidad)
export const INCIDENT_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  RESOLVED: 'resolved'
} as const;

export const INCIDENT_SEVERITY = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
  URGENT: 5
} as const;
// #endregion
