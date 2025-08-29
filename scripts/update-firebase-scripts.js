const fs = require('fs');
const path = require('path');

/**
 * Updates all scripts to use the new Firebase service account utility
 */
function updateFirebaseScripts() {
  const scriptsDir = __dirname;
  const files = fs.readdirSync(scriptsDir).filter(file =>
    file.endsWith('.js') &&
    file !== 'firebase-service-account.js' &&
    file !== 'convert-service-account-to-base64.js' &&
    file !== 'update-firebase-scripts.js'
  );

  console.log('🔄 Updating Firebase scripts to use new service account utility...');

  let updatedCount = 0;

  files.forEach(file => {
    const filePath = path.join(scriptsDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');

    // Skip if already updated
    if (content.includes('require(\'./firebase-service-account\')')) {
      console.log(`⏭️  Skipping ${file} (already updated)`);
      return;
    }

    // Pattern 1: require('../service-account-key.json') with admin.initializeApp
    const pattern1 = /if\s*\(\s*!admin\.apps\.length\s*\)\s*\{\s*const\s+serviceAccount\s*=\s*require\(['"]\.\.\/service-account-key\.json['"]\);\s*admin\.initializeApp\(\s*\{\s*credential:\s*admin\.credential\.cert\(serviceAccount\)\s*\}\s*\);\s*\}/g;

    // Pattern 2: path.join with admin.initializeApp
    const pattern2 = /if\s*\(\s*!admin\.apps\.length\s*\)\s*\{\s*const\s+serviceAccountPath\s*=\s*path\.join\(__dirname,\s*['"]\.\.['"],\s*['"]service-account-key\.json['"]\);\s*admin\.initializeApp\(\s*\{\s*projectId:\s*process\.env\.FIREBASE_PROJECT_ID\s*\|\|\s*['"][^'"]*['"],\s*credential:\s*admin\.credential\.cert\(serviceAccountPath\)\s*\}\s*\);\s*\}/g;

    // Pattern 3: Simple require with admin.initializeApp
    const pattern3 = /const\s+serviceAccount\s*=\s*require\(['"]\.\.\/service-account-key\.json['"]\);\s*admin\.initializeApp\(\s*\{\s*credential:\s*admin\.credential\.cert\(serviceAccount\)\s*\}\s*\);/g;

    let wasUpdated = false;

    // Replace pattern 1
    if (pattern1.test(content)) {
      content = content.replace(pattern1, 'const { initializeFirebaseAdmin } = require(\'./firebase-service-account\');\n\n// Inicializar Firebase\ninitializeFirebaseAdmin();');
      wasUpdated = true;
    }

    // Replace pattern 2
    if (pattern2.test(content)) {
      content = content.replace(pattern2, 'const { initializeFirebaseAdmin } = require(\'./firebase-service-account\');\n\n// Inicializar Firebase\ninitializeFirebaseAdmin();');
      wasUpdated = true;
    }

    // Replace pattern 3
    if (pattern3.test(content)) {
      content = content.replace(pattern3, 'const { initializeFirebaseAdmin } = require(\'./firebase-service-account\');\n\n// Inicializar Firebase\ninitializeFirebaseAdmin();');
      wasUpdated = true;
    }

    if (wasUpdated) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated ${file}`);
      updatedCount++;
    } else {
      console.log(`⏭️  No changes needed for ${file}`);
    }
  });

  console.log(`\n🎉 Updated ${updatedCount} scripts successfully!`);
  console.log('\n💡 All scripts now support:');
  console.log('   - Base64 environment variable: FIREBASE_SERVICE_ACCOUNT_BASE64');
  console.log('   - Fallback to service-account-key.json file');
  console.log('   - Automatic Firebase Admin SDK initialization');
}

if (require.main === module) {
  updateFirebaseScripts();
}

module.exports = { updateFirebaseScripts };
