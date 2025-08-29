import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

/**
 * Loads Firebase service account credentials from either:
 * 1. Base64 encoded environment variable FIREBASE_SERVICE_ACCOUNT_BASE64
 * 2. Traditional service-account-key.json file (fallback for backward compatibility)
 */
export function loadServiceAccountCredentials(): any {
  // Check if Base64 encoded service account is provided via environment variable
  const base64ServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (base64ServiceAccount) {
    try {
      console.log('🔐 Loading service account from Base64 environment variable...');
      const decodedJson = Buffer.from(base64ServiceAccount, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(decodedJson) as any;

      // Validate required fields
      if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
        throw new Error('Invalid service account JSON: missing required fields');
      }

      console.log('✅ Service account loaded successfully from environment variable');
      return serviceAccount;
    } catch (error) {
      console.error('❌ Error parsing Base64 service account:', error);
      throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64: ${error}`);
    }
  }

  // Fallback to traditional file-based approach
  try {
    console.log('📁 Loading service account from file (fallback mode)...');
    const serviceAccountPath = path.join(process.cwd(), 'service-account-key.json');

    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(`Service account file not found: ${serviceAccountPath}`);
    }

    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8')) as admin.ServiceAccount;
    console.log('✅ Service account loaded successfully from file');
    return serviceAccount;
  } catch (error) {
    console.error('❌ Error loading service account from file:', error);
    throw new Error(`Failed to load service account: ${error}`);
  }
}

/**
 * Initializes Firebase Admin SDK with service account credentials
 * This function should be called only once per application lifecycle
 */
export function initializeFirebaseAdmin(): void {
  if (!admin.apps.length) {
    const serviceAccount = loadServiceAccountCredentials();

    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id || 'claridad-c703b',
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('🚀 Firebase Admin SDK initialized successfully');
  }
}
