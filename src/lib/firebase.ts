// Firebase configuration - COMPLETAMENTE DESHABILITADO para evitar errores internos
let db: any = null;
let app: any = null;

// FIREBASE TEMPORALMENTE DESHABILITADO
// Esto es para evitar errores internos de Firebase cuando no está configurado correctamente
const FIREBASE_DISABLED = true;

if (!FIREBASE_DISABLED && typeof window !== 'undefined') {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // Verificar que tenemos una configuración COMPLETA y válida
  const isValidConfig = firebaseConfig.projectId &&
                       firebaseConfig.apiKey &&
                       firebaseConfig.authDomain &&
                       firebaseConfig.projectId !== 'demo-project' &&
                       firebaseConfig.apiKey !== 'demo-key' &&
                       firebaseConfig.apiKey.length > 20; // Validación adicional

  if (isValidConfig) {
    try {
      const { initializeApp, getApps } = require('firebase/app');
      const { getFirestore } = require('firebase/firestore');

      // Inicializar Firebase solo si no está inicializado
      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      db = getFirestore(app);
      console.log('🔥 Firebase inicializado correctamente');
    } catch (error) {
      console.warn('⚠️ Error inicializando Firebase:', error);
      db = null;
      app = null;
    }
  } else {
    // Silenciar mensaje repetitivo
    db = null;
    app = null;
  }
} else {
  // Silenciar mensaje repetitivo
  db = null;
  app = null;
}

export { app, db };
export default app;
