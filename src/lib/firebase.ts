import admin from 'firebase-admin';
import path from 'path';

// Inicializar Firebase Admin SDK solo una vez
if (!admin.apps.length) {
  const serviceAccountPath = path.join(process.cwd(), 'service-account-key.json');

  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'claridad-c703b',
    credential: admin.credential.cert(serviceAccountPath),
  });
}

export const firestore = admin.firestore();
export default admin;
