import admin from 'firebase-admin';
import { initializeFirebaseAdmin } from '../firebase-service-account';

// Inicializar Firebase Admin SDK solo una vez
initializeFirebaseAdmin();

export const firestore = admin.firestore();
export default admin;
