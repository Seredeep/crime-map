const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function testFirestore() {
  try {
    console.log('🧪 Probando conexión a Firestore...');
    if (!admin.apps.length) {
      const serviceAccountPath = path.join(__dirname, '..', 'service-account-key.json');
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'claridad-c703b',
        credential: admin.credential.cert(serviceAccountPath),
      });
    }
    const firestore = admin.firestore();
    const testDoc = {
      message: 'Mensaje de prueba',
      timestamp: new Date(),
      userId: 'test-user',
      userName: 'Usuario de Prueba',
      type: 'normal'
    };
    console.log('📝 Creando documento de prueba...');
    const docRef = await firestore.collection('test').add(testDoc);
    console.log(`✅ Documento creado con ID: ${docRef.id}`);
    const doc = await docRef.get();
    console.log('📖 Documento leído:', doc.data());
    await docRef.delete();
    console.log('🗑️ Documento de prueba eliminado');
    console.log('🎉 ¡Prueba de Firestore exitosa!');
  } catch (error) {
    console.error('❌ Error en la prueba de Firestore:', error);
  } finally {
    process.exit(0);
  }
}

testFirestore();
