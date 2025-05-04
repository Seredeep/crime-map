// Configuración de la base de datos
export const DB_CONFIG = {
  MONGODB_URI: process.env.MONGODB_URI,
  DATABASE_NAME: process.env.DATABASE_NAME,
  COLLECTIONS: {
    INCIDENTS: "incident_draft",
    USERS: "users",
    NEIGHBORHOODS: "neighborhoods"
  }
};

// Configuración de servicios externos
export const EXTERNAL_SERVICES = {
  GOOGLE_MAPS: {
    GEOCODING_API_KEY: process.env.GOOGLE_GEOCODING_API_KEY,
    GEOCODING_URL: process.env.GOOGLE_GEOCODING_URL
  }
};

// Configuración de la localización
export const LOCATION = {
  DEFAULT_NEIGHBORHOOD: "Bosque Peralta Ramos, Mar del Plata, Argentina",
  DEFAULT_CENTER: [-57.5575, -38.0031], // [longitude, latitude]
  DEFAULT_ZOOM: 13
};

// Etiquetas de incidentes
export const INCIDENT_TAGS = {
  COMMON: [
    "robo",
    "hurto",
    "asalto",
    "violencia",
    "vandalismo",
    "drogas",
    "disturbios",
    "sospechoso"
  ],
  SEVERITY: ["bajo", "medio", "alto", "crítico"],
  STATUS: ["pending", "verified", "resolved"]
};

// Colores para gráficos y UI
export const CHART_COLORS = {
  PRIMARY: "#3B82F6",
  SECONDARY: "#6B7280",
  SUCCESS: "#10B981",
  WARNING: "#F59E0B",
  DANGER: "#EF4444",
  INFO: "#3B82F6",
  BACKGROUND: {
    LIGHT: "#F3F4F6",
    DARK: "#1F2937"
  }
}; 