'use client';

import React from 'react';

interface FirebaseErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface FirebaseErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

class FirebaseErrorBoundary extends React.Component<
  FirebaseErrorBoundaryProps,
  FirebaseErrorBoundaryState
> {
  constructor(props: FirebaseErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): FirebaseErrorBoundaryState {
    // Verificar si es un error interno de Firebase
    const isFirebaseError = error.message?.includes('FIRESTORE') ||
                           error.message?.includes('INTERNAL ASSERTION FAILED') ||
                           error.stack?.includes('firebase');

    if (isFirebaseError) {
      console.log('🔥 Error de Firebase capturado y silenciado:', error.message);
      return { hasError: true, error };
    }

    // Si no es error de Firebase, re-lanzar
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Solo manejar errores de Firebase
    const isFirebaseError = error.message?.includes('FIRESTORE') ||
                           error.message?.includes('INTERNAL ASSERTION FAILED') ||
                           error.stack?.includes('firebase');

    if (isFirebaseError) {
      console.log('🔥 Error de Firebase capturado en boundary:', {
        error: error.message,
        stack: error.stack?.substring(0, 200) + '...'
      });
    }
  }

  render() {
    if (this.state.hasError) {
      // Renderizar fallback silencioso para errores de Firebase
      return this.props.fallback || (
        <div className="hidden">
          {/* Error de Firebase silenciado */}
        </div>
      );
    }

    return this.props.children;
  }
}

export default FirebaseErrorBoundary;
