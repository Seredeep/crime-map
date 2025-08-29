const fs = require('fs');
const path = require('path');

/**
 * Converts service-account-key.json to Base64 format for environment variable usage
 */
function convertServiceAccountToBase64() {
  try {
    const serviceAccountPath = path.join(__dirname, '..', 'service-account-key.json');

    if (!fs.existsSync(serviceAccountPath)) {
      console.error('❌ service-account-key.json not found in project root');
      console.log('Please ensure your service account key file is in the project root directory.');
      process.exit(1);
    }

    const serviceAccountJson = fs.readFileSync(serviceAccountPath, 'utf-8');
    const base64Encoded = Buffer.from(serviceAccountJson, 'utf-8').toString('base64');

    console.log('🔄 Converting service account to Base64...');
    console.log('✅ Conversion successful!');
    console.log('');
    console.log('📋 Copy the following to your environment variables:');
    console.log('');
    console.log('FIREBASE_SERVICE_ACCOUNT_BASE64=' + base64Encoded);
    console.log('');
    console.log('💡 You can add this to:');
    console.log('   - .env.local (for local development)');
    console.log('   - Vercel environment variables (for production)');
    console.log('   - Docker environment variables');
    console.log('   - Any deployment platform environment configuration');
    console.log('');
    console.log('🔒 Remember: Keep this value secure and never commit it to version control!');

  } catch (error) {
    console.error('❌ Error converting service account:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  convertServiceAccountToBase64();
}

module.exports = { convertServiceAccountToBase64 };
