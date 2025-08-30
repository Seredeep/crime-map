/**
 * TIPOS GLOBALES DEL SISTEMA
 * ==========================
 *
 * Este archivo centraliza los tipos e interfaces globales del sistema,
 * excluyendo las definiciones específicas de incidentes que ahora
 * se encuentran en services/incidents/types.ts
 */

// #region Incidentes y Reportes
/**
 * Representa un incidente reportado en el sistema
 */
export interface Incident {
  /** Propiedades adicionales dinámicas */
  [x: string]: any;
  /** Identificador único del incidente */
  _id: string;
  /** Descripción detallada del incidente */
  description: string;
  /** Dirección o ubicación textual del incidente */
  address: string;
  /** Hora del incidente en formato HH:mm */
  time: string;
  /** Fecha del incidente en formato YYYY-MM-DD */
  date: string;
  /** URLs de evidencia fotográfica o de video */
  evidenceUrls?: string[];
  /** Coordenadas geográficas del incidente */
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  /** Timestamp de creación del registro */
  createdAt: string;
  /** Estado actual del incidente */
  status?: 'pending' | 'verified' | 'resolved';
  /** Etiquetas/tipos de incidente asociados */
  tags?: string[];
}

/**
 * Filtros disponibles para búsqueda de incidentes
 */
export interface IncidentFilters {
  neighborhoodId?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  time?: string;
  timeFrom?: string;
  timeTo?: string;
  status?: 'pending' | 'verified' | 'resolved';
  type?: string;
  tags?: string[];
}
// #endregion

// #region Usuarios y Autenticación
/**
 * Representa un usuario registrado en el sistema
 */
export interface User {
  _id: string;
  email: string;
  name?: string;
  surname?: string;
  blockNumber?: number;
  lotNumber?: number;
  neighborhood?: string;
  chatId?: string;
  onboarded: boolean;
  profileImage?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Roles de usuario disponibles
 */
export type UserRole = 'user' | 'editor' | 'admin';
// #endregion

// #region Alertas de Pánico
/**
 * Representa una alerta de pánico activada por un usuario
 */
export interface PanicAlert {
  _id: string;
  userId: string;
  userEmail: string;
  userName: string;
  neighborhood: string;
  chatId?: string;
  blockNumber?: number;
  lotNumber?: number;
  timestamp: Date;
  location: string;
  status: 'active' | 'resolved';
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt: Date;
}
// #endregion

// #region Estadísticas y Análisis
/**
 * Resultados de análisis estadísticos de incidentes
 */
export interface StatisticsResults {
  day?: {
    dates: string[];
    counts: number[];
    rollingAverage: number[];
  };
  week?: {
    weeks: string[];
    counts: number[];
    rollingAverage: number[];
  };
  weekdayDistribution?: {
    weekdays: string[];
    counts: number[];
  };
  hourDistribution?: {
    hours: number[];
    counts: number[];
  };
  tag?: {
    tags: string[];
    counts: number[];
  };
  heatMapDensity?: {
    density: number;
    totalIncidents: number;
    area: number;
  };
}
// #endregion
/**
 * Tipos de mensaje en el chat
 */
export type MessageType = 'normal' | 'panic';

/**
 * Metadata de mensajes del chat
 */
export interface MessageMetadata {
  // Location data (for panic messages and location sharing)
  location?: {
    lat: number;
    lng: number;
    accuracy?: number;
    timestamp?: number;
    fallback?: boolean;
  };

  // Address information
  address?: string;

  // GPS data (panic-specific)
  gpsLocation?: string;
  gpsAddress?: string;
  hasGPS?: boolean;
  originalLocation?: { lat: number; lng: number };

  // Reply data
  replyTo?: {
    id: string;
    userId: string;
    userName: string;
    snippet: string;
  };

  // Threading
  threadId?: string; // id del mensaje raíz del hilo
  parentId?: string; // id del mensaje al que responde dentro del hilo
  threadStarterId?: string; // redundante con threadId si el mensaje es parte del hilo
  threadRepliesCount?: number; // contador opcional para mostrar preview en la lista principal

  // Media data
  media?: {
    type: 'image' | 'video' | 'audio' | 'document';
    url: string;
    filename?: string;
    size?: number;
    duration?: number;
    contentType?: string;
  };

  // Anonymous messaging
  anonymous?: boolean;
  originalUserName?: string;

  // Upload metadata (for file uploads)
  uploadedBy?: string;
  uploadedAt?: string;
  originalName?: string;
  fileType?: string;

  // Block/lot information
  blockNumber?: number | null;
  lotNumber?: number | null;

  // Additional flexible properties
  [key: string]: any;
}

/**
 * Estados de una alerta de pánico
 */
export type PanicAlertStatus = 'active' | 'resolved';
// #endregion
