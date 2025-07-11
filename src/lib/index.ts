/**
 * LIBRERÍA PRINCIPAL DEL SISTEMA
 * ==============================
 *
 * Punto de entrada principal para toda la librería del sistema.
 * Exporta de forma organizada todos los módulos, servicios,
 * configuraciones y utilidades.
 */

// #region Exportaciones de Configuración
export * from './config';
// #endregion

// #region Exportaciones de Tipos Globales
export * from './types/global';
// Re-exportar UserRole explícitamente desde config para evitar ambigüedad
export type { UserRole } from './config';
// #endregion

// #region Exportaciones de Servicios
export * from './services';
// #endregion

// #region Exportaciones de Utilidades
export * from './utils';
// #endregion

// #region Exportaciones de Contextos
export * from './contexts';
// #endregion

// #region Exportaciones de Componentes
export * from './components';
// #endregion

// #region Exportaciones de Hooks
export * from './hooks/useAppLoading';
export * from './hooks/useChatOptimized';
// #endregion
