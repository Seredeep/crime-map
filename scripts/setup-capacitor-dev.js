const fs = require('fs');
const path = require('path');
const { getLocalIPWithPort } = require('./get-local-ip');

const CAPACITOR_CONFIG_PATH = path.join(__dirname, '..', 'capacitor.config.ts');
const CAPACITOR_CONFIG_BACKUP_PATH = path.join(__dirname, '..', 'capacitor.config.backup.ts');

function backupOriginalConfig() {
  if (fs.existsSync(CAPACITOR_CONFIG_PATH)) {
    const content = fs.readFileSync(CAPACITOR_CONFIG_PATH, 'utf8');
    fs.writeFileSync(CAPACITOR_CONFIG_BACKUP_PATH, content);
    console.log('✅ Configuración original respaldada');
  }
}

function restoreOriginalConfig() {
  if (fs.existsSync(CAPACITOR_CONFIG_BACKUP_PATH)) {
    const content = fs.readFileSync(CAPACITOR_CONFIG_BACKUP_PATH, 'utf8');
    fs.writeFileSync(CAPACITOR_CONFIG_PATH, content);
    fs.unlinkSync(CAPACITOR_CONFIG_BACKUP_PATH);
    console.log('✅ Configuración original restaurada');
  }
}

function setupDevConfig(port = 3000) {
  const localIP = getLocalIPWithPort(port);

  // Leer la configuración actual
  let configContent = fs.readFileSync(CAPACITOR_CONFIG_PATH, 'utf8');

  // Crear configuración de desarrollo
  const devConfig = `import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.claridad.app',
  appName: 'Claridad',
  webDir: 'out',
  server: {
    androidScheme: 'http',
    url: '${localIP}',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#040910",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#B5CCF4",
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#040910"
    },
    Keyboard: {
      resizeOnFullScreen: true
    },
    App: {
      statusBarStyle: "DARK"
    },
    Geolocation: {
      permissions: {
        location: "always"
      }
    },
    Camera: {
      permissions: {
        camera: "required",
        photos: "required"
      }
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#B5CCF4",
      sound: "beep.wav"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    buildOptions: {
      keystorePath: 'C:/Users/sanch/OneDrive/Escritorio/Development/crime-map/android/app/my-release-key.keystore',
      keystorePassword: 'claridad123',
      keystoreAlias: 'claridad-key',
      keystoreAliasPassword: 'claridad123'
    }
  },
  ios: {
    contentInset: "automatic",
    scrollEnabled: true
  }
};

export default config;
`;

  // Hacer backup y escribir nueva configuración
  backupOriginalConfig();
  fs.writeFileSync(CAPACITOR_CONFIG_PATH, devConfig);

  console.log(`🚀 Configuración de desarrollo aplicada:`);
  console.log(`   📱 URL del servidor: ${localIP}`);
  console.log(`   🔄 Hot reload habilitado`);
  console.log(`   📋 Configuración original respaldada en capacitor.config.backup.ts`);
}

function setupProdConfig() {
  // Leer la configuración original del backup
  if (fs.existsSync(CAPACITOR_CONFIG_BACKUP_PATH)) {
    const originalContent = fs.readFileSync(CAPACITOR_CONFIG_BACKUP_PATH, 'utf8');

    // Remover la configuración del servidor para producción
    const prodContent = originalContent.replace(
      /server:\s*{[^}]*}/g,
      'server: {}'
    );

    fs.writeFileSync(CAPACITOR_CONFIG_PATH, prodContent);
    fs.unlinkSync(CAPACITOR_CONFIG_BACKUP_PATH);

    console.log('✅ Configuración de producción aplicada (servidor removido)');
  } else {
    console.log('⚠️  No se encontró backup de configuración original');
  }
}

// Manejo de argumentos de línea de comandos
const command = process.argv[2];
const port = process.argv[3] || 3000;

switch (command) {
  case 'dev':
    setupDevConfig(port);
    break;
  case 'prod':
    setupProdConfig();
    break;
  case 'restore':
    restoreOriginalConfig();
    break;
  default:
    console.log('Uso: node setup-capacitor-dev.js [dev|prod|restore] [puerto]');
    console.log('');
    console.log('Comandos:');
    console.log('  dev [puerto]    - Configurar para desarrollo con hot reload');
    console.log('  prod            - Configurar para producción (remover servidor)');
    console.log('  restore         - Restaurar configuración original');
    console.log('');
    console.log('Ejemplos:');
    console.log('  node setup-capacitor-dev.js dev 3000');
    console.log('  node setup-capacitor-dev.js prod');
    console.log('  node setup-capacitor-dev.js restore');
}

module.exports = { setupDevConfig, setupProdConfig, restoreOriginalConfig };
