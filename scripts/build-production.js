const { execSync } = require('child_process');
const { setupProdConfig } = require('./setup-capacitor-dev');

console.log('🏗️  Iniciando build de producción...');

try {
  // Configurar Capacitor para producción (remover servidor)
  console.log('🔧 Configurando Capacitor para producción...');
  setupProdConfig();

  // Construir la aplicación
  console.log('📦 Construyendo aplicación...');
  execSync('npm run build', { stdio: 'inherit' });

  // Sincronizar con Capacitor
  console.log('📱 Sincronizando con Capacitor...');
  execSync('npx cap sync', { stdio: 'inherit' });

  console.log('✅ Build de producción completado');
  console.log('');
  console.log('📋 Próximos pasos:');
  console.log('   • Para Android: npx cap open android');
  console.log('   • Para iOS: npx cap open ios');
  console.log('   • Para generar APK: cd android && ./gradlew assembleRelease');

} catch (error) {
  console.error('❌ Error durante el build:', error.message);

  // Restaurar configuración original en caso de error
  console.log('🔄 Restaurando configuración original...');
  const { restoreOriginalConfig } = require('./setup-capacitor-dev');
  restoreOriginalConfig();

  process.exit(1);
}
